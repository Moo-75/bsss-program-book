/* 한 번 연 뒤에는 행사장 연결이 불안정해도 프로그램북이 열리게 한다.
   화면·데이터 파일은 항상 서버에 최신인지 확인해서 받고(3초 안에 안 오면 저장본), 이미지·글꼴은 저장본을 먼저 쓴다. */
const CACHE = 'bsss15-v7';
const SHELL = [
  './', './styles.css', './app.js', './data.js',
  './assets/BoonTook-Regular.woff', './assets/bsss-band.webp', './assets/bsss-band-vertical.webp',
  './assets/dgist-logo.png', './assets/art/brain.webp', './assets/art/halftone.webp', './assets/art/astrocyte.webp', './assets/art/membrane.webp', './assets/art/orbit.webp', './assets/art/ring.webp', './assets/art/dots.webp', './assets/art/circles.webp', './assets/site-qr.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  // GitHub Pages는 max-age=600을 붙이므로, 브라우저 HTTP 캐시를 건너뛰고 서버에 바뀌었는지 확인한다 (안 바뀌었으면 304로 가볍게 끝남)
  const network = fetch(request, { cache: 'no-cache' }).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  if (!cached) return network;
  return Promise.race([network.catch(() => cached), new Promise(resolve => setTimeout(() => resolve(cached), 3000))]);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === location.origin;
  if (sameOrigin && !url.pathname.includes('/assets/')) event.respondWith(networkFirst(request));
  else if (sameOrigin || url.hostname === 'cdn.jsdelivr.net') event.respondWith(cacheFirst(request));
});

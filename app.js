(() => {
  'use strict';
  const data = window.SYMPOSIUM || {};
  const event = data.event || {};
  const $ = id => document.getElementById(id);
  const list = key => Array.isArray(data[key]) ? data[key] : [];
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  };
  const join = (...parts) => parts.filter(Boolean).join(' · ');
  const empty = (title, description) => {
    const box = node('div', 'empty');
    const text = node('div');
    text.append(node('strong', '', title), node('span', '', description));
    box.append(text);
    return box;
  };

  // 발표 종류별 설정: id 접두어는 공유 링크(#oral-01 등)에 쓰인다
  const KINDS = {
    keynote: { label: 'KEYNOTE LECTURE', prefix: 'keynote', empty: ['기조강연 정보를 준비하고 있습니다', '연사와 강연 초록이 확정되면 이곳에 안내합니다.'] },
    oral: { label: 'ORAL PRESENTATION', prefix: 'oral', empty: ['구두발표 정보를 준비하고 있습니다', '발표자와 초록이 확정되면 이곳에서 확인할 수 있습니다.'] },
    posters: { label: 'POSTER', prefix: 'poster', empty: ['포스터 목록을 준비하고 있습니다', '목록이 공개되면 번호와 발표자로 검색할 수 있습니다.'] },
    flash: { label: 'FLASH TALK', prefix: 'flash', empty: ['플래시 토크 정보를 준비하고 있습니다', '발표자와 주제가 확정되면 이곳에 안내합니다.'] },
    rewarded: { label: 'REWARDED TALK', prefix: 'rewarded', empty: ['발표 정보를 준비하고 있습니다', '확정된 발표자와 초록을 이곳에 안내할 예정입니다.'] }
  };
  const CHIP = { keynote: 'KEYNOTE', oral: 'ORAL', poster: 'POSTER', posters: 'POSTER', flash: 'FLASH TALK', rewarded: 'REWARDED', award: 'AWARD', awards: 'AWARD', break: 'BREAK', opening: 'OPENING', closing: 'CLOSING' };

  const entryNumber = (item, index) => item.number ? String(item.number) : String(index + 1).padStart(2, '0');
  const entryId = (kind, item, index) => `${KINDS[kind].prefix}-${entryNumber(item, index)}`.replace(/[^\w-]/g, '');

  // 검색어 강조: textContent만 사용해 입력 데이터가 HTML로 해석되지 않게 한다
  function highlighted(tag, className, text, term) {
    const el = node(tag, className);
    const value = String(text || '');
    if (!term) { el.textContent = value; return el; }
    const lower = value.toLocaleLowerCase();
    let from = 0, at;
    while ((at = lower.indexOf(term, from)) !== -1) {
      el.append(document.createTextNode(value.slice(from, at)), node('mark', '', value.slice(at, at + term.length)));
      from = at + term.length;
    }
    el.append(document.createTextNode(value.slice(from)));
    return el;
  }

  function renderEntries(kind, entries, term = '') {
    const target = $(`${kind}-content`);
    if (!entries.length) return false;
    const root = node('div', 'entry-list');
    entries.forEach(({ item, index }) => {
      const detail = node('details', 'entry');
      detail.id = entryId(kind, item, index);
      const summary = node('summary');
      summary.append(highlighted('span', 'entry-no', entryNumber(item, index), term));
      const label = node('span');
      label.append(node('span', 'entry-kind', KINDS[kind].label));
      label.append(highlighted('span', 'entry-title', item.title || '발표 제목 준비 중', term));
      label.append(highlighted('span', 'entry-meta', join(item.speaker, item.affiliation, item.time) || '발표자 정보 준비 중', term));
      const plus = node('span', 'plus'); plus.setAttribute('aria-hidden', 'true');
      summary.append(label, plus);

      const body = node('div', 'entry-body');
      if (item.photo || item.bio) {
        body.append(node('h3', '', 'SPEAKER'));
        if (item.photo) {
          const row = node('div', 'speaker');
          const img = node('img'); img.src = item.photo; img.alt = item.speaker || ''; img.loading = 'lazy';
          row.append(img, node('strong', '', join(item.speaker, item.affiliation)));
          body.append(row);
        }
        if (item.bio) body.append(node('p', '', item.bio));
      }
      body.append(node('h3', '', 'ABSTRACT'), node('p', '', item.abstract || '초록이 준비되는 대로 안내합니다.'));
      if (Array.isArray(item.publications) && item.publications.length) {
        body.append(node('h3', '', 'SELECTED PUBLICATIONS'));
        const ol = node('ol');
        item.publications.forEach(p => ol.append(node('li', '', p)));
        body.append(ol);
      }
      const share = node('button', 'share', '이 발표 링크 공유');
      share.type = 'button';
      share.addEventListener('click', () => shareLink(detail.id, item.title));
      body.append(share);

      detail.append(summary, body);
      root.append(detail);
    });
    target.replaceChildren(root);
    return true;
  }

  function renderTalks(kind) {
    const entries = list(kind).map((item, index) => ({ item, index }));
    if (!renderEntries(kind, entries)) $(`${kind}-content`).replaceChildren(empty(...KINDS[kind].empty));
  }

  function renderPosters() {
    const input = $('poster-search');
    const term = input.value.trim().toLocaleLowerCase();
    const all = list('posters').map((item, index) => ({ item, index }));
    $('poster-search-wrap').hidden = !all.length;
    $('clear-search').hidden = !term;
    if (!all.length) {
      $('posters-content').replaceChildren(empty(...KINDS.posters.empty));
      $('poster-count').textContent = '';
      return;
    }
    const filtered = all.filter(({ item, index }) => [entryNumber(item, index), item.title, item.speaker, item.affiliation]
      .some(value => String(value || '').toLocaleLowerCase().includes(term)));
    $('poster-count').textContent = term ? `${filtered.length} / ${all.length} POSTERS` : `${all.length} POSTERS`;
    if (!filtered.length) {
      $('posters-content').replaceChildren(empty('검색 결과가 없습니다', '번호, 이름, 제목의 일부로 다시 찾아보세요.'));
      return;
    }
    renderEntries('posters', filtered, term);
  }

  function renderSimple(targetId, entries, emptyText, emptyTitle) {
    const target = $(targetId);
    if (!entries.length) {
      target.replaceChildren(emptyTitle ? empty(emptyTitle, emptyText) : node('p', 'muted', emptyText));
      return;
    }
    const ul = node('ul', 'simple-list');
    entries.forEach(item => {
      const li = node('li');
      li.append(node('strong', '', item.name || ''));
      if (item.detail) li.append(node('span', '', item.detail));
      ul.append(li);
    });
    target.replaceChildren(ul);
  }

  // 시간표: "10:00–10:20" 또는 "10:00" 형식. 끝 시간이 없으면 다음 순서의 시작 시간까지로 본다
  const toMinutes = text => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(text || '').trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  function scheduleTimes(entries) {
    const parsed = entries.map(item => {
      const [start, end] = String(item.time || '').split(/\s*[–—~-]\s*/);
      return { start: toMinutes(start), end: toMinutes(end) };
    });
    parsed.forEach((t, i) => {
      if (t.end == null) t.end = parsed.slice(i + 1).find(n => n.start != null)?.start ?? (t.start != null ? t.start + 30 : null);
    });
    return parsed;
  }

  function currentTime() {
    const override = new URLSearchParams(location.search).get('now'); // 확인용: ?now=2027-01-21T10:30
    const date = override ? new Date(override) : new Date();
    return isNaN(date) ? new Date() : date;
  }
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function renderSchedule() {
    const entries = list('schedule');
    const target = $('schedule-content');
    if (!entries.length) {
      target.replaceChildren(empty('시간표를 준비하고 있습니다', '확정된 일정과 발표 순서가 이곳에 안내됩니다.'));
      return;
    }
    const root = node('div', 'schedule-list');
    entries.forEach(item => {
      const row = node('div', 'schedule-row');
      const [start, end] = String(item.time || '').split(/\s*[–—~-]\s*/);
      const time = node('span', 'schedule-time', start || '미정');
      if (end) time.append(node('small', '', `– ${end}`));
      const info = node('div');
      const chipText = CHIP[item.type];
      if (chipText) info.append(node('span', 'chip', chipText));
      info.append(node('span', 'schedule-title', item.title || '프로그램 미정'));
      const meta = join(item.speaker, item.location);
      if (meta) info.append(node('span', 'schedule-meta', meta));
      if (item.ref) {
        const a = node('a', 'schedule-link', '자세히 보기 →');
        a.href = `#${item.ref}`;
        info.append(a);
      }
      row.append(time, info);
      root.append(row);
    });
    target.replaceChildren(root);
    updateNow();
    setInterval(updateNow, 60000);
  }

  function updateNow() {
    const entries = list('schedule');
    const rows = [...document.querySelectorAll('.schedule-row')];
    const banner = $('now-banner');
    const now = currentTime();
    if (!event.date || localDate(now) !== event.date) { banner.hidden = true; return; }
    const minutes = now.getHours() * 60 + now.getMinutes();
    const times = scheduleTimes(entries);
    let current = -1, next = -1;
    times.forEach((t, i) => {
      rows[i].classList.remove('is-past', 'is-now', 'is-next');
      if (t.start == null) return;
      if (t.end != null && t.end <= minutes) rows[i].classList.add('is-past');
      else if (t.start <= minutes) { rows[i].classList.add('is-now'); current = i; }
      else if (next === -1) { rows[i].classList.add('is-next'); next = i; }
    });
    const lines = [];
    const line = (label, i) => {
      const p = node('p');
      p.append(node('b', '', label), document.createTextNode(`${entries[i].time || ''}  ${entries[i].title || ''}`));
      return p;
    };
    if (current !== -1) lines.push(line('NOW', current));
    if (next !== -1) lines.push(line('NEXT', next));
    if (!lines.length) lines.push(node('p', '', minutes < (times[0]?.start ?? 0) ? '곧 행사가 시작됩니다.' : '오늘 일정이 모두 끝났습니다. 함께해 주셔서 감사합니다.'));
    banner.replaceChildren(...lines);
    banner.hidden = false;
  }

  function fillEvent() {
    document.querySelectorAll('[data-event]').forEach(el => {
      const key = el.dataset.event;
      if (key === 'venueLines' && event.venue) {
        const [first, ...rest] = event.venue.replace(/,/g, '').split(/\s+/);
        el.replaceChildren(document.createTextNode(first), node('br'), document.createTextNode(rest.join(' ')));
      } else if (event[key]) {
        el.textContent = event[key];
      }
    });
    const venue = event.venue || 'DGIST';
    const links = [
      ['지도에서 보기', event.mapUrl],
      ['카카오맵', `https://map.kakao.com/?q=${encodeURIComponent('DGIST')}`],
      ['네이버 지도', `https://map.naver.com/p/search/${encodeURIComponent('DGIST')}`]
    ].filter(([, href]) => href);
    $('map-links').replaceChildren(...links.map(([label, href]) => {
      const a = node('a', '', label);
      a.href = href; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', `${label}: ${venue} (새 창)`);
      return a;
    }));
  }

  // 공유 링크: 지원되면 기기 공유 창, 아니면 주소 복사
  let toastTimer;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  async function shareLink(id, title) {
    const url = `${location.origin}${location.pathname}#${id}`;
    try {
      if (navigator.share) { await navigator.share({ title: title || '15th BSSS', url }); return; }
      await navigator.clipboard.writeText(url);
      toast('링크를 복사했습니다');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      window.prompt('아래 링크를 복사하세요', url);
    }
  }

  // #oral-01 같은 주소로 들어오면 해당 발표를 펼친다
  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (target && target.tagName === 'DETAILS') {
      target.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  }

  // 현재 보고 있는 섹션의 탭 강조
  function watchSections() {
    const tabs = [...document.querySelectorAll('.tabs a')];
    const byId = new Map(tabs.map(a => [a.getAttribute('href').slice(1), a]));
    const visible = new Map();
    const observer = new IntersectionObserver(items => {
      items.forEach(item => visible.set(item.target.id, item.isIntersecting));
      const active = [...byId.keys()].find(id => visible.get(id));
      tabs.forEach(a => a.removeAttribute('aria-current'));
      document.querySelectorAll('.sheet-links a').forEach(a => {
        if (active && a.getAttribute('href') === `#${active}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      const tab = active && byId.get(active);
      if (tab) {
        tab.setAttribute('aria-current', 'true');
        const bar = tab.parentElement;
        const left = tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2;
        bar.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }, { rootMargin: '-35% 0px -60% 0px' });
    byId.forEach((_, id) => { const s = $(id); if (s) observer.observe(s); });
  }

  // 첫 화면을 지나면 오른쪽 아래에 MENU·맨 위로 버튼을 띄운다
  function setupMenu() {
    const fab = $('fab');
    const menu = $('section-menu');
    new IntersectionObserver(([entry]) => { fab.hidden = entry.isIntersecting; })
      .observe(document.querySelector('.hero-art'));
    const close = () => { if (menu.open) menu.close(); };
    $('menu-open').addEventListener('click', () => {
      if (typeof menu.showModal === 'function') menu.showModal(); else menu.setAttribute('open', '');
      (menu.querySelector('a[aria-current]') || menu.querySelector('a')).focus();
    });
    $('menu-close').addEventListener('click', close);
    menu.addEventListener('click', e => { if (e.target === menu) close(); });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  fillEvent();
  setupMenu();
  renderSchedule();
  ['keynote', 'oral', 'flash', 'rewarded'].forEach(renderTalks);
  renderSimple('awards-content', list('awards'), '시상 부문과 진행 순서가 확정되면 이곳에 안내합니다.', '시상 안내를 준비하고 있습니다');
  renderSimple('laboratories-content', list('laboratories'), '참여 연구실 정보를 준비하고 있습니다.');
  renderSimple('committee-content', list('committee'), '운영위원회 정보를 준비하고 있습니다.');
  $('poster-search').addEventListener('input', renderPosters);
  $('clear-search').addEventListener('click', () => { $('poster-search').value = ''; renderPosters(); $('poster-search').focus(); });
  renderPosters();
  watchSections();
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();

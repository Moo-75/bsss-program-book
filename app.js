(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  let data = {};
  let event = {};
  const $ = id => document.getElementById(id);
  const list = key => Array.isArray(data[key]) ? data[key] : [];
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  };
  const join = (...parts) => parts.filter(Boolean).join(' · ');
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // 저장(★)한 발표: 이 기기의 브라우저에만 보관된다
  const SAVE_KEY = 'bsss15-saved';
  let saved = new Set();
  try { saved = new Set(JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')); } catch (error) { /* 저장소를 쓸 수 없으면 이번 방문 동안만 유지 */ }
  let savedOnly = false;
  const STAR = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.6l6.1-.8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function toggleSave(id, button) {
    const on = !saved.has(id);
    if (on) saved.add(id); else saved.delete(id);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify([...saved])); } catch (error) { /* 무시 */ }
    button.setAttribute('aria-pressed', String(on));
    toast(on ? '저장했습니다 · MENU에서 모아 볼 수 있어요' : '저장을 해제했습니다');
    updateSavedButton();
    const board = id.startsWith('poster-') && $(boardId(id.slice(7)));
    if (board) board.classList.toggle('is-saved', on);
    if (savedOnly) renderPosters();
  }
  function updateSavedButton() {
    const button = $('saved-only');
    const count = list('posters').filter((item, index) => saved.has(entryId('posters', item, index))).length;
    button.hidden = !list('posters').length;
    button.textContent = `★ 저장한 포스터 ${count}`;
    button.setAttribute('aria-pressed', String(savedOnly));
  }

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
      const wrap = node('div', 'entry-item');
      const detail = node('details', 'entry');
      detail.id = entryId(kind, item, index);
      const summary = node('summary');
      summary.append(highlighted('span', 'entry-no', entryNumber(item, index), term));
      const label = node('span');
      label.append(node('span', 'entry-kind', item.lang ? `${KINDS[kind].label} · IN ${String(item.lang).toUpperCase()}` : KINDS[kind].label));
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
      if (kind === 'posters') {
        const where = node('button', 'share share-map', '배치도에서 위치 보기');
        where.type = 'button';
        where.addEventListener('click', () => locateBoard(entryNumber(item, index)));
        body.append(where);
      }
      body.append(memo(detail.id));
      const share = node('button', 'share', '이 발표 링크 공유');
      share.type = 'button';
      share.addEventListener('click', () => shareLink(detail.id, item.title));
      body.append(share);
      detail.append(summary, body);

      const save = node('button', 'save');
      save.type = 'button';
      save.innerHTML = STAR;
      save.setAttribute('aria-label', `저장: ${item.title || entryNumber(item, index)}`);
      save.setAttribute('aria-pressed', String(saved.has(detail.id)));
      save.addEventListener('click', () => toggleSave(detail.id, save));

      wrap.append(detail, save);
      root.append(wrap);
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
    updateSavedButton();
    if (!all.length) {
      $('posters-content').replaceChildren(empty(...KINDS.posters.empty));
      $('poster-count').textContent = '';
      return;
    }
    const filtered = all.filter(({ item, index }) => (!savedOnly || saved.has(entryId('posters', item, index))) &&
      [entryNumber(item, index), item.title, item.speaker, item.affiliation]
        .some(value => String(value || '').toLocaleLowerCase().includes(term)));
    updateMap(term || savedOnly ? new Set(filtered.map(({ item, index }) => entryNumber(item, index))) : null);
    $('poster-count').textContent = term || savedOnly ? `${filtered.length} / ${all.length} POSTERS` : `${all.length} POSTERS`;
    if (!filtered.length) {
      $('posters-content').replaceChildren(savedOnly && !term
        ? empty('저장한 포스터가 없습니다', '포스터 오른쪽의 ☆를 누르면 여기에 모입니다.')
        : empty('검색 결과가 없습니다', '번호, 이름, 제목의 일부로 다시 찾아보세요.'));
      return;
    }
    renderEntries('posters', filtered, term);
  }

  // 포스터 배치도: data.js의 posterMap을 그린다. 없으면 포스터 번호(또는 예시 번호)로 임시 배치도를 만든다
  const boardId = number => `map-${String(number).replace(/[^\w-]/g, '')}`;
  function renderPosterMap() {
    const body = $('poster-map-body');
    const posters = list('posters');
    const numbers = posters.map((item, index) => entryNumber(item, index));
    const config = data.posterMap && Array.isArray(data.posterMap.areas) ? data.posterMap : null;
    const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
    const placeholder = Array.from({ length: 24 }, (_, i) => `P${String(i + 1).padStart(2, '0')}`);
    const areas = config ? config.areas : [{ name: event.venue ? `${event.venue} 포스터 구역` : '포스터 구역', rows: chunk(numbers.length ? numbers : placeholder, 6), entrance: 'bottom' }];
    const nodes = [];
    if (!config) {
      const flag = node('p', 'map-flag');
      flag.append(node('b', '', '임시 배치도'), document.createTextNode(numbers.length ? ' 번호 순서로 그린 예시입니다. 실제 위치는 확정 후 안내됩니다.' : ' 포스터 목록과 위치가 확정되면 실제 배치로 바뀝니다.'));
      nodes.push(flag);
    } else if (config.note) {
      nodes.push(node('p', 'map-flag', config.note));
    }
    areas.forEach(area => {
      const box = node('div', `map-area${area.entrance ? ` entrance-${area.entrance}` : ''}`);
      box.append(node('span', 'map-label', area.name || ''));
      const rows = node('div', 'map-rows');
      (area.rows || []).forEach(row => {
        const line = node('div', 'map-row');
        row.forEach(number => {
          const exists = numbers.includes(String(number));
          const board = node(exists ? 'a' : 'span', `board${exists ? '' : ' is-empty'}`, number);
          board.id = boardId(number);
          board.dataset.number = number;
          if (exists) {
            const index = numbers.indexOf(String(number));
            board.href = `#${entryId('posters', posters[index], index)}`;
            board.setAttribute('aria-label', `${number} ${posters[index].title || ''}`);
            board.addEventListener('click', e => { if (location.hash === board.hash) { e.preventDefault(); openFromHash(); } });
          }
          line.append(board);
        });
        rows.append(line);
      });
      box.append(rows);
      if (area.entrance) box.append(node('span', 'map-entrance', 'ENTRANCE 입구'));
      nodes.push(box);
    });
    const legend = node('p', 'map-legend');
    legend.append(node('span', 'is-saved', '저장한 포스터'), node('span', 'is-match', '검색 결과'));
    nodes.push(legend);
    body.replaceChildren(...nodes);
  }

  function updateMap(matches) {
    document.querySelectorAll('.board').forEach(board => {
      const number = board.dataset.number;
      const index = list('posters').findIndex((item, i) => entryNumber(item, i) === number);
      board.classList.toggle('is-saved', index !== -1 && saved.has(entryId('posters', list('posters')[index], index)));
      board.classList.toggle('is-match', !!matches && matches.has(number));
      board.classList.toggle('is-dim', !!matches && !matches.has(number));
    });
  }

  // 포스터 초록에서 "배치도에서 위치 보기"를 누르면 배치도의 해당 자리를 깜빡여 보여 준다
  function locateBoard(number) {
    const board = $(boardId(number));
    if (!board) { toast('배치도에 아직 위치가 없습니다'); return; }
    $('poster-map').open = true;
    board.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    board.classList.remove('is-located');
    void board.offsetWidth;
    board.classList.add('is-located');
    setTimeout(() => board.classList.remove('is-located'), 3200);
  }

  // 발표별 메모 (종이 프로그램북의 Note 페이지 대신). 이 기기의 브라우저에만 저장된다
  function memo(id) {
    const key = `bsss15-note-${id}`;
    const box = node('label', 'memo');
    const head = node('span', 'memo-head');
    head.append(node('b', '', 'MY NOTE'), node('small', 'memo-state', '이 기기에만 저장됩니다'));
    const area = node('textarea');
    area.rows = 3;
    area.placeholder = '발표를 들으며 메모하거나 질문을 적어 두세요';
    try { area.value = localStorage.getItem(key) || ''; } catch (error) { /* 저장소를 쓸 수 없으면 빈 메모 */ }
    let timer;
    area.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          if (area.value.trim()) localStorage.setItem(key, area.value); else localStorage.removeItem(key);
          head.querySelector('.memo-state').textContent = '저장됨 ✓';
        } catch (error) { head.querySelector('.memo-state').textContent = '이 브라우저에서는 저장할 수 없습니다'; }
      }, 400);
    });
    box.append(head, area);
    return box;
  }

  function renderSimple(targetId, entries, emptyText, emptyTitle) {
    const target = $(targetId);
    if (!entries.length) {
      target.replaceChildren(emptyTitle ? empty(emptyTitle, emptyText) : node('p', 'muted', emptyText));
      return;
    }
    const ul = node('ul', 'simple-list');
    let group;
    entries.forEach(item => {
      // group이 있으면 소속 기관별로 묶어 소제목을 단다 (In DGIST / In KBRI)
      if (item.group && item.group !== group) {
        group = item.group;
        ul.append(node('li', 'simple-group', group));
      }
      const li = node('li');
      li.append(node('strong', '', item.name || ''));
      if (item.detail) li.append(node('span', '', item.detail));
      ul.append(li);
    });
    target.replaceChildren(ul);
  }

  // 공지: 당일 변경 사항을 맨 위에 띄운다
  function renderNotices() {
    const target = $('notices');
    const items = list('notices');
    target.hidden = !items.length;
    target.replaceChildren(...items.map(item => {
      const box = node('div', 'notice');
      box.append(node('b', '', item.time ? `NOTICE · ${item.time}` : 'NOTICE'), node('strong', '', item.title || ''));
      if (item.detail) box.append(node('span', '', item.detail));
      return box;
    }));
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
    const override = params.get('now'); // 확인용: ?now=2027-01-21T10:30
    const date = override ? new Date(override) : new Date();
    return isNaN(date) ? new Date() : date;
  }
  const localDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const duration = minutes => minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;

  // 시간표 아이콘 (선 아이콘, currentColor)
  const ICON_PATHS = {
    registration: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M9 6V4h6v2"/><circle cx="8.5" cy="12" r="2"/><path d="M5.5 17c.6-1.8 1.7-2.6 3-2.6s2.4.8 3 2.6M14 11h4M14 14.5h4"/>',
    opening: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    closing: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    keynote: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    oral: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    rewarded: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"/><path d="m12 6.5.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 8.6l2-.3z"/>',
    photo: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    lunch: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11"/>',
    poster: '<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="M8 21l4-5 4 5M8 8h8M8 11h5"/>',
    coffee: '<path d="M4 10h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3c-.8 1 .8 2 0 3.5M12 3c-.8 1 .8 2 0 3.5"/>',
    flash: '<path d="M13 2 5 13.5h6L10 22l8-12h-6z"/>',
    award: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4M12 14v4M8 21h8M9.5 18h5"/>',
    social: '<circle cx="12" cy="7.5" r="2.5"/><circle cx="5.5" cy="9.5" r="2"/><circle cx="18.5" cy="9.5" r="2"/><path d="M7.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M2.5 18c0-2.3 1.3-4 3-4M21.5 18c0-2.3-1.3-4-3-4"/>',
    break: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'
  };
  ICON_PATHS.awards = ICON_PATHS.award;
  ICON_PATHS.posters = ICON_PATHS.poster;
  function icon(type) {
    const paths = ICON_PATHS[type];
    if (!paths) return null;
    const box = node('span', 'schedule-icon');
    box.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
    return box;
  }
  // 쉬는 시간 성격의 순서는 옅게, 강연은 강조색으로 보여 준다
  const QUIET = ['registration', 'photo', 'lunch', 'coffee', 'break'];
  const FEATURE = ['keynote', 'social'];

  function speakerBlock(item) {
    if (!item.speaker && !item.affiliation) return null;
    const box = node('span', 'schedule-speaker');
    if (item.speaker) box.append(node('strong', '', item.speaker));
    if (item.affiliation) box.append(node('small', '', item.affiliation));
    return box;
  }

  function renderSchedule() {
    const entries = list('schedule');
    const target = $('schedule-content');
    if (!entries.length) {
      target.replaceChildren(empty('시간표를 준비하고 있습니다', '확정된 일정과 발표 순서가 이곳에 안내됩니다.'));
      return;
    }
    const root = node('ol', 'schedule-list');
    entries.forEach((item, i) => {
      const type = item.type || '';
      const row = node('li', `schedule-row type-${type}${QUIET.includes(type) ? ' is-quiet' : ''}${FEATURE.includes(type) ? ' is-feature' : ''}`);
      row.id = `schedule-row-${i}`;
      const [start, end] = String(item.time || '').split(/\s*[–—~-]\s*/);
      const time = node('span', 'schedule-time');
      time.append(node('b', '', start || '미정'));
      if (end) time.append(node('small', '', end));
      const mark = node('span', 'schedule-mark');
      const glyph = icon(type);
      if (glyph) mark.append(glyph);

      const info = node('div', 'schedule-info');
      const head = node('div', 'schedule-head');
      const titleText = item.title || '프로그램 미정';
      if (item.ref && !item.talks) {
        const a = node('a', 'schedule-title', titleText);
        a.href = `#${item.ref}`;
        head.append(a);
      } else {
        head.append(node('span', 'schedule-title', titleText));
      }
      const speaker = speakerBlock(item);
      if (speaker) head.append(speaker);
      info.append(head);
      if (item.location) info.append(node('span', 'schedule-meta', item.location));

      // 한 시간대에 여러 발표가 이어지는 경우 (Student Oral 1~3 등)
      if (Array.isArray(item.talks) && item.talks.length) {
        const talks = node('ol', 'schedule-talks');
        item.talks.forEach(talk => {
          const li = node('li');
          const link = node(talk.ref ? 'a' : 'div', 'schedule-talk');
          if (talk.ref) link.href = `#${talk.ref}`;
          const text = node('span', 'schedule-talk-text');
          text.append(node('small', '', talk.label || ''), node('span', '', talk.title || '발표 제목 준비 중'));
          link.append(text);
          const who = speakerBlock(talk);
          if (who) link.append(who);
          li.append(link);
          talks.append(li);
        });
        info.append(talks);
      }
      row.append(time, mark, info);
      root.append(row);
    });
    target.replaceChildren(root);
  }

  // 당일: 시간표 강조 + 어느 위치에서나 보이는 NOW 띠
  function updateNow() {
    const entries = list('schedule');
    const rows = [...document.querySelectorAll('.schedule-row')];
    const banner = $('now-banner');
    const live = $('live');
    const now = currentTime();
    const today = !!event.date && localDate(now) === event.date;
    document.documentElement.classList.toggle('has-live', false);
    live.hidden = true;
    if (!today || !rows.length) { banner.hidden = true; return; }
    const minutes = now.getHours() * 60 + now.getMinutes();
    const times = scheduleTimes(entries);
    let current = -1, next = -1;
    times.forEach((t, i) => {
      if (!rows[i]) return;
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

    const shown = current !== -1 ? current : next;
    if (shown === -1) return;
    const t = times[shown];
    const isNow = shown === current;
    live.href = `#schedule-row-${shown}`;
    live.classList.toggle('is-next', !isNow);
    live.querySelector('b').textContent = isNow ? 'NOW' : 'NEXT';
    live.querySelector('.live-title').textContent = entries[shown].title || '';
    live.querySelector('.live-left').textContent = isNow ? `${duration(t.end - minutes)} 남음` : `${duration(t.start - minutes)} 후`;
    live.querySelector('.live-bar').style.transform = `scaleX(${isNow && t.end > t.start ? Math.min(1, (minutes - t.start) / (t.end - t.start)) : 0})`;
    live.hidden = false;
    document.documentElement.classList.add('has-live');
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

    // 행사 전에는 D-day, 당일에는 TODAY
    const target = event.date && new Date(`${event.date}T00:00`);
    if (target && !isNaN(target)) {
      const now = currentTime();
      const days = Math.round((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
      if (days >= 0) {
        $('dday').hidden = false;
        $('dday').querySelector('dd').textContent = days === 0 ? 'TODAY' : `D-${days}`;
      }
    }
  }

  // 공유 링크: 지원되면 기기 공유 창, 아니면 주소 복사
  let toastTimer;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }
  async function shareLink(id, title) {
    const url = `${location.origin}${location.pathname}${id ? `#${id}` : ''}`;
    try {
      if (navigator.share) { await navigator.share({ title: title || '15th BSSS Program Book', url }); return; }
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
    let target = document.getElementById(id);
    if (!target && id.startsWith('poster-') && (savedOnly || $('poster-search').value)) {
      savedOnly = false;
      $('poster-search').value = '';
      renderPosters();
      target = document.getElementById(id);
    }
    if (target && target.tagName === 'DETAILS') {
      target.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  }

  // 현재 보고 있는 섹션의 탭 강조: 상단 탭 바로 아래에 걸친 섹션을 현재 섹션으로 본다.
  // 바로가기를 누르면 이동이 끝날 때까지(사용자가 직접 스크롤하기 전까지) 누른 섹션을 유지한다.
  function watchSections() {
    const tabs = [...document.querySelectorAll('.tabs-inner a')];
    const byId = new Map(tabs.map(a => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map(id => $(id)).filter(Boolean);
    const header = document.querySelector('.tabs');
    let chosen = null;
    let shown;

    const pick = () => {
      if (chosen) return chosen;
      const line = header.getBoundingClientRect().bottom + 90;
      let active = null;
      sections.forEach(s => { if (s.getBoundingClientRect().top <= line) active = s.id; });
      // 맨 아래까지 내려가 마지막 섹션이 위로 올라오지 못하는 경우
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) active = sections[sections.length - 1].id;
      return active;
    };
    const update = () => {
      const active = pick();
      if (active === shown) return;
      shown = active;
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
        bar.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    };

    document.querySelectorAll('.tabs-inner a, .sheet-links a').forEach(a => a.addEventListener('click', () => {
      const id = a.getAttribute('href').slice(1);
      chosen = byId.has(id) ? id : null;
      update();
    }));
    const release = () => { if (chosen) { chosen = null; update(); } };
    ['wheel', 'touchstart', 'keydown'].forEach(type => addEventListener(type, release, { passive: true }));

    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // 첫 화면을 지나면 오른쪽 아래에 MENU·맨 위로 버튼을 띄운다
  function setupMenu() {
    const fab = $('fab');
    const menu = $('section-menu');
    new IntersectionObserver(([entry]) => fab.classList.toggle('show', !entry.isIntersecting))
      .observe(document.querySelector('.hero-art'));
    const close = () => { if (menu.open) menu.close(); };
    $('menu-open').addEventListener('click', () => {
      renderSavedList();
      if (typeof menu.showModal === 'function') menu.showModal(); else menu.setAttribute('open', '');
      (menu.querySelector('a[aria-current]') || menu.querySelector('a')).focus();
    });
    $('menu-close').addEventListener('click', close);
    menu.addEventListener('click', e => { if (e.target === menu || e.target.closest('a')) close(); });
    $('share-site').addEventListener('click', () => shareLink('', '15th BSSS Program Book'));
  }

  // MENU 안에 저장한 발표 모아 보기
  function renderSavedList() {
    const box = $('sheet-saved');
    const links = [];
    Object.keys(KINDS).forEach(kind => list(kind).forEach((item, index) => {
      const id = entryId(kind, item, index);
      if (!saved.has(id)) return;
      const a = node('a');
      a.href = `#${id}`;
      a.append(node('span', '', `${CHIP[kind]} ${entryNumber(item, index)}`), document.createTextNode(item.title || ''));
      const li = node('li'); li.append(a); links.push(li);
    }));
    box.hidden = !links.length;
    box.querySelector('ul').replaceChildren(...links);
  }

  // 날짜 숫자가 슬롯처럼 굴러가다 제자리에 멈춘다. 화면 낭독기는 숨긴 원래 문장을 읽는다
  function rollDate() {
    const date = document.querySelector('.hero-date');
    if (!date || date.dataset.rolled) return;
    date.dataset.rolled = '1';
    const copy = date.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    const label = node('span', 'sr-only', copy.textContent.replace(/\s+/g, ' ').trim());
    const visual = node('span', 'date-visual');
    visual.setAttribute('aria-hidden', 'true');
    let order = 0;
    [...date.childNodes].forEach(child => {
      if (child.nodeType !== Node.TEXT_NODE) { if (!child.classList?.contains('sr-only')) visual.append(child); else child.remove(); return; }
      [...child.textContent].forEach(ch => {
        if (!/\d/.test(ch)) { visual.append(document.createTextNode(ch)); return; }
        const digit = Number(ch);
        const steps = 7 + order * 3;
        const roll = node('span', 'roll');
        roll.append(node('span', 'roll-size', ch));
        const strip = node('span', 'roll-strip');
        for (let k = steps; k >= 0; k--) strip.append(node('span', '', (digit - k + 100) % 10));
        strip.style.setProperty('--to', `${-steps}em`);
        strip.style.setProperty('--delay', `${0.55 + order * 0.08}s`);
        strip.style.setProperty('--dur', `${1.1 + order * 0.18}s`);
        roll.append(strip);
        visual.append(roll);
        order++;
      });
      child.remove();
    });
    date.replaceChildren(label, visual);
  }

  // 스크롤 진행 막대와 섹션 등장 효과
  function setupMotion() {
    const bar = $('progress');
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    rollDate();

    // 첫 화면에서 스크롤하면 일러스트 부품이 서로 다른 방향·속도로 흩어진다 (--p: 0 → 1)
    const art = document.querySelector('.hero-art');
    let artTicking = false;
    const scatter = () => {
      const end = art.offsetTop + art.offsetHeight;
      art.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / end)).toFixed(3));
      artTicking = false;
    };
    addEventListener('scroll', () => { if (!artTicking) { artTicking = true; requestAnimationFrame(scatter); } }, { passive: true });
    scatter();

    const targets = document.querySelectorAll('.section-head, .section-desc, .section .content, .info-list, .hero-intro');
    const observer = new IntersectionObserver(items => items.forEach(item => {
      if (!item.isIntersecting) return;
      item.target.classList.add('in');
      observer.unobserve(item.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }

  // 행사 중 내용이 바뀌면 알려 준다 (data.js를 주기적으로 다시 확인)
  function watchUpdates() {
    if (params.has('demo') || location.protocol === 'file:') return;
    const snapshot = JSON.stringify(data);
    const check = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const response = await fetch('./data.js', { cache: 'no-store' });
        if (!response.ok) return;
        const scope = {};
        new Function('window', await response.text())(scope);
        if (scope.SYMPOSIUM && JSON.stringify(scope.SYMPOSIUM) !== snapshot) $('update-bar').hidden = false;
      } catch (error) { /* 연결이 불안정하면 다음 확인 때 다시 시도 */ }
    };
    setInterval(check, 3 * 60000);
    document.addEventListener('visibilitychange', check);
    $('update-reload').addEventListener('click', () => location.reload());
  }

  function start() {
    data = window.SYMPOSIUM || {};
    event = data.event || {};
    if (params.has('demo')) document.body.prepend(node('div', 'demo-flag', '예시 데이터 미리보기 · 실제 프로그램이 아닙니다'));
    else if (data.draft) document.body.prepend(node('div', 'demo-flag', data.draft));
    fillEvent();
    setupMenu();
    renderNotices();
    renderSchedule();
    updateNow();
    setInterval(updateNow, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateNow(); });
    ['keynote', 'oral', 'flash', 'rewarded'].forEach(renderTalks);
    renderSimple('awards-content', list('awards'), '시상 부문과 진행 순서가 확정되면 이곳에 안내합니다.', '시상 안내를 준비하고 있습니다');
    renderSimple('laboratories-content', list('laboratories'), '참여 연구실 정보를 준비하고 있습니다.');
    renderSimple('committee-content', list('committee'), '운영위원회 정보를 준비하고 있습니다.');
    renderSimple('prizes-content', list('prizes'), '경품과 이벤트가 정해지면 이곳에 안내합니다.');
    $('poster-search').addEventListener('input', renderPosters);
    $('clear-search').addEventListener('click', () => { $('poster-search').value = ''; renderPosters(); $('poster-search').focus(); });
    $('saved-only').addEventListener('click', () => { savedOnly = !savedOnly; renderPosters(); });
    renderPosterMap();
    renderPosters();
    watchSections();
    setupMotion();
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    addEventListener('offline', () => toast('오프라인입니다 · 저장된 내용을 보여 드립니다'));
    watchUpdates();
    // 한 번 열어 두면 연결이 끊겨도 볼 수 있게 한다
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 주소에 ?demo=1을 붙이면 예시 데이터로 모든 기능을 미리 볼 수 있다
  if (params.has('demo')) {
    const script = document.createElement('script');
    script.src = './data-demo.js';
    script.onload = script.onerror = start;
    document.head.append(script);
  } else {
    start();
  }
})();

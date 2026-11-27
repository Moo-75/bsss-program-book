/* 기능 확인용 예시 데이터입니다. 주소 뒤에 ?demo=1 을 붙였을 때만 쓰이며 실제 프로그램이 아닙니다. */
(() => {
  const abstract = 'This is a sample abstract. It is not a real talk; it only shows how the layout looks.\nIt demonstrates a multi-line abstract with background, methods, results and conclusion.';
  const people = n => Array.from({ length: n }, (_, i) => `Presenter ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) + 1 : ''}`);
  const talks = (n, word, minutes) => people(n).map((speaker, i) => ({
    number: String(i + 1).padStart(2, '0'), title: `Sample ${word} title ${i + 1}`, speaker, affiliation: `Sample Laboratory ${(i % 4) + 1}`,
    time: minutes ? minutes[i] : '', abstract
  }));
  window.SYMPOSIUM = {
    event: { date: '2027-01-21', dateLabel: '2027. 01. 21 (THU)', venue: 'DGIST E7, L29', venueNote: 'Sample venue note.', mapUrl: '' },
    notices: [{ time: '10:20', title: 'Sample notice: poster session location', detail: 'Same-day changes can be pinned at the top like this.' }],
    schedule: [
      { time: '09:30–10:00', type: 'opening', title: 'Registration & Opening', location: 'E7 L29' },
      { time: '10:00–10:50', type: 'keynote', title: 'Keynote Lecture', speaker: 'Sample Speaker', location: 'E7 L29', ref: 'keynote-01' },
      { time: '10:50–12:00', type: 'oral', title: 'Oral Presentation', location: 'E7 L29', ref: 'oral' },
      { time: '12:00–13:00', type: 'break', title: 'Lunch' },
      { time: '13:00–13:40', type: 'flash', title: 'Flash Talk', location: 'E7 L29', ref: 'flash' },
      { time: '13:40–15:10', type: 'poster', title: 'Poster Session', location: 'E7 Lobby', ref: 'posters' },
      { time: '15:10–16:00', type: 'rewarded', title: 'Rewarded Talk', location: 'E7 L29', ref: 'rewarded' },
      { time: '16:00–16:30', type: 'award', title: 'Award Ceremony & Closing', location: 'E7 L29', ref: 'awards' }
    ],
    keynote: [{ number: '01', title: 'Sample keynote title', speaker: 'Sample Speaker', affiliation: 'Sample University', time: '10:00', bio: 'Sample speaker biography.', abstract, publications: ['Sample publication 1', 'Sample publication 2'] }],
    oral: talks(4, 'oral', ['10:50', '11:05', '11:20', '11:35']),
    posters: talks(24, 'poster').map((p, i) => ({ ...p, number: `P${String(i + 1).padStart(2, '0')}` })),
    posterMap: {
      note: 'Sample map. Not the actual venue layout.',
      areas: [
        { name: 'E7 Lobby A', rows: [['P01', 'P02', 'P03', 'P04', 'P05', 'P06'], ['P07', 'P08', 'P09', 'P10', 'P11', 'P12']], entrance: 'bottom' },
        { name: 'E7 Lobby B', rows: [['P13', 'P14', 'P15', 'P16', 'P17', 'P18'], ['P19', 'P20', 'P21', 'P22', 'P23', 'P24']] }
      ]
    },
    flash: talks(5, 'flash talk'),
    rewarded: talks(2, 'Rewarded Talk', ['15:10', '15:35']),
    awards: [{ name: 'Sample award 1', detail: 'Sample description' }, { name: 'Sample award 2', detail: 'Sample description' }],
    laboratories: [{ name: 'Sample Laboratory 1', detail: 'Sample PI' }, { name: 'Sample Laboratory 2', detail: 'Sample PI' }],
    committee: [{ name: 'Sample team', detail: 'Member A, Member B' }]
  };
})();

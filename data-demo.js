/* 기능 확인용 예시 데이터입니다. 주소 뒤에 ?demo=1 을 붙였을 때만 쓰이며 실제 프로그램이 아닙니다. */
(() => {
  const abstract = '예시 초록입니다. 실제 발표 내용이 아니며 화면 구성을 확인하기 위한 문장입니다.\n배경, 방법, 결과, 결론 순서로 여러 줄의 초록이 들어갔을 때의 모습을 보여 줍니다.';
  const people = n => Array.from({ length: n }, (_, i) => `발표자 ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) + 1 : ''}`);
  const talks = (n, word, minutes) => people(n).map((speaker, i) => ({
    number: String(i + 1).padStart(2, '0'), title: `예시 ${word} 제목 ${i + 1}`, speaker, affiliation: `예시 연구실 ${(i % 4) + 1}`,
    time: minutes ? minutes[i] : '', abstract
  }));
  window.SYMPOSIUM = {
    event: { date: '2027-01-21', dateLabel: '2027. 01. 21 (THU)', venue: 'DGIST E7, L29', venueNote: '예시 안내 문구입니다.', mapUrl: '' },
    notices: [{ time: '10:20', title: '예시 공지: 포스터 세션 장소 안내', detail: '당일 변경 사항을 이렇게 맨 위에 띄울 수 있습니다.' }],
    schedule: [
      { time: '09:30–10:00', type: 'opening', title: 'Registration & Opening', location: 'E7 L29' },
      { time: '10:00–10:50', type: 'keynote', title: 'Keynote Lecture', speaker: '예시 연사', location: 'E7 L29', ref: 'keynote-01' },
      { time: '10:50–12:00', type: 'oral', title: 'Oral Presentation', location: 'E7 L29', ref: 'oral' },
      { time: '12:00–13:00', type: 'break', title: 'Lunch' },
      { time: '13:00–13:40', type: 'flash', title: 'Flash Talk', location: 'E7 L29', ref: 'flash' },
      { time: '13:40–15:10', type: 'poster', title: 'Poster Session', location: 'E7 로비', ref: 'posters' },
      { time: '15:10–16:00', type: 'rewarded', title: 'Rewarded Talk', location: 'E7 L29', ref: 'rewarded' },
      { time: '16:00–16:30', type: 'award', title: 'Award Ceremony & Closing', location: 'E7 L29', ref: 'awards' }
    ],
    keynote: [{ number: '01', title: '예시 기조강연 제목', speaker: '예시 연사', affiliation: '예시 대학교', time: '10:00', bio: '예시 연사 소개 문장입니다.', abstract, publications: ['예시 논문 정보 1', '예시 논문 정보 2'] }],
    oral: talks(4, '구두발표', ['10:50', '11:05', '11:20', '11:35']),
    posters: talks(24, '포스터').map((p, i) => ({ ...p, number: `P${String(i + 1).padStart(2, '0')}` })),
    flash: talks(5, '플래시 토크'),
    rewarded: talks(2, 'Rewarded Talk', ['15:10', '15:35']),
    awards: [{ name: '예시 시상 부문 1', detail: '예시 설명' }, { name: '예시 시상 부문 2', detail: '예시 설명' }],
    laboratories: [{ name: '예시 연구실 1', detail: '예시 책임교수' }, { name: '예시 연구실 2', detail: '예시 책임교수' }],
    committee: [{ name: '예시 분과', detail: '위원 A, 위원 B' }]
  };
})();

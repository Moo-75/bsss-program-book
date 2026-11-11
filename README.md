# 15th BSSS 모바일 프로그램북

GitHub Pages에 배포할 수 있는 정적 웹사이트입니다. 별도의 설치나 빌드가 필요하지 않습니다. `index.html`, `styles.css`, `app.js`, `data.js`, `assets/`를 같은 상대 위치로 유지해 주세요.

디자인은 포스터 최종본(`2026_poster_draft_4`)을 따릅니다. 색(`#EEE2DF` 배경, `#0E5AAA` 코발트, `#82AFDD` 연파랑), BoonTook 글꼴, 왼쪽 BSSS 띠, 포스터 일러스트를 그대로 사용합니다.

## 현재 반영된 정보

- 행사 날짜: 2027년 1월 21일 (목) — 사용자 확인. **포스터 최종본에는 JAN 14로 인쇄되어 있으니 포스터를 확인하세요.**
- 장소: DGIST E7, L29 (최종 확인 필요)
- 시간표·발표·포스터·연구실·위원회: 정보 준비 중

실제 발표자 이름, 초록, 일정, 시상 부문을 확인하기 전에는 입력하지 마세요.

## 정보 입력 (`data.js`)

배열에 객체를 추가하면 페이지에 자동으로 표시됩니다. 모든 텍스트는 큰따옴표로 감싸고 각 항목은 쉼표로 구분합니다. 아래는 형식 예시이며 실제 행사가 아닙니다.

```js
window.SYMPOSIUM = {
  event: {
    date: "2027-01-21",              // 당일 '진행 중' 표시에 사용 (YYYY-MM-DD)
    dateLabel: "2027. 01. 21 (THU)",
    venue: "DGIST E7, L29",
    venueNote: "오시는 길 안내 문구",
    mapUrl: ""                       // 정확한 지도 링크가 있으면 입력
  },
  schedule: [
    // type: opening, keynote, oral, poster, flash, rewarded, award, break, closing
    // ref: 연결할 발표 id (예: "oral-01") 또는 섹션 id (예: "posters")
    { time: "10:00–10:50", type: "keynote", title: "Keynote Lecture", speaker: "연사 이름", location: "장소", ref: "keynote-01" }
  ],
  keynote:  [{ number: "01", title: "강연 제목", speaker: "연사", affiliation: "소속", time: "10:00", photo: "./assets/speakers/이름.jpg", bio: "소개", abstract: "초록", publications: ["논문 정보"] }],
  oral:     [{ number: "01", title: "발표 제목", speaker: "발표자", affiliation: "소속", time: "10:50", abstract: "초록" }],
  posters:  [{ number: "P01", title: "포스터 제목", speaker: "발표자", affiliation: "소속", abstract: "초록" }],
  flash:    [{ number: "01", title: "발표 제목", speaker: "발표자", affiliation: "소속" }],
  rewarded: [{ number: "01", title: "발표 제목", speaker: "발표자", affiliation: "소속", abstract: "초록" }],
  awards:   [{ name: "시상 부문", detail: "설명" }],
  laboratories: [{ name: "연구실 이름", detail: "기관 및 책임교수" }],
  committee:    [{ name: "분과 이름", detail: "위원 이름" }]
};
```

- 비어 있는 배열(`[]`)은 "준비 중" 안내로 표시됩니다.
- 초록의 줄바꿈은 `\n`으로 넣습니다. `photo`, `bio`, `publications`는 선택 항목입니다.
- 시간은 `"10:00–10:20"` 또는 `"10:00"` 형식으로 씁니다. 끝 시간이 없으면 다음 순서 시작까지로 계산합니다.

## 기능

- **당일 진행 표시**: `event.date`와 같은 날에는 시간표에 지금(NOW)·다음(NEXT) 순서가 표시됩니다. 미리 확인하려면 주소 뒤에 `?now=2027-01-21T10:30`을 붙이세요.
- **발표별 링크**: `주소#oral-01`, `#keynote-01`, `#poster-P01`, `#flash-01`, `#rewarded-01`로 들어오면 해당 초록이 펼쳐집니다. 각 초록의 "이 발표 링크 공유" 버튼으로 복사·공유할 수 있습니다.
- **포스터 검색**: 번호, 제목, 발표자, 소속 검색과 일치 부분 강조. 포스터가 없을 때는 검색창이 숨겨집니다.
- **공유 미리보기**: 카카오톡 등에 링크를 보내면 `assets/og-image.jpg`가 표시됩니다. 날짜나 디자인이 바뀌면 이 이미지도 바꿔야 합니다. 일부 메신저는 절대 주소를 요구하므로 Pages 주소가 정해지면 `index.html`의 `og:image`를 `https://.../assets/og-image.jpg`로 바꾸세요.

- **어디서나 보이는 NOW 띠**: 당일에는 상단 탭 아래에 지금 순서와 남은 시간이 항상 표시됩니다. 누르면 시간표의 해당 줄로 이동합니다.
- **저장(★)**: 발표·포스터 오른쪽의 별을 누르면 그 기기에 저장됩니다. 포스터는 "저장한 포스터"만 모아 볼 수 있고, MENU 아래에 저장 목록이 나옵니다.
- **공지**: `data.js`에 `notices: [{ time: "10:20", title: "제목", detail: "내용" }]`를 넣으면 맨 위에 파란 공지로 표시됩니다.
- **업데이트 알림**: 열어 둔 화면은 3분마다 `data.js`를 다시 확인하고, 바뀌었으면 "새로고침" 알림을 띄웁니다. (GitHub Pages 반영까지 최대 10분쯤 걸릴 수 있습니다.)
- **오프라인**: 한 번 연 뒤에는 연결이 끊겨도 열립니다(`sw.js`). 화면·데이터는 최신을 먼저 받고 3초 안에 안 오면 저장본을 씁니다. 이미지·글꼴 파일을 **같은 이름으로 교체**했다면 `sw.js`의 `CACHE` 이름(`bsss15-v1`)을 올려 주세요.
- **홈 화면 추가**: `manifest.webmanifest`와 `assets/icon-*.png`.
- **예시 데이터 미리보기**: 주소 뒤에 `?demo=1`을 붙이면 `data-demo.js`의 가짜 데이터로 모든 기능을 볼 수 있습니다. 예: `?demo=1&now=2027-01-21T11:10`. 실제 방문자에게는 보이지 않습니다.
- **D-day**: 행사 전에는 첫 화면에 D-n, 당일에는 TODAY가 표시됩니다.

## 에셋

- `assets/art/*.webp`: 포스터 일러스트를 부품별(뇌, 뉴런, 망점 원, 막단백질, 고리, 점 등)로 나눈 레이어. 첫 화면에서 각자 조금씩 다르게 움직입니다. 위치는 `index.html`, 움직임은 `styles.css`의 `.art-*`에서 조정합니다.
- `assets/bsss-band*.webp`, `dgist-logo.png`: 포스터 PDF에서 추출한 그래픽
- `assets/BoonTook-Regular.woff`: 영문 표제 글꼴(SIL OFL, 라틴 문자만 남긴 subset). 한글은 Pretendard(jsDelivr CDN)로 표시됩니다.

## 배포 (확정)

- 주소: **https://moo-75.github.io/bsss-program-book/**
- 저장소: https://github.com/Moo-75/bsss-program-book (공개, `main` 브랜치 루트에서 Pages 배포)
- QR 코드: `../output/qr/` (`bsss_qr_black.*` 인쇄용 기본, `bsss_qr_blue.*` 포스터 색). 오류 정정 H 등급.

수정은 `symposium-web/`에서 하고, `symposium-publish/`(저장소와 연결된 폴더)로 복사한 뒤 commit·push하면 1분 안팎으로 반영됩니다. **저장소 이름이나 계정을 바꾸면 주소가 바뀌어 이미 인쇄한 QR이 작동하지 않습니다.** 공개 저장소이므로 `data.js`에 넣은 내용은 누구나 볼 수 있습니다.

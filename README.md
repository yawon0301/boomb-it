# 붐잇 (boomb-it)

> 마감이 다가오면 화면 위에서 폭탄이 타들어가는 할 일 웹.

「붐잇 기획서 — 최종」 + 「붐잇 개발지침서」 기준으로 새로 구현한 MVP.
**React + Tailwind CSS v4**, 저장은 **브라우저 localStorage**(로그인 없음).

## 실행

```bash
cd boomb-it
npm install
npm run dev      # http://localhost:5173
```

Chrome / Edge 권장 — 떠 있는 창(Document Picture-in-Picture)은 이 브라우저들에서만 동작합니다.

## 레이아웃

- **모바일 기본** — 480px 센터 앱 하나. 인스타 DM 밀도 + iOS 타이머 톤(지침서 3-2·3-3).
- **PC(lg↑)** — 센터를 가운데 두고 **좌측 날개=사이트 소개**, **우측 날개=메모 통계 배너 블럭**.
  날개는 `lg` 이상에서만 나타나며 모바일에선 숨겨집니다. (`src/components/Shell.jsx`)

## 구현된 것 (기획서 2-Z MVP)

- 할 일 등록 — 내용 + 날짜·시간 + 매일 반복, 하단 입력창 빠른 추가
- 폭탄/평화 모드, 타이머 길이 30분~3시간(10분 단위)
- 폭탄 캐릭터 5상태 SVG (`Bomb.jsx`) — 색·표정·심지만 계산으로 전환
- 떠 있는 창(PiP) 상주 + `/float` 미리보기
- 폭발 10초 전 알림 “10초 뒤 터집니다” (탭이 살아 있을 때)
- 폭발 시 완료 / 미루기 / 놓아주기, 미루기 10분 단위·날짜 직접
- 폭발 방치 시 경과 시간 표시
- 우측 날개 통계(타는 중/방치/오늘 완료/평화/완료율/다음 폭발까지)

## 지침서 함정 반영

시간은 전부 계산(누적 금지, `lib/time.js`) · PiP는 클릭 안에서만 열고 스타일 복사
(`lib/pip.js`) · `tabular-nums` · 알림은 첫 할 일 저장 직후 1회만 요청.

## 구조

```
src/
  lib/    store(localStorage) · time · recurrence(store 내) · notify · pip · stats · hooks
  pages/  Checklist(/) · NewTask(/new) · TaskDetail(/task/:id) · Settings(/settings) · /float
  components/ Shell · IntroWing · StatsWing · Bomb · TimerRing · TaskRow · TaskForm
              BottomInput · ActionButtons · PostponeSheet · FloatContent · FloatProvider · Header
```

## Supabase 전환 (2차)

지침서 4장의 스키마·RLS는 그대로 유효합니다. 전환 시 **`src/lib/store.js` 한 파일**만
같은 함수 시그니처로 Supabase 구현으로 교체하면 됩니다 (task/occurrence 모델 동일).
```

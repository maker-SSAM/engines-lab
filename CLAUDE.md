# CLAUDE.md — 슬라이드 엔진(프레임워크) 공부 실험실

## 이 프로젝트는
- 초등 교사가 수업·연수용 슬라이드를 만들 때 쓸 **엔진(프레임워크)**을 공부하는 실험실이다.
- 공개 엔진(reveal.js, Marp, Slidev, impress.js 등)을 직접 시험해 보고, 초등 수업에 쓸 만한 기능을 찾는다.
- 검증된 기능은 강의 프로젝트(`../Lecture-Notes`)의 엔진 v2 후보가 된다. **여기서 `../Lecture-Notes` 파일을 직접 고치지 않는다.** 옮길 기능은 정리해서 제안만 한다.

## 작업 방식 (사용자 요청)
- **질문·조사·비교 요청에는 답만 한다.** 시험 덱 제작, 도구 설치, 배포는 사용자가 "만들어줘/진행해"처럼 지시할 때 시작한다.
- 사용자는 휴대폰으로 확인할 때가 많다. 결과를 보여 줄 때는 휴대폰에서 열 수 있는 방법(배포 링크 등)을 함께 제안한다. 배포는 매번 허락을 받는다.
- 시험할 때마다 **`학습노트.md`에 기록**한다: 무엇을 시도했고, 결과가 어땠고, 초등 수업에 어떻게 쓸 수 있는지(또는 왜 안 되는지). 직접 확인한 것과 문서로만 본 것을 구분해 적는다.

## 폴더
```
build-lab.js        공통 시험 내용(저글링 4장)을 엔진별로 생성 — 내용 수정은 여기 한 곳에서
rebuild.sh          전체 재생성 (build-lab.js → Marp 변환 → Slidev 빌드)
index.html          비교 페이지 (시험 덱 바로가기 · 기능 비교표 · 결론)
current/            비교 기준: 강의 프로젝트 엔진으로 만든 시험 덱
reveal/ impress/ marp/ slidev/   엔진별 시험 덱
vendor/             엔진 파일 사본 — 각 폴더에 LICENSE 를 반드시 함께 둔다(MIT 조건)
baseline/           강의 프로젝트 엔진 원본 사본(src/, DESIGN.md) — 공부·비교용, 고치지 않는다
학습노트.md          배운 점 기록
```

## 설치 도구는 OneDrive 밖에
- npm 패키지(reveal.js·impress.js·Marp CLI)는 `~/engines-lab-tools/npm`, Slidev 는 `~/engines-lab-tools/slidev` (합계 약 700MB).
- **이 폴더 안에서 `npm install` 하지 않는다** (node_modules 가 OneDrive 동기화를 느리게 함). 새 엔진도 `~/engines-lab-tools/` 아래에 설치하고, 필요한 파일만 `vendor/` 로 복사한다.
- 미리보기: `.claude/launch.json` 의 `lab` (python http.server, 포트 5180).

## 시험 규칙
- 모든 엔진에 **같은 내용**을 넣는다(`build-lab.js`). 엔진 차이만 보이게 하기 위해서다.
- 디자인(색·글자 크기)은 `baseline/DESIGN.md` 기준으로 맞춘다.
- 평가 기준(초등 현장): 단계별 등장 · 원리 그림 애니메이션 · 판서 · 발표자 대본 · 목차 · 전자칠판 터치 · PDF 내보내기 · 파일 하나로 공유 · 만드는 데 필요한 것 · 채팅 AI가 아는 정도 · 용량.
- 라이선스를 먼저 확인한다. MIT 는 저작권 문구만 남기면 자유. MPL(예: Sozi)은 고친 파일의 소스를 공개해야 하므로 아이디어만 참고한다.

## 배포 (실험실 전용 저장소)
- 저장소: GitHub 공개 저장소 `maker-SSAM/engines-lab`, `main` 브랜치. **이 폴더 자체가 그 저장소**다(`git push` 하면 됨).
- 주소: https://maker-ssam.github.io/engines-lab/ (비교 페이지 `index.html`). 시험 덱은 `…/engines-lab/reveal/` 처럼 폴더 이름으로.
- 절차: 사용자가 배포를 허락하면 → commit → push → 주소가 200으로 열리는지 확인 → 링크 전달.
- 커밋 메시지는 한국어 한 줄, 작성자는 이 저장소에 설정된 `maker-SSAM`.
- `.nojekyll` 이 있어야 Slidev 결과의 `_` 로 시작하는 파일이 그대로 올라간다. 지우지 않는다.
- 강의용 저장소(`slides-4eb9a2a2c2`)에는 실험물을 올리지 않는다.

# portfolio-web

[Astro](https://astro.build) + TypeScript로 만든 공개 개발자 포트폴리오·기술 블로그. 정적 파일로 배포한다. 기본 언어는 한국어(`/`), 영어는 `/en/`이며 locale을 더 추가할 수 있는 구조다.

**Personal OS** 프로젝트의 공개 면이다. 비공개 Obsidian Vault가 원본이고, Mac mini의 비공개 FastAPI 백엔드가 검색·AI를 담당하며, 이 사이트에는 검토·승인 파이프라인(`docs/publishing.md`)을 통과한 콘텐츠만 올라온다.

English: [README.md](README.md)

## 상태

Phase 1 — 뼈대. 페이지, i18n 라우팅, 콘텐츠 컬렉션, 다크 모드, CI가 동작하며 콘텐츠는 샘플이다.

## 요구사항

- Node 24 (`.nvmrc`), npm

## 개발

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # astro check (TypeScript strict)
npm run build      # dist/
npm run preview
```

## 디자인 시스템과 QA

- `DESIGN.md` — 성격, 타이포그래피(Wanted Sans·고운바탕·JetBrains Mono, 모두 SIL OFL self-host), 라이트/다크 색 토큰, 레이아웃·컴포넌트 규칙. `src/styles/tokens.css`가 이 문서를 그대로 반영합니다.
- `npm run design:qa` — 타입 체크, 빌드, 색 리터럴 검사, Playwright(설치된 Chrome 사용) 320/390/768/1280px × 라이트/다크: 가로 오버플로, axe(WCAG 2.2 AA), 44px 터치 타깃, 전체 페이지 스크린샷(`shots/`). `VISUAL_BASELINE=1`이면 `tests/__screenshots__/`와 비교합니다.
- `docs/design/quality-gates.md` — "완료"의 기준. `LICENSES.md` — 모든 서드파티 자산과 라이선스.
- `.claude/skills/design-qa`와 `.claude/settings.json`의 Stop hook이 코딩 에이전트가 UI 작업을 끝내기 전에 검사를 돌리게 합니다.

## 구조

`README.md`의 Structure 절과 동일. 요지: `src/content/<collection>/<locale>/`에 locale별 Markdown, `src/i18n/ui.ts`에 모든 UI 문자열, `src/views/`에 locale 무관 페이지 컴포넌트, `src/pages/`와 `src/pages/en/`은 그것을 감싸는 얇은 라우트.

## 글로벌 전제

| 축 | 규칙 |
|---|---|
| 시간 | frontmatter 날짜는 ISO 8601, 표시는 `formatDate(date, locale, timeZone)`로만 |
| 언어 | BCP 47, `defaultLocale: 'ko'`, `prefixDefaultLocale: false`, 모든 페이지에 `hreflang` |
| 노출성 | `visibility: private \| restricted \| public` + `draft`. 목록은 public만, restricted는 비공개 링크(`noindex`), private는 빌드 안 함 |
| 배포 | `output: 'static'`, 어댑터 없음, `SITE_URL` 환경변수 |

## 콘텐츠 추가

1. `src/content/writing/<locale>/<slug>.md` (ASCII kebab-case). 번역본은 같은 slug와 `translationKey`.
2. frontmatter: `title, summary, date, tags, lang, translationKey, visibility, draft, license`.
3. 콘텐츠는 `docs/publishing.md`의 파이프라인을 통해서만 이 저장소에 들어온다.

### 평범한 Markdown이 화면에서 바뀌는 것

글은 평범한 Markdown 그대로 두고, 빌드(`src/plugins/`, `src/styles/prose.css`)가 꾸민다. Vault 원본에 사이트 전용 문법은 필요 없다.

| 쓰는 것 | 화면에 보이는 것 |
| --- | --- |
| 인용 블록 첫 줄의 `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` | 아이콘·색·locale별 제목이 붙은 콜아웃 |
| 언어를 적은 코드 블록 | 언어 라벨과 복사 버튼이 있는 다크 코드 카드 |
| 문단에 단독으로 쓴 `![alt](image.png "캡션")` | 캡션 달린 `<figure>` (캡션이 없으면 alt 사용). 이미지는 `LICENSES.md` 행이 필요 |
| 다른 사이트로 가는 링크 | 글자 뒤 화살표, `rel="noopener"` |
| `##` ~ `####` 제목 | 목차 항목과 제목 옆 링크 아이콘 |
| `<kbd>Ctrl</kbd>` | 키 캡 |
| 표 | 둥근 테두리, 폰에서는 가로 스크롤 |
| (자동) | 본문 글자 수로 계산한 읽는 시간이 메타 줄에 표시 |

## 배포 (수동)

Cloudflare Pages → GitHub 저장소 연결 → 빌드 명령 `npm run build`, 출력 `dist`, 환경변수 `SITE_URL=https://<도메인>`. 다른 정적 호스팅도 같은 방식.

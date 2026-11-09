---
title: "디자인 점검용 문서 — 긴 한글 제목과 여러 열의 표가 좁은 화면에서도 넘치지 않는지 확인하기"
summary: "사이트의 글 레이아웃을 점검하기 위한 표본 문서다. 넓은 표, 긴 문장, 코드, 목록을 한곳에 모았다."
date: 2026-11-09
tags: [meta, fixture]
lang: ko
translationKey: markdown-fixture
visibility: restricted
draft: false
---

이 문서는 디자인 QA(`tests/pages.mjs`의 `article-tables`)가 방문하는 표본이다. 내용에는 의미가 없고, 목록에 노출되지 않는다.

## 열이 많은 표

| 항목 | 설명 | 형식 | 기본값 | 비고 |
| --- | --- | --- | --- | --- |
| 제목 | 원어 그대로 적는 글의 제목. 길어져도 줄바꿈으로 처리되어야 한다 | 문자열 | 없음 | 필수 |
| 요약 | 목록과 검색 결과에 보이는 한두 문장 | 문자열 | 없음 | 필수 |
| 날짜 | 글을 처음 쓴 날 | ISO 8601 (`YYYY-MM-DD`) | 없음 | 표시할 때만 지역 형식으로 바꾼다 |
| 언어 | 본문 언어 | BCP 47 (`ko`, `en`) | `ko` | 번역본은 같은 `translationKey`를 쓴다 |
| 노출 | 누가 볼 수 있는가 | `private` · `restricted` · `public` | `private` | 가장 보수적인 값이 기본이다 |

## 열이 더 많은 표

| 단계 | 기간 | 목표 | 완료 기준 | 담당 | 위험 | 대응 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 첫째 주 | 자료 수집과 색인 | 표본 입력에서 결과가 나온다 | 데이터 | 항목 이름이 문서마다 다르다 | 핵심 항목만 먼저 맞춘다 |
| 2 | 둘째 주 | 검증 흐름과 화면 | 처음부터 끝까지 한 번에 돈다 | 백엔드·프론트 | 실행마다 결과가 달라진다 | 도구 결과를 저장해 둔다 |
| 3 | 셋째 주 | 안정화와 배포 | 반복 실행에도 같은 결과가 나온다 | 전원 | 외부 서비스 장애 | 저장해 둔 자료로 시연한다 |

## 긴 문장과 끊기지 않는 문자열

한글은 어절 단위로 줄이 바뀌어야 읽기 편하다. 다만 `a-very-long-identifier-without-any-natural-break-point-that-must-still-wrap-inside-the-column`처럼 끊을 곳이 없는 문자열도 화면 밖으로 넘치면 안 된다.

- 목록 항목 하나. 설명이 길어져 두 줄 이상이 되더라도 들여쓰기가 유지되어야 한다.
- 목록 항목 둘. [외부 링크](https://example.com/)는 새 창 표시와 함께 보인다.

```ts
// 코드 블록은 가로로 스크롤되고 페이지 폭을 밀어내지 않는다.
export function formatDate(date: Date, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone }).format(date);
}
```

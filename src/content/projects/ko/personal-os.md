---
title: Personal OS
summary: Obsidian를 원본으로 삼는 로컬 우선 개인 지식 시스템. Mac mini의 비공개 FastAPI 백엔드가 하이브리드 검색과 근거 기반 AI 질의응답을 제공한다.
date: 2026-10-28
tags: [python, fastapi, postgresql, rag]
lang: ko
translationKey: personal-os
visibility: public
draft: false
license: CC-BY-4.0
role: 설계·구현 (개인 프로젝트)
period: 2026-10 –
stack: [Python 3.13, FastAPI, PostgreSQL, pgvector, Astro, Docker Compose, Tailscale]
---

## 문제

흩어진 학습 노트·프로젝트 기록·커리어 자료를 한 곳에 모으되, AI가 원본을 망가뜨리지 않고 "내가 예전에 이 문제를 어떻게 풀었지?"에 근거를 들어 답하게 하고 싶었다.

## 설계 결정

- Markdown이 원본, DB와 벡터 인덱스는 언제든 재구축 가능한 파생 데이터.
- 공개 사이트와 비공개 백엔드를 네트워크 수준에서 분리. 공개 콘텐츠는 승인 후 별도 저장소로만 복사.
- 키워드 검색(FTS)과 벡터 검색을 RRF로 결합. 기술 용어는 정확히 일치해야 하기 때문.
- AI는 제안만 하고, 파일 변경은 diff 승인 후에만 적용.

## 측정 (예정)

Recall@5, P50/P95 지연, 인덱싱 처리량, 잘못된 출처 인용 비율, 질문당 비용(USD). 수치는 측정 후 이 페이지에 추가한다.

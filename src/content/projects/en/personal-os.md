---
title: Personal OS
summary: A local-first personal knowledge system with Obsidian as the source of truth and a private FastAPI backend on a Mac mini providing hybrid search and citation-backed AI answers.
date: 2026-10-28
tags: [python, fastapi, postgresql, rag]
lang: en
translationKey: personal-os
visibility: public
draft: false
license: CC-BY-4.0
role: Design and implementation (personal project)
period: 2026-10 –
stack: [Python 3.13, FastAPI, PostgreSQL, pgvector, Astro, Docker Compose, Tailscale]
---

## Problem

Bring scattered study notes, project records and career material into one place, without letting AI damage the originals, and have it answer "how did I solve this before?" with evidence.

## Design decisions

- Markdown is the source of truth; the database and vector index are derived data that can be rebuilt at any time.
- The public site and the private backend are separated at the network level. Public content is copied to a separate repository only after approval.
- Keyword search (FTS) and vector search are fused with RRF, because technical identifiers must match exactly.
- AI only proposes; file changes are applied after a diff is approved.

## Measurements (planned)

Recall@5, P50/P95 latency, indexing throughput, wrong-citation rate, cost per question (USD). Numbers will be added here once measured.

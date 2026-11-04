# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has not tagged a release
yet; `backend/pyproject.toml` declares version `0.1.0`.

## [Unreleased]

### Added

- Repository documentation: architecture overview, installation, configuration, data import and MCP setup guides.
- Issue templates, pull request template and Code of Conduct.
- CI runs the backend tests on Python 3.12, 3.13 and 3.14, and the web self-checks (`npm test`).
- `backend/.env.example`.

### Changed

- The logo files used by the README moved to `assets/logo/`.

### Removed

- The internal brand workspace (`docs/brand/`).

## 2026-11-04

### Added

- Agent-drafted content briefs: the `posts_needing_briefs` MCP tool and the `draft_briefs` prompt. Drafts are flagged
  `needs_review` until confirmed in the app.
- Content calendar of published and planned posts.
- Post experiments: plan a post with a hypothesis, link it to the published post, and record a verdict.
- Follower lift per post (`followers_3d` in `v_content_performance`).

### Changed

- Engagement rate falls back to impressions when a platform reports no views.
- Tidier dashboard cards.

## 2026-11-03

### Added

- Content briefs (`content_briefs`): the creative decisions behind a post, versioned per post.
- Full-screen post editor.
- Open-source project files: license, contributing guide, security policy and CI.

### Fixed

- Import crash on Python 3.12 and 3.13.

## 2026-11-02

### Added

- Logo and redesigned dark/light UI.

## 2026-11-01

### Changed

- Layered FastAPI backend and feature-based web app structure.

## 2026-10-28

### Added

- First version: FastAPI REST API, MCP server and TanStack Start dashboard for YouTube, TikTok, Instagram and LinkedIn
  analytics.

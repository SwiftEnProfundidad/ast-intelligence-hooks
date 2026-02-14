# Visual Assets Guide

This folder stores framework diagrams and screenshots used in documentation.

## Standard

- Prefer `SVG` for diagrams (resolution-independent, diff-friendly).
- Keep screenshot assets (`PNG`) only for terminal/UI captures where vector format is not available.
- Use `docs/images/*.svg` links in docs when an SVG equivalent exists.
- Keep naming stable (`ast_intelligence_0X.svg`) to avoid link churn across docs.

## Current migration status

- Architecture and workflow diagrams are standardized on SVG:
  - `ast_intelligence_01.svg`
  - `ast_intelligence_02.svg`
  - `ast_intelligence_03.svg`
  - `ast_intelligence_04.svg`
  - `ast_intelligence_05.svg`
- PNG counterparts are retained only as legacy/backward-compatible assets.

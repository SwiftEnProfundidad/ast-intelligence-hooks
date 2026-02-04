---
# Architecture Overview

## Legacy
All code under `/legacy` belongs to the pre-enterprise design (v0).
This code is frozen and must not be refactored.
It may only receive minimal maintenance fixes.

## Enterprise Core
All new development happens under `/core`.
The enterprise core must not depend on `/legacy`.
Legacy code may call the core, never the other way around.

## Integrations
All hooks, CI, MCP, and external adapters live under `/integrations`.
Integrations delegate all decision-making to the core.
---

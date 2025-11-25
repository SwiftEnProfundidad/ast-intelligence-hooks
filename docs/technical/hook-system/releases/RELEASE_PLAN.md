# Hook-System Release Plan (v6.0.0)

## Scope
- NotificationCenter, monitoring services, auto recovery, install wizard.
- Applies to projects consuming `@pumuki/ast-intelligence-hooks`.

## Pre-release Checklist
- ✅ `npm test` passing (unit + integration).
- ✅ `.AI_EVIDENCE.json` timestamp < 10 minutes.
- ✅ Documentation updated: INSTALLATION_GUIDE.md, TROUBLESHOOTING.md, README.md.
- ✅ CHANGELOG v6.0.0 reviewed.

## Release Steps
1. Tag and package:
   ```bash
   npm version 6.0.0
   npm publish --dry-run
   ```
2. Validate install wizard on a clean clone.
3. Run health-check / auto-recovery CLIs manually.
4. Record logs (`.audit-reports/`) and attach to release notes.

## Deployment
- Target projects: RuralGO repositories using hook-system guards.
- Execute `npx ast-sync pull --strategy=merge` in each project.
- Monitor NotificationCenter (`health_check_*`, `auto_recovery_*`) during first 24h.

## Rollback Strategy
- Checkout previous tag (`v5.2.0`).
- Restore `.hook-system` config backups.
- Disable auto-recovery if repeated failures appear.

## Communication
- Announce in release channel with summary + checklist.
- Share troubleshooting guide link and install wizard instructions.

## Post-release Metrics
- Token monitor false positives < 5%.
- Notification spam reduction maintained (>80%).
- Guard uptime > 99% (tracked via `health-status.json`).


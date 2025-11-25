# Changelog

## [6.0.0] - 2025-11-10

### Breaking Changes
- Package renamed from `@carlos/ast-intelligence-hooks` to `@pumuki/ast-intelligence-hooks`
- Reorganized exports to support modular Clean Architecture layers
- Updated to semantic versioning 6.0.0 for npm distribution

### Added
- `domain/index.js` - Aggregated exports for domain layer (entities, rules, repository interfaces)
- `application/index.js` - Aggregated exports for application layer (use cases, services)
- `config/index.js` - Centralized configuration with `defaultConfig` and `mergeConfig()` utility
- `infrastructure/sync/LibrarySyncService.js` - Bidirectional synchronization service
- `bin/sync-library.js` - CLI tool for library synchronization (`ast-sync` command)
- **`application/services/notification/NotificationCenterService.js`** - Centralized notification service with deduplication (NEW)
- **`application/services/notification/__tests__/NotificationCenterService.spec.js`** - Comprehensive test suite (NEW)
- **`docs/technical/NOTIFICATION_SYSTEM_AUDIT.md`** - Complete audit of notification system (NEW)
- Conflict resolution strategies: library-wins, project-wins, newest-wins, manual
- Automatic backup creation before sync operations
- Dry-run mode for safe sync preview
- Notification deduplication with 5-second window
- Configurable cooldowns per notification type (evidence, token, dirty_tree, heartbeat)
- Retry logic with exponential backoff for notification delivery
- Message queue with auto-flush (1-second interval)
- Structured JSON logging for notifications
- Enhanced `package.json` exports with proper module paths
- Backward compatibility layer for existing consumers
- `.npmignore` for optimized package distribution

### Changed
- Main `index.js` now exports organized layers (domain, application, config)
- Improved modular structure for better tree-shaking and selective imports
- Updated version to 6.0.0 (from 5.2.0)
- **`RealtimeGuardService.js`** - Refactored to use NotificationCenterService via Dependency Injection
  - Removed 110 lines of notification logic (sendMacNotification, resolveTerminalNotifier, etc.)
  - Reduced from 1855 to ~1745 lines (-5.9%)
  - Reduced instance variables from 80+ to ~65 (-18.75%)
  - All 29 notify() calls now include type and metadata for intelligent cooldowns
  - Notification spam reduced by 80%+ through deduplication and cooldowns
  - Improved testability with DI (can inject mock NotificationCenterService)

### Structure
```javascript
// New modular imports
const { domain, application, config } = require('@pumuki/ast-intelligence-hooks');

// Backward compatible (still works)
const { Finding, AuditResult } = require('@pumuki/ast-intelligence-hooks');
```

### Migration Guide
For existing consumers:
1. Update package.json: `"@carlos/ast-intelligence-hooks"` → `"@pumuki/ast-intelligence-hooks"`
2. No code changes needed - backward compatibility maintained
3. Optional: migrate to modular imports for better tree-shaking

---

## [5.2.0] - 2025-11-06

### Added
- Dynamic rules loader with platform detection
- Autonomous orchestrator service
- Context detection engine

### Changed
- Enhanced platform detection service
- Improved AST intelligence core

---

## [5.1.0] - 2025-11-01

### Added
- Multi-platform support (iOS, Android, Backend, Frontend)
- Feature-First + DDD + Clean Architecture enforcement
- Dynamic violations API

### Changed
- Refactored AST analyzers by platform
- Enhanced reporting and severity tracking

---

## [5.0.0] - 2025-10-15

Initial enterprise release with complete AST Intelligence System.


# Core Data Expert

Use this skill when auditing or implementing Core Data code that must remain safe across contexts, layers, and async boundaries.

## Focus areas

- ✅ Prefer `NSManagedObjectID` or mapped DTO/domain models over passing `NSManagedObject` across boundaries.
- ✅ Avoid returning or accepting `NSManagedObject` in async APIs that cross actor or context boundaries.
- ✅ Keep Core Data orchestration inside infrastructure or repository layers instead of presentation or application code.
- ✅ Make context ownership explicit and keep merge boundaries controlled.
- ✅ Treat managed objects as context-scoped references, not as portable domain entities.

## What good looks like

- Use repositories that map managed objects into domain models before crossing module boundaries.
- Pass `NSManagedObjectID` when a different context must resolve the entity later.
- Keep fetch, save, and merge work inside dedicated persistence services.

## What to avoid

- ❌ Passing `NSManagedObject` through service, use-case, or presentation boundaries.
- ❌ Async APIs that return `NSManagedObject` directly.
- ❌ Using `CoreData`, `@FetchRequest`, `managedObjectContext`, or persistence containers directly in application/presentation code.
- ❌ Leaking context-scoped managed objects into SwiftUI state or view models.

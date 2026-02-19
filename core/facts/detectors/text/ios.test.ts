import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasSwiftAnyViewUsage,
  hasSwiftCallbackStyleSignature,
  hasSwiftDispatchGroupUsage,
  hasSwiftDispatchQueueUsage,
  hasSwiftDispatchSemaphoreUsage,
  hasSwiftForceCastUsage,
  hasSwiftForceTryUsage,
  hasSwiftForceUnwrap,
  hasSwiftNavigationViewUsage,
  hasSwiftObservableObjectUsage,
  hasSwiftOnTapGestureUsage,
  hasSwiftOperationQueueUsage,
  hasSwiftStringFormatUsage,
  hasSwiftTaskDetachedUsage,
  hasSwiftUIScreenMainBoundsUsage,
  hasSwiftUncheckedSendableUsage,
} from './ios';

test('hasSwiftForceUnwrap detecta force unwrap postfix en expresiones', () => {
  const source = `
let token = optionalToken!
let value = loadUser()!
`;
  assert.equal(hasSwiftForceUnwrap(source), true);
});

test('hasSwiftForceUnwrap excluye type annotations, force cast y operadores', () => {
  const source = `
let name: String!
let model = payload as! User
if left != right { print("ok") }
let flag = value!!
`;
  assert.equal(hasSwiftForceUnwrap(source), false);
});

test('hasSwiftAnyViewUsage detecta AnyView en codigo real', () => {
  const source = `
func render() -> some View {
  AnyView(Text("hello"))
}
`;
  assert.equal(hasSwiftAnyViewUsage(source), true);
});

test('hasSwiftAnyViewUsage ignora comentarios, strings y coincidencias parciales', () => {
  const source = `\n// AnyView(Text("debug"))\nlet value = "AnyView(Text(\\"debug\\"))"\nlet customAnyViewBuilder = true\n`;
  assert.equal(hasSwiftAnyViewUsage(source), false);
});

test('hasSwiftForceTryUsage detecta try! y descarta try?', () => {
  const positive = `
func load() {
  let user = try! repository.fetch()
}
`;
  const negative = `
func load() {
  let user = try? repository.fetch()
}
`;
  assert.equal(hasSwiftForceTryUsage(positive), true);
  assert.equal(hasSwiftForceTryUsage(negative), false);
});

test('hasSwiftForceCastUsage detecta as! y descarta as?', () => {
  const positive = `
let model = payload as! User
`;
  const negative = `
let model = payload as? User
`;
  assert.equal(hasSwiftForceCastUsage(positive), true);
  assert.equal(hasSwiftForceCastUsage(negative), false);
});

test('hasSwiftCallbackStyleSignature detecta firmas callback con @escaping', () => {
  const completionSignature = `
func fetch(completion: @escaping (Result<Void, Error>) -> Void) {}
`;
  const handlerSignature = `
func run(handler: @MainActor @escaping () -> Void) {}
`;
  assert.equal(hasSwiftCallbackStyleSignature(completionSignature), true);
  assert.equal(hasSwiftCallbackStyleSignature(handlerSignature), true);
});

test('hasSwiftCallbackStyleSignature ignora usos fuera de firmas callback', () => {
  const source = `\n// @escaping completion: @escaping () -> Void\nlet text = "@escaping completion: @escaping () -> Void"\n`;
  assert.equal(hasSwiftCallbackStyleSignature(source), false);
});

test('detecta primitivas GCD y OperationQueue en codigo ejecutable', () => {
  const source = `
DispatchQueue.main.async { }
DispatchGroup()
DispatchSemaphore(value: 1)
OperationQueue()
`;

  assert.equal(hasSwiftDispatchQueueUsage(source), true);
  assert.equal(hasSwiftDispatchGroupUsage(source), true);
  assert.equal(hasSwiftDispatchSemaphoreUsage(source), true);
  assert.equal(hasSwiftOperationQueueUsage(source), true);
});

test('hasSwiftTaskDetachedUsage detecta Task.detached y evita Task normal', () => {
  const positive = `
Task.detached(priority: .background) { }
`;
  const negative = `
Task {
  await work()
}
`;
  assert.equal(hasSwiftTaskDetachedUsage(positive), true);
  assert.equal(hasSwiftTaskDetachedUsage(negative), false);
});

test('hasSwiftUncheckedSendableUsage detecta @unchecked Sendable', () => {
  const source = `
final class LegacyBox: @unchecked Sendable {}
`;
  assert.equal(hasSwiftUncheckedSendableUsage(source), true);
});

test('detectores SwiftUI modernos detectan patrones legacy relevantes', () => {
  const source = `
final class LegacyViewModel: ObservableObject {}
NavigationView { Text("x") }
Text("Tap").onTapGesture { }
let value = String(format: "%d", 1)
let width = UIScreen.main.bounds.width
`;
  assert.equal(hasSwiftObservableObjectUsage(source), true);
  assert.equal(hasSwiftNavigationViewUsage(source), true);
  assert.equal(hasSwiftOnTapGestureUsage(source), true);
  assert.equal(hasSwiftStringFormatUsage(source), true);
  assert.equal(hasSwiftUIScreenMainBoundsUsage(source), true);
});

test('detectores legacy ignoran strings y comentarios', () => {
  const source = `
// Task.detached { }
let a = "Task.detached { }"
let b = "NavigationView { }"
let c = "String(format: \\\"%d\\\", 1)"
let d = "UIScreen.main.bounds.width"
`;
  assert.equal(hasSwiftTaskDetachedUsage(source), false);
  assert.equal(hasSwiftNavigationViewUsage(source), false);
  assert.equal(hasSwiftStringFormatUsage(source), false);
  assert.equal(hasSwiftUIScreenMainBoundsUsage(source), false);
});

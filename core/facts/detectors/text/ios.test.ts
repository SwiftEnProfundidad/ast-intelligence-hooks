import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findSwiftLiskovSubstitutionMatch,
  findSwiftInterfaceSegregationMatch,
  findSwiftOpenClosedSwitchMatch,
  findSwiftConcreteDependencyDipMatch,
  findSwiftPresentationSrpMatch,
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

test('hasSwiftForceUnwrap excluye comparaciones seguras contra nil', () => {
  const source = `
if ProcessInfo.processInfo.environment["SIMULATOR_UDID"] != nil {
  return
}

if waitersByKey[key] != nil {
  consume()
}
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

test('findSwiftPresentationSrpMatch devuelve payload semantico para SRP-iOS en presentation', () => {
  const source = `
@MainActor
final class PumukiSrpIosCanaryViewModel {
  private let coordinator: StoreMapCoordinator

  func restoreSessionSnapshot() async {}

  func fetchRemoteCatalog() async throws {
    _ = URLSession.shared
  }

  func cacheLastStoreID(_ storeID: String) {
    UserDefaults.standard.set(storeID, forKey: "last-store-id")
  }

  func openStoreMap() {
    coordinator.navigate(to: .storeMap)
  }
}
`;

  const match = findSwiftPresentationSrpMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiSrpIosCanaryViewModel',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [6] },
    { kind: 'call', name: 'remote networking', lines: [9] },
    { kind: 'call', name: 'local persistence', lines: [13] },
    { kind: 'member', name: 'navigation flow', lines: [17] },
  ]);
  assert.match(match.why, /SRP/i);
  assert.match(match.impact, /múltiples razones de cambio/i);
  assert.match(match.expected_fix, /estado|coordinador|casos de uso/i);
});

test('findSwiftConcreteDependencyDipMatch devuelve payload semantico para DIP-iOS en application', () => {
  const source = `
import Foundation

final class PumukiDipIosCanaryUseCase {
  private let session: URLSession
  private let preferences: UserDefaults

  init() {
    self.session = URLSession.shared
    self.preferences = UserDefaults.standard
  }

  func execute() async throws {
    guard let url = URL(string: "https://example.com/catalog.json") else {
      return
    }

    _ = try await session.data(from: url)
    preferences.set(Date().timeIntervalSince1970, forKey: "last-sync")
  }
}
`;

  const match = findSwiftConcreteDependencyDipMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiDipIosCanaryUseCase',
    lines: [4],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'property', name: 'concrete dependency: URLSession', lines: [5] },
    { kind: 'call', name: 'URLSession.shared', lines: [9] },
    { kind: 'property', name: 'concrete dependency: UserDefaults', lines: [6] },
    { kind: 'call', name: 'UserDefaults.standard', lines: [10] },
  ]);
  assert.match(match.why, /DIP/i);
  assert.match(match.impact, /infraestructura concretos|coste de sustituir/i);
  assert.match(match.expected_fix, /puertos|infrastructure/i);
});

test('findSwiftOpenClosedSwitchMatch devuelve payload semantico para OCP-iOS en application', () => {
  const source = `enum PumukiOcpIosCanaryChannel {
  case groceryPickup
  case homeDelivery
}

final class PumukiOcpIosCanaryUseCase {
  func makeBanner(for channel: PumukiOcpIosCanaryChannel) -> String {
    switch channel {
    case .groceryPickup:
      return "pickup"
    case .homeDelivery:
      return "delivery"
    }
  }
}
`;

  const match = findSwiftOpenClosedSwitchMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiOcpIosCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'case .groceryPickup', lines: [9] },
    { kind: 'member', name: 'case .homeDelivery', lines: [11] },
  ]);
  assert.match(match.why, /OCP/i);
  assert.match(match.impact, /nuevo caso|nuevo comportamiento/i);
  assert.match(match.expected_fix, /estrategia|protocolo|registry/i);
});

test('findSwiftInterfaceSegregationMatch devuelve payload semantico para ISP-iOS en application', () => {
  const source = `
protocol PumukiIspIosCanarySessionManaging {
  func restoreSession() async throws
  func persistSessionID(_ id: String) async
  func clearSession() async
  func refreshToken() async throws -> String
}

final class PumukiIspIosCanaryUseCase {
  private let sessionManager: PumukiIspIosCanarySessionManaging

  init(sessionManager: PumukiIspIosCanarySessionManaging) {
    self.sessionManager = sessionManager
  }

  func execute() async throws {
    try await sessionManager.restoreSession()
  }
}
`;

  const match = findSwiftInterfaceSegregationMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiIspIosCanaryUseCase',
    lines: [9],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'fat protocol: PumukiIspIosCanarySessionManaging', lines: [2] },
    { kind: 'call', name: 'used member: restoreSession', lines: [17] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [4] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [5] },
  ]);
  assert.match(match.why, /ISP/i);
  assert.match(match.impact, /contrato demasiado ancho|cambios ajenos/i);
  assert.match(match.expected_fix, /protocolos pequeños|puerto mínimo/i);
});

test('findSwiftLiskovSubstitutionMatch devuelve payload semantico para LSP-iOS en application', () => {
  const source = `
protocol PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal
}

final class PumukiLspIosCanaryStandardDiscount: PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal {
    amount * 0.9
  }
}

final class PumukiLspIosCanaryPremiumDiscount: PumukiLspIosCanaryDiscountApplying {
  func apply(to amount: Decimal) -> Decimal {
    guard amount >= 100 else {
      fatalError("premium-only")
    }
    return amount * 0.8
  }
}
`;

  const match = findSwiftLiskovSubstitutionMatch(source);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiLspIosCanaryPremiumDiscount',
    lines: [12],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspIosCanaryDiscountApplying', lines: [2] },
    { kind: 'member', name: 'safe substitute: PumukiLspIosCanaryStandardDiscount', lines: [6] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [14] },
    { kind: 'call', name: 'fatalError', lines: [15] },
  ]);
  assert.match(match.why, /LSP/i);
  assert.match(match.impact, /sustitución|precondiciones|regresiones/i);
  assert.match(match.expected_fix, /contrato base|adaptador|estrategia/i);
});

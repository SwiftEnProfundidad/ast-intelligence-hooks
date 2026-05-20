import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../Fact';
import { extractHeuristicFacts } from '../extractHeuristicFacts';
import { evaluateRules } from '../../gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../rules/presets/astHeuristicsRuleSet';

const fileContentFact = (path: string, content: string): Fact => {
  return {
    kind: 'FileContent',
    source: 'unit-test',
    path,
    content,
  };
};

const toRuleIds = (
  findings: ReadonlyArray<{ ruleId: string }>
): string[] => findings.map((finding) => finding.ruleId).sort();

test('detects frontend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/domain/feature/file.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const ruleIds = toRuleIds(evaluateRules(astHeuristicsRuleSet, extracted));
  assert.equal(ruleIds.includes('heuristics.ts.backend.magic-number-literal.ast'), false);
  assert.equal(ruleIds.includes('heuristics.ts.explicit-any.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.console-log.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.console-error.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.eval.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.function-constructor.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.debugger.ast'), true);
});

test('detects backend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/feature/file.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); const unsafeBuffer = Buffer.allocUnsafe(32); function calculateTotal() { return 42; } debugger;'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const ruleIds = toRuleIds(evaluateRules(astHeuristicsRuleSet, extracted));
  assert.equal(ruleIds.includes('heuristics.ts.backend.magic-number-literal.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.explicit-any.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.console-log.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.console-error.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.eval.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.function-constructor.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.buffer-alloc-unsafe.ast'), true);
  assert.equal(ruleIds.includes('heuristics.ts.debugger.ast'), true);
});

test('detects backend permissive CORS heuristic with actionable line metadata', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/main.ts',
        [
          'import { NestFactory } from "@nestjs/core";',
          'async function bootstrap() {',
          '  const app = await NestFactory.create(AppModule);',
          '  app.enableCors({ origin: "*" });',
          '  await app.listen(3000);',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const fact = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.permissive-cors.ast'
  );
  assert.ok(fact);
  assert.deepEqual(fact.lines, [4]);
});

test('detects backend string literal unions that should be enums', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/domain/entities/Order.ts',
        [
          "export type OrderStatus = 'pending' | 'paid' | 'cancelled';",
          'export class Order {',
          '  status!: OrderStatus;',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const fact = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.string-literal-union-enum.ast'
  );
  assert.ok(fact);
  assert.deepEqual(fact.lines, [1]);
});

test('detects frontend sensitive token in URL heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/features/profile/load-profile.ts',
        'export const loadProfile = (token: string) => fetch(`/api/profile?access_token=${token}`);'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), [
    'common.network.missing_error_handling',
    'heuristics.ts.sensitive-token-in-url.ast',
  ]);
});

test('detects frontend non semantic clickable JSX heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/features/stores/StoreCard.tsx',
        'export const StoreCard = ({ open }) => <div onClick={open}>Open</div>;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.tsx.non-semantic-clickable.ast']);
});

test('detects frontend redundant ARIA role heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/features/navigation/MainNavigation.tsx',
        'export const MainNavigation = () => <nav role="navigation">Menu</nav>;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.tsx.redundant-aria-role.ast']);
});

test('detects frontend nested if else heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/features/stores/resolveStoreState.ts',
        'export function resolveStoreState(store) { if (store) { if (store.open) { return "open"; } } else { return "missing"; } return "closed"; }'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.ts.nested-if-else.ast']);
});

test('detects legacy Next pages API route heuristic in frontend path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/pages/api/stores.ts',
        'export default function handler(req, res) { res.status(200).json({ ok: true }); }'
      ),
      fileContentFact(
        'apps/frontend/src/app/api/stores/route.ts',
        'export async function GET() { return Response.json({ ok: true }); }'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.ts.next-pages-api-route.ast']);
});

test('skips TypeScript heuristics for test files', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/domain/feature/file.spec.ts',
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.length, 0);
});

test('detects direct network calls in frontend tests where MSW should be used', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/features/stores/stores.test.ts',
        'test("loads stores", async () => { await fetch("/api/stores"); });'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), [
    'common.network.missing_error_handling',
    'heuristics.ts.frontend-test-direct-network-call.ast',
  ]);
});

test('detects common.network.missing_error_handling in test files while keeping generic TS heuristics skipped', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/__tests__/network.test.ts',
        'const payload: any = 1; axios.get("/health");'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.network.missing_error_handling'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ts.explicit-any.ast'),
    false
  );
});

test('detects backend callback hell heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/orders/load-orders.ts',
        [
          'export function loadOrders(repository: Repository) {',
          '  repository.findUser("u1", (user) => {',
          '    repository.findOrders(user.id, (orders) => {',
          '      repository.saveSnapshot(orders);',
          '    });',
          '  });',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.ts.callback-hell.ast']);
});

test('detects backend bcrypt weak salt rounds heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/auth/hash-password.ts',
        'export const hashPassword = (password: string) => bcrypt.hash(password, 8);'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.ts.bcrypt-weak-salt-rounds.ast']);
});

test('detects backend interpolated unsafe SQL heuristic in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/orders.repository.ts',
        'export const findOrder = (db: Database, id: string) => db.query(`select * from orders where id = ${id}`);'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.ts.sql-interpolated-unsafe-call.ast']);
});

test('detects iOS heuristics and skips bridge callback rule', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Feature/View.swift',
        [
          'let result = value!',
          'let wrapped = AnyView(Text("hello"))',
          'let value = try! resolver.execute()',
          'let model = anyModel as! ProfileViewModel',
          'func fetch(completion: @escaping () -> Void) {}',
          'publisher.sink { value in render(value) }',
          'let repository = MockOrdersRepository()',
          'DispatchQueue.main.async {}',
          'DispatchGroup()',
          'DispatchSemaphore(value: 1)',
          'OperationQueue()',
          'Task.detached { }',
          'enum APIEndpoint { case login }',
          'func uploadAll(items: [Item]) async {',
          '  for item in items { await upload(item) }',
          '}',
          'func lintWorkaround() async { await Task.yield() }',
          'loader.load { [unowned self] value in print(value) }',
          'if session.isValid { if form.isValid { if network.isReachable { submit() } } }',
          '// temporary workaround',
          'private func buildSnapshot() async -> ProfileSnapshot { ProfileSnapshot.empty }',
          'func store() { do { try repository.save() } catch { } }',
          'print(accessToken)',
          'logger.error("Refresh failed \\\\(refreshToken)")',
          'UserDefaults.standard.set(accessToken, forKey: "accessToken")',
          'final class LegacyViewModel: ObservableObject {}',
          '@preconcurrency import LegacyFramework',
          'nonisolated(unsafe) static var sharedBridge: LegacyViewModel?',
          'MainActor.assumeIsolated { reload() }',
          '@StateObject private var ownedViewModel = LegacyViewModel()',
          '@ObservedObject var injectedViewModel: LegacyViewModel',
          'GeometryReader { proxy in Text("layout").frame(width: proxy.size.width) }',
          'Text("headline").fontWeight(.bold)',
          'Text("Start premium trial")',
          'let heroPath = Bundle.main.path(forResource: "hero", withExtension: "png")',
          'Text("Price").font(.system(size: 18))',
          'Text("Price").multilineTextAlignment(.right)',
          'Thread.sleep(forTimeInterval: 0.25)',
          'print(Thread.current)',
          'Button { delete() } label: { Image(systemName: "trash") }',
          'let filtered = items.filter { $0.title.contains(searchText) }',
          'ForEach(items.indices, id: \\.self) { index in Text(items[index].title) }',
          'NavigationView { Text("hello") }',
          'Text("primary").foregroundColor(.blue)',
          'Image("hero").cornerRadius(12)',
          'TabView { HomeView().tabItem { Label("Home", systemImage: "house") } }',
          'Text("static").glassEffect(.regular.interactive(), in: .rect(cornerRadius: 16))',
          'Text("morph").glassEffectID("card", in: animation)',
          'Text("tap").onTapGesture { }',
          'let title = String(format: "%d", 1)',
          'ScrollView(.vertical, showsIndicators: false) { Text("feed") }',
          '.sheet(isPresented: $showDetails) { DetailView() }',
          '.onChange(of: query) { newValue in print(newValue) }',
          '.onChange(of: query) { _, newValue in var trimmed = query.trimmingCharacters(in: .whitespaces) }',
          'let width = UIScreen.main.bounds.width',
          'let erasedPayload: Any = payload',
          'final class LegacyType: @unchecked Sendable {}',
          'struct DetailView: View {',
          '  @State private var filter: String',
          '  @StateObject private var detailViewModel: LegacyViewModel',
          '  init(filter: String, detailViewModel: LegacyViewModel) {',
          '    _filter = State(initialValue: filter)',
          '    _detailViewModel = StateObject(wrappedValue: detailViewModel)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/Infrastructure/Bridge/SessionBridge.swift',
        'func fetch(completion: @escaping () -> Void) {}'
      ),
      fileContentFact(
        'apps/ios/Infrastructure/API/Client.swift',
        [
          'final class APIClient {',
          '  func load() {',
          '    AF.request("https://example.com")',
          '    let object = try? JSONSerialization.jsonObject(with: Data())',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact('apps/ios/Podfile', 'pod "LegacyDependency"'),
      fileContentFact('apps/ios/Cartfile', 'github "Legacy/Dependency"'),
      fileContentFact('apps/ios/App/es.lproj/Localizable.strings', '"title" = "Catalog";'),
      fileContentFact('apps/ios/App/Base.lproj/Main.storyboard', '<document />'),
      fileContentFact(
        'apps/ios/App/Info.plist',
        [
          '<dict>',
          '  <key>NSAppTransportSecurity</key>',
          '  <dict>',
          '    <key>NSAllowsArbitraryLoads</key>',
          '    <true/>',
          '  </dict>',
          '</dict>',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ios.accessibility.fixed-font-size.ast',
    'heuristics.ios.accessibility.icon-only-control-label.ast',
    'heuristics.ios.accessibility.on-tap-without-button-trait.ast',
    'heuristics.ios.anyview.ast',
    'heuristics.ios.assets.loose-resource.ast',
    'heuristics.ios.assume-isolated.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.combine.sink-without-store.ast',
      'heuristics.ios.concurrency.async-without-await.ast',
      'heuristics.ios.concurrency.dummy-await.ast',
      'heuristics.ios.concurrency.long-task-without-cancellation-check.ast',
      'heuristics.ios.concurrency.thread-centric-debugging.ast',
      'heuristics.ios.concurrency.ui-state-without-mainactor.ast',
      'heuristics.ios.contains-user-filter.ast',
    'heuristics.ios.corner-radius.ast',
    'heuristics.ios.dependencies.carthage.ast',
    'heuristics.ios.dependencies.cocoapods.ast',
    'heuristics.ios.dispatchgroup.ast',
    'heuristics.ios.dispatchqueue.ast',
    'heuristics.ios.dispatchsemaphore.ast',
    'heuristics.ios.error.empty-catch.ast',
    'heuristics.ios.font-weight-bold.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-unwrap.ast',
    'heuristics.ios.foreach-indices.ast',
    'heuristics.ios.foreground-color.ast',
    'heuristics.ios.geometryreader.ast',
    'heuristics.ios.interface-builder.storyboard-xib.ast',
    'heuristics.ios.json.jsonserialization.ast',
    'heuristics.ios.legacy-onchange.ast',
    'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
    'heuristics.ios.localization.hardcoded-ui-string.ast',
    'heuristics.ios.localization.localizable-strings.ast',
    'heuristics.ios.localization.physical-text-alignment.ast',
    'heuristics.ios.logging.adhoc-print.ast',
    'heuristics.ios.logging.sensitive-data.ast',
    'heuristics.ios.maintainability.comment-trivia.ast',
    'heuristics.ios.maintainability.nested-if-pyramid.ast',
    'heuristics.ios.memory.unowned-self-capture.ast',
    'heuristics.ios.navigation-view.ast',
    'heuristics.ios.networking.alamofire.ast',
    'heuristics.ios.networking.endpoint-enum-ocp.ast',
    'heuristics.ios.nonisolated-unsafe.ast',
    'heuristics.ios.observable-object.ast',
    'heuristics.ios.on-tap-gesture.ast',
    'heuristics.ios.operation-queue.ast',
    'heuristics.ios.passed-value-state-wrapper.ast',
    'heuristics.ios.performance.blocking-sleep.ast',
    'heuristics.ios.preconcurrency.ast',
    'heuristics.ios.scrollview-shows-indicators.ast',
    'heuristics.ios.security.insecure-transport.ast',
    'heuristics.ios.security.userdefaults-sensitive-data.ast',
    'heuristics.ios.sheet-is-presented.ast',
    'heuristics.ios.string-format.ast',
    'heuristics.ios.swiftui.foreach-self-identity.ast',
    'heuristics.ios.swiftui.glass-interactive-static-element.ast',
    'heuristics.ios.swiftui.glasseffectid-without-namespace.ast',
    'heuristics.ios.swiftui.onchange-readonly-var.ast',
    'heuristics.ios.tab-item.ast',
    'heuristics.ios.task-detached.ast',
    'heuristics.ios.testing.production-test-double.ast',
    'heuristics.ios.type-erasure.any.ast',
    'heuristics.ios.uiscreen-main-bounds.ast',
    'heuristics.ios.unchecked-sendable.ast',
  ]);
  const dispatchGroupFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.dispatchgroup.ast'
  );
  assert.deepEqual(dispatchGroupFinding?.lines, [9]);
  assert.deepEqual(dispatchGroupFinding?.primary_node, {
    kind: 'call',
    name: 'GCD DispatchGroup call',
    lines: [9],
  });
  assert.deepEqual(dispatchGroupFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: structured concurrency TaskGroup or async aggregation boundary',
      lines: [9],
    },
  ]);
  assert.match(dispatchGroupFinding?.expected_fix ?? '', /TaskGroup/);
  const anyViewFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.anyview.ast'
  );
  assert.deepEqual(anyViewFinding?.lines, [2]);
  assert.deepEqual(anyViewFinding?.primary_node, {
    kind: 'call',
    name: 'type erasure wrapper AnyView',
    lines: [2],
  });
  assert.deepEqual(anyViewFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: concrete View composition or @ViewBuilder branch',
      lines: [2],
    },
  ]);
  assert.match(anyViewFinding?.expected_fix ?? '', /@ViewBuilder/);

  const callbackFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.callback-style.ast'
  );
  assert.deepEqual(callbackFinding?.lines, [5]);
  assert.deepEqual(callbackFinding?.primary_node, {
    kind: 'call',
    name: 'escaping callback-style API signature',
    lines: [5],
  });
  assert.deepEqual(callbackFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: async/await API or explicit bridge adapter',
      lines: [5],
    },
  ]);
  assert.match(callbackFinding?.expected_fix ?? '', /async\/await/);

  const dispatchQueueFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.dispatchqueue.ast'
  );
  assert.deepEqual(dispatchQueueFinding?.lines, [8]);
  assert.deepEqual(dispatchQueueFinding?.primary_node, {
    kind: 'call',
    name: 'GCD DispatchQueue call',
    lines: [8],
  });
  assert.deepEqual(dispatchQueueFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: structured concurrency Task/actor/MainActor boundary',
      lines: [8],
    },
  ]);
  assert.match(dispatchQueueFinding?.expected_fix ?? '', /async\/await/);
  const sensitiveLoggingFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.logging.sensitive-data.ast'
  );
  assert.deepEqual(sensitiveLoggingFinding?.primary_node, {
    kind: 'call',
    name: 'logging call with sensitive data',
    lines: sensitiveLoggingFinding?.lines ?? [],
  });
  assert.match(sensitiveLoggingFinding?.expected_fix ?? '', /redacted/);
  const userDefaultsSensitiveFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.security.userdefaults-sensitive-data.ast'
  );
  assert.deepEqual(userDefaultsSensitiveFinding?.primary_node, {
    kind: 'call',
    name: 'sensitive UserDefaults/AppStorage storage',
    lines: userDefaultsSensitiveFinding?.lines ?? [],
  });
  assert.match(userDefaultsSensitiveFinding?.expected_fix ?? '', /Keychain/);
  const dispatchSemaphoreFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.dispatchsemaphore.ast'
  );
  assert.deepEqual(dispatchSemaphoreFinding?.lines, [10]);
  assert.deepEqual(dispatchSemaphoreFinding?.primary_node, {
    kind: 'call',
    name: 'GCD DispatchSemaphore call',
    lines: [10],
  });
  assert.deepEqual(dispatchSemaphoreFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: structured concurrency TaskGroup, AsyncStream or explicit async boundary',
      lines: [10],
    },
  ]);
  assert.match(dispatchSemaphoreFinding?.expected_fix ?? '', /AsyncStream/);
  const forceUnwrapFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.force-unwrap.ast'
  );
  assert.deepEqual(forceUnwrapFinding?.lines, [1]);
  assert.deepEqual(forceUnwrapFinding?.primary_node, {
    kind: 'member',
    name: 'force unwrap postfix !',
    lines: [1],
  });
  assert.deepEqual(forceUnwrapFinding?.related_nodes, [
    {
      kind: 'member',
      name: 'replacement: guarded optional binding or explicit failure path',
      lines: [1],
    },
  ]);
  assert.match(forceUnwrapFinding?.expected_fix ?? '', /guard let/);
  const forceTryFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.force-try.ast'
  );
  assert.deepEqual(forceTryFinding?.lines, [3]);
  assert.deepEqual(forceTryFinding?.primary_node, {
    kind: 'call',
    name: 'force try expression try!',
    lines: [3],
  });
  assert.deepEqual(forceTryFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: do/catch or throwing boundary',
      lines: [3],
    },
  ]);
  assert.match(forceTryFinding?.expected_fix ?? '', /do\/catch/);

  const forceCastFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.force-cast.ast'
  );
  assert.deepEqual(forceCastFinding?.lines, [4]);
  assert.deepEqual(forceCastFinding?.primary_node, {
    kind: 'call',
    name: 'force cast expression as!',
    lines: [4],
  });
  assert.deepEqual(forceCastFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: conditional cast or typed boundary',
      lines: [4],
    },
  ]);
  assert.match(forceCastFinding?.expected_fix ?? '', /as\?/);
});

test('does not detect iOS force-unwrap heuristic for safe nil comparisons', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/ListRouting/Application/UseCases/SyncShoppingListUseCase.swift',
        [
          'if ProcessInfo.processInfo.environment["SIMULATOR_UDID"] != nil {',
          '  return',
          '}',
          'if waitersByKey[key] != nil {',
          '  consume()',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.force-unwrap.ast'), false);
});

test('emits actionable iOS line metadata for PUMUKI-INC-151 presentation findings', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Features/BuyerCommerce/BuyerAuthScreen.swift',
        [
          'import SwiftUI',
          'struct BuyerAuthScreen: View {',
          '  private let apiKey = "sk_live_123456789"',
          '  var body: some View {',
          '    VStack(spacing: 12) {',
          '      Text("Login").font(.system(size: 18))',
          '      Circle().fill(Color.blue).frame(width: 320, height: 44)',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const factsByRuleId = new Map(
    extracted
      .filter((fact) => fact.kind === 'Heuristic')
      .map((fact) => [fact.ruleId, fact])
  );

  for (const ruleId of [
    'heuristics.ios.maintainability.magic-number-layout.ast',
    'heuristics.ios.security.hardcoded-sensitive-string.ast',
    'heuristics.ios.accessibility.fixed-font-size.ast',
    'heuristics.ios.swiftui.explicit-color-static-member.ast',
  ]) {
    const fact = factsByRuleId.get(ruleId);
    assert.ok(fact, `${ruleId} should be emitted`);
    assert.ok(Array.isArray(fact.lines) && fact.lines.length > 0, `${ruleId} should include lines`);
    assert.ok(fact.primary_node, `${ruleId} should include primary_node`);
    assert.ok(fact.expected_fix, `${ruleId} should include expected_fix`);
  }

  assert.deepEqual(
    factsByRuleId.get('heuristics.ios.maintainability.magic-number-layout.ast')?.lines,
    [5, 7]
  );
  assert.deepEqual(
    factsByRuleId.get('heuristics.ios.security.hardcoded-sensitive-string.ast')?.lines,
    [3]
  );
  assert.deepEqual(
    factsByRuleId.get('heuristics.ios.accessibility.fixed-font-size.ast')?.lines,
    [6]
  );
  assert.deepEqual(
    factsByRuleId.get('heuristics.ios.swiftui.explicit-color-static-member.ast')?.lines,
    [7]
  );
});

test('emits actionable iOS line metadata for PUMUKI-INC-152 BuyerShellView findings', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Features/BuyerCommerce/BuyerShellView.swift',
        [
          'import SwiftUI',
          'struct BuyerShellView: View {',
          '  var body: some View {',
          '    ScrollView {',
          '      VStack {',
          '        ForEach(items.indices, id: \\.self) { index in',
          '          if items[index].isVisible {',
          '            Text(items[index].title).foregroundColor(.blue)',
          '          }',
          '        }',
          '        ForEach(items.filter { $0.isVisible }) { item in',
          '          Text(item.title)',
          '        }',
          '        if isLoading {',
          '          Text("Loading")',
          '        } else {',
          '          Text("Ready")',
          '        }',
          '        Button {',
          '          if isLoading { return }',
          '        } label: {',
          '          Text("Retry")',
          '        }',
          '        Image("hero").cornerRadius(12)',
          '      }',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const factsByRuleId = new Map(
    extracted
      .filter((fact) => fact.kind === 'Heuristic')
      .map((fact) => [fact.ruleId, fact])
  );

  for (const ruleId of [
    'heuristics.ios.foreach-indices.ast',
    'heuristics.ios.swiftui.foreach-self-identity.ast',
    'heuristics.ios.swiftui.inline-foreach-transform.ast',
    'heuristics.ios.swiftui.foreach-conditional-view-count.ast',
    'heuristics.ios.swiftui.conditional-same-view-identity.ast',
    'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast',
    'heuristics.ios.swiftui.inline-action-logic.ast',
    'heuristics.ios.localization.hardcoded-ui-string.ast',
    'heuristics.ios.foreground-color.ast',
    'heuristics.ios.corner-radius.ast',
  ]) {
    const fact = factsByRuleId.get(ruleId);
    assert.ok(fact, `${ruleId} should be emitted`);
    assert.ok(Array.isArray(fact.lines) && fact.lines.length > 0, `${ruleId} should include lines`);
    assert.ok(fact.primary_node, `${ruleId} should include primary_node`);
    assert.ok(fact.expected_fix, `${ruleId} should include expected_fix`);
  }
});

test('detects iOS Swift Testing and Core Data boundary heuristics in scoped files', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/App/Tests/LoginFlowTests.swift',
        [
          'import XCTest',
          '',
          'final class LoginFlowTests: XCTestCase {',
          '  func testLogin() async throws {',
          '    XCTAssertEqual(result, expected)',
          '    let token = try XCTUnwrap(optionalToken)',
          '    let loadExpectation = expectation(description: "Done")',
          '    service.run { loadExpectation.fulfill() }',
          '    waitForExpectations(timeout: 1)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/App/Tests/LoginHybridTests.swift',
        [
          'import XCTest',
          'import Testing',
          '',
          'final class LoginLegacyTests: XCTestCase {',
          '  func testLegacyLogin() {}',
          '}',
          '',
          '@Suite',
          'struct LoginModernTests {',
          '  @Test func login() async {}',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/App/Tests/LoginQuickSpec.swift',
        [
          'import Quick',
          'import Nimble',
          '',
          'final class LoginQuickSpec: QuickSpec {',
          '  override class func spec() {',
          '    describe("login") {',
          '      it("opens the session") {',
          '        expect(true).to(beTrue())',
          '      }',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/App/Persistence/UserRepository.swift',
        [
          'import CoreData',
          '',
          'final class UserRepository {',
          '  var selectedEntity: NSManagedObject?',
          '',
          '  func fetchEntity() async throws -> NSManagedObject {',
          '    fatalError()',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/App/Presentation/Feature/DetailView.swift',
        [
          'import CoreData',
          'import SwiftData',
          '',
          'final class TodoEntity: NSManagedObject {}',
          '@Model final class TodoModel { var title: String }',
          '',
          'struct DetailView: View {',
          '  @Environment(\\.managedObjectContext) private var context',
          '  @Environment(\\.modelContext) private var modelContext',
          '  @State private var selectedEntity: TodoEntity?',
          '  @Query(sort: \\TodoModel.title) private var todos: [TodoModel]',
          '}',
          '',
          'final class DetailViewModel: ObservableObject {',
          '  @Published var entity: TodoEntity?',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctest-import.ast'), true);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctest-suite-modernizable.ast'),
    true
  );
  const modernizableSuiteFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.xctest-suite-modernizable.ast'
  );
  assert.deepEqual(modernizableSuiteFinding?.lines, [1, 3, 4]);
  assert.deepEqual(modernizableSuiteFinding?.primary_node, {
    kind: 'class',
    name: 'modernizable XCTestCase test suite',
    lines: [1, 3, 4],
  });
  assert.deepEqual(modernizableSuiteFinding?.related_nodes, [
    {
      kind: 'class',
      name: 'replacement: Swift Testing @Suite/@Test suite',
      lines: [1, 3, 4],
    },
  ]);
  assert.match(modernizableSuiteFinding?.expected_fix ?? '', /@Test/);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctassert.ast'), true);
  const xctAssertFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.xctassert.ast'
  );
  assert.deepEqual(xctAssertFinding?.lines, [5]);
  assert.deepEqual(xctAssertFinding?.primary_node, {
    kind: 'call',
    name: 'legacy XCTest assertion call',
    lines: [5],
  });
  assert.deepEqual(xctAssertFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: #expect(...)',
      lines: [5],
    },
  ]);
  assert.match(xctAssertFinding?.expected_fix ?? '', /#expect/);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctunwrap.ast'), true);
  const xctUnwrapFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.xctunwrap.ast'
  );
  assert.deepEqual(xctUnwrapFinding?.lines, [6]);
  assert.deepEqual(xctUnwrapFinding?.primary_node, {
    kind: 'call',
    name: 'legacy XCTest unwrap call',
    lines: [6],
  });
  assert.deepEqual(xctUnwrapFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: #require(...)',
      lines: [6],
    },
  ]);
  assert.match(xctUnwrapFinding?.expected_fix ?? '', /#require/);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.wait-for-expectations.ast'),
    true
  );
  const waitFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.wait-for-expectations.ast'
  );
  assert.deepEqual(waitFinding?.lines, [9]);
  assert.deepEqual(waitFinding?.primary_node, {
    kind: 'call',
    name: 'legacy XCTest wait call',
    lines: [9],
  });
  assert.deepEqual(waitFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: await fulfillment(of:timeout:) or predicate-driven UI wait wrapper',
      lines: [9],
    },
  ]);
  assert.match(waitFinding?.expected_fix ?? '', /await fulfillment/);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.legacy-expectation-description.ast'),
    true
  );
  const legacyExpectationFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.legacy-expectation-description.ast'
  );
  assert.deepEqual(legacyExpectationFinding?.lines, [7]);
  assert.deepEqual(legacyExpectationFinding?.primary_node, {
    kind: 'call',
    name: 'legacy XCTest expectation(description:) call',
    lines: [7],
  });
  assert.deepEqual(legacyExpectationFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: await confirmation or awaited fulfillment flow',
      lines: [7],
    },
  ]);
  assert.match(legacyExpectationFinding?.expected_fix ?? '', /await confirmation/);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.mixed-frameworks.ast'),
    true
  );
  const mixedFrameworksFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.mixed-frameworks.ast'
  );
  assert.deepEqual(mixedFrameworksFinding?.lines, [1, 2, 4, 8, 10]);
  assert.deepEqual(mixedFrameworksFinding?.primary_node, {
    kind: 'class',
    name: 'mixed XCTestCase and Swift Testing suite',
    lines: [1, 2, 4, 8, 10],
  });
  assert.deepEqual(mixedFrameworksFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: isolate XCTest compatibility from Swift Testing suites',
      lines: [1, 2, 4, 8, 10],
    },
  ]);
  assert.match(mixedFrameworksFinding?.expected_fix ?? '', /Split XCTest compatibility tests/);
  const quickNimbleFinding = findings.find(
    (finding) => finding.ruleId === 'heuristics.ios.testing.quick-nimble.ast'
  );
  assert.deepEqual(quickNimbleFinding?.lines, [1, 2, 4, 6, 7, 8]);
  assert.deepEqual(quickNimbleFinding?.primary_node, {
    kind: 'class',
    name: 'QuickSpec legacy test suite',
    lines: [1, 2, 4, 6, 7, 8],
  });
  assert.deepEqual(quickNimbleFinding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: Swift Testing @Suite/@Test with #expect/#require',
      lines: [1, 2, 4, 6, 7, 8],
    },
  ]);
  assert.match(quickNimbleFinding?.expected_fix ?? '', /native Swift Testing/);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.core-data.nsmanagedobject-boundary.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.core-data.layer-leak.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.swiftdata.layer-leak.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast'),
    true
  );
});

test('extracts actionable iOS third-party UI test framework heuristic facts', () => {
  const findings = extractHeuristicFacts({
    facts: [
      fileContentFact('apps/ios/Tests/UITests/CheckoutUITests.swift', [
        'import XCTest',
        'import EarlGrey',
        '',
        'final class CheckoutUITests: XCTestCase {',
        '  func testCheckout() {',
        '    EarlGrey.selectElement(with: grey_accessibilityID("pay")).perform(grey_tap())',
        '  }',
        '}',
      ].join('\n')),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = findings.find(
    (candidate) => candidate.ruleId === 'heuristics.ios.testing.third-party-ui-test-framework.ast'
  );
  assert.deepEqual(finding?.lines, [2, 6]);
  assert.deepEqual(finding?.primary_node, {
    kind: 'call',
    name: 'third-party UI test framework node',
    lines: [2, 6],
  });
  assert.deepEqual(finding?.related_nodes, [
    {
      kind: 'call',
      name: 'replacement: native XCUITest XCUIApplication/XCUIElement flow',
      lines: [2, 6],
    },
  ]);
  assert.match(finding?.expected_fix ?? '', /native XCUITest/);
});

test('does not emit Swift Testing migration findings for brownfield XCTest specs with quality helpers', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Tests/Mac/Presentation/Features/BuyerOnboardingStringsTests.spec.swift',
        [
          'import XCTest',
          '',
          'final class BuyerOnboardingStringsTests: XCTestCase {',
          '  func testTitle() {',
          '    let sut = makeSUT()',
          '    XCTAssertEqual(sut.title, "Comprar cerca")',
          '  }',
          '',
          '  private func makeSUT() -> BuyerOnboardingStrings {',
          '    let sut = BuyerOnboardingStrings()',
          '    trackForMemoryLeaks(sut)',
          '    return sut',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctest-import.ast'), false);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctest-suite-modernizable.ast'),
    false
  );
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctassert.ast'), false);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctunwrap.ast'), false);
});

test('detects IOS-CANARY-001 semantic heuristic with primary_node and related_nodes', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
        [
          'final class AppShellViewModel {',
          '  static let shared = AppShellViewModel()',
          '  func refresh() async throws {',
          '    let (_, _) = try await URLSession.shared.data(from: endpoint)',
          '  }',
          '  func persist() {',
          '    _ = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)',
          '  }',
          '  func navigateToStore() {',
          '    router.navigate(to: .storeMap)',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'AppShellViewModel',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'property', name: 'shared singleton', lines: [2] },
    { kind: 'call', name: 'URLSession.shared', lines: [4] },
    { kind: 'call', name: 'FileManager.default', lines: [7] },
    { kind: 'member', name: 'navigation flow', lines: [10] },
  ]);
  assert.match(finding.why ?? '', /SRP/);
  assert.match(finding.impact ?? '', /Presentation/);
  assert.match(finding.expected_fix ?? '', /ViewModel limitado a estado/);
});

test('detects semantic SRP heuristic for TypeScript command/query mix with AST nodes', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/runtime/pumuki-srp-canary.ts',
        [
          'export class PumukiSrpCommandQueryCanary {',
          '  getById(id: string): { id: string; status: "draft" } {',
          '    return { id, status: "draft" };',
          '  }',
          '',
          '  save(id: string): void {',
          '    void id;',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.srp.class-command-query-mix.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpCommandQueryCanary',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'query:getById', lines: [2] },
    { kind: 'member', name: 'command:save', lines: [6] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /testeo aislado/i);
  assert.match(finding.expected_fix ?? '', /lectura y escritura/i);
});

test('detects semantic DIP heuristics for TypeScript framework import and concrete instantiation', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/application/pumuki-dip-canary.ts',
        [
          "import { PrismaClient } from '@prisma/client';",
          '',
          'export class PumukiDipCanaryUseCase {',
          '  private readonly prisma = new PrismaClient();',
          '',
          '  async execute(orderId: string): Promise<void> {',
          '    await this.prisma.order.update({',
          '      where: { id: orderId },',
          "      data: { status: 'draft' },",
          '    });',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const importFinding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.dip.framework-import.ast'
  );
  const concreteFinding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.dip.concrete-instantiation.ast'
  );

  assert.ok(importFinding);
  assert.ok(concreteFinding);
  assert.deepEqual(importFinding.primary_node, {
    kind: 'class',
    name: 'PumukiDipCanaryUseCase',
    lines: [3],
  });
  assert.deepEqual(importFinding.related_nodes, [
    { kind: 'member', name: 'import:@prisma/client', lines: [1] },
    { kind: 'call', name: 'new PrismaClient', lines: [4] },
  ]);
  assert.match(importFinding.why ?? '', /DIP/i);
  assert.match(importFinding.impact ?? '', /infraestructura concreta/i);
  assert.match(importFinding.expected_fix ?? '', /puerto|abstracci/i);
  assert.deepEqual(concreteFinding.primary_node, importFinding.primary_node);
  assert.deepEqual(concreteFinding.related_nodes, importFinding.related_nodes);
});

test('detects semantic SRP heuristic for iOS presentation types with multiple reasons of change', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/Validation/Presentation/PumukiSrpIosCanaryViewModel.swift',
        [
          '@MainActor',
          'final class PumukiSrpIosCanaryViewModel {',
          '  private let coordinator: StoreMapCoordinator',
          '',
          '  func restoreSessionSnapshot() async {}',
          '',
          '  func fetchRemoteCatalog() async throws {',
          '    _ = URLSession.shared',
          '  }',
          '',
          '  func cacheLastStoreID(_ storeID: String) {',
          '    UserDefaults.standard.set(storeID, forKey: "last-store-id")',
          '  }',
          '',
          '  func openStoreMap() {',
          '    coordinator.navigate(to: .storeMap)',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpIosCanaryViewModel',
    lines: [2],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [5] },
    { kind: 'call', name: 'remote networking', lines: [8] },
    { kind: 'call', name: 'local persistence', lines: [12] },
    { kind: 'member', name: 'navigation flow', lines: [16] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /estado|coordinador|casos de uso/i);
});

test('detects semantic DIP heuristic for iOS application types with concrete framework dependencies', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/Validation/Application/PumukiDipIosCanaryUseCase.swift',
        [
          'import Foundation',
          '',
          'final class PumukiDipIosCanaryUseCase {',
          '  private let session: URLSession',
          '  private let preferences: UserDefaults',
          '',
          '  init() {',
          '    self.session = URLSession.shared',
          '    self.preferences = UserDefaults.standard',
          '  }',
          '',
          '  func execute() async throws {',
          '    guard let url = URL(string: "https://example.com/catalog.json") else {',
          '      return',
          '    }',
          '',
          '    _ = try await session.data(from: url)',
          '    preferences.set(Date().timeIntervalSince1970, forKey: "last-sync")',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.solid.dip.concrete-framework-dependency.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiDipIosCanaryUseCase',
    lines: [3],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'property', name: 'concrete dependency: URLSession', lines: [4] },
    { kind: 'call', name: 'URLSession.shared', lines: [8] },
    { kind: 'property', name: 'concrete dependency: UserDefaults', lines: [5] },
    { kind: 'call', name: 'UserDefaults.standard', lines: [9] },
  ]);
  assert.match(finding.why ?? '', /DIP/i);
  assert.match(finding.impact ?? '', /alto nivel|coste de sustituir|infraestructura/i);
  assert.match(finding.expected_fix ?? '', /puertos|infrastructure/i);
});

test('detects semantic OCP heuristic for iOS application types with discriminator branching', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/Validation/Application/PumukiOcpIosCanaryUseCase.swift',
        [
          'enum PumukiOcpIosCanaryChannel {',
          '  case groceryPickup',
          '  case homeDelivery',
          '}',
          '',
          'final class PumukiOcpIosCanaryUseCase {',
          '  func makeBanner(for channel: PumukiOcpIosCanaryChannel) -> String {',
          '    switch channel {',
          '    case .groceryPickup:',
          '      return "pickup"',
          '    case .homeDelivery:',
          '      return "delivery"',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.solid.ocp.discriminator-switch.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpIosCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'case .groceryPickup', lines: [9] },
    { kind: 'member', name: 'case .homeDelivery', lines: [11] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|nuevo comportamiento/i);
  assert.match(finding.expected_fix ?? '', /estrategia|protocolo|registry/i);
});

test('detects semantic OCP heuristic for backend application types with discriminator branching', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/application/pumuki-ocp-canary-use-case.ts',
        [
          'export class PumukiOcpBackendCanaryUseCase {',
          '  resolveChannel(request: { kind: string }): string {',
          '    switch (request.kind) {',
          "      case 'pickup':",
          "        return 'pickup-banner';",
          "      case 'delivery':",
          "        return 'delivery-banner';",
          '      default:',
          "        return 'generic-banner';",
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.ocp.discriminator-switch.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpBackendCanaryUseCase',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: kind', lines: [3] },
    { kind: 'member', name: 'case:pickup', lines: [4] },
    { kind: 'member', name: 'case:delivery', lines: [6] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|modificar/i);
  assert.match(finding.expected_fix ?? '', /estrategia|polimorfismo|mapa/i);
});

test('detects semantic ISP heuristic for backend application types with fat contracts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/application/pumuki-isp-canary-use-case.ts',
        [
          'export interface PumukiIspBackendCatalogPort {',
          '  findById(id: string): Promise<string>;',
          '  saveSnapshot(snapshot: unknown): Promise<void>;',
          '}',
          '',
          'export class PumukiIspBackendCanaryUseCase {',
          '  private readonly catalogPort: PumukiIspBackendCatalogPort;',
          '',
          '  async execute(id: string): Promise<string> {',
          '    return this.catalogPort.findById(id);',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.isp.interface-command-query-mix.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspBackendCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspBackendCatalogPort', lines: [1] },
    { kind: 'member', name: 'used member: findById', lines: [10] },
    { kind: 'member', name: 'unused contract member: saveSnapshot', lines: [3] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato|acopla|test/i);
  assert.match(finding.expected_fix ?? '', /puertos|separa|split/i);
});

test('detects semantic LSP heuristic for backend application types with unsafe substitution', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/application/pumuki-lsp-canary-use-case.ts',
        [
          'export abstract class PumukiLspBackendCanaryDiscountPolicy {',
          '  abstract apply(amount: number): number;',
          '}',
          '',
          'export class PumukiLspBackendStandardDiscountPolicy extends PumukiLspBackendCanaryDiscountPolicy {',
          '  override apply(amount: number): number {',
          '    return amount * 0.9;',
          '  }',
          '}',
          '',
          'export class PumukiLspBackendPremiumDiscountPolicy extends PumukiLspBackendCanaryDiscountPolicy {',
          '  override apply(amount: number): number {',
          '    throw new Error("Not implemented for low amount");',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.solid.lsp.override-not-implemented.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspBackendPremiumDiscountPolicy',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspBackendCanaryDiscountPolicy', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspBackendStandardDiscountPolicy', lines: [5] },
    { kind: 'member', name: 'unsafe override: apply', lines: [12] },
    { kind: 'call', name: 'throw not implemented', lines: [13] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustituci|regresion|crash/i);
  assert.match(finding.expected_fix ?? '', /contrato|estrategia|subtipo/i);
});

test('detects semantic ISP heuristic for iOS application types with fat protocol dependencies', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/Validation/Application/PumukiIspIosCanaryUseCase.swift',
        [
          'protocol PumukiIspIosCanarySessionManaging {',
          '  func restoreSession() async throws',
          '  func persistSessionID(_ id: String) async',
          '  func clearSession() async',
          '  func refreshToken() async throws -> String',
          '}',
          '',
          'final class PumukiIspIosCanaryUseCase {',
          '  private let sessionManager: PumukiIspIosCanarySessionManaging',
          '',
          '  init(sessionManager: PumukiIspIosCanarySessionManaging) {',
          '    self.sessionManager = sessionManager',
          '  }',
          '',
          '  func execute() async throws {',
          '    try await sessionManager.restoreSession()',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.solid.isp.fat-protocol-dependency.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspIosCanaryUseCase',
    lines: [8],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat protocol: PumukiIspIosCanarySessionManaging', lines: [1] },
    { kind: 'call', name: 'used member: restoreSession', lines: [16] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [3] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [4] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato demasiado ancho|cambios ajenos/i);
  assert.match(finding.expected_fix ?? '', /protocolos pequeños|puerto mínimo/i);
});

test('detects semantic LSP heuristic for iOS application types with unsafe substitution', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/Validation/Application/PumukiLspIosCanaryDiscount.swift',
        [
          'protocol PumukiLspIosCanaryDiscountApplying {',
          '  func apply(to amount: Decimal) -> Decimal',
          '}',
          '',
          'final class PumukiLspIosCanaryStandardDiscount: PumukiLspIosCanaryDiscountApplying {',
          '  func apply(to amount: Decimal) -> Decimal {',
          '    amount * 0.9',
          '  }',
          '}',
          '',
          'final class PumukiLspIosCanaryPremiumDiscount: PumukiLspIosCanaryDiscountApplying {',
          '  func apply(to amount: Decimal) -> Decimal {',
          '    guard amount >= 100 else {',
          '      fatalError("premium-only")',
          '    }',
          '    return amount * 0.8',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.solid.lsp.narrowed-precondition.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspIosCanaryPremiumDiscount',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspIosCanaryDiscountApplying', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspIosCanaryStandardDiscount', lines: [5] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [13] },
    { kind: 'call', name: 'fatalError', lines: [14] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustitución|precondiciones|regresiones/i);
  assert.match(finding.expected_fix ?? '', /contrato base|adaptador|estrategia/i);
});

test('detects IOS-CANARY-001 against AppShell-style mixed responsibilities in a real iOS ViewModel', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
        [
          'public final class AppShellViewModel {',
          '  public func restorePersistedSessionIfNeeded() async {}',
          '  public func continueAsGuest() async {}',
          '  public func bootstrapAuthenticatedSession(idToken: String) async {}',
          '  public func selectStore(_ store: StoreDescriptor) async throws {}',
          '  public func syncShoppingList() async {}',
          '  public func markNextStopCompleted() {}',
          '  public func scanCheckpoint(_ checkpointCode: String) async {}',
          '  public func flushOfflineQueue() async {}',
          '  public func openDeepLink(_ rawURL: String) throws {}',
          '  private func rebuildRouteStatus() {}',
          '  private func enqueueOfflineCheckpoint(_ checkpointCode: String, storeID: String) async {}',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast'
  );

  assert.ok(finding);
  assert.equal(finding.primary_node?.name, 'AppShellViewModel');
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'session bootstrap/restoration', lines: [2, 3, 4] },
    { kind: 'member', name: 'store selection orchestration', lines: [5] },
    { kind: 'member', name: 'shopping list synchronization', lines: [6] },
    { kind: 'member', name: 'route progression', lines: [7, 8, 11] },
    { kind: 'member', name: 'offline queue coordination', lines: [9, 12] },
    { kind: 'member', name: 'deep link/navigation flow', lines: [10] },
  ]);
  assert.match(finding.why ?? '', /múltiples razones de cambio/i);
  assert.match(finding.impact ?? '', /cola offline/i);
  assert.match(finding.expected_fix ?? '', /coordinadores dedicados/i);
});

test('skips iOS force-try heuristic in comments and strings', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Feature/View.swift',
        [
          '// try! commented out',
          'let message = "try! not executable"',
          '// as! commented out',
          'let castLiteral = "as! not executable"',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.force-try.ast'), false);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.force-cast.ast'), false);
});

test('detects Android heuristics in production path and skips tests', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/Feature.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }'].join('\n')
      ),
      fileContentFact(
        'apps/android/local.properties',
        ['sdk.dir=/Users/demo/Library/Android/sdk'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/data/LegacyPreferencesStore.kt',
        ['class LegacyPreferencesStore(private val preferences: SharedPreferences)'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/data/FakeOrdersRepositoryFactory.kt',
        ['class FakeOrdersRepositoryFactory { fun create(): OrdersRepository = mockk(relaxed = true) }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/data/LegacySyncTask.java',
        ['class LegacySyncTask extends android.os.AsyncTask<Void, Void, Void> { }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/CheckoutActivity.kt',
        [
          'class CheckoutActivity : ComponentActivity() {',
          '  override fun onCreate(savedInstanceState: Bundle?) {',
          '    super.onCreate(savedInstanceState)',
          '    setContent { CheckoutScreen() }',
          '  }',
          '  fun loadRemoteCheckout() { OkHttpClient().newCall(request).execute() }',
          '  fun cacheCheckoutState() { getSharedPreferences("checkout", MODE_PRIVATE).edit().apply() }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/presentation/OrdersScreen.kt',
        [
          '@Composable',
          'fun OrdersScreen(orders: List<Order>) {',
          '  LaunchedEffect(Unit) { loadOrders() }',
          '  val formatter = DecimalFormat("#.00")',
          '  Box(modifier = Modifier.background(Color.Red).padding(16.dp))',
          '  Column(modifier = Modifier.verticalScroll(rememberScrollState())) {',
          '    orders.forEach { order -> Text(order.name) }',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/presentation/FeatureViewModel.kt',
        [
          'class FeatureViewModel : ViewModel() {',
          '  private val mutableState = MutableLiveData<FeatureUiState>()',
          '  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/application/SyncOrdersUseCase.kt',
        ['suspend fun execute() = withContext(Dispatchers.Main) { }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/domain/BuildCatalogIndexUseCase.kt',
        ['suspend fun execute() = withContext(Dispatchers.Default) { }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/application/ParallelSyncUseCase.kt',
        ['suspend fun execute() = supervisorScope { launch { syncRemote() } }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/application/LifecycleLeakUseCase.kt',
        ['fun execute() { lifecycleScope.launch { syncRemote() } }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/application/SafeSyncUseCase.kt',
        [
          'suspend fun execute() {',
          '  try { syncRemote() } catch (error: IOException) { recover(error) }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/application/CheckoutLogger.kt',
        ['class CheckoutLogger { fun log(value: String?) { Log.d("Checkout", value!!.trim()) } }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/presentation/CheckoutScreen.kt',
        [
          '@Composable fun CheckoutScreen() { Text("Comprar ahora"); Icon(Icons.Default.Warning); BottomNavigation { } }',
          '@Composable fun SearchBox() { val query = mutableStateOf(""); Text(query.value) }',
          '@Composable fun FixedScale(content: @Composable () -> Unit) { CompositionLocalProvider(LocalDensity provides Density(1f, fontScale = 1f)) { content() } }',
          '@Composable fun AppTheme(content: @Composable () -> Unit) { MaterialTheme(colorScheme = AppColorScheme, content = content) }',
          '@Composable fun BusyEffect(viewModel: CheckoutViewModel) { LaunchedEffect(viewModel.sessionId) { while (true) { viewModel.poll() } } }',
          'class CheckoutNavigator { fun open(context: Context) { context.startActivity(Intent(context, CheckoutActivity::class.java)) } }',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/presentation/CheckoutViewModel.kt',
        [
          'class CheckoutViewModel : ViewModel() {',
          '  val coldState: Flow<CheckoutUiState> = repository.observeCheckout()',
          '  val uiState: SharedFlow<CheckoutUiState> = MutableSharedFlow()',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/FeatureTest.kt',
        [
          'Thread.sleep(10)',
          'GlobalScope.launch { }',
          'runBlocking { }',
          'private val mutableState = MutableLiveData<FeatureUiState>()',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/LegacyJUnit4Test.kt',
        [
          'import org.junit.Test',
          'import org.junit.Assert',
          '',
          'class LegacyJUnit4Test {',
          '  @Test',
          '  fun verifiesLegacyAssertion() {',
          '    Assert.assertEquals(1, 1)',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.accessibility.fontscale-disabled.ast',
    'heuristics.android.accessibility.missing-content-description.ast',
    'heuristics.android.architecture.god-activity.ast',
    'heuristics.android.compose.incomplete-material-theme.ast',
    'heuristics.android.compose.launched-effect-busy-loop.ast',
    'heuristics.android.compose.legacy-bottom-navigation.ast',
    'heuristics.android.compose.modifier-background-before-padding.ast',
    'heuristics.android.compose.non-lazy-scrollable-collection.ast',
    'heuristics.android.compose.object-creation-without-remember.ast',
    'heuristics.android.compose.state-creation-without-remember.ast',
    'heuristics.android.compose.unstable-launched-effect-key.ast',
    'heuristics.android.concurrency.asynctask.ast',
    'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast',
    'heuristics.android.coroutines.hardcoded-background-dispatcher.ast',
    'heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast',
    'heuristics.android.coroutines.manual-scope-in-viewmodel.ast',
    'heuristics.android.coroutines.supervisor-scope.ast',
    'heuristics.android.coroutines.try-catch.ast',
    'heuristics.android.coroutines.with-context.ast',
    'heuristics.android.coroutines.with-context.ast',
    'heuristics.android.flow.livedata-state-exposure.ast',
    'heuristics.android.flow.sharedflow-used-as-state.ast',
    'heuristics.android.flow.viewmodel-flow-without-statein.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.navigation.imperative-navigation.ast',
    'heuristics.android.null-safety.force-unwrap.ast',
    'heuristics.android.observability.production-logging.ast',
    'heuristics.android.persistence.shared-preferences-usage.ast',
    'heuristics.android.persistence.shared-preferences-usage.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.security.local-properties-tracked.ast',
    'heuristics.android.testing.junit4-usage.ast',
    'heuristics.android.testing.production-mock-usage.ast',
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.ui.hardcoded-string.ast',
  ]);
});

test('detects semantic Android SRP heuristic in presentation path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/validation/presentation/PumukiSrpAndroidCanaryViewModel.kt',
        [
          'import android.content.SharedPreferences',
          'import androidx.lifecycle.ViewModel',
          'import androidx.navigation.NavController',
          'import okhttp3.OkHttpClient',
          '',
          'class PumukiSrpAndroidCanaryViewModel(',
          '  private val navController: NavController,',
          ') : ViewModel() {',
          '  fun restoreSessionSnapshot() {}',
          '',
          '  suspend fun fetchRemoteCatalog() {',
          '    val client = OkHttpClient()',
          '    client.newCall(request)',
          '  }',
          '',
          '  fun cacheLastStore(preferences: SharedPreferences, storeId: String) {',
          '    preferences.edit().putString("last-store-id", storeId).apply()',
          '  }',
          '',
          '  fun openStoreMap() {',
          '    navController.navigate("store-map")',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiSrpAndroidCanaryViewModel',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'session/auth flow', lines: [9] },
    { kind: 'call', name: 'remote networking', lines: [12] },
    { kind: 'call', name: 'local persistence', lines: [16] },
    { kind: 'member', name: 'navigation flow', lines: [21] },
  ]);
  assert.match(finding.why ?? '', /SRP/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /coordinadores|casos de uso/i);
});

test('detects semantic Android DIP heuristic in application path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiDipAndroidCanaryUseCase.kt',
        [
          'import android.content.SharedPreferences',
          'import okhttp3.OkHttpClient',
          'import okhttp3.Request',
          '',
          'class PumukiDipAndroidCanaryUseCase(',
          '  private val preferences: SharedPreferences,',
          ') {',
          '  private val client: OkHttpClient = OkHttpClient()',
          '',
          '  suspend fun execute() {',
          '    val request = Request.Builder()',
          '      .url("https://example.com/catalog.json")',
          '      .build()',
          '',
          '    client.newCall(request)',
          '    preferences.edit().putLong("last-sync", 1L).apply()',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.android.solid.dip.concrete-framework-dependency.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiDipAndroidCanaryUseCase',
    lines: [5],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'property', name: 'concrete dependency: SharedPreferences', lines: [6] },
    { kind: 'property', name: 'concrete dependency: OkHttpClient', lines: [8] },
    { kind: 'call', name: 'OkHttpClient()', lines: [8] },
  ]);
  assert.match(finding.why ?? '', /DIP/i);
  assert.match(finding.impact ?? '', /infraestructura|alto nivel|coste de sustituir/i);
  assert.match(finding.expected_fix ?? '', /puertos|abstracciones|gateways/i);
});

test('detects semantic Android OCP heuristic in application path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiOcpAndroidCanaryUseCase.kt',
        [
          'enum class PumukiOcpAndroidCanaryChannel {',
          '  GroceryPickup,',
          '  HomeDelivery,',
          '}',
          '',
          'class PumukiOcpAndroidCanaryUseCase {',
          '  fun resolve(channel: PumukiOcpAndroidCanaryChannel): String {',
          '    return when (channel) {',
          '      PumukiOcpAndroidCanaryChannel.GroceryPickup -> "pickup"',
          '      PumukiOcpAndroidCanaryChannel.HomeDelivery -> "delivery"',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.android.solid.ocp.discriminator-branching.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiOcpAndroidCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: channel', lines: [8] },
    { kind: 'member', name: 'branch GroceryPickup', lines: [9] },
    { kind: 'member', name: 'branch HomeDelivery', lines: [10] },
  ]);
  assert.match(finding.why ?? '', /OCP/i);
  assert.match(finding.impact ?? '', /nuevo caso|modificar/i);
  assert.match(finding.expected_fix ?? '', /estrategia|interfaz|registry/i);
});

test('detects semantic Android ISP heuristic in application path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiIspAndroidCanaryUseCase.kt',
        [
          'interface PumukiIspAndroidCanarySessionPort {',
          '  suspend fun restoreSession()',
          '  suspend fun persistSessionID(id: String)',
          '  suspend fun clearSession()',
          '  suspend fun refreshToken(): String',
          '}',
          '',
          'class PumukiIspAndroidCanaryUseCase(',
          '  private val sessionPort: PumukiIspAndroidCanarySessionPort,',
          ') {',
          '  suspend fun execute() {',
          '    sessionPort.restoreSession()',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.android.solid.isp.fat-interface-dependency.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiIspAndroidCanaryUseCase',
    lines: [8],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspAndroidCanarySessionPort', lines: [1] },
    { kind: 'call', name: 'used member: restoreSession', lines: [12] },
    { kind: 'member', name: 'unused contract member: persistSessionID', lines: [3] },
    { kind: 'member', name: 'unused contract member: clearSession', lines: [4] },
  ]);
  assert.match(finding.why ?? '', /ISP/i);
  assert.match(finding.impact ?? '', /contrato demasiado ancho|cambios ajenos/i);
  assert.match(finding.expected_fix ?? '', /interfaces pequeñas|puerto mínimo/i);
});

test('detects semantic Android LSP heuristic in application path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/validation/application/PumukiLspAndroidCanaryDiscountPolicy.kt',
        [
          'interface PumukiLspAndroidCanaryDiscountPolicy {',
          '  fun apply(amount: Double): Double',
          '}',
          '',
          'class PumukiLspAndroidCanaryStandardDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {',
          '  override fun apply(amount: Double): Double {',
          '    return amount * 0.9',
          '  }',
          '}',
          '',
          'class PumukiLspAndroidCanaryPremiumDiscountPolicy : PumukiLspAndroidCanaryDiscountPolicy {',
          '  override fun apply(amount: Double): Double {',
          '    require(amount >= 100.0)',
          '    error("premium-only")',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.android.solid.lsp.narrowed-precondition.ast'
  );

  assert.ok(finding);
  assert.equal(finding.severity, 'CRITICAL');
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiLspAndroidCanaryPremiumDiscountPolicy',
    lines: [11],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'base contract: PumukiLspAndroidCanaryDiscountPolicy', lines: [1] },
    { kind: 'member', name: 'safe substitute: PumukiLspAndroidCanaryStandardDiscountPolicy', lines: [5] },
    { kind: 'member', name: 'narrowed precondition: apply', lines: [13] },
    { kind: 'call', name: 'error', lines: [14] },
  ]);
  assert.match(finding.why ?? '', /LSP/i);
  assert.match(finding.impact ?? '', /sustituci|regresion|crash/i);
  assert.match(finding.expected_fix ?? '', /contrato base|estrategia|subtipo/i);
});

test('returns empty when no heuristic platform is detected', () => {
  const extracted = extractHeuristicFacts({
    facts: [fileContentFact('apps/backend/src/feature/file.ts', 'const value: any = 1;')],
    detectedPlatforms: {},
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.length, 0);
});

test('detects TypeScript heuristics outside apps scope when PUMUKI_HEURISTICS_TS_SCOPE=all', () => {
  const previousScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE;
  process.env.PUMUKI_HEURISTICS_TS_SCOPE = 'all';

  try {
    const extracted = extractHeuristicFacts({
      facts: [fileContentFact('core/domain/service.ts', 'const value: any = 1; console.log(value);')],
      detectedPlatforms: {},
    });

    const findings = evaluateRules(astHeuristicsRuleSet, extracted);
    assert.equal(
      findings.some((finding) => finding.ruleId === 'heuristics.ts.explicit-any.ast'),
      true
    );
    assert.equal(
      findings.some((finding) => finding.ruleId === 'heuristics.ts.console-log.ast'),
      true
    );
  } finally {
    if (typeof previousScope === 'string') {
      process.env.PUMUKI_HEURISTICS_TS_SCOPE = previousScope;
    } else {
      delete process.env.PUMUKI_HEURISTICS_TS_SCOPE;
    }
  }
});

test('detects legacy common type/network families from AST facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/types/contract.ts',
        [
          'type Payload = Record<string, unknown>',
          'type Base = string | undefined',
          'const parsed = input as unknown',
          'const response = axios.get("/health")',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  const recordUnknownFact = extracted.find(
    (finding) => finding.ruleId === 'common.types.record_unknown_requires_type'
  );
  const unknownAssertionFact = extracted.find(
    (finding) => finding.ruleId === 'common.types.unknown_without_guard'
  );
  const undefinedUnionFact = extracted.find(
    (finding) => finding.ruleId === 'common.types.undefined_in_base_type'
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.types.record_unknown_requires_type'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.types.unknown_without_guard'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.types.undefined_in_base_type'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.network.missing_error_handling'),
    true
  );
  assert.deepEqual(recordUnknownFact?.lines, [1]);
  assert.deepEqual(undefinedUnionFact?.lines, [2]);
  assert.deepEqual(unknownAssertionFact?.lines, [3]);
});

test('preserva lineas por fichero para common.network.missing_error_handling', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/unhandled.ts',
        [
          'async function load() {',
          '  return axios.get("/health");',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/backend/src/application/handled.ts',
        [
          'async function load() {',
          '  return axios.get("/health").catch(() => null);',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted).filter(
    (finding) => finding.ruleId === 'common.network.missing_error_handling'
  );
  const unhandledFact = extracted.find(
    (fact) =>
      fact.ruleId === 'common.network.missing_error_handling'
      && fact.filePath === 'apps/backend/src/application/unhandled.ts'
  );
  const handledFact = extracted.find(
    (fact) =>
      fact.ruleId === 'common.network.missing_error_handling'
      && fact.filePath === 'apps/backend/src/application/handled.ts'
  );

  assert.equal(findings.length, 1);
  assert.deepEqual(unhandledFact?.lines, [2]);
  assert.equal(handledFact, undefined);
});

test('maps empty catch heuristic to legacy common.error.empty_catch finding', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/catch.ts',
        [
          'async function loadData() {',
          '  try {',
          '    await fetch("/api/data");',
          '  } catch {}',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  const emptyCatchFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.empty-catch.ast'
  );
  const commonEmptyCatchFact = extracted.find(
    (finding) => finding.ruleId === 'common.error.empty_catch'
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ts.empty-catch.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'common.error.empty_catch'),
    true
  );
  assert.deepEqual(emptyCatchFact?.lines, [4]);
  assert.deepEqual(commonEmptyCatchFact?.lines, [4]);
});

test('propagates AST line metadata for process, security, browser y fs', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/line-locators.ts',
        [
          'const fs = require("fs");',
          'process.exit(1);',
          'const apiToken = "super-secret-token-123";',
          'document.write(apiToken);',
          'fs.writeFileSync("/tmp/demo.txt", apiToken);',
          'fs.promises.readFile("/tmp/demo.txt", "utf8");',
          'fs.readFile("/tmp/demo.txt", "utf8", () => {});',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const processExitFact = extracted.find((finding) => finding.ruleId === 'heuristics.ts.process-exit.ast');
  const hardcodedSecretFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.hardcoded-secret-token.ast'
  );
  const documentWriteFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.document-write.ast'
  );
  const fsWriteSyncFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.fs-write-file-sync.ast'
  );
  const fsPromisesReadFileFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.fs-promises-read-file.ast'
  );
  const fsReadFileCallbackFact = extracted.find(
    (finding) => finding.ruleId === 'heuristics.ts.fs-read-file-callback.ast'
  );

  assert.deepEqual(processExitFact?.lines, [2]);
  assert.deepEqual(hardcodedSecretFact?.lines, [3]);
  assert.deepEqual(documentWriteFact?.lines, [4]);
  assert.deepEqual(fsWriteSyncFact?.lines, [5]);
  assert.deepEqual(fsPromisesReadFileFact?.lines, [6]);
  assert.deepEqual(fsReadFileCallbackFact?.lines, [7]);
});

test('emits workflow BDD findings for repos with high implementation volume and low feature coverage', () => {
  const implementationFacts: Fact[] = Array.from({ length: 55 }, (_, index) =>
    fileContentFact(`apps/backend/src/module-${index}.ts`, `export const value${index} = ${index};`)
  );
  const extracted = extractHeuristicFacts({
    facts: implementationFacts,
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'workflow.bdd.missing_feature_files'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'workflow.bdd.insufficient_features'),
    true
  );
});

test('extracts NestJS constructor DI without decorator heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/orders.service.ts',
        'export class OrdersService { constructor(private readonly repo: OrdersRepository) {} }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.nestjs.constructor-di-without-decorator.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_NESTJS_CONSTRUCTOR_DI_WITHOUT_DECORATOR_AST');
});

test('extracts backend persistence mutation without audit event heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/complete-order.service.ts',
        [
          'export async function completeOrder(repository: OrdersRepository) {',
          '  await repository.save({ id: "order-1", status: "complete" });',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) =>
      entry.ruleId === 'heuristics.ts.backend.persistence-mutation-without-audit-event.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_PERSISTENCE_MUTATION_WITHOUT_AUDIT_EVENT_AST');
});

test('extracts backend hard delete without soft delete heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/use-cases/DeleteOrderUseCase.ts',
        [
          'export class DeleteOrderUseCase {',
          '  async execute(orderId: string) {',
          '    await this.ordersRepository.delete(orderId);',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const fact = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.hard-delete-without-soft-delete.ast'
  );
  assert.ok(fact);
  assert.deepEqual(fact.lines, [3]);
});

test('extracts backend DTO property without validation heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/create-order.dto.ts',
        ['export class CreateOrderDto {', '  email: string;', '}'].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.dto-property-without-validation.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_VALIDATION_AST');
});

test('extracts backend sensitive data logging heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/auth/auth.service.ts',
        'export function login(logger: Logger, accessToken: string) { logger.info(accessToken); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.sensitive-data-logging.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_SENSITIVE_DATA_LOGGING_AST');
});

test('extracts backend log without context heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/orders.service.ts',
        'export function handle(error: Error, logger: Logger) { logger.error(error); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.log-without-context.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_LOG_WITHOUT_CONTEXT_AST');
  assert.deepEqual(finding.lines, [1]);
});

test('extracts backend magic number heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/order-pricing.service.ts',
        [
          'export function calculateTotal(subtotal: number) {',
          '  const VAT_RATE = 21;',
          '  return subtotal * 21;',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.magic-number-literal.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_MAGIC_NUMBER_LITERAL_AST');
});

test('extracts backend generic error throw heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/create-order.use-case.ts',
        'export function createOrder() { throw new Error("invalid order"); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.generic-error-throw.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_GENERIC_ERROR_THROW_AST');
});

test('extracts backend production mock or spy heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/order.repository.ts',
        'export const repository = { save: jest.fn() };'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.production-mock-or-spy.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_PRODUCTION_MOCK_OR_SPY_AST');
});

test('extracts typed heuristic facts with expected metadata', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.equal(extracted.length, 150);
  assert.equal(extracted.every((fact) => fact.kind === 'Heuristic'), true);
  assert.equal(extracted.every((fact) => fact.source === 'heuristics:ast'), true);
});

test('extracts backend nested DTO property without nested validation heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/create-order.dto.ts',
        'export class CreateOrderDto { address!: AddressDto; }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_DTO_NESTED_PROPERTY_WITHOUT_NESTED_VALIDATION_AST');
});

test('extracts backend controller route without guard heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/orders.controller.ts',
        [
          'import { Controller, Get } from "@nestjs/common";',
          '@Controller("orders")',
          'export class OrdersController {',
          '  @Get()',
          '  listOrders() { return []; }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.controller-route-without-guard.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_GUARD_AST');
});

test('extracts backend stack trace exposure heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/errors/error.filter.ts',
        'export function handle(error: Error, res: Response) { return res.json({ statusCode: 500, stack: error.stack }); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.error-stack-in-http-response.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_ERROR_STACK_IN_HTTP_RESPONSE_AST');
});

test('extracts backend inconsistent error response heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/errors/error.filter.ts',
        'export function handle(error: Error, res: Response) { return res.status(500).json({ message: error.message }); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.inconsistent-error-response.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_INCONSISTENT_ERROR_RESPONSE_AST');
  assert.deepEqual(finding.lines, [1]);
});

test('extracts backend error payload with success status heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/errors/error.filter.ts',
        'export function handle(error: Error, res: Response) { return res.status(200).json({ error: error.message }); }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.error-payload-success-status.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_ERROR_PAYLOAD_SUCCESS_STATUS_AST');
  assert.deepEqual(finding.lines, [1]);
});

test('extracts backend controller entity response heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/orders/orders.controller.ts',
        [
          'import { Controller, Get } from "@nestjs/common";',
          'import { OrderEntity } from "../domain/entities/OrderEntity";',
          '@Controller("orders")',
          'export class OrdersController {',
          '  @Get(":id")',
          '  getOrder(): Promise<OrderEntity> {',
          '    return this.service.getOrder();',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.controller-entity-response.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_CONTROLLER_ENTITY_RESPONSE_AST');
  assert.deepEqual(finding.lines, [5]);
});

test('extracts backend anemic domain model heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/domain/entities/OrderEntity.ts',
        [
          'export class OrderEntity {',
          '  id!: string;',
          '  status!: string;',
          '  getStatus() { return this.status; }',
          '  setStatus(status: string) { this.status = status; }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { backend: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.backend.anemic-domain-model.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_BACKEND_ANEMIC_DOMAIN_MODEL_AST');
});

test('extracts iOS EnvironmentObject heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Profile/ProfileView.swift',
        [
          'import SwiftUI',
          'struct ProfileView: View {',
          '  @EnvironmentObject var session: SessionStore',
          '  var body: some View { Text(session.name) }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { ios: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.swiftui.environment-object.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_IOS_SWIFTUI_ENVIRONMENT_OBJECT_AST');
  assert.deepEqual(finding.lines, [3]);
});

test('emits actionable iOS task lifecycle metadata for PUMUKI-INC-155', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Features/Auth/LoginView.swift',
        [
          'import SwiftUI',
          'struct LoginView: View {',
          '  var body: some View {',
          '    Text("Login")',
          '      .onAppear {',
          '        Task {',
          '          await viewModel.load()',
          '        }',
          '      }',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { ios: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.swiftui.onappear-task.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.lines, [6]);
  assert.equal(finding.primary_node?.name, 'Task launched inside SwiftUI onAppear');
  assert.match(finding.expected_fix ?? '', /\.task/);
});

test('extracts actionable iOS cross-feature import heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Features/Auth/LoginView.swift',
        [
          'import SwiftUI',
          'import SharedKernel',
          'import Orders',
          'struct LoginView: View {',
          '  let route: OrdersRoute',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { ios: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.architecture.cross-feature-import.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_IOS_ARCHITECTURE_CROSS_FEATURE_IMPORT_AST');
  assert.deepEqual(finding.lines, [3]);
  assert.equal(finding.primary_node?.name, 'cross-feature Swift import');
  assert.match(finding.expected_fix ?? '', /SharedKernel/);
});

test('extracts actionable iOS layer direction violation heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Features/Orders/Domain/Entities/Order.swift',
        [
          'import Foundation',
          'import SwiftUI',
          'import CoreData',
          'struct Order: Sendable {',
          '  let id: String',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { ios: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.architecture.layer-direction-violation.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_IOS_ARCHITECTURE_LAYER_DIRECTION_VIOLATION_AST');
  assert.deepEqual(finding.lines, [2, 3]);
  assert.equal(finding.primary_node?.name, 'forbidden import for Clean Architecture layer');
  assert.match(finding.expected_fix ?? '', /Infrastructure/);
});

test('extracts actionable iOS excessive public API heuristic facts', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Features/BuyerCommerce/BuyerShellViewModel.swift',
        [
          'import SwiftUI',
          '',
          'public final class BuyerShellViewModel {',
          '  public var selectedTab: Tab = .home',
          '  public init() {}',
          '  public func openCheckout() {}',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: { ios: { detected: true } },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ios.architecture.excessive-public-api.ast'
  );

  assert.ok(finding);
  assert.equal(finding.code, 'HEURISTICS_IOS_ARCHITECTURE_EXCESSIVE_PUBLIC_API_AST');
  assert.deepEqual(finding.lines, [3, 4, 5, 6]);
  assert.equal(finding.primary_node?.name, 'excessive public/open Swift API surface');
  assert.match(finding.expected_fix ?? '', /internal by default/);
});

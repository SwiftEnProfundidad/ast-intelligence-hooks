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
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const bcrypt = require("bcrypt"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); const prismaClient = new PrismaClient(); const prismaPkg = require("@prisma/client"); interface AccountPort { findById(id: string): string; saveProfile(id: string): void; } class AccountService { findById() { return "ok"; } saveProfile() { return "ok"; } } function resolveByKind(entity: any) { switch (entity.kind) { case "reservation": return 1; case "zbe": return 2; default: return 0; } } class BaseHandler { run() { return 0; } } class ExtendedHandler extends BaseHandler { override run() { throw new Error("Not implemented"); } } debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'common.error.empty_catch',
    'heuristics.ts.buffer-alloc-unsafe-slow.ast',
    'heuristics.ts.buffer-alloc-unsafe.ast',
    'heuristics.ts.child-process-exec-file-sync.ast',
    'heuristics.ts.child-process-exec-file-untrusted-args.ast',
    'heuristics.ts.child-process-exec-file.ast',
    'heuristics.ts.child-process-exec-sync.ast',
    'heuristics.ts.child-process-exec.ast',
    'heuristics.ts.child-process-fork.ast',
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.child-process-shell-true.ast',
    'heuristics.ts.child-process-spawn-sync.ast',
    'heuristics.ts.child-process-spawn.ast',
    'heuristics.ts.clean-architecture.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.dynamic-shell-invocation.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.fs-access-callback.ast',
    'heuristics.ts.fs-access-sync.ast',
    'heuristics.ts.fs-append-file-callback.ast',
    'heuristics.ts.fs-append-file-sync.ast',
    'heuristics.ts.fs-chmod-callback.ast',
    'heuristics.ts.fs-chmod-sync.ast',
    'heuristics.ts.fs-chown-callback.ast',
    'heuristics.ts.fs-chown-sync.ast',
    'heuristics.ts.fs-close-callback.ast',
    'heuristics.ts.fs-close-sync.ast',
    'heuristics.ts.fs-copy-file-callback.ast',
    'heuristics.ts.fs-copy-file-sync.ast',
    'heuristics.ts.fs-cp-callback.ast',
    'heuristics.ts.fs-cp-sync.ast',
    'heuristics.ts.fs-exists-callback.ast',
    'heuristics.ts.fs-exists-sync.ast',
    'heuristics.ts.fs-fchmod-callback.ast',
    'heuristics.ts.fs-fchmod-sync.ast',
    'heuristics.ts.fs-fchown-callback.ast',
    'heuristics.ts.fs-fchown-sync.ast',
    'heuristics.ts.fs-fdatasync-callback.ast',
    'heuristics.ts.fs-fdatasync-sync.ast',
    'heuristics.ts.fs-fstat-callback.ast',
    'heuristics.ts.fs-fstat-sync.ast',
    'heuristics.ts.fs-fsync-callback.ast',
    'heuristics.ts.fs-fsync-sync.ast',
    'heuristics.ts.fs-ftruncate-callback.ast',
    'heuristics.ts.fs-ftruncate-sync.ast',
    'heuristics.ts.fs-futimes-callback.ast',
    'heuristics.ts.fs-futimes-sync.ast',
    'heuristics.ts.fs-lchmod-callback.ast',
    'heuristics.ts.fs-lchown-callback.ast',
    'heuristics.ts.fs-link-callback.ast',
    'heuristics.ts.fs-link-sync.ast',
    'heuristics.ts.fs-lstat-callback.ast',
    'heuristics.ts.fs-lstat-sync.ast',
    'heuristics.ts.fs-lutimes-callback.ast',
    'heuristics.ts.fs-lutimes-sync.ast',
    'heuristics.ts.fs-mkdir-callback.ast',
    'heuristics.ts.fs-mkdir-sync.ast',
    'heuristics.ts.fs-mkdtemp-callback.ast',
    'heuristics.ts.fs-mkdtemp-sync.ast',
    'heuristics.ts.fs-open-callback.ast',
    'heuristics.ts.fs-open-sync.ast',
    'heuristics.ts.fs-opendir-callback.ast',
    'heuristics.ts.fs-opendir-sync.ast',
    'heuristics.ts.fs-promises-access.ast',
    'heuristics.ts.fs-promises-append-file.ast',
    'heuristics.ts.fs-promises-chmod.ast',
    'heuristics.ts.fs-promises-chown.ast',
    'heuristics.ts.fs-promises-copy-file.ast',
    'heuristics.ts.fs-promises-cp.ast',
    'heuristics.ts.fs-promises-link.ast',
    'heuristics.ts.fs-promises-lstat.ast',
    'heuristics.ts.fs-promises-mkdir.ast',
    'heuristics.ts.fs-promises-mkdtemp.ast',
    'heuristics.ts.fs-promises-open.ast',
    'heuristics.ts.fs-promises-opendir.ast',
    'heuristics.ts.fs-promises-read-file.ast',
    'heuristics.ts.fs-promises-readdir.ast',
    'heuristics.ts.fs-promises-readlink.ast',
    'heuristics.ts.fs-promises-realpath.ast',
    'heuristics.ts.fs-promises-rename.ast',
    'heuristics.ts.fs-promises-rm.ast',
    'heuristics.ts.fs-promises-stat.ast',
    'heuristics.ts.fs-promises-symlink.ast',
    'heuristics.ts.fs-promises-unlink.ast',
    'heuristics.ts.fs-promises-utimes.ast',
    'heuristics.ts.fs-promises-write-file.ast',
    'heuristics.ts.fs-read-callback.ast',
    'heuristics.ts.fs-read-file-callback.ast',
    'heuristics.ts.fs-read-file-sync.ast',
    'heuristics.ts.fs-read-sync.ast',
    'heuristics.ts.fs-readdir-callback.ast',
    'heuristics.ts.fs-readdir-sync.ast',
    'heuristics.ts.fs-readlink-callback.ast',
    'heuristics.ts.fs-readlink-sync.ast',
    'heuristics.ts.fs-readv-callback.ast',
    'heuristics.ts.fs-readv-sync.ast',
    'heuristics.ts.fs-realpath-callback.ast',
    'heuristics.ts.fs-realpath-sync.ast',
    'heuristics.ts.fs-rename-callback.ast',
    'heuristics.ts.fs-rename-sync.ast',
    'heuristics.ts.fs-rm-callback.ast',
    'heuristics.ts.fs-rm-sync.ast',
    'heuristics.ts.fs-rmdir-callback.ast',
    'heuristics.ts.fs-rmdir-sync.ast',
    'heuristics.ts.fs-stat-callback.ast',
    'heuristics.ts.fs-stat-sync.ast',
    'heuristics.ts.fs-statfs-callback.ast',
    'heuristics.ts.fs-statfs-sync.ast',
    'heuristics.ts.fs-symlink-callback.ast',
    'heuristics.ts.fs-symlink-sync.ast',
    'heuristics.ts.fs-truncate-callback.ast',
    'heuristics.ts.fs-truncate-sync.ast',
    'heuristics.ts.fs-unlink-callback.ast',
    'heuristics.ts.fs-unlink-sync.ast',
    'heuristics.ts.fs-unwatch-file-callback.ast',
    'heuristics.ts.fs-utimes-callback.ast',
    'heuristics.ts.fs-utimes-sync.ast',
    'heuristics.ts.fs-watch-callback.ast',
    'heuristics.ts.fs-watch-file-callback.ast',
    'heuristics.ts.fs-write-callback.ast',
    'heuristics.ts.fs-write-file-callback.ast',
    'heuristics.ts.fs-write-file-sync.ast',
    'heuristics.ts.fs-write-sync.ast',
    'heuristics.ts.fs-writev-callback.ast',
    'heuristics.ts.fs-writev-sync.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.hardcoded-secret-token.ast',
    'heuristics.ts.hardcoded-values.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insecure-token-date-now.ast',
    'heuristics.ts.insecure-token-math-random.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.jwt-decode-without-verify.ast',
    'heuristics.ts.jwt-sign-no-expiration.ast',
    'heuristics.ts.jwt-verify-ignore-expiration.ast',
    'heuristics.ts.magic-numbers.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.process-env-mutation.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.tls-env-override.ast',
    'heuristics.ts.tls-reject-unauthorized-false.ast',
    'heuristics.ts.vm-dynamic-code-execution.ast',
    'heuristics.ts.weak-crypto-hash.ast',
    'heuristics.ts.weak-token-randomuuid.ast',
    'heuristics.ts.with-statement.ast',
  ]);
});

test('detects backend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const bcrypt = require("bcrypt"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const passwordHash = bcrypt.hashSync(apiToken, 8); const { createLogger, format } = require("winston"); const logger = createLogger({ format: format.json() }); const metrics = require("prom-client"); const { ThrottlerModule } = require("@nestjs/throttler"); const throttlerConfig = ThrottlerModule.forRoot({ ttl: 60, limit: 10 }); const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); const error = new Error("Payment failed"); logger.error(error); logger.info({ requestId: "req-1", traceId: "trace-1", correlationId: "corr-1" }); logger.warn({ password: apiToken, token: sessionToken }); const app = { enableCors: () => void 0 }; app.enableCors({ origin: ["https://app.example.com", "https://admin.example.com"] }); app.useGlobalPipes(new ValidationPipe({ whitelist: true })); const { ConfigModule } = require("@nestjs/config"); ConfigModule.forRoot({ validationSchema: Joi.object({ NODE_ENV: Joi.string().required() }) }); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; const apiUrl = process.env.API_URL || "http://localhost:3000"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); const prismaClient = new PrismaClient(); const prismaPkg = require("@prisma/client"); interface AccountPort { findById(id: string): string; saveProfile(id: string): void; } class AccountService { findById() { return "ok"; } saveProfile() { return "ok"; } } function resolveByKind(entity: any) { switch (entity.kind) { case "reservation": return 1; case "zbe": return 2; default: return 0; } } class BaseHandler { run() { return 0; } } class ExtendedHandler extends BaseHandler { override run() { throw new Error("Not implemented"); } } debugger;'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'common.error.empty_catch',
    'heuristics.ts.buffer-alloc-unsafe-slow.ast',
    'heuristics.ts.buffer-alloc-unsafe.ast',
    'heuristics.ts.child-process-exec-file-sync.ast',
    'heuristics.ts.child-process-exec-file-untrusted-args.ast',
    'heuristics.ts.child-process-exec-file.ast',
    'heuristics.ts.child-process-exec-sync.ast',
    'heuristics.ts.child-process-exec.ast',
    'heuristics.ts.child-process-fork.ast',
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.child-process-shell-true.ast',
    'heuristics.ts.child-process-spawn-sync.ast',
    'heuristics.ts.child-process-spawn.ast',
    'heuristics.ts.clean-architecture.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.correlation-ids.ast',
    'heuristics.ts.cors-configured.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.dynamic-shell-invocation.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.env-default-fallback.ast',
    'heuristics.ts.error-logging-full-context.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.fs-access-callback.ast',
    'heuristics.ts.fs-access-sync.ast',
    'heuristics.ts.fs-append-file-callback.ast',
    'heuristics.ts.fs-append-file-sync.ast',
    'heuristics.ts.fs-chmod-callback.ast',
    'heuristics.ts.fs-chmod-sync.ast',
    'heuristics.ts.fs-chown-callback.ast',
    'heuristics.ts.fs-chown-sync.ast',
    'heuristics.ts.fs-close-callback.ast',
    'heuristics.ts.fs-close-sync.ast',
    'heuristics.ts.fs-copy-file-callback.ast',
    'heuristics.ts.fs-copy-file-sync.ast',
    'heuristics.ts.fs-cp-callback.ast',
    'heuristics.ts.fs-cp-sync.ast',
    'heuristics.ts.fs-exists-callback.ast',
    'heuristics.ts.fs-exists-sync.ast',
    'heuristics.ts.fs-fchmod-callback.ast',
    'heuristics.ts.fs-fchmod-sync.ast',
    'heuristics.ts.fs-fchown-callback.ast',
    'heuristics.ts.fs-fchown-sync.ast',
    'heuristics.ts.fs-fdatasync-callback.ast',
    'heuristics.ts.fs-fdatasync-sync.ast',
    'heuristics.ts.fs-fstat-callback.ast',
    'heuristics.ts.fs-fstat-sync.ast',
    'heuristics.ts.fs-fsync-callback.ast',
    'heuristics.ts.fs-fsync-sync.ast',
    'heuristics.ts.fs-ftruncate-callback.ast',
    'heuristics.ts.fs-ftruncate-sync.ast',
    'heuristics.ts.fs-futimes-callback.ast',
    'heuristics.ts.fs-futimes-sync.ast',
    'heuristics.ts.fs-lchmod-callback.ast',
    'heuristics.ts.fs-lchown-callback.ast',
    'heuristics.ts.fs-link-callback.ast',
    'heuristics.ts.fs-link-sync.ast',
    'heuristics.ts.fs-lstat-callback.ast',
    'heuristics.ts.fs-lstat-sync.ast',
    'heuristics.ts.fs-lutimes-callback.ast',
    'heuristics.ts.fs-lutimes-sync.ast',
    'heuristics.ts.fs-mkdir-callback.ast',
    'heuristics.ts.fs-mkdir-sync.ast',
    'heuristics.ts.fs-mkdtemp-callback.ast',
    'heuristics.ts.fs-mkdtemp-sync.ast',
    'heuristics.ts.fs-open-callback.ast',
    'heuristics.ts.fs-open-sync.ast',
    'heuristics.ts.fs-opendir-callback.ast',
    'heuristics.ts.fs-opendir-sync.ast',
    'heuristics.ts.fs-promises-access.ast',
    'heuristics.ts.fs-promises-append-file.ast',
    'heuristics.ts.fs-promises-chmod.ast',
    'heuristics.ts.fs-promises-chown.ast',
    'heuristics.ts.fs-promises-copy-file.ast',
    'heuristics.ts.fs-promises-cp.ast',
    'heuristics.ts.fs-promises-link.ast',
    'heuristics.ts.fs-promises-lstat.ast',
    'heuristics.ts.fs-promises-mkdir.ast',
    'heuristics.ts.fs-promises-mkdtemp.ast',
    'heuristics.ts.fs-promises-open.ast',
    'heuristics.ts.fs-promises-opendir.ast',
    'heuristics.ts.fs-promises-read-file.ast',
    'heuristics.ts.fs-promises-readdir.ast',
    'heuristics.ts.fs-promises-readlink.ast',
    'heuristics.ts.fs-promises-realpath.ast',
    'heuristics.ts.fs-promises-rename.ast',
    'heuristics.ts.fs-promises-rm.ast',
    'heuristics.ts.fs-promises-stat.ast',
    'heuristics.ts.fs-promises-symlink.ast',
    'heuristics.ts.fs-promises-unlink.ast',
    'heuristics.ts.fs-promises-utimes.ast',
    'heuristics.ts.fs-promises-write-file.ast',
    'heuristics.ts.fs-read-callback.ast',
    'heuristics.ts.fs-read-file-callback.ast',
    'heuristics.ts.fs-read-file-sync.ast',
    'heuristics.ts.fs-read-sync.ast',
    'heuristics.ts.fs-readdir-callback.ast',
    'heuristics.ts.fs-readdir-sync.ast',
    'heuristics.ts.fs-readlink-callback.ast',
    'heuristics.ts.fs-readlink-sync.ast',
    'heuristics.ts.fs-readv-callback.ast',
    'heuristics.ts.fs-readv-sync.ast',
    'heuristics.ts.fs-realpath-callback.ast',
    'heuristics.ts.fs-realpath-sync.ast',
    'heuristics.ts.fs-rename-callback.ast',
    'heuristics.ts.fs-rename-sync.ast',
    'heuristics.ts.fs-rm-callback.ast',
    'heuristics.ts.fs-rm-sync.ast',
    'heuristics.ts.fs-rmdir-callback.ast',
    'heuristics.ts.fs-rmdir-sync.ast',
    'heuristics.ts.fs-stat-callback.ast',
    'heuristics.ts.fs-stat-sync.ast',
    'heuristics.ts.fs-statfs-callback.ast',
    'heuristics.ts.fs-statfs-sync.ast',
    'heuristics.ts.fs-symlink-callback.ast',
    'heuristics.ts.fs-symlink-sync.ast',
    'heuristics.ts.fs-truncate-callback.ast',
    'heuristics.ts.fs-truncate-sync.ast',
    'heuristics.ts.fs-unlink-callback.ast',
    'heuristics.ts.fs-unlink-sync.ast',
    'heuristics.ts.fs-unwatch-file-callback.ast',
    'heuristics.ts.fs-utimes-callback.ast',
    'heuristics.ts.fs-utimes-sync.ast',
    'heuristics.ts.fs-watch-callback.ast',
    'heuristics.ts.fs-watch-file-callback.ast',
    'heuristics.ts.fs-write-callback.ast',
    'heuristics.ts.fs-write-file-callback.ast',
    'heuristics.ts.fs-write-file-sync.ast',
    'heuristics.ts.fs-write-sync.ast',
    'heuristics.ts.fs-writev-callback.ast',
    'heuristics.ts.fs-writev-sync.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.hardcoded-secret-token.ast',
    'heuristics.ts.hardcoded-values.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insecure-token-date-now.ast',
    'heuristics.ts.insecure-token-math-random.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.jwt-decode-without-verify.ast',
    'heuristics.ts.jwt-sign-no-expiration.ast',
    'heuristics.ts.jwt-verify-ignore-expiration.ast',
    'heuristics.ts.magic-numbers.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.no-sensitive-log.ast',
    'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast',
    'heuristics.ts.process-env-mutation.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.prometheus-prom-client.ast',
    'heuristics.ts.rate-limiting-throttler.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.tls-env-override.ast',
    'heuristics.ts.tls-reject-unauthorized-false.ast',
    'heuristics.ts.validation-config.ast',
    'heuristics.ts.validationpipe-global.ast',
    'heuristics.ts.vm-dynamic-code-execution.ast',
    'heuristics.ts.weak-crypto-hash.ast',
    'heuristics.ts.weak-token-randomuuid.ast',
    'heuristics.ts.winston-structured-json-logger.ast',
    'heuristics.ts.with-statement.ast',
  ]);
  assert.equal(extracted.every((finding) => finding.source === 'heuristics:ast'), true);
});

test('skips TypeScript heuristics for test files', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/domain/feature/file.spec.ts',
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const bcrypt = require("bcrypt"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const passwordHash = bcrypt.hashSync(apiToken, 8); const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); logger.warn({ password: apiToken, token: sessionToken }); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; const apiUrl = process.env.API_URL || "http://localhost:3000"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.length, 0);
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
          'DispatchQueue.main.async {}',
          'DispatchGroup()',
          'DispatchSemaphore(value: 1)',
          'OperationQueue()',
          'Task.detached { }',
          'final class LegacyViewModel: ObservableObject {}',
          '@preconcurrency import LegacyFramework',
          'nonisolated(unsafe) static var sharedBridge: LegacyViewModel?',
          'MainActor.assumeIsolated { reload() }',
          '@StateObject private var ownedViewModel = LegacyViewModel()',
          '@ObservedObject var injectedViewModel: LegacyViewModel',
          'GeometryReader { proxy in Text("layout").frame(width: proxy.size.width) }',
          'Text("headline").fontWeight(.bold)',
          'let filtered = items.filter { $0.title.contains(searchText) }',
          'ForEach(items.indices, id: \\.self) { index in Text(items[index].title) }',
          'NavigationView { Text("hello") }',
          'Text("primary").foregroundColor(.blue)',
          'Image("hero").cornerRadius(12)',
          'TabView { HomeView().tabItem { Label("Home", systemImage: "house") } }',
          'Text("tap").onTapGesture { }',
          'let title = String(format: "%d", 1)',
          'ScrollView(.vertical, showsIndicators: false) { Text("feed") }',
          '.sheet(isPresented: $showDetails) { DetailView() }',
          '.onChange(of: query) { newValue in print(newValue) }',
          'let width = UIScreen.main.bounds.width',
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
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ios.anyview.ast',
    'heuristics.ios.assume-isolated.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.contains-user-filter.ast',
    'heuristics.ios.corner-radius.ast',
    'heuristics.ios.dispatchgroup.ast',
    'heuristics.ios.dispatchqueue.ast',
    'heuristics.ios.dispatchsemaphore.ast',
    'heuristics.ios.font-weight-bold.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-unwrap.ast',
    'heuristics.ios.foreach-indices.ast',
    'heuristics.ios.foreground-color.ast',
    'heuristics.ios.geometryreader.ast',
    'heuristics.ios.legacy-onchange.ast',
    'heuristics.ios.legacy-swiftui-observable-wrapper.ast',
    'heuristics.ios.navigation-view.ast',
    'heuristics.ios.nonisolated-unsafe.ast',
    'heuristics.ios.observable-object.ast',
    'heuristics.ios.on-tap-gesture.ast',
    'heuristics.ios.operation-queue.ast',
    'heuristics.ios.passed-value-state-wrapper.ast',
    'heuristics.ios.preconcurrency.ast',
    'heuristics.ios.scrollview-shows-indicators.ast',
    'heuristics.ios.sheet-is-presented.ast',
    'heuristics.ios.string-format.ast',
    'heuristics.ios.tab-item.ast',
    'heuristics.ios.task-detached.ast',
    'heuristics.ios.uiscreen-main-bounds.ast',
    'heuristics.ios.unchecked-sendable.ast',
  ]);
});

test('detects backend guards heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/presentation/orders.controller.ts',
        'import { UseGuards } from "@nestjs/common"; import { JwtAuthGuard } from "./jwt-auth.guard"; @UseGuards(JwtAuthGuard) export class OrdersController { list() { return []; } }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.guards-useguards-jwtauthguard.ast',
  ]);
});

test('detects backend interceptors heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/presentation/orders.controller.ts',
        'import { UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common"; @UseInterceptors(ClassSerializerInterceptor) export class OrdersController { list() { return []; } }'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.interceptors-useinterceptors-logging-transform.ast',
  ]);
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
          '',
          'final class TodoEntity: NSManagedObject {}',
          '',
          'struct DetailView: View {',
          '  @Environment(\\.managedObjectContext) private var context',
          '  @State private var selectedEntity: TodoEntity?',
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
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctassert.ast'), true);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.xctunwrap.ast'), true);
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.wait-for-expectations.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.legacy-expectation-description.ast'),
    true
  );
  assert.equal(
    findings.some((finding) => finding.ruleId === 'heuristics.ios.testing.mixed-frameworks.ast'),
    true
  );
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
    findings.some((finding) => finding.ruleId === 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast'),
    true
  );
});

test('does not emit Swift Testing migration findings for compatible brownfield XCTest unit suites', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Tests/Mac/Presentation/LoginModelTests.spec.swift',
        [
          'import XCTest',
          '',
          'final class LoginModelTests: XCTestCase {',
          '  func test_submit_validCredentials_storesSession() async throws {',
          '    let (sut, repository) = makeSUT()',
          '    try await sut.submit()',
          '    XCTAssertEqual(repository.receivedRequests.count, 1)',
          '    let session = try XCTUnwrap(repository.savedSession)',
          '    XCTAssertEqual(session.userId, "buyer-1")',
          '  }',
          '',
          '  private func makeSUT(',
          '    file: StaticString = #filePath,',
          '    line: UInt = #line',
          '  ) -> (LoginModel, AuthRepositorySpy) {',
          '    let repository = AuthRepositorySpy()',
          '    let sut = LoginModel(repository: repository)',
          '    trackForMemoryLeaks(sut, testCase: self, file: file, line: line)',
          '    trackForMemoryLeaks(repository, testCase: self, file: file, line: line)',
          '    return (sut, repository)',
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
  const testingFindings = findings.filter((finding) =>
    finding.ruleId.startsWith('heuristics.ios.testing.')
  );

  assert.deepEqual(testingFindings.map((finding) => finding.ruleId), []);
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

test('detects semantic God Class heuristic for TypeScript backend production code', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/pumuki-god-class-canary.ts',
        [
          'export class PumukiBackendGodClassCanary {',
          '  private readonly prisma = new PrismaClient();',
          '',
          '  getOrder(id: string): string {',
          '    return id;',
          '  }',
          '',
          '  saveOrder(id: string): void {',
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
    (entry) => entry.ruleId === 'heuristics.ts.god-class-large-class.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiBackendGodClassCanary',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'query:getOrder', lines: [4] },
    { kind: 'member', name: 'command:saveOrder', lines: [8] },
    { kind: 'call', name: 'new PrismaClient', lines: [2] },
  ]);
  assert.match(finding.why ?? '', /God Class/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /colaboradores o casos de uso dedicados/i);
});

test('detects semantic God Class heuristic for TypeScript frontend production code', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/application/pumuki-god-class-canary.ts',
        [
          'export class PumukiFrontendGodClassCanary {',
          '  private readonly apollo = new ApolloClient();',
          '',
          '  getProfile(id: string): string {',
          '    return id;',
          '  }',
          '',
          '  saveProfile(id: string): void {',
          '    void id;',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.god-class-large-class.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.primary_node, {
    kind: 'class',
    name: 'PumukiFrontendGodClassCanary',
    lines: [1],
  });
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'query:getProfile', lines: [4] },
    { kind: 'member', name: 'command:saveProfile', lines: [8] },
    { kind: 'call', name: 'new ApolloClient', lines: [2] },
  ]);
  assert.match(finding.why ?? '', /God Class/i);
  assert.match(finding.impact ?? '', /múltiples razones de cambio/i);
  assert.match(finding.expected_fix ?? '', /colaboradores o casos de uso dedicados/i);
});

test('detects frontend React class component heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/components/LegacyCounter.tsx',
        [
          "import React from 'react';",
          '',
          'export class LegacyCounter extends React.Component {',
          '  render() {',
          '    return <div />;',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const finding = extracted.find(
    (entry) => entry.ruleId === 'heuristics.ts.react-class-component.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding.lines, [3]);
  assert.equal(finding.primary_node, undefined);
  assert.equal(finding.related_nodes, undefined);
  assert.equal(finding.why, undefined);
  assert.equal(finding.impact, undefined);
  assert.equal(finding.expected_fix, undefined);
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

test('detects semantic OCP heuristic for iOS coordinator switch over outcome', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Onboarding/LaunchFlowCoordinator.swift',
        [
          'public final class LaunchFlowCoordinator {',
          '  public func bootstrap() async {',
          '    let outcome = await appConfigurationUseCase.execute()',
          '    switch outcome {',
          '    case .mandatoryUpdate:',
          '      route = .updateRequired',
          '    case .maintenance:',
          '      route = .maintenance',
          '    case .proceed:',
          '      route = .home',
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
  assert.equal(finding.primary_node?.name, 'LaunchFlowCoordinator');
  assert.deepEqual(finding.related_nodes, [
    { kind: 'member', name: 'discriminator switch: outcome', lines: [4] },
    { kind: 'member', name: 'case .mandatoryUpdate', lines: [5] },
    { kind: 'member', name: 'case .maintenance', lines: [7] },
    { kind: 'member', name: 'case .proceed', lines: [9] },
  ]);
});

test('detects semantic SRP heuristic for XCTestCase suites with mixed responsibilities', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Tests/Mac/Presentation/LaunchFlowCoordinatorConfigTests.spec.swift',
        [
          'import XCTest',
          '',
          'final class LaunchFlowCoordinatorConfigTests: XCTestCase {',
          '  func test_bootstrap_whenMandatoryUpdate_routesToUpdateRequired() async {}',
          '  func test_bootstrap_whenSessionIsValid_routesHome() async {}',
          '  func test_completeOnboarding_marksProgressAndRoutesToLogin() async {}',
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
  assert.equal(finding.code, 'HEURISTICS_IOS_SOLID_SRP_XCTEST_MIXED_RESPONSIBILITIES_AST');
  assert.equal(finding.primary_node?.name, 'LaunchFlowCoordinatorConfigTests');
  assert.match(finding.why ?? '', /XCTestCase|SRP/);
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
        [
          'Thread.sleep(10)',
          'GlobalScope.launch { }',
          'runBlocking { }',
          'val name = user!!.name',
          'val title = "Hola mundo"',
          'Log.d("prod log")',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/TimberLogger.kt',
        [
          'import timber.log.Timber',
          '',
          'fun log(message: String) {',
          '  Timber.d(message)',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/concurrency/SupervisorScopeManager.kt',
        [
          'import kotlinx.coroutines.async',
          'import kotlinx.coroutines.launch',
          '',
          'suspend fun loadDashboard() = supervisorScope {',
          '  val summary = async { loadSummary() }',
          '  launch { refreshCache() }',
          '  summary.await()',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/ui/TouchTargetButton.kt',
        [
          '@Composable fun TouchTargetButton(title: String) {',
          '  IconButton(',
          '    onClick = {},',
          '    modifier = Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)',
          '  ) {',
          '    Text(title)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/OrderDao.kt',
        [
          '@Dao',
          'interface OrderDao {',
          '  @Transaction',
          '  fun loadOrderGraph(): Order',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/SessionStore.kt',
        [
          'object SessionStore {',
          '  fun refresh() {}',
          '}',
          '',
          'class HomeRepository private constructor() {',
          '  companion object {',
          '    @Volatile private var INSTANCE: HomeRepository? = null',
          '',
          '    fun getInstance(): HomeRepository {',
          '      return INSTANCE ?: HomeRepository()',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/LegacyActivity.java',
        ['package com.acme;', 'public class LegacyActivity {}'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/LegacyLoader.java',
        [
          'package com.acme;',
          'import android.os.AsyncTask;',
          'public class LegacyLoader extends AsyncTask<Void, Void, String> {}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/HomeActivity.kt',
        [
          'import android.widget.TextView',
          'class HomeActivity : AppCompatActivity() {',
          '  fun render() {',
          '    val title = findViewById<TextView>(R.id.title)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/RxRepository.kt',
        [
          'import io.reactivex.rxjava3.core.Observable',
          'class RxRepository {',
          '  fun load() = Observable.just("ok")',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/CoroutineDispatcher.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'suspend fun load() = withContext(Dispatchers.IO) { "ok" }',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/WithContextRepository.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'class WithContextRepository {',
          '  suspend fun load() = withContext(Dispatchers.Main) { "ok" }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/CoroutineTryCatch.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'suspend fun load() {',
          '  try {',
          '    withContext(Dispatchers.IO) { "ok" }',
          '  } catch (e: Exception) {',
          '    throw e',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/FeatureTest.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }', 'val name = user!!.name'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/LegacyActivityTest.java',
        ['package com.acme;', 'public class LegacyActivityTest {}'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/LegacyLoaderTest.java',
        [
          'package com.acme;',
          'import android.os.AsyncTask;',
          'public class LegacyLoaderTest extends AsyncTask<Void, Void, String> {}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/HomeActivityTest.kt',
        [
          'import android.widget.TextView',
          'class HomeActivityTest : AppCompatActivity() {',
          '  fun render() {',
          '    val title = findViewById<TextView>(R.id.title)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/kotlin/com/acme/RxRepositoryTest.kt',
        [
          'import io.reactivex.rxjava3.core.Observable',
          'class RxRepositoryTest {',
          '  fun load() = Observable.just("ok")',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/kotlin/com/acme/CoroutineDispatcherTest.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'suspend fun load() = withContext(Dispatchers.IO) { "ok" }',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/kotlin/com/acme/WithContextRepositoryTest.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'class WithContextRepositoryTest {',
          '  suspend fun load() = withContext(Dispatchers.Main) { "ok" }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/kotlin/com/acme/CoroutineTryCatchTest.kt',
        [
          'import kotlinx.coroutines.Dispatchers',
          'import kotlinx.coroutines.withContext',
          'suspend fun load() {',
          '  try {',
          '    withContext(Dispatchers.IO) { "ok" }',
          '  } catch (e: Exception) {',
          '    throw e',
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
    'heuristics.android.asynctask-deprecated.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast',
    'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast',
    'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast',
    'heuristics.android.findviewbyid.ast',
    'heuristics.android.force-unwrap.ast',
    'heuristics.android.globalscope.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.java-source.ast',
    'heuristics.android.java-source.ast',
    'heuristics.android.no-console-log.ast',
    'heuristics.android.no-singleton.ast',
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.rxjava-new-code.ast',
    'heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast',
    'heuristics.android.suspend-functions-para-operaciones-async.ast',
    'heuristics.android.thread-sleep.ast',
    'heuristics.android.timber-logging-library.ast',
    'heuristics.android.touch-targets-mi-nimo-48dp.ast',
    'heuristics.android.transaction-para-operaciones-multi-query.ast',
    'heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast',
    'heuristics.android.withcontext-change-dispatcher.ast',
    'heuristics.android.withcontext-change-dispatcher.ast',
    'heuristics.android.withcontext-change-dispatcher.ast',
  ]);
});

test('detects Android BuildConfig heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/BuildInfo.kt',
        [
          'fun versionName(): String {',
          '  return BuildConfig.VERSION_NAME',
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
    'heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast',
  ]);
});

test('detects Android adaptive layouts heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/ui/ResponsiveScreen.kt',
        [
          'fun ResponsiveScreen(activity: Activity) {',
          '  val windowSizeClass = calculateWindowSizeClass(activity)',
          '  when (windowSizeClass.widthSizeClass) {',
          '    WindowWidthSizeClass.Compact -> Unit',
          '    WindowWidthSizeClass.Medium -> Unit',
          '    WindowWidthSizeClass.Expanded -> Unit',
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
    'heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast',
  ]);
});

test('detects Android existing structure heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/architecture/SessionModule.kt',
        [
          'interface SessionContract {',
          '  fun load(): String',
          '}',
          '',
          '@Module',
          '@InstallIn(SingletonComponent::class)',
          'object SessionModule',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast',
  ]);
});

test('detects Android existing structure heuristics in gradle production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/build.gradle.kts',
        [
          'dependencies {',
          '  implementation(libs.androidx.core.ktx)',
          '  api(libs.core.domain)',
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
    'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast',
  ]);
});

test('detects Android strings.xml localization heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/res/values-es/strings.xml',
        [
          '<resources>',
          '  <string name="app_name">Mi App</string>',
          '  <string-array name="onboarding_steps">',
          '    <item>Bienvenido</item>',
          '  </string-array>',
          '</resources>',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast',
  ]);
});

test('detects Android plurals.xml heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/res/values-es/plurals.xml',
        [
          '<resources>',
          '  <plurals name="notification_count">',
          '    <item quantity="one">1 notificación</item>',
          '    <item quantity="other">%d notificaciones</item>',
          '  </plurals>',
          '</resources>',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);

  assert.deepEqual(toRuleIds(findings), ['heuristics.android.plurals-values-plurals-xml.ast']);
});

test('detects Android Binds heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/di/NetworkModule.kt',
        [
          'import dagger.Binds',
          'import dagger.Module',
          'import dagger.hilt.InstallIn',
          'import dagger.hilt.components.SingletonComponent',
          '',
          '@Module',
          '@InstallIn(SingletonComponent::class)',
          'abstract class NetworkModule {',
          '  @Binds',
          '  abstract fun bindRepository(impl: RepositoryImpl): Repository',
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
    'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast',
  ]);
});

test('detects Android Provides heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/di/NetworkModule.kt',
        [
          'import dagger.Module',
          'import dagger.Provides',
          'import dagger.hilt.InstallIn',
          'import dagger.hilt.components.SingletonComponent',
          '',
          '@Module',
          '@InstallIn(SingletonComponent::class)',
          'abstract class NetworkModule {',
          '  @Provides',
          '  fun provideRepository(): Repository = RepositoryImpl()',
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
    'heuristics.android.provides-para-interfaces-o-third-party.ast',
  ]);
});

test('detects Android Compose and single-activity heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/HomeScreen.kt',
        [
          '@Composable',
          'fun HomeScreen() {',
          '  Box(modifier = Modifier)',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/MainActivity.kt',
        [
          'class MainActivity : ComponentActivity() {',
          '  override fun onCreate(savedInstanceState: Bundle?) {',
          '    super.onCreate(savedInstanceState)',
          '    setContent {',
          '      NavHost(navController = rememberNavController(), startDestination = homeRoute()) { }',
          '    }',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/GodActivity.kt',
        [
          'class GodActivity : ComponentActivity() {',
          '  override fun onCreate(savedInstanceState: Bundle?) {',
          '    super.onCreate(savedInstanceState)',
          '    setContent {',
          '      GodScreen()',
          '    }',
          '  }',
          '}',
          '',
          '@Composable',
          'fun GodScreen() {',
          '  Box(modifier = Modifier)',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.god-activities-single-activity-composables.ast',
    'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
  ]);
});

test('detects Android coroutine callback heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/network/RemoteCatalogRepository.kt',
        [
          'class RemoteCatalogRepository {',
          '  fun loadRemoteData() {',
          '    service.enqueue()',
          '    task.addOnSuccessListener { }',
          '    task.addOnCompleteListener { }',
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
    'heuristics.android.coroutines-async-await-no-callbacks.ast',
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
  ]);
});

test('detects backend DTO validation heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/users/CreateUserDto.ts',
        [
          "import { IsEmail, IsString } from 'class-validator';",
          "import { Exclude, Transform } from 'class-transformer';",
          '',
          'export class CreateUserDto {',
          '  @IsEmail()',
          '  email!: string;',
          '',
          '  @IsString()',
          '  name!: string;',
          '}',
          '',
          'export class UserResponseDto {',
          '  @Exclude()',
          '  password!: string;',
          '',
          '  @Transform(({ value }) => value.trim())',
          '  displayName!: string;',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.class-transformer-decorators.ast',
    'heuristics.ts.class-validator-decorators.ast',
  ]);
});

test('detects backend DTO boundary heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/users/CreateUserDto.ts',
        [
          'export class CreateUserDto {',
          '  email!: string;',
          '  name!: string;',
          '}',
          '',
          'export class UserResponseDto {',
          '  id!: string;',
          '  displayName!: string;',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast',
  ]);
});

test('detects backend separated DTO heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/orders/OrderDto.ts',
        [
          'export class CreateOrderDto {}',
          '',
          'export class UpdateOrderDto {}',
          '',
          'export class OrderResponseDto {}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast',
  ]);
});

test('detects backend return DTO heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/orders/OrderService.ts',
        [
          'export class OrderEntity {}',
          'export class OrderResponseDto {}',
          '',
          'export class OrderService {',
          '  findOrder(): Promise<OrderEntity> {',
          '    const orderEntity = new OrderEntity();',
          '    return orderEntity;',
          '  }',
          '',
          '  toResponse(): Promise<OrderResponseDto> {',
          '    return Promise.resolve(new OrderResponseDto());',
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
    (entry) => entry.ruleId === 'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast'
  );

  assert.ok(finding);
  assert.deepEqual(finding?.lines, [5, 7]);
  assert.equal(finding?.primary_node, undefined);
  assert.equal(finding?.related_nodes, undefined);
  assert.equal(finding?.why, undefined);
  assert.equal(finding?.impact, undefined);
  assert.equal(finding?.expected_fix, undefined);
});

test('detects backend transaction heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/infrastructure/orders/OrderRepository.ts',
        [
          'export class OrderRepository {',
          '  async persist(dataSource: DataSource) {',
          '    return dataSource.transaction(async (manager) => {',
          '      await manager.save(orderEntity);',
          '      await manager.update(OrderEntity, orderEntity.id, orderEntity);',
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

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast',
    'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast',
  ]);
});

test('detects backend input validation heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/presentation/orders.controller.ts',
        [
          'import { Body, Controller, Post } from "@nestjs/common";',
          'import { CreateOrderDto } from "../application/orders/CreateOrderDto";',
          '',
          '@Controller("orders")',
          'export class OrdersController {',
          '  @Post()',
          '  create(@Body() createOrderDto: CreateOrderDto) {',
          '    return createOrderDto;',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'common.network.missing_error_handling',
    'heuristics.ts.input-validation-siempre-validar-con-dtos.ast',
  ]);
});

test('detects backend nested validation heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/application/orders/CreateOrderDto.ts',
        [
          'import { Type } from "class-transformer";',
          'import { ValidateNested } from "class-validator";',
          '',
          'export class CreateOrderDto {',
          '  @ValidateNested()',
          '  @Type(() => AddressDto)',
          '  address!: AddressDto;',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.nested-validation-validatenested-type.ast',
  ]);
});

test('detects backend API versioning heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/presentation/orders.controller.ts',
        [
          'import { Controller, Get, Version } from "@nestjs/common";',
          '',
          '@Controller("orders")',
          'export class OrdersController {',
          '  @Get()',
          '  @Version("2")',
          '  list() {',
          '    return [];',
          '  }',
          '}',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'common.network.missing_error_handling',
    'heuristics.ts.versionado-api-v1-api-v2.ast',
  ]);
});

test('detects Android StateFlow heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/CatalogViewModel.kt',
        [
          'class CatalogViewModel : ViewModel() {',
          '  private val _uiState = MutableStateFlow(CatalogUiState())',
          '  val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()',
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
    'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast',
    'heuristics.android.stateflow-estado-mutable-observable.ast',
    'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
    'heuristics.android.viewmodel-sobrevive-configuration-changes.ast',
  ]);
});

test('detects Android SharedFlow heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/CatalogViewModel.kt',
        [
          'class CatalogViewModel : ViewModel() {',
          '  private val _events = MutableSharedFlow<UiEvent>()',
          '  val events: SharedFlow<UiEvent> = _events.asSharedFlow()',
          '',
          '  fun onRetry() {',
          '    _events.tryEmit(UiEvent.Retry)',
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
    'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast',
    'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
    'heuristics.android.viewmodel-sobrevive-configuration-changes.ast',
  ]);
});

test('detects Android Flow builders heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/data/CatalogFlowSource.kt',
        [
          'import kotlinx.coroutines.flow.Flow',
          'import kotlinx.coroutines.flow.asFlow',
          '',
          'fun observeCatalog(): Flow<List<Int>> = flow {',
          '  emit(listOf(1))',
          '}',
          '',
          'val flowValues = flowOf(1, 2, 3)',
          'val stream = listOf(4, 5).asFlow()',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.flow-builders-flow-emit-flowof-asflow.ast',
  ]);
});

test('detects Android Flow collect heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/CatalogObserver.kt',
        [
          'import kotlinx.coroutines.CoroutineScope',
          'import kotlinx.coroutines.flow.Flow',
          '',
          'fun observeCatalog(scope: CoroutineScope, flow: Flow<List<Int>>) {',
          '  flow.collect { items -> render(items) }',
          '  flow.collectLatest { items -> renderLatest(items) }',
          '  flow.launchIn(scope)',
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
    'heuristics.android.collect-terminal-operator-para-consumir-flow.ast',
  ]);
});

test('detects Android collectAsState heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/CatalogScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.lifecycle.compose.collectAsStateWithLifecycle',
          '',
          '@Composable fun CatalogScreen(viewModel: CatalogViewModel) {',
          '  val state by viewModel.uiState.collectAsState()',
          '  val lifecycleState by viewModel.uiState.collectAsStateWithLifecycle()',
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
    'heuristics.android.collect-as-state-consumir-flow-en-compose.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
  ]);
});

test('detects Android remember heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/ChartScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.remember',
          '@Composable fun ChartScreen() {',
          '  val formatter = remember { java.time.Clock.systemUTC() }',
          '  Text(text = formatter.toString())',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.remember-evitar-recrear-objetos.ast',
    'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast',
  ]);
});

test('detects Android derivedStateOf heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/SearchScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.derivedStateOf',
          '@Composable fun SearchScreen(query: String) {',
          '  val hasQuery = derivedStateOf { query.isNotBlank() }',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast',
    'heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast',
  ]);
});

test('detects Android LaunchedEffect heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/DetailsScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.LaunchedEffect',
          '@Composable fun DetailsScreen(viewModel: DetailsViewModel) {',
          '  LaunchedEffect(viewModel.selectedId) {',
          '    viewModel.refresh()',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.launchedeffect-side-effects-con-lifecycle.ast',
  ]);
});

test('detects Android LaunchedEffect keys heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/DetailsScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.LaunchedEffect',
          '@Composable fun DetailsScreen(viewModel: DetailsViewModel) {',
          '  LaunchedEffect(viewModel.selectedId, viewModel.refreshTrigger) {',
          '    viewModel.refresh()',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast',
  ]);
});

test('detects Android DisposableEffect heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/DisposableScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.DisposableEffect',
          '@Composable fun DisposableScreen() {',
          '  DisposableEffect(Unit) {',
          '    onDispose { }',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast',
  ]);
});

test('detects Android Preview heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/PreviewScreen.kt',
        [
          'data class PreviewUiState(val label: String)',
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.ui.tooling.preview.Preview',
          '',
          '@Preview(showBackground = true)',
          '@Composable fun PreviewScreen(state: PreviewUiState) {',
          '  Text(text = state.label)',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast',
  ]);
});

test('detects Android Theme heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/AppTheme.kt',
        [
          'import androidx.compose.material3.MaterialTheme',
          'import androidx.compose.runtime.Composable',
          '',
          '@Composable fun AppTheme(content: @Composable () -> Unit) {',
          '  MaterialTheme(',
          '    colorScheme = darkColorScheme(),',
          '    typography = AppTypography,',
          '    shapes = AppShapes,',
          '    content = content',
          '  )',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.theme-color-scheme-typography-shapes.ast',
  ]);
});

test('detects Android Dark theme heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/AppTheme.kt',
        [
          'import androidx.compose.material3.MaterialTheme',
          'import androidx.compose.runtime.Composable',
          '',
          '@Composable fun AppTheme(content: @Composable () -> Unit) {',
          '  val darkTheme = isSystemInDarkTheme()',
          '  val colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme()',
          '  MaterialTheme(',
          '    colorScheme = colorScheme',
          '    typography = AppTypography,',
          '    shapes = AppShapes,',
          '    content = content',
          '  )',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast',
    'heuristics.android.theme-color-scheme-typography-shapes.ast',
  ]);
});

test('detects Android text scaling heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/ScaledTextScreen.kt',
        [
          'import androidx.compose.material3.Text',
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.ui.platform.LocalDensity',
          'import androidx.compose.ui.unit.sp',
          '',
          '@Composable fun ScaledTextScreen(label: String) {',
          '  val fontScale = LocalDensity.current.fontScale',
          '  Text(label, fontSize = 16.sp)',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast',
  ]);
});

test('detects Android accessibility heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/AccessibleIconScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.ui.Modifier',
          '',
          '@Composable fun AccessibleIconScreen(semanticsLabel: String) {',
          '  Box(modifier = Modifier.semantics { })',
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
    'heuristics.android.accessibility-semantics-contentdescription.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.talkback-screen-reader-de-android.ast',
  ]);
});

test('detects Android contentDescription heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/SettingsButton.kt',
        [
          'import androidx.compose.runtime.Composable',
          '',
          '@Composable fun SettingsButton(description: String) {',
          '  Icon(',
          '    imageVector = Icons.Default.Settings,',
          '    contentDescription = description',
          '  )',
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
    'heuristics.android.accessibility-semantics-contentdescription.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.contentdescription-para-ima-genes-y-botones.ast',
    'heuristics.android.talkback-screen-reader-de-android.ast',
  ]);
});

test('detects Android TalkBack heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/AccessibleIconScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.ui.Modifier',
          '',
          '@Composable fun AccessibleIconScreen() {',
          '  Box(modifier = Modifier.semantics { })',
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
    'heuristics.android.accessibility-semantics-contentdescription.ast',
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.talkback-screen-reader-de-android.ast',
  ]);
});

test('detects Android recomposition heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/CounterScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.mutableStateOf',
          '@Composable fun CounterScreen(viewModel: CounterViewModel) {',
          '  println(viewModel.counter.value)',
          '  viewModel.counter.value = viewModel.counter.value + 1',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast',
  ]);
});

test('detects Android skip recomposition heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/FeedScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import kotlinx.collections.immutable.ImmutableList',
          '',
          '@Composable fun FeedScreen(items: ImmutableList<FeedItem>) {',
          '  FeedList(items = items)',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast',
  ]);
});

test('detects Android stability heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/FeedScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.Immutable',
          'import androidx.compose.runtime.Stable',
          '',
          '@Stable',
          'class PlaybackState(val isPlaying: Boolean)',
          '',
          '@Immutable',
          'data class FeedUiState(val title: String)',
          '',
          '@Composable fun FeedScreen(state: FeedUiState, playback: PlaybackState) {',
          '  FeedList(state = state, playback = playback)',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.stability-composables-estables-recomponen-menos.ast',
  ]);
});

test('detects Android state hoisting heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/ui/CounterScreen.kt',
        [
          'import androidx.compose.runtime.Composable',
          'import androidx.compose.runtime.mutableStateOf',
          'import androidx.compose.runtime.rememberSaveable',
          '@Composable fun CounterScreen() {',
          '  var count by rememberSaveable { mutableStateOf(0) }',
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
    'heuristics.android.composable-functions-composable-para-ui.ast',
    'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast',
  ]);
});

test('detects Android repository heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/data/CatalogRepository.kt',
        [
          'class CatalogRepository(',
          '  private val api: CatalogApi,',
          '  private val cache: CatalogCache,',
          ') {',
          '  suspend fun loadCatalog(): List<String> = api.loadCatalog()',
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
    'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast',
  ]);
});

test('detects Android ViewModel heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/presentation/CatalogViewModel.kt',
        [
          'import androidx.lifecycle.ViewModel',
          'class CatalogViewModel : ViewModel()',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast',
    'heuristics.android.viewmodel-sobrevive-configuration-changes.ast',
  ]);
});

test('detects Android suspend functions in API service heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/catalog/network/CatalogApiService.kt',
        [
          'interface CatalogApiService {',
          '  suspend fun fetchCatalog(): List<String>',
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
    'heuristics.android.suspend-functions-en-api-service.ast',
  ]);
});

test('detects Android suspend functions async heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/dashboard/DashboardCoordinator.kt',
        [
          'class DashboardCoordinator {',
          '  suspend fun loadDashboard(): Unit = Unit',
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
    'heuristics.android.suspend-functions-para-operaciones-async.ast',
  ]);
});

test('detects Android async-await parallelism heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/reports/ReportCoordinator.kt',
        [
          'import kotlinx.coroutines.async',
          'import kotlinx.coroutines.awaitAll',
          'class ReportCoordinator {',
          '  fun buildReport() {',
          '    val summary = async { loadSummary() }',
          '    val details = async { loadDetails() }',
          '    awaitAll(summary, details)',
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
    'heuristics.android.async-await-paralelismo.ast',
  ]);
});

test('detects Android arguments heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/navigation/OrderDetailCoordinator.kt',
        [
          'import androidx.navigation.NavController',
          'import androidx.lifecycle.SavedStateHandle',
          'class OrderDetailCoordinator(',
          '  private val navController: NavController,',
          '  private val savedStateHandle: SavedStateHandle,',
          '  private val orderIdKey: String,',
          ') {',
          '  val orderId = checkNotNull(savedStateHandle[orderIdKey])',
          '  fun openDetails(route: String) {',
          '    navController.navigate(route)',
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
    'heuristics.android.arguments-pasar-datos-entre-pantallas.ast',
  ]);
});

test('detects Android version catalogs heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/gradle/libs.versions.toml',
        [
          '[versions]',
          'agp = "8.5.2"',
          '',
          '[libraries]',
          'androidx-core = { module = "androidx.core:core-ktx", version.ref = "agp" }',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast',
  ]);
});

test('detects Android WorkManager dependency heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/gradle/build.gradle.kts',
        [
          'dependencies {',
          '  implementation("androidx.work:work-runtime-ktx:2.9.1")',
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
    'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast',
    'heuristics.android.hardcoded-strings.ast',
    'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast',
  ]);
});

test('detects Android WorkManager worker heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/sync/SyncWorker.kt',
        [
          'import android.content.Context',
          'import androidx.work.CoroutineWorker',
          'import androidx.work.WorkerParameters',
          '',
          'class SyncWorker(',
          '  appContext: Context,',
          '  workerParams: WorkerParameters,',
          ') : CoroutineWorker(appContext, workerParams) {',
          '  override suspend fun doWork(): Result {',
          '    return Result.success()',
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
    'heuristics.android.workmanager-background-tasks.ast',
  ]);
});

test('detects Android analytics heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/analytics/PurchaseAnalytics.kt',
        [
          'import com.google.firebase.analytics.FirebaseAnalytics',
          '',
          'class PurchaseAnalytics(private val firebaseAnalytics: FirebaseAnalytics) {',
          '  fun trackPurchase(eventName: String) {',
          '    firebaseAnalytics.trackEvent(eventName)',
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
    'heuristics.android.analytics-firebase-analytics-o-custom.ast',
  ]);
});

test('detects Android profiler heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/performance/CheckoutProfiler.kt',
        [
          'import android.os.Debug',
          '',
          'class CheckoutProfiler {',
          '  fun traceStartup() {',
          '    Debug.startMethodTracing()',
          '    Debug.stopMethodTracing()',
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
    'heuristics.android.android-profiler-cpu-memory-network-profiling.ast',
  ]);
});

test('detects Android baseline profiles heuristics in androidTest path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/src/androidTest/kotlin/com/acme/performance/StartupBaselineProfileTest.kt',
        [
          'import androidx.benchmark.macro.junit4.BaselineProfileRule',
          '',
          'class StartupBaselineProfileTest {',
          '  @get:Rule',
          '  val baselineProfileRule = BaselineProfileRule()',
          '',
          '  @Test',
          '  fun generateBaselineProfile() {',
          '    baselineProfileRule.collect(',
          '      packageName = "com.acme.app"',
          '    ) {',
          '      startActivityAndWait()',
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

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast',
  ]);
});

test('detects Android single activity heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/kotlin/com/acme/MainActivity.kt',
        [
          'class MainActivity : ComponentActivity() {',
          '  override fun onCreate(savedInstanceState: Bundle?) {',
          '    super.onCreate(savedInstanceState)',
          '    setContent {',
          '      NavHost(navController = rememberNavController(), startDestination = homeRoute()) { }',
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

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
  ]);
});

test('detects Android instrumented tests heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/src/androidTest/kotlin/com/acme/catalog/CatalogInstrumentedTest.kt',
        [
          '@RunWith(AndroidJUnit4::class)',
          'class CatalogInstrumentedTest {',
          '  @Test fun launchesActivity() {',
          '    ActivityScenario.launch(MainActivity::class.java)',
          '    InstrumentationRegistry.getInstrumentation()',
          '    onView(withId(R.id.title)).check(matches(isDisplayed()))',
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
    'heuristics.android.androidtest-instrumented-tests-device-emulator.ast',
  ]);
});

test('detects Android test structure heuristics in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/android/src/androidTest/kotlin/com/acme/catalog/CatalogAaaTest.kt',
        [
          'class CatalogAaaTest {',
          '  @Test',
          '  fun savesCatalog() {',
          '    // Arrange',
          '    val repository = FakeRepository()',
          '    // Act',
          '    val result = repository.save()',
          '    // Assert',
          '    assertTrue(result)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/src/androidTest/kotlin/com/acme/catalog/CatalogBddTest.kt',
        [
          'class CatalogBddTest {',
          '  @Test',
          '  fun savesCatalog() {',
          '    // Given',
          '    val repository = FakeRepository()',
          '    // When',
          '    val result = repository.save()',
          '    // Then',
          '    assertTrue(result)',
          '  }',
          '}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/android/src/test/kotlin/com/acme/catalog/CatalogRepositoryTest.kt',
        [
          'class CatalogRepositoryTest {',
          '  @Test',
          '  fun loadsCatalog() {',
          '    assertTrue(true)',
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
    'heuristics.android.aaa-pattern-arrange-act-assert.ast',
    'heuristics.android.given-when-then-bdd-style.ast',
    'heuristics.android.test-unit-tests-jvm.ast',
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

test('detects console.log with semantic payload in TypeScript facts', () => {
  const previousScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE;
  process.env.PUMUKI_HEURISTICS_TS_SCOPE = 'all';

  try {
    const extracted = extractHeuristicFacts({
      facts: [
        fileContentFact(
          'core/domain/service.ts',
          'function renderAuditTrail(value: string) { console.log(value); }'
        ),
      ],
      detectedPlatforms: {},
    });

    const findings = evaluateRules(astHeuristicsRuleSet, extracted);
    const finding = findings.find((entry) => entry.ruleId === 'heuristics.ts.console-log.ast');

    assert.ok(finding);
    assert.deepEqual(finding?.primary_node, {
      kind: 'member',
      name: 'renderAuditTrail',
      lines: [1],
    });
    assert.deepEqual(finding?.related_nodes, [
      { kind: 'call', name: 'console.log', lines: [1] },
    ]);
    assert.match(finding?.why ?? '', /console\.log/i);
    assert.match(finding?.impact ?? '', /logs de producci/i);
    assert.match(finding?.expected_fix ?? '', /logger|traza/i);
  } finally {
    if (typeof previousScope === 'string') {
      process.env.PUMUKI_HEURISTICS_TS_SCOPE = previousScope;
    } else {
      delete process.env.PUMUKI_HEURISTICS_TS_SCOPE;
    }
  }
});

test('detects explicit any with semantic payload in TypeScript facts', () => {
  const previousScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE;
  process.env.PUMUKI_HEURISTICS_TS_SCOPE = 'all';

  try {
    const extracted = extractHeuristicFacts({
      facts: [
        fileContentFact(
          'apps/backend/src/domain/service.ts',
          'function parsePayload(payload: any) { return payload; }'
        ),
      ],
      detectedPlatforms: {},
    });

    const findings = evaluateRules(astHeuristicsRuleSet, extracted);
    const finding = findings.find((entry) => entry.ruleId === 'heuristics.ts.explicit-any.ast');

    assert.ok(finding);
    assert.deepEqual(finding?.primary_node, {
      kind: 'member',
      name: 'parsePayload',
      lines: [1],
    });
    assert.deepEqual(finding?.related_nodes, [
      { kind: 'member', name: 'explicit any', lines: [1] },
    ]);
    assert.match(finding?.why ?? '', /any/i);
    assert.match(finding?.impact ?? '', /regresiones|tipad/i);
    assert.match(finding?.expected_fix ?? '', /unknown|gen[eé]rico/i);
  } finally {
    if (typeof previousScope === 'string') {
      process.env.PUMUKI_HEURISTICS_TS_SCOPE = previousScope;
    } else {
      delete process.env.PUMUKI_HEURISTICS_TS_SCOPE;
    }
  }
});

test('detects empty catch with semantic payload in TypeScript facts', () => {
  const previousScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE;
  process.env.PUMUKI_HEURISTICS_TS_SCOPE = 'all';

  try {
    const extracted = extractHeuristicFacts({
      facts: [
        fileContentFact(
          'apps/backend/src/domain/service.ts',
          'function processOrder() { try { work(); } catch {} }'
        ),
      ],
      detectedPlatforms: {},
    });

    const findings = evaluateRules(astHeuristicsRuleSet, extracted);
    const finding = findings.find((entry) => entry.ruleId === 'heuristics.ts.empty-catch.ast');

    assert.ok(finding);
    assert.deepEqual(finding?.primary_node, {
      kind: 'member',
      name: 'processOrder',
      lines: [1],
    });
    assert.deepEqual(finding?.related_nodes, [
      { kind: 'member', name: 'empty catch', lines: [1] },
    ]);
    assert.match(finding?.why ?? '', /catch vac[ií]o/i);
    assert.match(finding?.impact ?? '', /producci[oó]n|observabilidad/i);
    assert.match(finding?.expected_fix ?? '', /registra|propaga|documenta/i);
  } finally {
    if (typeof previousScope === 'string') {
      process.env.PUMUKI_HEURISTICS_TS_SCOPE = previousScope;
    } else {
      delete process.env.PUMUKI_HEURISTICS_TS_SCOPE;
    }
  }
});

test('detects clean architecture with semantic payload in TypeScript facts', () => {
  const previousScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE;
  process.env.PUMUKI_HEURISTICS_TS_SCOPE = 'all';

  try {
    const extracted = extractHeuristicFacts({
      facts: [
        fileContentFact(
          'apps/backend/src/application/order.service.ts',
          [
            'import { PrismaClient } from "@prisma/client";',
            'export class OrderService {',
            '  private readonly client = new PrismaClient();',
            '  createOrder() { return this.client.order.create({ data: {} }); }',
            '}',
          ].join('\n')
        ),
      ],
      detectedPlatforms: {},
    });

    const findings = evaluateRules(astHeuristicsRuleSet, extracted);
    const finding = findings.find((entry) => entry.ruleId === 'heuristics.ts.clean-architecture.ast');

    assert.ok(finding);
    assert.deepEqual(finding?.primary_node, {
      kind: 'class',
      name: 'OrderService',
      lines: [2],
    });
    assert.deepEqual(finding?.related_nodes, [
      { kind: 'member', name: 'import:@prisma/client', lines: [1] },
      { kind: 'call', name: 'new PrismaClient', lines: [3] },
    ]);
    assert.match(finding?.why ?? '', /Clean Architecture/i);
    assert.match(finding?.impact ?? '', /direcci[oó]n de dependencias|acopl/i);
    assert.match(finding?.expected_fix ?? '', /puerto|abstracci/i);
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
  assert.deepEqual(emptyCatchFact?.lines, [1, 4]);
  assert.deepEqual(commonEmptyCatchFact?.lines, [1, 4]);
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

test('extracts typed heuristic facts with expected metadata', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const bcrypt = require("bcrypt"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.equal(extracted.length, 152);
  assert.equal(extracted.every((fact) => fact.kind === 'Heuristic'), true);
  assert.equal(extracted.every((fact) => fact.source === 'heuristics:ast'), true);
});

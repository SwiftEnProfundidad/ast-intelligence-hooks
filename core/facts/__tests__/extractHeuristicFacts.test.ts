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
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); const prismaClient = new PrismaClient(); const prismaPkg = require("@prisma/client"); interface AccountPort { findById(id: string): string; saveProfile(id: string): void; } class AccountService { findById() { return "ok"; } saveProfile() { return "ok"; } } function resolveByKind(entity: any) { switch (entity.kind) { case "reservation": return 1; case "zbe": return 2; default: return 0; } } class BaseHandler { run() { return 0; } } class ExtendedHandler extends BaseHandler { override run() { throw new Error("Not implemented"); } } debugger;'
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
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insecure-token-date-now.ast',
    'heuristics.ts.insecure-token-math-random.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.jwt-decode-without-verify.ast',
    'heuristics.ts.jwt-sign-no-expiration.ast',
    'heuristics.ts.jwt-verify-ignore-expiration.ast',
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
        'const cp = require("child_process"); const fs = require("fs"); const crypto = require("crypto"); const jwt = require("jsonwebtoken"); const jsonwebtoken = require("jsonwebtoken"); const vm = require("vm"); const value: any = 1; const apiToken = "sk_test_1234567890abcdef"; const sessionToken = Math.random().toString(36).slice(2); const authToken = Date.now().toString(36); const uuidToken = crypto.randomUUID(); const decodedToken = jwt.decode(sessionToken); const decodedTokenTwo = jsonwebtoken.decode(authToken); const verifiedToken = jwt.verify(sessionToken, "secret", { ignoreExpiration: true }); const signedToken = jwt.sign({ sub: "u1" }, "secret"); const insecureTlsAgent = new https.Agent({ rejectUnauthorized: false }); const unsafeBuffer = Buffer.allocUnsafe(32); const unsafeBufferSlow = Buffer.allocUnsafeSlow(32); const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; crypto.createHash("md5").update("x").digest("hex"); fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.statfsSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.accessSync("/tmp/demo.txt"); fs.utimesSync("/tmp/demo.txt", new Date(), new Date()); fs.renameSync("/tmp/demo.txt", "/tmp/demo-renamed-sync.txt"); fs.copyFileSync("/tmp/demo-renamed-sync.txt", "/tmp/demo-copy-sync.txt"); fs.unlinkSync("/tmp/demo-copy-sync.txt"); fs.truncateSync("/tmp/demo.txt", 0); fs.rmdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); const execFileArgs = [value]; cp.execFile("echo", execFileArgs); cp.execSync("echo test"); const dynamicShellCommand = `echo `; cp.exec(dynamicShellCommand); cp.exec("echo test"); vm.runInNewContext(dynamicShellCommand); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.spawn("echo", ["test"], { shell: true }); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); const prismaClient = new PrismaClient(); const prismaPkg = require("@prisma/client"); interface AccountPort { findById(id: string): string; saveProfile(id: string): void; } class AccountService { findById() { return "ok"; } saveProfile() { return "ok"; } } function resolveByKind(entity: any) { switch (entity.kind) { case "reservation": return 1; case "zbe": return 2; default: return 0; } } class BaseHandler { run() { return 0; } } class ExtendedHandler extends BaseHandler { override run() { throw new Error("Not implemented"); } } debugger;'
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
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insecure-token-date-now.ast',
    'heuristics.ts.insecure-token-math-random.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.jwt-decode-without-verify.ast',
    'heuristics.ts.jwt-sign-no-expiration.ast',
    'heuristics.ts.jwt-verify-ignore-expiration.ast',
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
  assert.equal(extracted.every((finding) => finding.source === 'heuristics:ast'), true);
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
          'NavigationView { Text("hello") }',
          'Text("tap").onTapGesture { }',
          'let title = String(format: "%d", 1)',
          'let width = UIScreen.main.bounds.width',
          'final class LegacyType: @unchecked Sendable {}',
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
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.dispatchgroup.ast',
    'heuristics.ios.dispatchqueue.ast',
    'heuristics.ios.dispatchsemaphore.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-unwrap.ast',
    'heuristics.ios.navigation-view.ast',
    'heuristics.ios.observable-object.ast',
    'heuristics.ios.on-tap-gesture.ast',
    'heuristics.ios.operation-queue.ast',
    'heuristics.ios.string-format.ast',
    'heuristics.ios.task-detached.ast',
    'heuristics.ios.uiscreen-main-bounds.ast',
    'heuristics.ios.unchecked-sendable.ast',
  ]);
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
        'apps/android/app/src/test/java/com/acme/FeatureTest.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }'].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.thread-sleep.ast',
  ]);
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

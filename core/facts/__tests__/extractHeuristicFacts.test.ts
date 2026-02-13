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
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); cp.execSync("echo test"); cp.exec("echo test"); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.child-process-exec-file-sync.ast',
    'heuristics.ts.child-process-exec-file.ast',
    'heuristics.ts.child-process-exec-sync.ast',
    'heuristics.ts.child-process-exec.ast',
    'heuristics.ts.child-process-fork.ast',
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.child-process-spawn-sync.ast',
    'heuristics.ts.child-process-spawn.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.fs-access-callback.ast',
    'heuristics.ts.fs-append-file-callback.ast',
    'heuristics.ts.fs-append-file-sync.ast',
    'heuristics.ts.fs-chmod-callback.ast',
    'heuristics.ts.fs-chmod-sync.ast',
    'heuristics.ts.fs-chown-callback.ast',
    'heuristics.ts.fs-chown-sync.ast',
    'heuristics.ts.fs-close-callback.ast',
    'heuristics.ts.fs-close-sync.ast',
    'heuristics.ts.fs-copy-file-callback.ast',
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
    'heuristics.ts.fs-rm-callback.ast',
    'heuristics.ts.fs-rm-sync.ast',
    'heuristics.ts.fs-rmdir-callback.ast',
    'heuristics.ts.fs-stat-callback.ast',
    'heuristics.ts.fs-stat-sync.ast',
    'heuristics.ts.fs-statfs-callback.ast',
    'heuristics.ts.fs-symlink-callback.ast',
    'heuristics.ts.fs-symlink-sync.ast',
    'heuristics.ts.fs-truncate-callback.ast',
    'heuristics.ts.fs-unlink-callback.ast',
    'heuristics.ts.fs-unwatch-file-callback.ast',
    'heuristics.ts.fs-utimes-callback.ast',
    'heuristics.ts.fs-watch-callback.ast',
    'heuristics.ts.fs-watch-file-callback.ast',
    'heuristics.ts.fs-write-callback.ast',
    'heuristics.ts.fs-write-file-callback.ast',
    'heuristics.ts.fs-write-file-sync.ast',
    'heuristics.ts.fs-write-sync.ast',
    'heuristics.ts.fs-writev-callback.ast',
    'heuristics.ts.fs-writev-sync.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.process-env-mutation.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.with-statement.ast',
  ]);
});

test('detects backend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); cp.execSync("echo test"); cp.exec("echo test"); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.child-process-exec-file-sync.ast',
    'heuristics.ts.child-process-exec-file.ast',
    'heuristics.ts.child-process-exec-sync.ast',
    'heuristics.ts.child-process-exec.ast',
    'heuristics.ts.child-process-fork.ast',
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.child-process-spawn-sync.ast',
    'heuristics.ts.child-process-spawn.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.fs-access-callback.ast',
    'heuristics.ts.fs-append-file-callback.ast',
    'heuristics.ts.fs-append-file-sync.ast',
    'heuristics.ts.fs-chmod-callback.ast',
    'heuristics.ts.fs-chmod-sync.ast',
    'heuristics.ts.fs-chown-callback.ast',
    'heuristics.ts.fs-chown-sync.ast',
    'heuristics.ts.fs-close-callback.ast',
    'heuristics.ts.fs-close-sync.ast',
    'heuristics.ts.fs-copy-file-callback.ast',
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
    'heuristics.ts.fs-rm-callback.ast',
    'heuristics.ts.fs-rm-sync.ast',
    'heuristics.ts.fs-rmdir-callback.ast',
    'heuristics.ts.fs-stat-callback.ast',
    'heuristics.ts.fs-stat-sync.ast',
    'heuristics.ts.fs-statfs-callback.ast',
    'heuristics.ts.fs-symlink-callback.ast',
    'heuristics.ts.fs-symlink-sync.ast',
    'heuristics.ts.fs-truncate-callback.ast',
    'heuristics.ts.fs-unlink-callback.ast',
    'heuristics.ts.fs-unwatch-file-callback.ast',
    'heuristics.ts.fs-utimes-callback.ast',
    'heuristics.ts.fs-watch-callback.ast',
    'heuristics.ts.fs-watch-file-callback.ast',
    'heuristics.ts.fs-write-callback.ast',
    'heuristics.ts.fs-write-file-callback.ast',
    'heuristics.ts.fs-write-file-sync.ast',
    'heuristics.ts.fs-write-sync.ast',
    'heuristics.ts.fs-writev-callback.ast',
    'heuristics.ts.fs-writev-sync.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.process-env-mutation.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.with-statement.ast',
  ]);
  assert.equal(extracted.every((finding) => finding.source === 'heuristics:ast'), true);
});

test('skips TypeScript heuristics for test files', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.spec.ts',
        'const cp = require("child_process"); const fs = require("fs"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); cp.execSync("echo test"); cp.exec("echo test"); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
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
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-unwrap.ast',
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

test('extracts typed heuristic facts with expected metadata', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const fs = require("fs"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); process.env.NODE_ENV = "production"; fs.utimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.watch("/tmp/demo.txt", () => {}); fs.watchFile("/tmp/demo.txt", () => {}); fs.unwatchFile("/tmp/demo.txt", () => {}); fs.exists("/tmp/demo.txt", () => {}); fs.readFile("/tmp/demo.txt", "utf8", () => {}); fs.writeFile("/tmp/demo.txt", value, () => {}); fs.appendFile("/tmp/demo.txt", value, () => {}); fs.readdir("/tmp", () => {}); fs.mkdir("/tmp/demo-callback-dir", () => {}); fs.rmdir("/tmp/demo-callback-dir", () => {}); fs.rm("/tmp/demo-callback-dir", () => {}); fs.truncate("/tmp/demo.txt", 0, () => {}); fs.rename("/tmp/demo.txt", "/tmp/demo-renamed.txt", () => {}); fs.copyFile("/tmp/demo.txt", "/tmp/demo-copy-callback.txt", () => {}); fs.stat("/tmp/demo-copy-callback.txt", () => {}); fs.statfs("/tmp/demo-copy-callback.txt", () => {}); fs.fstat(10, () => {}); fs.lstat("/tmp/demo-copy-callback.txt", () => {}); fs.realpath("/tmp/demo-copy-callback.txt", () => {}); fs.access("/tmp/demo-copy-callback.txt", () => {}); fs.chmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchmod(10, 0o644, () => {}); fs.chown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchown("/tmp/demo-copy-callback.txt", 1000, 1000, () => {}); fs.lchmod("/tmp/demo-copy-callback.txt", 0o644, () => {}); fs.fchown(10, 1000, 1000, () => {}); fs.unlink("/tmp/demo-copy-callback.txt", () => {}); fs.readlink("/tmp/demo-copy-callback.txt", () => {}); fs.symlink("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-link.txt", () => {}); fs.link("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-hardlink.txt", () => {}); fs.mkdtemp("/tmp/demo-callback-prefix-", () => {}); fs.opendir("/tmp", () => {}); fs.open("/tmp/demo-copy-callback.txt", "r", () => {}); fs.cp("/tmp/demo-copy-callback.txt", "/tmp/demo-copy-callback-cp.txt", () => {}); fs.fdatasync(10, () => {}); fs.ftruncate(10, 0, () => {}); fs.futimes(10, new Date(), new Date(), () => {}); fs.lutimes("/tmp/demo.txt", new Date(), new Date(), () => {}); fs.fsync(10, () => {}); fs.close(10, () => {}); fs.read(10, Buffer.alloc(8), 0, 8, 0, () => {}); fs.readv(10, [Buffer.alloc(8)], 0, () => {}); fs.writev(10, [Buffer.from("demo")], 0, () => {}); fs.write(10, Buffer.from("demo"), 0, 4, 0, () => {}); fs.writeFileSync("/tmp/demo.txt", value); fs.rmSync("/tmp/demo-sync-dir", { force: true, recursive: true }); fs.mkdirSync("/tmp/demo-sync-dir", { recursive: true }); fs.readdirSync("/tmp"); fs.readFileSync("/tmp/demo.txt", "utf8"); fs.statSync("/tmp/demo.txt"); fs.realpathSync("/tmp/demo.txt"); fs.lstatSync("/tmp/demo.txt"); fs.existsSync("/tmp/demo.txt"); fs.chmodSync("/tmp/demo.txt", 0o644); fs.chownSync("/tmp/demo.txt", 1000, 1000); fs.fchownSync(10, 1000, 1000); fs.fchmodSync(10, 0o644); fs.fstatSync(10); fs.ftruncateSync(10, 0); fs.futimesSync(10, new Date(), new Date()); fs.lutimesSync("/tmp/demo.txt", new Date(), new Date()); fs.readvSync(10, [Buffer.alloc(8)], 0); fs.writevSync(10, [Buffer.from("demo")], 0); fs.writeSync(10, Buffer.from("demo"), 0, 4, 0); fs.fsyncSync(10); fs.fdatasyncSync(10); fs.closeSync(10); fs.readSync(10, Buffer.alloc(8), 0, 8, 0); fs.readlinkSync("/tmp/demo.txt"); fs.symlinkSync("/tmp/demo.txt", "/tmp/demo-link-sync.txt"); fs.linkSync("/tmp/demo.txt", "/tmp/demo-hardlink-sync.txt"); fs.cpSync("/tmp/demo.txt", "/tmp/demo-cp-sync.txt"); fs.openSync("/tmp/demo.txt", "r"); fs.opendirSync("/tmp"); fs.mkdtempSync("/tmp/demo-sync-prefix-"); fs.appendFileSync("/tmp/demo.txt", value); fs.promises.writeFile("/tmp/demo.txt", value); fs.promises.appendFile("/tmp/demo.txt", value); fs.promises.rm("/tmp/demo.txt", { force: true }); fs.promises.unlink("/tmp/demo.txt"); fs.promises.readFile("/tmp/demo.txt", "utf8"); fs.promises.readdir("/tmp"); fs.promises.mkdir("/tmp/demo-dir", { recursive: true }); fs.promises.stat("/tmp/demo.txt"); fs.promises.copyFile("/tmp/demo.txt", "/tmp/demo-copy.txt"); fs.promises.rename("/tmp/demo-copy.txt", "/tmp/demo-final.txt"); fs.promises.access("/tmp/demo-final.txt"); fs.promises.chmod("/tmp/demo-final.txt", 0o644); fs.promises.chown("/tmp/demo-final.txt", 1000, 1000); fs.promises.utimes("/tmp/demo-final.txt", new Date(), new Date()); fs.promises.lstat("/tmp/demo-final.txt"); fs.promises.realpath("/tmp/demo-final.txt"); fs.promises.symlink("/tmp/demo-final.txt", "/tmp/demo-link.txt"); fs.promises.link("/tmp/demo-final.txt", "/tmp/demo-hardlink.txt"); fs.promises.readlink("/tmp/demo-link.txt"); fs.promises.open("/tmp/demo-final.txt", "r"); fs.promises.opendir("/tmp"); fs.promises.cp("/tmp/demo-final.txt", "/tmp/demo-cp.txt"); fs.promises.mkdtemp("/tmp/demo-prefix-"); cp.execFileSync("echo", ["test"]); cp.execFile("echo", ["test"]); cp.execSync("echo test"); cp.exec("echo test"); cp.spawnSync("echo", ["test"]); cp.spawn("echo", ["test"]); cp.fork("./worker.js"); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.equal(extracted.length, 125);
  assert.equal(extracted.every((fact) => fact.kind === 'Heuristic'), true);
  assert.equal(extracted.every((fact) => fact.source === 'heuristics:ast'), true);
});

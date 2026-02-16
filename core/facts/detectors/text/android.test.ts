import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasKotlinGlobalScopeUsage,
  hasKotlinRunBlockingUsage,
  hasKotlinThreadSleepCall,
} from './android';

test('hasKotlinThreadSleepCall detecta Thread.sleep en codigo Kotlin real', () => {
  const source = `
fun waitForRetry() {
  Thread.sleep(250)
}
`;
  assert.equal(hasKotlinThreadSleepCall(source), true);
});

test('hasKotlinThreadSleepCall ignora coincidencias en comentarios y strings', () => {
  const source = `
// Thread.sleep(500)
val debug = "Thread.sleep(500)"
`;
  assert.equal(hasKotlinThreadSleepCall(source), false);
});

test('hasKotlinGlobalScopeUsage detecta launch y async sobre GlobalScope', () => {
  const launchSource = `
fun loadData() {
  GlobalScope.launch {
    println("ok")
  }
}
`;
  const asyncSource = `
fun loadAsync() {
  GlobalScope.async {
    42
  }
}
`;
  assert.equal(hasKotlinGlobalScopeUsage(launchSource), true);
  assert.equal(hasKotlinGlobalScopeUsage(asyncSource), true);
});

test('hasKotlinGlobalScopeUsage descarta metodos no bloqueados por la regla', () => {
  const source = `
fun cancelScope() {
  GlobalScope.cancel()
}
`;
  assert.equal(hasKotlinGlobalScopeUsage(source), false);
});

test('hasKotlinRunBlockingUsage detecta runBlocking con llaves y con generics', () => {
  const bracesSource = `
fun main() {
  runBlocking {
    println("done")
  }
}
`;
  const genericSource = `
fun main() {
  runBlocking<Unit> {
    println("done")
  }
}
`;
  assert.equal(hasKotlinRunBlockingUsage(bracesSource), true);
  assert.equal(hasKotlinRunBlockingUsage(genericSource), true);
});

test('hasKotlinRunBlockingUsage ignora comentarios y nombres parciales', () => {
  const commentedSource = `
// runBlocking { println("debug") }
val sample = "runBlocking { println(\\"debug\\") }"
`;
  const partialSource = `
fun main() {
  myrunBlocking {
    println("done")
  }
}
`;
  assert.equal(hasKotlinRunBlockingUsage(commentedSource), false);
  assert.equal(hasKotlinRunBlockingUsage(partialSource), false);
});

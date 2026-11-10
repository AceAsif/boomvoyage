import test from 'node:test';
import assert from 'node:assert/strict';
import { createScreenLock } from '../js/wakelock.js';

// A pretend navigator.wakeLock that records what happens.
function fakeNav({ refuse = false, delay = 0 } = {}) {
  const log = { requests: 0, released: 0, types: [] };
  const sentinels = [];
  const nav = {
    wakeLock: {
      async request(type) {
        log.requests += 1;
        log.types.push(type);
        if (delay) await new Promise((r) => setTimeout(r, delay));
        if (refuse) throw new Error('NotAllowedError');
        const handlers = {};
        const sentinel = {
          handlers,
          addEventListener(name, fn) { handlers[name] = fn; },
          async release() { log.released += 1; if (handlers.release) handlers.release(); },
        };
        sentinels.push(sentinel);
        return sentinel;
      },
    },
  };
  return { nav, log, sentinels };
}

const visibleDoc = () => ({ visibilityState: 'visible' });

function fakeFallback({ works = true } = {}) {
  const f = { started: 0, stopped: 0 };
  f.make = () => ({
    async start() { f.started += 1; if (!works) throw new Error('no video'); return true; },
    stop() { f.stopped += 1; },
  });
  return f;
}

test('uses the Wake Lock API for the screen, and asks only once', async () => {
  const { nav, log } = fakeNav();
  const lock = createScreenLock({ nav, doc: visibleDoc() });
  assert.equal(lock.supported, true);
  assert.equal(await lock.request(), true);
  assert.equal(lock.mode, 'api');
  assert.equal(lock.active, true);
  assert.deepEqual(log.types, ['screen']);
  assert.equal(await lock.request(), true);
  assert.equal(log.requests, 1, 'a second request does not ask the browser again');
});

test('two requests at the same moment make only one call', async () => {
  const { nav, log } = fakeNav({ delay: 10 });
  const lock = createScreenLock({ nav, doc: visibleDoc() });
  const [a, b] = await Promise.all([lock.request(), lock.request()]);
  assert.equal(a, true);
  assert.equal(b, true);
  assert.equal(log.requests, 1);
});

test('release lets go of the lock, and refresh does nothing afterwards', async () => {
  const { nav, log } = fakeNav();
  const lock = createScreenLock({ nav, doc: visibleDoc() });
  await lock.request();
  await lock.release();
  assert.equal(log.released, 1);
  assert.equal(lock.mode, 'none');
  assert.equal(await lock.refresh(), false);
  assert.equal(log.requests, 1);
});

test('when the browser takes the lock away (tab hidden), refresh gets it back', async () => {
  const { nav, log, sentinels } = fakeNav();
  const lock = createScreenLock({ nav, doc: visibleDoc() });
  await lock.request();
  sentinels[0].handlers.release(); // the browser released it by itself
  assert.equal(lock.mode, 'none');
  assert.equal(await lock.refresh(), true);
  assert.equal(log.requests, 2);
  assert.equal(lock.mode, 'api');
});

test('a hidden page does not ask; it asks when the page is shown again', async () => {
  const { nav, log } = fakeNav();
  const doc = { visibilityState: 'hidden' };
  const lock = createScreenLock({ nav, doc });
  assert.equal(await lock.request(), false);
  assert.equal(log.requests, 0);
  doc.visibilityState = 'visible';
  assert.equal(await lock.refresh(), true);
  assert.equal(log.requests, 1);
});

test('if the API refuses, the silent-video fallback is used and stopped on release', async () => {
  const { nav } = fakeNav({ refuse: true });
  const fb = fakeFallback();
  const lock = createScreenLock({ nav, doc: visibleDoc(), makeFallback: fb.make });
  assert.equal(await lock.request(), true);
  assert.equal(lock.mode, 'fallback');
  assert.equal(fb.started, 1);
  await lock.release();
  assert.equal(fb.stopped, 1);
  assert.equal(lock.mode, 'none');
});

test('without the API the fallback is used', async () => {
  const fb = fakeFallback();
  const lock = createScreenLock({ nav: {}, doc: visibleDoc(), makeFallback: fb.make });
  assert.equal(lock.supported, false);
  assert.equal(await lock.request(), true);
  assert.equal(lock.mode, 'fallback');
});

test('if nothing works, request says false and nothing throws', async () => {
  for (const make of [() => null, fakeFallback({ works: false }).make]) {
    const lock = createScreenLock({ nav: undefined, doc: visibleDoc(), makeFallback: make });
    assert.equal(await lock.request(), false);
    assert.equal(lock.mode, 'none');
    assert.equal(lock.active, false);
    await lock.release(); // also safe
  }
});

test('release while the browser is still answering gives the lock straight back', async () => {
  const { nav, log } = fakeNav({ delay: 20 });
  const lock = createScreenLock({ nav, doc: visibleDoc() });
  const pending = lock.request();
  await lock.release();
  assert.equal(await pending, false);
  assert.equal(lock.mode, 'none');
  assert.equal(log.released, 1, 'the lock that arrived late was released at once');
});

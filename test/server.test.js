import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createApp } from '../server.js';
import { createStore, FREE_LIMIT } from '../src/store.js';
import { generatePlanOffline } from '../src/engine.js';
import { verifyWebhook } from '../src/billing.js';

delete process.env.ANTHROPIC_API_KEY;
delete process.env.STRIPE_SECRET_KEY;

let server, base;
before(async () => {
  const { app } = createApp({ store: createStore(null), generate: async (input, analysis) => generatePlanOffline(input, analysis) });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function client() {
  let cookie = '';
  return async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie }, body: body && JSON.stringify(body) });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, body: await res.json() };
  };
}

test('free tier allows exactly FREE_LIMIT generations, then 402', async () => {
  const call = client();
  const me = await call('/api/me');
  assert.equal(me.body.quota.remaining, FREE_LIMIT);
  for (let i = 0; i < FREE_LIMIT; i++) {
    const r = await call('/api/generate', { method: 'POST', body: { description: 'Ich habe eine Modemarke und will mehr Verkäufe.' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.quota.remaining, FREE_LIMIT - i - 1);
  }
  const blocked = await call('/api/generate', { method: 'POST', body: { description: 'Ich habe eine Modemarke und will mehr Verkäufe.' } });
  assert.equal(blocked.status, 402);
});

test('demo upgrade unlocks unlimited generations', async () => {
  const call = client();
  await call('/api/me');
  const up = await call('/api/billing/checkout', { method: 'POST' });
  assert.equal(up.body.demo, true);
  assert.equal(up.body.quota.tier, 'pro');
  const r = await call('/api/generate', { method: 'POST', body: { description: 'Personal Trainer sucht mehr Anfragen' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.quota.limit, null);
});

test('validates input', async () => {
  const call = client();
  const r = await call('/api/generate', { method: 'POST', body: { description: 'kurz' } });
  assert.equal(r.status, 400);
});

test('plans are saved per user and isolated', async () => {
  const a = client();
  const b = client();
  const gen = await a('/api/generate', { method: 'POST', body: { description: 'Wir sind ein Café und wollen Reichweite', nicheVideos: 'POV: Erster Kaffee | 1M | 100k' } });
  assert.ok(gen.body.plan.analysis);
  assert.equal((await a('/api/plans')).body.plans.length, 1);
  assert.equal((await a(`/api/plans/${gen.body.id}`)).status, 200);
  await b('/api/me');
  assert.equal((await b(`/api/plans/${gen.body.id}`)).status, 404);
  assert.equal((await a(`/api/plans/${gen.body.id}`, { method: 'DELETE' })).status, 200);
});

test('analyze endpoint', async () => {
  const call = client();
  const r = await call('/api/analyze', { method: 'POST', body: { videos: '3 Fehler beim Training | 1M | 50k' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.analysis.patterns[0].id, 'mistakes');
});

test('stripe webhook signature verification', () => {
  const secret = 'whsec_test';
  const body = '{"type":"x"}';
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  assert.equal(verifyWebhook(body, `t=${t},v1=${sig}`, secret), true);
  assert.equal(verifyWebhook(body, `t=${t},v1=${'0'.repeat(64)}`, secret), false);
  assert.equal(verifyWebhook(body, `t=${t - 10_000},v1=${sig}`, secret), false);
});

test('health check', async () => {
  const r = await client()('/healthz');
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

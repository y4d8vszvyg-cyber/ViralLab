import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlanOffline } from '../src/engine.js';
import { analyzeNiche } from '../src/analyzer.js';
import { PlanSchema } from '../src/schema.js';

const FASHION = 'Ich habe eine Modemarke und will mehr Verkäufe.';

test('builds the example fashion plan', () => {
  const plan = generatePlanOffline({ description: FASHION });
  assert.ok(PlanSchema.safeParse(plan).success);
  assert.equal(plan.meta.industry, 'fashion');
  assert.equal(plan.meta.goal, 'sales');
  assert.equal(plan.posts.length, 7);
  assert.equal(plan.posts[0].day, 'Montag');
  assert.equal(plan.posts[0].title, '3 Fehler, die deine Outfits billig aussehen lassen');
  assert.equal(plan.posts[1].format, 'Produktvideo');
  assert.equal(plan.posts[1].hooks[0], 'Ich hätte nie gedacht, dass diese Jacke so gut aussieht …');
  assert.equal(plan.posts[2].format, 'Storytelling');
});

test('every post has hooks, script, caption, hashtags and 3 platform variants', () => {
  const plan = generatePlanOffline({ description: FASHION, weeks: 2, postsPerWeek: 5 });
  assert.equal(plan.posts.length, 10);
  for (const p of plan.posts) {
    assert.equal(p.hooks.length, 3);
    assert.ok(p.script.length >= 4);
    assert.ok(p.caption.length > 20);
    assert.ok(p.hashtags.every((h) => h.startsWith('#')));
    assert.deepEqual(p.variants.map((v) => v.platform), ['TikTok', 'Instagram Reels', 'YouTube Shorts']);
  }
  assert.equal(plan.posts[5].day, 'Montag (Woche 2)');
  assert.equal(plan.posts[5].dayIndex, 7);
});

test('is deterministic per seed and varies across seeds', () => {
  const a = generatePlanOffline({ description: FASHION, seed: 1 });
  const b = generatePlanOffline({ description: FASHION, seed: 1 });
  const c = generatePlanOffline({ description: FASHION, seed: 2 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.posts.map((p) => p.postingTime + p.caption), c.posts.map((p) => p.postingTime + p.caption));
});

test('niche analysis re-ranks formats and fills inspiredBy', () => {
  const analysis = analyzeNiche('POV: Du findest die Jeans | 2M | 200k\nPOV: Endlich Wochenende | 1M | 80k\nPOV: Neues Outfit | 900k | 70k');
  const plan = generatePlanOffline({ description: FASHION }, analysis);
  assert.equal(plan.posts[0].format, 'POV');
  assert.match(plan.posts[0].inspiredBy, /POV/);
  assert.match(plan.summary, /3 analysierten/);
});

test('uses the brand name and detects other industries', () => {
  const plan = generatePlanOffline({ description: 'Wir sind ein Café in Hamburg und wollen mehr Reichweite', brand: 'Bohnenglück', goal: 'brand' });
  assert.equal(plan.meta.industry, 'food');
  assert.ok(plan.posts.some((p) => p.title.includes('Bohnenglück')));
  assert.ok(plan.posts[0].hashtags.includes('#bohnenglück'));
});

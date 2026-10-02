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

test('respects platforms, video length, CTA, hashtag count and emoji options', () => {
  const plan = generatePlanOffline({
    description: FASHION, platforms: ['Instagram Reels'], videoLength: 'kurz', cta: 'dm', hashtagCount: 3, emojis: 'keine', tone: 'professionell',
  });
  for (const p of plan.posts) {
    assert.deepEqual(p.variants.map((v) => v.platform), ['Instagram Reels']);
    assert.equal(p.variants[0].length, '8–15 Sek.');
    assert.equal(p.variants[0].cta, 'Schreib mir „INFO“ per DM');
    assert.match(p.caption, /Schreib mir „INFO“ per DM/);
    assert.equal(p.hashtags.length, 3);
    assert.doesNotMatch(p.caption, /\p{Extended_Pictographic}/u);
  }
  assert.match(plan.summary, /Professionell/);
});

test('limits formats and supports 1–7 posts per week', () => {
  const plan = generatePlanOffline({ description: FASHION, formats: ['pov', 'howto'], postsPerWeek: 2, weeks: 3 });
  assert.equal(plan.posts.length, 6);
  assert.ok(plan.posts.every((p) => ['POV', 'Tutorial / How-to'].includes(p.format)));
  assert.equal(generatePlanOffline({ description: FASHION, postsPerWeek: 1 }).posts[0].day, 'Mittwoch');
  assert.equal(generatePlanOffline({ description: FASHION, postsPerWeek: 6 }).posts.length, 6);
});

test('faceless scripts never ask for a face on camera', () => {
  const plan = generatePlanOffline({ description: FASHION, onCamera: 'faceless' });
  for (const p of plan.posts) for (const b of p.script) assert.doesNotMatch(b.visual, /gesicht in die kamera|direkt in die kamera/i);
  const mixed = generatePlanOffline({ description: FASHION, onCamera: 'mixed' });
  assert.ok(mixed.posts.some((p) => p.script.some((b) => /Gesicht in die Kamera/.test(b.visual))));
});

test('new industries, goals and custom audience', () => {
  const plan = generatePlanOffline({ description: 'Wir sind eine Tischlerei und suchen Azubis', audience: 'Schulabgänger aus Köln' });
  assert.equal(plan.meta.industry, 'crafts');
  assert.equal(plan.meta.goal, 'recruiting');
  assert.equal(plan.audience, 'Schulabgänger aus Köln');
  assert.equal(generatePlanOffline({ description: 'irgendwas', industry: 'pets', goal: 'local' }).meta.industry, 'pets');
});

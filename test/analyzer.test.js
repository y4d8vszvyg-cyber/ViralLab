import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVideos, classifyHook, analyzeNiche } from '../src/analyzer.js';

test('parses German number formats and durations', () => {
  const [v] = parseVideos('Mein Hook | 1,2M | 45k | 3.200 | 120.000 | 0:24');
  assert.equal(v.hook, 'Mein Hook');
  assert.equal(v.views, 1_200_000);
  assert.equal(v.likes, 45_000);
  assert.equal(v.comments, 3_200);
  assert.equal(v.shares, 120_000);
  assert.equal(v.duration, 24);
});

test('only the hook is required; comments and blank lines are skipped', () => {
  const videos = parseVideos('# Kommentar\n\nNur ein Hook\n');
  assert.equal(videos.length, 1);
  assert.equal(videos[0].views, null);
});

test('classifies hook patterns', () => {
  assert.ok(classifyHook('3 Fehler, die du vermeiden solltest').includes('mistakes'));
  assert.ok(classifyHook('POV: Du findest die perfekte Jeans').includes('pov'));
  assert.ok(classifyHook('Warum sind alle so gut angezogen?').includes('question'));
  assert.deepEqual(classifyHook('Neue Kollektion ist da'), ['statement']);
});

test('analyzeNiche ranks patterns and produces insights', () => {
  const a = analyzeNiche(`POV: Du bist im Gym | 2M | 200k | 5k | 10k | 15
POV: Montagmorgen | 1M | 90k | 1k | 3k | 12
Neues Produkt | 5k | 100 | 2 | 1 | 40`);
  assert.equal(a.videoCount, 3);
  assert.equal(a.patterns[0].id, 'pov');
  assert.equal(a.topVideos[0].hook, 'POV: Du bist im Gym');
  assert.ok(a.insights.length >= 3);
});

test('analyzeNiche returns null for empty input', () => {
  assert.equal(analyzeNiche('   '), null);
});

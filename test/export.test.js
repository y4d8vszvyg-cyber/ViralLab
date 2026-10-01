import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toICS, toMarkdown, toCSV, nextMonday } from '../public/export.js';
import { generatePlanOffline } from '../src/engine.js';

const plan = generatePlanOffline({ description: 'Ich habe eine Modemarke und will mehr Verkäufe.' });

test('nextMonday', () => {
  assert.equal(nextMonday(new Date(2026, 9, 1)).getDate(), 5); // Thu 1 Oct 2026 -> Mon 5 Oct
  assert.equal(nextMonday(new Date(2026, 9, 5)).getDate(), 5);
});

test('ICS contains one event per post on the right days', () => {
  const ics = toICS(plan, new Date(2026, 9, 5));
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 7);
  assert.match(ics, /DTSTART:20261005T/);
  assert.match(ics, /DTSTART:20261011T/);
});

test('Markdown and CSV include all posts', () => {
  assert.equal(toMarkdown(plan).match(/^## /gm).length, 7);
  const csv = toCSV(plan);
  assert.ok(plan.posts.every((p) => csv.includes(`"${p.day}";"${p.postingTime}"`)));
});

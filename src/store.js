// Tiny JSON-file store. Good enough for a single-instance deployment; swap for
// a real database when scaling horizontally.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const FREE_LIMIT = Number(process.env.FREE_LIMIT || 10);

export function createStore(file) {
  let db = { users: {}, plans: {}, cancellations: [] };
  if (file && fs.existsSync(file)) {
    try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* start fresh on corrupt file */ }
  }
  let timer = null;
  const persist = () => {
    if (!file) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db));
      fs.renameSync(tmp, file);
    }, 50);
  };

  const store = {
    getUser(id) {
      if (!db.users[id]) {
        db.users[id] = { id, createdAt: new Date().toISOString(), generations: 0, tier: 'free', proUntil: null, stripeCustomerId: null, stripeSubscriptionId: null };
        persist();
      }
      return db.users[id];
    },
    isPro(user) {
      return user.tier === 'pro' && (!user.proUntil || new Date(user.proUntil) > new Date());
    },
    quota(user) {
      const pro = store.isPro(user);
      return { tier: pro ? 'pro' : 'free', used: user.generations, limit: pro ? null : FREE_LIMIT, remaining: pro ? null : Math.max(0, FREE_LIMIT - user.generations) };
    },
    canGenerate(user) {
      return store.isPro(user) || user.generations < FREE_LIMIT;
    },
    recordGeneration(user) {
      user.generations += 1;
      persist();
    },
    setPro(user, { until = null, customerId = null, subscriptionId = null } = {}) {
      user.tier = 'pro';
      user.proUntil = until;
      if (customerId) user.stripeCustomerId = customerId;
      if (subscriptionId) user.stripeSubscriptionId = subscriptionId;
      persist();
    },
    setFree(user) {
      user.tier = 'free';
      user.proUntil = null;
      persist();
    },
    findUserBy(field, value) {
      return Object.values(db.users).find((u) => u[field] === value) || null;
    },
    savePlan(userId, input, plan) {
      const id = crypto.randomUUID();
      db.plans[id] = { id, userId, createdAt: new Date().toISOString(), input, plan };
      persist();
      return db.plans[id];
    },
    getPlan(userId, id) {
      const p = db.plans[id];
      return p && p.userId === userId ? p : null;
    },
    listPlans(userId) {
      return Object.values(db.plans)
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => ({ id: p.id, createdAt: p.createdAt, description: p.input.description.slice(0, 120), posts: p.plan.posts.length }));
    },
    deletePlan(userId, id) {
      if (db.plans[id]?.userId !== userId) return false;
      delete db.plans[id];
      persist();
      return true;
    },
    addCancellation(record) {
      const entry = { id: crypto.randomUUID().slice(0, 8).toUpperCase(), receivedAt: new Date().toISOString(), ...record };
      (db.cancellations ||= []).push(entry);
      persist();
      return entry;
    },
    flush() {
      if (!file) return;
      clearTimeout(timer);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(db));
    },
  };
  return store;
}

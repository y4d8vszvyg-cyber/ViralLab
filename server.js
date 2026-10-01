import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createStore, FREE_LIMIT } from './src/store.js';
import { analyzeNiche } from './src/analyzer.js';
import { generatePlan, aiEnabled } from './src/ai.js';
import { stripeEnabled, createCheckoutSession, retrieveCheckoutSession, createPortalSession, verifyWebhook, PRO_PRICE_CENTS } from './src/billing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GenerateInput = z.object({
  description: z.string().trim().min(10, 'Beschreibe dein Business in mindestens 10 Zeichen.').max(2000),
  brand: z.string().trim().max(60).optional(),
  goal: z.enum(['sales', 'leads', 'reach', 'brand']).optional(),
  industry: z.string().max(30).optional(),
  tone: z.string().trim().max(80).optional(),
  postsPerWeek: z.coerce.number().int().refine((n) => [3, 4, 5, 7].includes(n)).default(7),
  weeks: z.coerce.number().int().min(1).max(4).default(1),
  nicheVideos: z.string().max(20000).optional(),
  seed: z.coerce.number().int().optional(),
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

export function createApp({ store = createStore(path.join(DATA_DIR, 'db.json')), generate = generatePlan } = {}) {
  const app = express();
  const secret = process.env.SESSION_SECRET || 'virallab-dev-secret';
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET muss in Produktion gesetzt sein.');
  }
  // Behind a hosting proxy (Render, Railway, Fly): trust X-Forwarded-* for https URLs and secure cookies.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.get('/healthz', (req, res) => res.json({ ok: true }));
  const allowDemoUpgrade = !stripeEnabled() && process.env.ALLOW_DEMO_UPGRADE !== 'false';
  const inFlight = new Set();

  // Stripe webhooks need the raw body for signature verification.
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const raw = req.body.toString('utf8');
    if (!verifyWebhook(raw, req.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET)) return res.status(400).send('invalid signature');
    const event = JSON.parse(raw);
    const obj = event.data?.object || {};
    if (event.type === 'checkout.session.completed' && obj.client_reference_id) {
      store.setPro(store.getUser(obj.client_reference_id), { customerId: obj.customer, subscriptionId: obj.subscription });
    } else if (event.type === 'customer.subscription.deleted') {
      const user = store.findUserBy('stripeSubscriptionId', obj.id) || store.findUserBy('stripeCustomerId', obj.customer);
      if (user) store.setFree(user);
    }
    res.json({ received: true });
  });

  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser(secret));

  // Anonymous, signed user cookie – no signup needed to start.
  app.use((req, res, next) => {
    let id = req.signedCookies.vl_uid;
    if (!id) {
      id = crypto.randomUUID();
      res.cookie('vl_uid', id, { signed: true, httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === 'production' });
    }
    req.user = store.getUser(id);
    next();
  });

  const baseUrl = (req) => process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

  app.get('/api/me', (req, res) => {
    res.json({
      quota: store.quota(req.user),
      features: { ai: aiEnabled(), stripe: stripeEnabled(), demoUpgrade: allowDemoUpgrade },
      pricing: { freeGenerations: FREE_LIMIT, proMonthlyEur: PRO_PRICE_CENTS / 100 },
    });
  });

  app.post('/api/analyze', (req, res) => {
    const analysis = analyzeNiche(String(req.body?.videos || ''));
    if (!analysis) return res.status(400).json({ error: 'Keine Videos erkannt. Füge mindestens eine Zeile mit einem Hook ein.' });
    res.json({ analysis });
  });

  app.post('/api/generate', async (req, res) => {
    const parsed = GenerateInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const user = req.user;
    if (!store.canGenerate(user)) {
      return res.status(402).json({ error: `Deine ${FREE_LIMIT} kostenlosen Generierungen sind aufgebraucht. Upgrade auf Pro für unbegrenzte Content-Pläne.`, quota: store.quota(user) });
    }
    if (inFlight.has(user.id)) return res.status(429).json({ error: 'Es läuft bereits eine Generierung.' });
    inFlight.add(user.id);
    try {
      const input = parsed.data;
      const analysis = input.nicheVideos ? analyzeNiche(input.nicheVideos) : null;
      const plan = await generate(input, analysis);
      store.recordGeneration(user);
      const saved = store.savePlan(user.id, { ...input, nicheVideos: undefined }, { ...plan, analysis });
      res.json({ id: saved.id, plan: saved.plan, quota: store.quota(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Generierung fehlgeschlagen. Bitte versuche es erneut.' });
    } finally {
      inFlight.delete(user.id);
    }
  });

  app.get('/api/plans', (req, res) => res.json({ plans: store.listPlans(req.user.id) }));
  app.get('/api/plans/:id', (req, res) => {
    const plan = store.getPlan(req.user.id, req.params.id);
    plan ? res.json(plan) : res.status(404).json({ error: 'Plan nicht gefunden' });
  });
  app.delete('/api/plans/:id', (req, res) => {
    store.deletePlan(req.user.id, req.params.id) ? res.json({ ok: true }) : res.status(404).json({ error: 'Plan nicht gefunden' });
  });

  app.post('/api/billing/checkout', async (req, res) => {
    if (store.isPro(req.user)) return res.json({ alreadyPro: true });
    if (stripeEnabled()) {
      try {
        const session = await createCheckoutSession(req.user, baseUrl(req));
        return res.json({ url: session.url });
      } catch (err) {
        console.error(err);
        return res.status(502).json({ error: 'Checkout konnte nicht gestartet werden.' });
      }
    }
    if (!allowDemoUpgrade) return res.status(503).json({ error: 'Zahlungen sind nicht konfiguriert.' });
    store.setPro(req.user, { until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() });
    res.json({ demo: true, quota: store.quota(req.user) });
  });

  app.get('/api/billing/success', async (req, res) => {
    try {
      const session = await retrieveCheckoutSession(String(req.query.session_id || ''));
      if (session.client_reference_id === req.user.id && ['paid', 'no_payment_required'].includes(session.payment_status)) {
        store.setPro(req.user, { customerId: session.customer, subscriptionId: session.subscription });
        return res.redirect('/?checkout=success');
      }
    } catch (err) {
      console.error(err);
    }
    res.redirect('/?checkout=failed');
  });

  app.post('/api/billing/portal', async (req, res) => {
    if (!stripeEnabled() || !req.user.stripeCustomerId) return res.status(400).json({ error: 'Kein aktives Abo gefunden.' });
    try {
      const session = await createPortalSession(req.user, baseUrl(req));
      res.json({ url: session.url });
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: 'Kundenportal nicht erreichbar.' });
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));
  return { app, store };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app, store } = createApp();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`🚀 ViralLab läuft auf http://localhost:${port}`);
    console.log(`   KI: ${aiEnabled() ? 'Claude aktiv' : 'Offline-Engine (ANTHROPIC_API_KEY setzen für Claude)'}`);
    console.log(`   Zahlungen: ${stripeEnabled() ? 'Stripe aktiv' : 'Demo-Modus'}`);
  });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.flush(); process.exit(0); });
}

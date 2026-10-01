// Stripe subscription billing (Pro: 9,99 €/Monat) via the Stripe REST API.
// Without STRIPE_SECRET_KEY the app runs in demo mode: upgrading unlocks Pro
// for 30 days without payment, so the full flow can be tried locally.

import crypto from 'node:crypto';

const STRIPE_API = 'https://api.stripe.com/v1';
export const PRO_PRICE_CENTS = 999;

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object') form(v, key, out);
    else if (v !== undefined && v !== null) out.append(key, String(v));
  }
  return out;
}

async function stripe(method, endpoint, body) {
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? form(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Stripe-Fehler ${res.status}`);
  return json;
}

export async function createCheckoutSession(user, baseUrl) {
  const lineItem = process.env.STRIPE_PRICE_ID
    ? { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
    : { quantity: 1, price_data: { currency: 'eur', unit_amount: PRO_PRICE_CENTS, recurring: { interval: 'month' }, product_data: { name: 'ViralLab Pro' } } };
  return stripe('POST', '/checkout/sessions', {
    mode: 'subscription',
    client_reference_id: user.id,
    line_items: { 0: lineItem },
    success_url: `${baseUrl}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/?checkout=cancelled`,
    allow_promotion_codes: 'true',
    ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : {}),
  });
}

export async function retrieveCheckoutSession(id) {
  return stripe('GET', `/checkout/sessions/${encodeURIComponent(id)}`);
}

export async function createPortalSession(user, baseUrl) {
  return stripe('POST', '/billing_portal/sessions', { customer: user.stripeCustomerId, return_url: baseUrl });
}

/** Verify a Stripe webhook signature (Stripe-Signature header, v1 scheme). */
export function verifyWebhook(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k, v]));
  const signatures = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return signatures.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

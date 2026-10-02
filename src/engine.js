// Offline content engine. Builds a complete, plausible content plan from
// hand-crafted viral formats when no Claude API key is configured, and is the
// fallback when the API is unreachable.

import { INDUSTRIES, GOALS, detectIndustry, detectGoal } from './industries.js';
import { PLATFORMS, TONES, VIDEO_LENGTHS, CTAS, HASHTAG_COUNTS } from './options.js';

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const SLOTS = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
const TIMES = ['07:30', '12:15', '17:45', '18:30', '19:00', '20:15', '21:00'];

export function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Each format: pillar it serves, analyzer pattern it maps to, and a builder.
export const FORMATS = {
  mistakes: {
    name: 'Fehler-Liste', pillar: 'Reichweite', pattern: 'mistakes',
    build: (c) => ({
      title: `3 Fehler, die ${c.p.pain}`,
      hooks: [`3 Fehler, die ${c.p.pain}`, `Mach das nie wieder – zumindest nicht, wenn es um ${c.p.result} geht`, `Fehler Nr. 2 macht fast jeder …`],
      script: [
        { time: '0–2s', visual: 'Close-up, Text-Overlay mit dem Hook, schneller Zoom', voiceover: `3 Fehler, die ${c.p.pain}.` },
        { time: '2–8s', visual: 'Fehler 1 zeigen (falsch ❌), dann richtig ✅', voiceover: `Erstens: ${c.p.mistakeList[0]}.` },
        { time: '8–14s', visual: 'Split-Screen falsch vs. richtig', voiceover: `Zweitens: ${c.p.mistakeList[1]}.` },
        { time: '14–20s', visual: 'Schnitt auf Detailaufnahme', voiceover: `Und drittens – der Klassiker: ${c.p.mistakeList[2]}.` },
        { time: '20–25s', visual: 'Gesicht in die Kamera, Produkt im Bild', voiceover: `Welchen Fehler machst du? Schreib's in die Kommentare.` },
      ],
      why: 'Negative Hooks erzeugen Verlustangst; die nummerierte Struktur hält die Watchtime bis zum Ende.',
    }),
  },
  product: {
    name: 'Produktvideo', pillar: 'Verkauf', pattern: 'surprise',
    build: (c) => ({
      title: `Produkt-Spotlight: ${cap(c.product)}`,
      hooks: [`Ich hätte nie gedacht, dass ${c.product} so gut aussieht …`, `Das ist der Grund, warum ${c.product} ständig ausverkauft ist`, `Ehrlich? Ich war skeptisch. Bis jetzt.`],
      script: [
        { time: '0–2s', visual: 'Unboxing / Produkt kommt ins Bild, überraschter Blick', voiceover: `Ich hätte nie gedacht, dass ${c.product} so gut aussieht …` },
        { time: '2–7s', visual: '3 schnelle Detail-Shots (Material, Funktion, Detail)', voiceover: 'Schau dir mal dieses Detail an.' },
        { time: '7–15s', visual: 'Produkt im echten Einsatz / am Körper', voiceover: `Und so wirkt es im Alltag – genau dafür lieben es unsere Kunden.` },
        { time: '15–20s', visual: 'Kundenkommentar als Screenshot einblenden', voiceover: 'Und das sagen die, die es schon haben.' },
        { time: '20–24s', visual: 'Produkt + Preis-Overlay', voiceover: `${c.goal.cta}.` },
      ],
      why: 'Überraschungs-Hook bricht die Erwartung; Detail-Shots liefern Begehrlichkeit, Social Proof senkt die Kaufhürde.',
    }),
  },
  story: {
    name: 'Storytelling', pillar: 'Vertrauen', pattern: 'story',
    build: (c) => ({
      title: `Die Geschichte hinter ${c.brandDat}`,
      hooks: [`Vor einem Jahr wollte ich ${c.brandAcc} fast aufgeben …`, `Niemand hat an diese Idee geglaubt.`, `So hat alles angefangen – mit einem einzigen Kunden.`],
      script: [
        { time: '0–3s', visual: 'Altes Foto / Handyvideo vom Anfang', voiceover: `Vor einem Jahr wollte ich ${c.brandAcc} fast aufgeben.` },
        { time: '3–12s', visual: 'B-Roll: Arbeitsplatz, erste Versuche', voiceover: 'Die ersten Monate liefen gar nicht – kaum Kunden, viele Zweifel.' },
        { time: '12–22s', visual: 'Wendepunkt: Nachricht/Bestellung auf dem Handy', voiceover: 'Dann kam diese eine Nachricht, die alles verändert hat.' },
        { time: '22–32s', visual: 'Heute: Team, Produkte, volle Regale', voiceover: 'Heute sind wir hier – und das verdanken wir dir.' },
        { time: '32–36s', visual: 'Gesicht in die Kamera', voiceover: 'Danke, dass du Teil davon bist. ❤️' },
      ],
      why: 'Geschichten mit Tiefpunkt und Wendepunkt erzeugen Empathie – Menschen kaufen von Menschen.',
    }),
  },
  howto: {
    name: 'Tutorial / How-to', pillar: 'Vertrauen', pattern: 'howto',
    build: (c) => ({
      title: `So geht's: ${c.p.tipList[0]}`,
      hooks: [`So verbesserst du ${c.p.result} in 30 Sekunden`, `${c.p.tipList[0]} – speicher dir das!`, `Der einfachste Trick, den kaum jemand kennt`],
      script: [
        { time: '0–2s', visual: 'Ergebnis zuerst zeigen (Payoff vorziehen)', voiceover: `So verbesserst du ${c.p.result} in 30 Sekunden.` },
        { time: '2–10s', visual: 'Schritt 1 in Nahaufnahme', voiceover: `Schritt eins: ${c.p.tipList[0]}.` },
        { time: '10–18s', visual: 'Schritt 2', voiceover: `Schritt zwei: ${c.p.tipList[1]}.` },
        { time: '18–26s', visual: 'Schritt 3', voiceover: `Und zum Schluss: ${c.p.tipList[2]}.` },
        { time: '26–30s', visual: 'Ergebnis nochmal + Text „Speichern!“', voiceover: 'Speicher dir das für später.' },
      ],
      why: 'Mehrwert-Content wird gespeichert – Saves sind eines der stärksten Ranking-Signale.',
    }),
  },
  pov: {
    name: 'POV', pillar: 'Community', pattern: 'pov',
    build: (c) => ({
      title: `POV: Du entdeckst ${c.brandPov}`,
      hooks: [`POV: Du hast endlich etwas gefunden, das ${c.p.result} wirklich besser macht`, `POV: Deine Freunde fragen, wo du das her hast`, `POV: Der Moment, in dem es Klick macht`],
      script: [
        { time: '0–3s', visual: 'Ich-Perspektive, Text-Overlay „POV: …“, Trend-Sound', voiceover: '(kein Voiceover – nur Sound & Text)' },
        { time: '3–8s', visual: 'Reaktion: Augen weiten sich, Produkt kommt ins Bild', voiceover: '' },
        { time: '8–14s', visual: 'Schneller Schnitt: Produkt in Aktion, Beat-synchron', voiceover: '' },
        { time: '14–18s', visual: 'Text: „Und jetzt willst du es auch, oder?“', voiceover: '' },
      ],
      why: 'POV versetzt Zuschauer direkt in die Szene – hohe Identifikation und Teil-Rate.',
    }),
  },
  myth: {
    name: 'Mythos aufdecken', pillar: 'Reichweite', pattern: 'controversy',
    build: (c) => ({
      title: `Mythos: „${c.p.myth}“`,
      hooks: [`Unpopuläre Meinung: „${c.p.myth}“ ist kompletter Quatsch.`, `Das hat dir jeder falsch erklärt.`, `Ich sag's jetzt einfach: ${c.p.myth}? Nein.`],
      script: [
        { time: '0–3s', visual: 'Direkt in die Kamera, entschlossener Blick', voiceover: `Unpopuläre Meinung: „${c.p.myth}“ – stimmt nicht.` },
        { time: '3–12s', visual: 'Beweis zeigen (Vergleich, Zahlen, Beispiel)', voiceover: 'Und hier ist der Beweis.' },
        { time: '12–20s', visual: 'Erklärung mit Text-Overlays', voiceover: 'Was wirklich zählt, ist etwas ganz anderes.' },
        { time: '20–25s', visual: 'Frage als Overlay', voiceover: 'Siehst du das anders? Diskutier mit mir in den Kommentaren.' },
      ],
      why: 'Polarisierende Aussagen treiben Kommentare – Diskussionen pushen das Video im Algorithmus.',
    }),
  },
  behind: {
    name: 'Behind the Scenes', pillar: 'Vertrauen', pattern: 'secret',
    build: (c) => ({
      title: `Behind the Scenes: ${c.p.behind}`,
      hooks: [`Das zeigt dir sonst niemand: ${c.p.behind}`, `So sieht es wirklich bei ${c.brandDat} aus`, `Kein Filter, keine Show – nur echt.`],
      script: [
        { time: '0–2s', visual: 'Tür öffnet sich / Kamera geht „hinter die Kulissen“', voiceover: 'Das zeigt dir sonst niemand.' },
        { time: '2–15s', visual: 'Zeitraffer: Prozess in 5–6 schnellen Clips', voiceover: `Heute zeige ich dir, ${c.p.behind}.` },
        { time: '15–22s', visual: 'Kleiner Fail / ehrlicher Moment', voiceover: 'Und ja – nicht alles klappt beim ersten Mal. 😅' },
        { time: '22–27s', visual: 'Fertiges Ergebnis', voiceover: 'Aber am Ende lohnt es sich jedes Mal.' },
      ],
      why: 'Authentische Einblicke bauen Vertrauen auf; kleine Fails machen die Marke menschlich.',
    }),
  },
  transformation: {
    name: 'Vorher / Nachher', pillar: 'Verkauf', pattern: 'transformation',
    build: (c) => ({
      title: c.p.transformation,
      hooks: [`Warte bis zum Ende … ${c.p.transformation}`, `Vorher vs. nachher – der Unterschied ist krass`, `Niemand glaubt mir, dass das dieselbe Person/derselbe Ort ist`],
      script: [
        { time: '0–2s', visual: 'Vorher-Zustand, Text „Warte bis zum Ende“', voiceover: 'Warte bis zum Ende.' },
        { time: '2–12s', visual: 'Prozess im Zeitraffer, Beat-synchron', voiceover: '' },
        { time: '12–16s', visual: 'Transition (Hand vor Kamera / Snap)', voiceover: '' },
        { time: '16–22s', visual: 'Nachher-Reveal, langsame Kamerafahrt', voiceover: `Und das alles mit ${c.product}.` },
        { time: '22–25s', visual: 'Split-Screen vorher/nachher', voiceover: `${c.goal.cta}.` },
      ],
      why: 'Der Payoff am Ende maximiert Watchtime und Rewatches – perfekt für den Algorithmus.',
    }),
  },
  reply: {
    name: 'Kommentar-Antwort', pillar: 'Community', pattern: 'question',
    build: (c) => ({
      title: 'Antwort auf die meistgestellte Frage',
      hooks: [`„Lohnt sich ${c.product} wirklich?“ – ehrliche Antwort`, 'Ihr fragt es mich jeden Tag, also hier die Antwort', 'Diese Frage bekomme ich 20× pro Woche …'],
      script: [
        { time: '0–3s', visual: 'Kommentar-Sticker einblenden (Reply-Funktion)', voiceover: 'Ihr fragt es mich jeden Tag, also hier die Antwort.' },
        { time: '3–15s', visual: 'Ehrliche Antwort mit Beispielen', voiceover: 'Kurz gesagt: Ja – aber nur, wenn du auf diese eine Sache achtest.' },
        { time: '15–22s', visual: 'Demonstration', voiceover: 'Ich zeig dir genau, was ich meine.' },
        { time: '22–25s', visual: 'Text: „Nächste Frage?“', voiceover: 'Stell mir deine Frage – ich antworte mit einem Video.' },
      ],
      why: 'Reply-Videos belohnen Community-Interaktion und erzeugen eine Endlosschleife an Content-Ideen.',
    }),
  },
  offer: {
    name: 'Angebot / Call-to-Action', pillar: 'Verkauf', pattern: 'list',
    build: (c) => ({
      title: `3 Gründe, warum ${c.product} sich lohnt`,
      hooks: [`3 Gründe, warum ${c.product} sich lohnt – Grund 3 überzeugt jeden`, 'Wenn du noch überlegst, schau dir das an', 'Nur diese Woche – danach ist es wieder weg'],
      script: [
        { time: '0–2s', visual: 'Produkt groß im Bild, Zahl „3“ als Overlay', voiceover: `3 Gründe, warum ${c.product} sich lohnt.` },
        { time: '2–8s', visual: 'Grund 1 visualisiert', voiceover: 'Erstens: Qualität, die man sofort sieht.' },
        { time: '8–14s', visual: 'Grund 2 visualisiert', voiceover: 'Zweitens: Du merkst den Unterschied im Alltag.' },
        { time: '14–20s', visual: 'Kundenbewertung', voiceover: 'Und drittens: Hunderte zufriedene Kunden.' },
        { time: '20–24s', visual: 'Angebot + Dringlichkeit (Countdown-Sticker)', voiceover: `${c.goal.cta}.` },
      ],
      why: 'Konkrete Gründe beantworten Einwände; Dringlichkeit verwandelt Interesse in Kaufentscheidungen.',
    }),
  },
};

// Default format order per goal; the niche analysis re-ranks these.
const GOAL_FORMATS = {
  sales: ['mistakes', 'product', 'story', 'transformation', 'howto', 'pov', 'offer', 'myth', 'behind', 'reply'],
  leads: ['mistakes', 'howto', 'story', 'myth', 'transformation', 'reply', 'offer', 'behind', 'pov', 'product'],
  reach: ['mistakes', 'pov', 'myth', 'transformation', 'howto', 'reply', 'behind', 'story', 'product', 'offer'],
  brand: ['story', 'behind', 'howto', 'myth', 'pov', 'reply', 'transformation', 'mistakes', 'product', 'offer'],
  launch: ['behind', 'story', 'product', 'pov', 'transformation', 'offer', 'reply', 'mistakes', 'howto', 'myth'],
  local: ['behind', 'pov', 'product', 'mistakes', 'reply', 'transformation', 'story', 'offer', 'howto', 'myth'],
  community: ['myth', 'pov', 'reply', 'mistakes', 'story', 'howto', 'behind', 'transformation', 'product', 'offer'],
  recruiting: ['behind', 'story', 'pov', 'myth', 'reply', 'howto', 'mistakes', 'transformation', 'product', 'offer'],
};

function guessBrand(description) {
  const quoted = description.match(/[„"“']([^„"“”']{2,40})[“"”']/);
  if (quoted) return quoted[1].trim();
  const named = description.match(/\b(?:heißt|namens|marke|brand|firma|shop)\s+([A-ZÄÖÜ][\wÄÖÜäöüß&-]+(?:\s[A-ZÄÖÜ][\wÄÖÜäöüß&-]+)?)/);
  return named ? named[1] : null;
}

function rankFormats(goal, analysis) {
  const base = GOAL_FORMATS[goal];
  if (!analysis?.patterns?.length) return base.map((id) => ({ id, inspiredBy: '' }));
  const boost = new Map(analysis.patterns.slice(0, 4).map((p, i) => [p.id, { rank: i, p }]));
  return base
    .map((id, i) => {
      const b = boost.get(FORMATS[id].pattern);
      return { id, score: b ? -10 + b.rank : i, inspiredBy: b ? `${b.p.label} (z.B. „${b.p.examples[0]}“)` : '' };
    })
    .sort((a, b) => a.score - b.score);
}

const GENERIC_TAGS = ['#fyp', '#viral', '#foryou', '#trending', '#tipps', '#deutschland', '#explore', '#lernenmittiktok', '#contentcreator', '#reelsdeutschland'];

function hashtagsFor(rnd, profile, brand, count) {
  const want = HASHTAG_COUNTS.includes(Number(count)) ? Number(count) : 8;
  const tags = brand ? ['#' + brand.toLowerCase().replace(/[^a-z0-9äöüß]/g, '')] : [];
  const pools = [[...profile.hashtags], [...GENERIC_TAGS]];
  for (const pool of pools) {
    while (tags.length < want && pool.length) {
      const tag = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags.slice(0, want);
}

const EMOJI_RE = /\s*\p{Extended_Pictographic}️?/gu;
export const stripEmojis = (text) => text.replace(EMOJI_RE, '').replace(/[ \t]+\n/g, '\n').trim();

// Swap on-camera shots for faceless alternatives (B-roll, hands, screen, product).
function makeFaceless(script) {
  return script.map((beat) => /gesicht|in die kamera|blick|reaktion|ich-perspektive/i.test(beat.visual)
    ? { ...beat, visual: 'B-Roll: Hände, Produkt-Close-up oder Screen-Recording mit großem Text-Overlay (kein Gesicht)' }
    : beat);
}

const PLATFORM_TIPS = {
  TikTok: { adjustment: 'Trend-Sound nutzen, schnelle Schnitte alle 1–2 Sek., Untertitel in TikTok-Schrift.', cta: 'Kommentiere „Teil 2“' },
  'Instagram Reels': { adjustment: 'Ästhetischere Farbgebung, Cover-Bild fürs Grid gestalten, Caption etwas länger.', cta: null },
  'YouTube Shorts': { adjustment: 'Mehr Kontext & Erklärung, nahtloser Loop am Ende (letzter Satz führt in den ersten).', cta: 'Abonniere für mehr' },
};

function variantsFor(post, c, analysis, opts) {
  const lengths = (VIDEO_LENGTHS[opts.videoLength] || VIDEO_LENGTHS.mix).ranges;
  const median = analysis?.medianDuration;
  return opts.platforms.map((platform) => {
    const i = PLATFORMS.indexOf(platform);
    let length = lengths[platform];
    if (platform === 'TikTok' && median && (!opts.videoLength || opts.videoLength === 'mix')) {
      length = `${Math.max(7, Math.round(median * 0.9))}–${Math.round(median * 1.1)} Sek.`;
    }
    const tip = PLATFORM_TIPS[platform];
    return {
      platform,
      length,
      onScreenText: post.hooks[i % post.hooks.length],
      adjustment: tip.adjustment + (opts.faceless ? ' Faceless umsetzen: Stimme aus dem Off, Text-Overlays, Detailaufnahmen.' : ''),
      cta: opts.ctaChosen ? c.goal.cta : tip.cta || c.goal.cta,
    };
  });
}

export function generatePlanOffline(input, analysis = null) {
  const description = String(input.description || '').trim();
  const industryKey = input.industry && INDUSTRIES[input.industry] ? input.industry : detectIndustry(description);
  const goalKey = input.goal && GOALS[input.goal] ? input.goal : detectGoal(description);
  const p = INDUSTRIES[industryKey];
  const cta = CTAS[input.cta]?.text;
  const goal = { ...GOALS[goalKey], cta: cta || GOALS[goalKey].cta };
  const tone = TONES[input.tone] || null;
  const platforms = (Array.isArray(input.platforms) ? input.platforms : []).filter((x) => PLATFORMS.includes(x));
  const opts = {
    platforms: platforms.length ? PLATFORMS.filter((x) => platforms.includes(x)) : PLATFORMS,
    videoLength: input.videoLength,
    ctaChosen: Boolean(cta),
  };
  const rnd = seededRandom(`${description}|${input.seed ?? 0}`);
  const brandName = String(input.brand || '').trim() || guessBrand(description);
  const brandForms = brandName
    ? { brand: brandName, brandAcc: brandName, brandDat: brandName, brandPov: brandName }
    : { brand: 'meine Marke', brandAcc: 'meine Marke', brandDat: 'meiner Marke', brandPov: 'diese Marke' };
  const postsPerWeek = SLOTS[input.postsPerWeek] ? Number(input.postsPerWeek) : 7;
  const weeks = Math.min(Math.max(Number(input.weeks) || 1, 1), 4);

  const allowed = (Array.isArray(input.formats) ? input.formats : []).filter((f) => FORMATS[f]);
  let ranked = rankFormats(goalKey, analysis);
  if (allowed.length) ranked = ranked.filter((r) => allowed.includes(r.id));
  const posts = [];
  const uses = new Map();
  let n = 0;
  for (let w = 0; w < weeks; w++) {
    for (const slot of SLOTS[postsPerWeek]) {
      const pick0 = ranked[n % ranked.length];
      const fmt = FORMATS[pick0.id];
      const used = uses.get(pick0.id) || 0;
      uses.set(pick0.id, used + 1);
      const ctx = { p, goal, ...brandForms, product: p.products[used % p.products.length] };
      const built = fmt.build(ctx);
      const hooks = [...built.hooks];
      const faceless = input.onCamera === 'faceless' || (input.onCamera === 'mixed' && n % 2 === 1);
      // Remix the strongest niche pattern into the hook set as a fresh variant
      const top = analysis?.patterns?.[0];
      if (top && top.id !== fmt.pattern && top.id === 'pov') hooks[2] = `POV: ${built.title}`;
      if (top && top.id !== fmt.pattern && top.id === 'question') hooks[2] = `Wusstest du, warum ${built.title.toLowerCase()}?`;
      const post = {
        day: weeks > 1 ? `${WEEKDAYS[slot]} (Woche ${w + 1})` : WEEKDAYS[slot],
        dayIndex: w * 7 + slot,
        format: fmt.name,
        pillar: fmt.pillar,
        title: built.title,
        hooks,
        script: faceless ? makeFaceless(built.script) : built.script,
        caption: '',
        hashtags: [],
        variants: [],
        postingTime: pick(rnd, TIMES),
        whyItWorks: built.why,
        inspiredBy: pick0.inspiredBy,
      };
      const closers = tone ? tone.closers : ['Speicher dir das für später 📌', 'Teile das mit jemandem, der das sehen muss 👀', 'Was meinst du? 👇'];
      const lead = input.emojis === 'viele' ? `${pick(rnd, ['🔥', '✨', '🚀', '😍', '👀'])} ` : '';
      post.caption = `${lead}${hooks[0]}\n\n${pick(rnd, closers)}\n\n👉 ${goal.cta}`;
      if (input.emojis === 'keine') {
        post.caption = stripEmojis(post.caption);
        post.hooks = post.hooks.map(stripEmojis);
        post.script = post.script.map((b) => ({ ...b, voiceover: stripEmojis(b.voiceover) }));
      }
      post.hashtags = hashtagsFor(rnd, p, brandName, input.hashtagCount);
      post.variants = variantsFor(post, ctx, analysis, { ...opts, faceless });
      posts.push(post);
      n++;
    }
  }

  const pillars = [...new Set(posts.map((x) => x.pillar))];
  return {
    summary: `Strategie für ${p.label} mit Ziel „${goal.label}“: Reichweiten-Formate holen neue Zuschauer, Vertrauens-Formate machen aus ihnen Fans, und gezielte Verkaufs-Posts wandeln sie in Kunden um.` +
      (tone ? ` Tonalität: ${tone.label}.` : '') +
      (analysis ? ` Die Formate basieren auf den ${analysis.videoCount} analysierten Nischen-Videos – stärkstes Muster: ${analysis.patterns[0].label}.` : ''),
    audience: String(input.audience || '').trim() || p.audience,
    contentPillars: pillars,
    posts,
    meta: { engine: 'offline', industry: industryKey, goal: goalKey },
  };
}

import { toICS, toMarkdown, toCSV } from './export.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const state = { me: null, plan: null, planId: null, lastInput: null, platform: 'TikTok', seed: 0 };

const SAMPLE = `3 Fehler, die dein Outfit billig aussehen lassen | 2,1M | 180k | 3,2k | 12k | 0:24
POV: Du findest endlich die perfekte Jeans | 850k | 92k | 800 | 4k | 15
Ich hätte nie gedacht, dass Leinen so edel aussieht | 1,4M | 120k | 2k | 9k | 31
Hör auf, diese Sneaker zu deinem Anzug zu tragen | 960k | 71k | 5,1k | 3k | 19
Vorher vs. nachher: Gleiches Budget, anderer Look | 1,1M | 140k | 1,2k | 15k | 27
Warum sehen alle Italiener so gut angezogen aus? | 640k | 48k | 2,9k | 2k | 38
5 Basics, die jeder Mann besitzen sollte | 720k | 66k | 900 | 11k | 33
Wie ich meine Modemarke mit 500 € gestartet habe | 410k | 39k | 1,1k | 1,5k | 52`;

const LOADING_STEPS = ['Analysiere deine Nische …', 'Mische Hooks …', 'Schreibe Skripte …', 'Optimiere Captions …', 'Plane deinen Kalender …', 'Fast fertig …'];

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Unbekannter Fehler'), { status: res.status, data });
  return data;
}

function renderQuota(quota) {
  const el = $('#quota');
  if (quota.tier === 'pro') {
    el.textContent = '⚡ Pro';
    el.className = 'pill pro';
  } else {
    el.textContent = `${quota.remaining}/${quota.limit} frei`;
    el.className = 'pill';
  }
}

async function loadMe() {
  state.me = await api('/api/me');
  renderQuota(state.me.quota);
  $('#freeCount').textContent = state.me.pricing.freeGenerations;
  const f = state.me.features;
  $('#billingNote').textContent = f.stripe ? 'Sichere Zahlung über Stripe.' : f.demoUpgrade ? 'Demo-Modus: Pro wird 30 Tage kostenlos freigeschaltet.' : '';
}

/* ---------- niche lab ---------- */
function renderAnalysis(a, target = $('#analysis')) {
  if (!a) { target.innerHTML = ''; return; }
  const max = Math.max(...a.patterns.map((p) => p.share));
  target.innerHTML = `
    <div class="analysis">
      <b>🔬 ${a.videoCount} Videos analysiert</b>
      <ul class="insights">${a.insights.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <div class="bars">${a.patterns.slice(0, 6).map((p) => `
        <div class="bar" title="${esc(p.why)}"><span>${esc(p.label)}</span><div class="track"><div class="fill" style="width:${(p.share / max) * 100}%"></div></div><span>${Math.round(p.share * 100)}%</span></div>`).join('')}
      </div>
      ${a.keywords.some((k) => k.count > 1) ? `<div class="kw">${a.keywords.filter((k) => k.count > 1).map((k) => `<span>${esc(k.word)} ×${k.count}</span>`).join('')}</div>` : ''}
    </div>`;
}

$('#analyzeBtn').addEventListener('click', async () => {
  const videos = $('[name=nicheVideos]').value;
  try {
    const { analysis } = await api('/api/analyze', { method: 'POST', body: { videos } });
    renderAnalysis(analysis);
  } catch (e) { toast(e.message); }
});
$('#sampleBtn').addEventListener('click', () => { $('[name=nicheVideos]').value = SAMPLE; $('#analyzeBtn').click(); });

$$('[data-example]').forEach((b) => b.addEventListener('click', () => { $('#description').value = b.dataset.example; $('#description').focus(); }));

/* ---------- generation ---------- */
function readForm() {
  const fd = new FormData($('#gen'));
  const input = Object.fromEntries([...fd.entries()].filter(([, v]) => String(v).trim() !== ''));
  input.description = $('#description').value.trim();
  return input;
}

async function generate(input) {
  $('#formError').textContent = '';
  $('#genBtn').disabled = true;
  $('#loading').hidden = false;
  $('#result').hidden = true;
  let step = 0;
  $('#loadingText').textContent = LOADING_STEPS[0];
  const ticker = setInterval(() => { step = Math.min(step + 1, LOADING_STEPS.length - 1); $('#loadingText').textContent = LOADING_STEPS[step]; }, 1800);
  $('#loading').scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    const data = await api('/api/generate', { method: 'POST', body: input });
    state.plan = data.plan;
    state.planId = data.id;
    state.lastInput = input;
    renderQuota(data.quota);
    renderPlan();
  } catch (e) {
    $('#formError').textContent = e.message;
    if (e.status === 402) { renderQuota(e.data.quota); openDialog('pricing'); }
  } finally {
    clearInterval(ticker);
    $('#loading').hidden = true;
    $('#genBtn').disabled = false;
  }
}

$('#gen').addEventListener('submit', (e) => {
  e.preventDefault();
  state.seed = 0;
  generate(readForm());
});
$('#regenBtn').addEventListener('click', () => {
  if (!state.lastInput) return;
  state.seed += 1;
  generate({ ...state.lastInput, seed: state.seed });
});

/* ---------- rendering ---------- */
const pillarColor = (p) => `var(--pillar-${p}, var(--cyan))`;

function renderPlan() {
  const plan = state.plan;
  $('#result').hidden = false;
  $('#planTitle').textContent = `${plan.posts.length} Posts · ${new Set(plan.posts.map((p) => p.format)).size} Formate`;
  $('#planSummary').textContent = plan.summary;
  $('#planAudience').textContent = `🎯 Zielgruppe: ${plan.audience}`;
  $('#pillars').innerHTML = plan.contentPillars.map((p) => `<span class="tag" style="--c:${pillarColor(p)}">${esc(p)}</span>`).join('') +
    (plan.meta?.engine === 'offline' ? '<span class="pill small" title="Setze ANTHROPIC_API_KEY für KI-generierte Pläne">⚙️ Offline-Engine</span>' : '<span class="pill small">🤖 Claude</span>');
  const insights = $('#planInsights');
  if (plan.analysis) { insights.innerHTML = '<details><summary class="muted">Nischen-Analyse anzeigen</summary><div id="planAnalysis"></div></details>'; renderAnalysis(plan.analysis, $('#planAnalysis')); }
  else insights.innerHTML = '';
  renderCalendar();
  $('#result').scrollIntoView({ behavior: 'smooth' });
}

function renderCalendar() {
  $('#calendar').innerHTML = state.plan.posts.map((p, i) => {
    const v = p.variants.find((x) => x.platform === state.platform) || p.variants[0];
    return `
      <button class="post" data-i="${i}" style="--c:${pillarColor(p.pillar)}">
        <div class="day"><b>${esc(p.day)}</b><span>${esc(p.postingTime)} Uhr</span></div>
        <div class="fmt">🎬 ${esc(p.format)}</div>
        <div class="hook">„${esc(v?.onScreenText || p.hooks[0])}“</div>
        <div class="meta"><span>${esc(p.pillar)}</span>${v ? `<span>${esc(v.length)}</span>` : ''}<span>${p.hashtags.length} Hashtags</span></div>
        ${p.inspiredBy ? `<div class="inspired">🧬 Inspiriert von: ${esc(p.inspiredBy)}</div>` : ''}
      </button>`;
  }).join('');
}

$('#calendar').addEventListener('click', (e) => {
  const card = e.target.closest('.post');
  if (card) openPost(Number(card.dataset.i));
});

$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => x.classList.toggle('active', x === t));
  state.platform = t.dataset.platform;
  renderCalendar();
}));

function copyBtn(text) {
  return `<button class="copy" data-copy="${esc(text)}">Kopieren</button>`;
}

function openPost(i) {
  const p = state.plan.posts[i];
  $('#postDetail').innerHTML = `
    <div class="detail">
      <p class="eyebrow">${esc(p.day)} · ${esc(p.postingTime)} Uhr · ${esc(p.format)}</p>
      <h2>${esc(p.title)}</h2>
      <span class="tag" style="--c:${pillarColor(p.pillar)}">${esc(p.pillar)}</span>

      <div class="section"><h3>Hooks ${copyBtn(p.hooks.join('\n'))}</h3>
        <ol class="hooks">${p.hooks.map((h) => `<li><span>${esc(h)}</span>${copyBtn(h)}</li>`).join('')}</ol></div>

      <div class="section"><h3>Skript ${copyBtn(p.script.map((b) => `[${b.time}] ${b.visual}\n${b.voiceover}`).join('\n\n'))}</h3>
        <table class="script">${p.script.map((b) => `<tr><td>${esc(b.time)}</td><td>${esc(b.visual)}</td><td>${esc(b.voiceover)}</td></tr>`).join('')}</table></div>

      <div class="section"><h3>Caption ${copyBtn(`${p.caption}\n\n${p.hashtags.join(' ')}`)}</h3>
        <div class="caption">${esc(p.caption)}</div></div>

      <div class="section"><h3>Hashtags ${copyBtn(p.hashtags.join(' '))}</h3>
        <div class="hashtags">${p.hashtags.map((h) => `<span>${esc(h)}</span>`).join('')}</div></div>

      <div class="section"><h3>Plattform-Varianten</h3>
        <div class="variants">${p.variants.map((v) => `
          <div class="variant ${v.platform === state.platform ? 'active' : ''}">
            <b>${esc(v.platform)}</b><span class="muted small">⏱ ${esc(v.length)}</span>
            <span>📝 „${esc(v.onScreenText)}“</span><span>${esc(v.adjustment)}</span><span>👉 ${esc(v.cta)}</span>
          </div>`).join('')}</div></div>

      <div class="section"><div class="why">💡 <b>Warum das funktioniert:</b> ${esc(p.whyItWorks)}${p.inspiredBy ? `<br>🧬 <b>Nischen-Vorlage:</b> ${esc(p.inspiredBy)}` : ''}</div></div>
    </div>`;
  $('#postDialog').showModal();
}

document.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) {
    await navigator.clipboard.writeText(c.dataset.copy);
    toast('Kopiert ✓');
  }
});

/* ---------- export ---------- */
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#exportBtn').addEventListener('click', () => { $('#exportMenu').hidden = !$('#exportMenu').hidden; });
document.addEventListener('click', (e) => { if (!e.target.closest('.dropdown')) $('#exportMenu').hidden = true; });
$('#exportMenu').addEventListener('click', async (e) => {
  const kind = e.target.closest('[data-export]')?.dataset.export;
  if (!kind || !state.plan) return;
  if (kind === 'ics') download('virallab-plan.ics', toICS(state.plan), 'text/calendar');
  if (kind === 'md') download('virallab-plan.md', toMarkdown(state.plan), 'text/markdown');
  if (kind === 'csv') download('virallab-plan.csv', '\ufeff' + toCSV(state.plan), 'text/csv');
  if (kind === 'copy') { await navigator.clipboard.writeText(toMarkdown(state.plan)); toast('Plan kopiert ✓'); }
  $('#exportMenu').hidden = true;
});

/* ---------- dialogs ---------- */
function openDialog(name) {
  if (name === 'history') loadHistory();
  $(`#${name}Dialog`).showModal();
}
$$('[data-open]').forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.open)));
$$('dialog').forEach((d) => {
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
});

$('#upgradeBtn').addEventListener('click', async () => {
  try {
    const data = await api('/api/billing/checkout', { method: 'POST' });
    if (data.url) { location.href = data.url; return; }
    if (data.quota) renderQuota(data.quota);
    toast(data.alreadyPro ? 'Du bist bereits Pro ⚡' : 'Pro aktiviert ⚡ (Demo)');
    $('#pricingDialog').close();
    await loadMe();
  } catch (e) { toast(e.message); }
});

async function loadHistory() {
  const list = $('#historyList');
  list.innerHTML = '<p class="muted">Lade …</p>';
  const { plans } = await api('/api/plans');
  if (!plans.length) { list.innerHTML = '<p class="muted">Noch keine Pläne – erstelle deinen ersten oben.</p>'; return; }
  list.innerHTML = plans.map((p) => `
    <div class="history-item">
      <button class="open" data-plan="${p.id}">${esc(p.description)}<small>${new Date(p.createdAt).toLocaleString('de-DE')} · ${p.posts} Posts</small></button>
      <button class="copy" data-del="${p.id}">Löschen</button>
    </div>`).join('');
}
$('#historyList').addEventListener('click', async (e) => {
  const open = e.target.closest('[data-plan]');
  const del = e.target.closest('[data-del]');
  if (open) {
    const saved = await api(`/api/plans/${open.dataset.plan}`);
    state.plan = saved.plan; state.planId = saved.id; state.lastInput = saved.input;
    $('#historyDialog').close();
    renderPlan();
  } else if (del) {
    await api(`/api/plans/${del.dataset.del}`, { method: 'DELETE' });
    loadHistory();
  }
});

/* ---------- boot ---------- */
const params = new URLSearchParams(location.search);
if (params.get('checkout') === 'success') toast('Willkommen bei Pro ⚡');
if (params.get('checkout') === 'failed') toast('Zahlung konnte nicht bestätigt werden.');
if (params.has('checkout')) history.replaceState(null, '', '/');
loadMe().catch(() => toast('Server nicht erreichbar'));

// Builds a self-contained, browser-only demo of ViralLab (dist/virallab-demo.html):
// offline engine + analyzer run client-side, quota and plans live in localStorage.
// Usage: node scripts/build-demo.mjs
import fs from 'node:fs';
const R = new URL('../', import.meta.url).pathname;
const read = (f) => fs.readFileSync(R + f, 'utf8');
const strip = (s) => s.replace(/^import .*$/gm, '').replace(/^export (?=(const|function|async|let))/gm, '');

let app = strip(read('public/app.js'));
// Route API calls to the in-browser backend
app = app.replace(/async function api\(path, opts = \{\}\) \{[\s\S]*?\n\}\n/, 'const api = localApi;\n');
// Downloads are blocked in the artifact frame: show export text with a copy button instead
app = app.replace(/function download\(name, content, type\) \{[\s\S]*?\n\}\n/, `function download(name, content) {
  $('#exportName').textContent = name;
  $('#exportText').value = content;
  $('#exportDialog').showModal();
}
$('#exportCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#exportText').value); toast('Kopiert ✓'); }
  catch { $('#exportText').select(); toast('Text markiert – mit Strg/Cmd+C kopieren'); }
});
`);
app = app.replace("await navigator.clipboard.writeText(c.dataset.copy);\n    toast('Kopiert ✓');",
  "try { await navigator.clipboard.writeText(c.dataset.copy); toast('Kopiert ✓'); } catch { toast('Kopieren nicht möglich'); }");
app = app.replace("{ await navigator.clipboard.writeText(toMarkdown(state.plan)); toast('Plan kopiert ✓'); }",
  "{ download('virallab-plan.md', toMarkdown(state.plan)); }");
app = app.replace(/if \(kind === 'ics'\) download\('virallab-plan.ics', toICS\(state.plan\), 'text\/calendar'\);/, "if (kind === 'ics') download('virallab-plan.ics (in eine .ics-Datei einfügen)', toICS(state.plan));");

const localApi = `
// ---- In-browser backend (replaces the Express API in this demo) ----
const FREE_LIMIT = 10;
const LS = {
  get(k, d) { try { const v = localStorage.getItem('virallab:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('virallab:' + k, JSON.stringify(v)); } catch {} },
};
const mem = { user: LS.get('user', { generations: 0, proUntil: null }), plans: LS.get('plans', []) };
const isPro = () => mem.user.proUntil && new Date(mem.user.proUntil) > new Date();
const quota = () => isPro() ? { tier: 'pro', used: mem.user.generations, limit: null, remaining: null }
  : { tier: 'free', used: mem.user.generations, limit: FREE_LIMIT, remaining: Math.max(0, FREE_LIMIT - mem.user.generations) };
const fail = (status, error, data = {}) => { throw Object.assign(new Error(error), { status, data }); };
async function localApi(path, opts = {}) {
  const method = opts.method || 'GET';
  const body = opts.body || {};
  await new Promise((r) => setTimeout(r, path === '/api/generate' ? 2200 : 50));
  if (path === '/api/options') return optionCatalog();
  if (path === '/api/me') return { quota: quota(), features: { ai: false, stripe: false, demoUpgrade: true }, billing: { manageable: false }, pricing: { freeGenerations: FREE_LIMIT, proMonthlyEur: 9.99 } };
  if (path === '/api/analyze') {
    const analysis = analyzeNiche(String(body.videos || ''));
    if (!analysis) fail(400, 'Keine Videos erkannt. Füge mindestens eine Zeile mit einem Hook ein.');
    return { analysis };
  }
  if (path === '/api/generate') {
    const description = String(body.description || '').trim();
    if (description.length < 10) fail(400, 'Beschreibe dein Business in mindestens 10 Zeichen.');
    if (!isPro() && mem.user.generations >= FREE_LIMIT) fail(402, 'Deine 10 kostenlosen Generierungen sind aufgebraucht. Upgrade auf Pro für unbegrenzte Content-Pläne.', { quota: quota() });
    const input = { ...body, description };
    const analysis = input.nicheVideos ? analyzeNiche(input.nicheVideos) : null;
    const plan = { ...generatePlanOffline(input, analysis), analysis };
    mem.user.generations += 1; LS.set('user', mem.user);
    const id = Date.now().toString(36);
    const { nicheVideos, ...savedInput } = input;
    mem.plans.unshift({ id, createdAt: new Date().toISOString(), input: savedInput, plan });
    mem.plans = mem.plans.slice(0, 20); LS.set('plans', mem.plans);
    return { id, plan, quota: quota() };
  }
  if (path === '/api/plans') return { plans: mem.plans.map((p) => ({ id: p.id, createdAt: p.createdAt, description: p.input.description.slice(0, 120), posts: p.plan.posts.length })) };
  const m = path.match(/^\\/api\\/plans\\/(.+)$/);
  if (m) {
    const p = mem.plans.find((x) => x.id === m[1]);
    if (!p) fail(404, 'Plan nicht gefunden');
    if (method === 'DELETE') { mem.plans = mem.plans.filter((x) => x !== p); LS.set('plans', mem.plans); return { ok: true }; }
    return p;
  }
  if (path === '/api/billing/checkout') {
    if (isPro()) return { alreadyPro: true };
    mem.user.proUntil = new Date(Date.now() + 30 * 864e5).toISOString(); LS.set('user', mem.user);
    return { demo: true, quota: quota() };
  }
  fail(404, 'Unbekannte Aktion');
}
`;

const js = ['industries', 'options', 'analyzer', 'engine', 'catalog'].map((m) => strip(read(`src/${m}.js`)))
  .concat(strip(read('public/export.js')), localApi, app).join('\n');

let html = read('public/index.html');
const body = html.match(/<body>([\s\S]*)<\/body>/)[1]
  .replace('placeholder="Ich habe eine Modemarke und will mehr Verkäufe."></textarea>', 'placeholder="Ich habe eine Modemarke und will mehr Verkäufe.">Ich habe eine Modemarke und will mehr Verkäufe.</textarea>')
  .replace(/<script src="app.js" type="module"><\/script>/, '')
  .replace(/<footer class="foot">[\s\S]*?<\/footer>/, `<dialog id="exportDialog" class="sheet narrow">
    <button class="close" data-close aria-label="Schließen">✕</button>
    <h2>Export</h2>
    <p class="muted small" id="exportName"></p>
    <textarea id="exportText" rows="14" readonly></textarea>
    <div class="row"><button class="btn primary" id="exportCopy">In Zwischenablage kopieren</button></div>
  </dialog>
  <footer class="foot">ViralLab · Demo-Version: läuft komplett in deinem Browser mit der Offline-Engine, deine Pläne bleiben auf deinem Gerät.<br>Die volle App mit Claude-KI und Stripe-Abo: <a href="https://github.com/y4d8vszvyg-cyber/ViralLab">github.com/y4d8vszvyg-cyber/ViralLab</a></footer>`)
  .replace(/<a href="\/(agb|widerruf)" target="_blank">([^<]*)<\/a>/g, '$2');
const css = read('public/styles.css').replace(/^\/\* Self-hosted fonts[^\n]*\n(@font-face[^\n]*\n)+/, '').replace('html { color-scheme: dark; }', 'html, :root { color-scheme: dark; }') + `
.foot a { color: var(--cyan); }
#exportText { font-family: ui-monospace, monospace; font-size: .8rem; margin-top: .5rem; }
.hero { padding-top: 2.5rem; }
.topbar { top: env(safe-area-inset-top, 0px); }
@media (max-width: 520px) { .topbar nav .link { padding: .35rem .4rem; font-size: .85rem; } .logo { font-size: 1.15rem; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
`;
const out = `<title>ViralLab</title>
<meta name="description" content="Beschreibe dein Business – ViralLab erstellt Hooks, Skripte, Captions, Hashtags und einen Content-Kalender für TikTok, Reels & Shorts.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${css}
</style>
${body}
<script type="module">
${js}
</script>
`;
fs.mkdirSync(R + 'dist', { recursive: true });
fs.writeFileSync(R + 'dist/virallab-demo.html', out);
console.log(`dist/virallab-demo.html (${Math.round(out.length / 1024)} KB)`);

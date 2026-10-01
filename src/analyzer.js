// Niche analyzer: takes successful videos of a niche (pasted by the user) and
// extracts the patterns that made them work. The result feeds the generator so
// it can build *new* concepts on proven structures instead of copying videos.

export const HOOK_PATTERNS = [
  { id: 'mistakes', label: 'Fehler-Hook', re: /\b(fehler|mistake|falsch|nie wieder|stop|hör auf|vermeide)\b/i,
    template: 'Negative Spannung: Der Zuschauer will wissen, ob er den Fehler selbst macht.' },
  { id: 'list', label: 'Zahlen-Liste', re: /^\s*\d+\s|\b\d+\s+(tipps|gründe|dinge|wege|fehler|tricks|hacks|ideen|tips|things|ways|reasons)\b/i,
    template: 'Konkrete Zahl verspricht klaren, abgeschlossenen Mehrwert.' },
  { id: 'pov', label: 'POV', re: /\bpov\b/i,
    template: 'Der Zuschauer wird direkt in eine Situation versetzt – hohe Identifikation.' },
  { id: 'question', label: 'Frage', re: /\?\s*$/,
    template: 'Offene Frage erzeugt Neugier-Lücke.' },
  { id: 'secret', label: 'Geheimnis / Insider', re: /\b(geheim|secret|niemand|keiner|insider|trick|hack|verrät|nobody)\b/i,
    template: 'Exklusives Wissen – der Zuschauer will dazugehören.' },
  { id: 'transformation', label: 'Vorher/Nachher', re: /\b(vorher|nachher|before|after|transformation|von .* zu|glow ?up|makeover)\b/i,
    template: 'Sichtbare Veränderung liefert einen Payoff am Ende – hohe Watchtime.' },
  { id: 'story', label: 'Storytelling', re: /^\s*(ich|als ich|wie ich|i |when i|my |mein)/i,
    template: 'Persönliche Geschichte baut Vertrauen und Bindung auf.' },
  { id: 'surprise', label: 'Überraschung', re: /\b(nie gedacht|unglaublich|schockiert|krass|wow|never thought|didn.?t expect|plot twist)\b/i,
    template: 'Erwartungsbruch stoppt den Scroll.' },
  { id: 'controversy', label: 'Kontroverse Meinung', re: /\b(unpopular|unpopuläre|ehrlich gesagt|überbewertet|overrated|hot take|die wahrheit)\b/i,
    template: 'Polarisierung treibt Kommentare – der Algorithmus liebt Diskussionen.' },
  { id: 'howto', label: 'How-to', re: /\b(so geht|wie du|how to|anleitung|tutorial|schritt)\b/i,
    template: 'Direkter Nutzen – wird gespeichert und geteilt.' },
];

const STOPWORDS = new Set(('der die das und oder aber ich du er sie es wir ihr sie ein eine einen einem einer ' +
  'mit für von zu im in am an auf aus bei nach so wie was wer ist sind war hat habe hast nicht nie mehr ' +
  'dein deine mein meine diese dieser dieses the a an and or to of in on for is are my your this that with ' +
  'it i you how why what pov dass den dem des als auch noch nur schon mal hier man sich hätte gedacht warum alle jeder jede').split(' '));

function parseNumber(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase().replace(/\s/g, '');
  if (!s) return null;
  const m = s.match(/^([\d.,]+)(k|tsd|m|mio)?$/);
  if (!m) return null;
  let num = m[1];
  // "1.2" / "1,2" with suffix => decimal; "120.000" without suffix => thousands separator
  if (m[2]) num = num.replace(',', '.');
  else num = num.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
  const value = parseFloat(num);
  if (Number.isNaN(value)) return null;
  const mult = { k: 1e3, tsd: 1e3, m: 1e6, mio: 1e6 }[m[2]] || 1;
  return Math.round(value * mult);
}

function parseDuration(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  let m = s.match(/^(\d+):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d+)\s*(s|sek|sec)?$/);
  return m ? Number(m[1]) : null;
}

/**
 * Parse pasted video lines. Format per line (only the hook is required):
 *   Hook / Titel | Views | Likes | Kommentare | Shares | Dauer
 * Separators: "|", ";" or tab.
 */
export function parseVideos(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split(/\s*[|;\t]\s*/);
      const [hook, views, likes, comments, shares, duration] = parts;
      return {
        hook: hook.replace(/^["„“]|["“”]$/g, '').trim(),
        views: parseNumber(views),
        likes: parseNumber(likes),
        comments: parseNumber(comments),
        shares: parseNumber(shares),
        duration: parseDuration(duration),
      };
    })
    .filter((v) => v.hook.length > 0);
}

export function engagementRate(v) {
  if (!v.views) return null;
  const interactions = (v.likes || 0) + 2 * (v.comments || 0) + 3 * (v.shares || 0);
  return interactions / v.views;
}

export function classifyHook(hook) {
  const matches = HOOK_PATTERNS.filter((p) => p.re.test(hook)).map((p) => p.id);
  return matches.length ? matches : ['statement'];
}

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function analyzeNiche(text) {
  const videos = parseVideos(text).map((v) => ({ ...v, patterns: classifyHook(v.hook), er: engagementRate(v) }));
  if (!videos.length) return null;

  // Score: views (log) weighted by engagement. Videos without stats count as average.
  const score = (v) => (v.views ? Math.log10(v.views + 10) : 4) * (1 + (v.er ?? 0.05) * 10);
  const ranked = [...videos].sort((a, b) => score(b) - score(a));

  const byPattern = new Map();
  for (const v of videos) {
    for (const p of v.patterns) {
      const entry = byPattern.get(p) || { id: p, count: 0, totalScore: 0, examples: [] };
      entry.count += 1;
      entry.totalScore += score(v);
      if (entry.examples.length < 3) entry.examples.push(v.hook);
      byPattern.set(p, entry);
    }
  }
  const patterns = [...byPattern.values()]
    .map((e) => {
      const def = HOOK_PATTERNS.find((p) => p.id === e.id);
      return {
        id: e.id,
        label: def ? def.label : 'Aussage',
        why: def ? def.template : 'Direkte, klare Aussage.',
        count: e.count,
        share: e.count / videos.length,
        avgScore: e.totalScore / e.count,
        examples: e.examples,
      };
    })
    .sort((a, b) => b.avgScore * Math.sqrt(b.count) - a.avgScore * Math.sqrt(a.count));

  const words = new Map();
  for (const v of videos) {
    for (const w of v.hook.toLowerCase().match(/[a-zäöüß0-9#]{3,}/g) || []) {
      if (STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
      words.set(w, (words.get(w) || 0) + 1);
    }
  }
  const keywords = [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w, c]) => ({ word: w, count: c }));

  const durations = videos.map((v) => v.duration).filter(Boolean);
  const ers = videos.map((v) => v.er).filter((x) => x != null);
  const hookLengths = videos.map((v) => v.hook.split(/\s+/).length);

  const insights = [];
  if (patterns[0]) insights.push(`„${patterns[0].label}“ ist das stärkste Hook-Muster dieser Nische (${Math.round(patterns[0].share * 100)} % der Videos).`);
  const medDur = median(durations);
  if (medDur) insights.push(`Erfolgreiche Videos sind im Median ${Math.round(medDur)} Sekunden lang.`);
  const medHook = median(hookLengths);
  if (medHook) insights.push(`Die besten Hooks haben ~${Math.round(medHook)} Wörter – kurz genug für die ersten 2 Sekunden.`);
  const medEr = median(ers);
  if (medEr != null) insights.push(`Median-Engagement: ${(medEr * 100).toFixed(1)} % (Likes + 2× Kommentare + 3× Shares / Views).`);
  if (keywords[0]) insights.push(`Wiederkehrende Begriffe: ${keywords.slice(0, 5).map((k) => k.word).join(', ')}.`);

  return {
    videoCount: videos.length,
    topVideos: ranked.slice(0, 5),
    patterns,
    keywords,
    medianDuration: medDur,
    medianEngagement: medEr,
    medianHookWords: medHook,
    insights,
  };
}

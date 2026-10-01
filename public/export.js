// Pure export helpers (also unit-tested in Node).

const pad = (n) => String(n).padStart(2, '0');

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Next Monday (or today if Monday) at local midnight. */
export function nextMonday(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = (8 - d.getDay()) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export function toICS(plan, start = nextMonday()) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ViralLab//Content-Plan//DE', 'CALSCALE:GREGORIAN'];
  plan.posts.forEach((post, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + post.dayIndex);
    const [h, m] = (post.postingTime || '18:00').split(':').map(Number);
    const local = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h || 0)}${pad(m || 0)}00`;
    const desc = [`Hook: ${post.hooks[0]}`, '', ...post.script.map((b) => `${b.time}: ${b.voiceover || b.visual}`), '', post.caption, post.hashtags.join(' ')].join('\n');
    lines.push('BEGIN:VEVENT', `UID:virallab-${i}-${local}@virallab`, `DTSTAMP:${stamp}`, `DTSTART:${local}`, 'DURATION:PT30M',
      `SUMMARY:${icsEscape(`🎬 ${post.format}: ${post.title}`)}`, `DESCRIPTION:${icsEscape(desc)}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function toMarkdown(plan) {
  const out = ['# ViralLab Content-Plan', '', plan.summary, '', `**Zielgruppe:** ${plan.audience}`, ''];
  for (const post of plan.posts) {
    out.push(`## ${post.day} · ${post.postingTime} – ${post.format}`, '', `### 🎬 ${post.title}`, '', '**Hooks**');
    post.hooks.forEach((h, i) => out.push(`${i + 1}. ${h}`));
    out.push('', '**Skript**', '', '| Zeit | Bild | Text |', '|---|---|---|');
    post.script.forEach((b) => out.push(`| ${b.time} | ${b.visual.replace(/\|/g, '/')} | ${b.voiceover.replace(/\|/g, '/')} |`));
    out.push('', '**Caption**', '', post.caption, '', post.hashtags.join(' '), '', '**Plattform-Varianten**');
    post.variants.forEach((v) => out.push(`- **${v.platform}** (${v.length}): ${v.adjustment} – Overlay: „${v.onScreenText}“ – CTA: ${v.cta}`));
    out.push('', `> 💡 ${post.whyItWorks}`, '');
  }
  return out.join('\n');
}

export function toCSV(plan) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Tag', 'Uhrzeit', 'Format', 'Säule', 'Titel', 'Hook 1', 'Hook 2', 'Hook 3', 'Skript', 'Caption', 'Hashtags'];
  const rows = plan.posts.map((p) => [p.day, p.postingTime, p.format, p.pillar, p.title, ...p.hooks.slice(0, 3),
    p.script.map((b) => `${b.time}: ${b.voiceover || b.visual}`).join(' / '), p.caption, p.hashtags.join(' ')]);
  return [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
}

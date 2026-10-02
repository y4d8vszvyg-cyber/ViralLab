// Claude-powered plan generation. Falls back to the offline engine when no API
// key is configured or the API call fails, so the app always delivers a plan.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { PlanSchema } from './schema.js';
import { generatePlanOffline, WEEKDAYS, SLOTS } from './engine.js';
import { INDUSTRIES, GOALS } from './industries.js';
import { PLATFORMS, TONES, VIDEO_LENGTHS, ON_CAMERA, CTAS, EMOJIS } from './options.js';
import { FORMATS } from './engine.js';

const MODEL = process.env.VIRALLAB_MODEL || 'claude-opus-5-5';

const SYSTEM_PROMPT = `Du bist ViralLab, eine Content-Strategin für Kurzvideos (TikTok, Instagram Reels, YouTube Shorts) mit Fokus auf den deutschsprachigen Markt.

Du erstellst aus der Beschreibung eines Unternehmens einen kompletten, sofort umsetzbaren Content-Plan. Jeder Post hat:
- ein klares Format (z.B. Fehler-Liste, Produktvideo, Storytelling, POV, Tutorial, Vorher/Nachher, Mythos, Behind the Scenes, Kommentar-Antwort),
- drei Hooks, die in den ersten 2 Sekunden den Scroll stoppen (stärkster zuerst),
- ein Skript in Zeitfenstern mit Bild und gesprochenem Text,
- eine Caption mit Call-to-Action und 6–9 passende Hashtags (Mix aus Nische und breit),
- Varianten für TikTok, Instagram Reels und YouTube Shorts mit konkreten Unterschieden.

Mische Reichweite-, Vertrauens-, Community- und Verkaufs-Posts passend zum Ziel. Schreibe auf Deutsch, locker, konkret und branchenspezifisch, ohne Floskeln. Erfinde keine Fakten über das Unternehmen (keine erfundenen Preise, Kundenzahlen oder Auszeichnungen). Nutze Platzhalter in eckigen Klammern, wo echte Details fehlen.

Wenn eine Nischenanalyse erfolgreicher Videos mitgeliefert wird: Kopiere keine Videos. Leite die Muster ab, die sie erfolgreich machen (Hook-Typ, Länge, Struktur, Emotion), und baue daraus neue, eigene Konzepte für dieses Unternehmen. Benenne im Feld inspiredBy, welches Muster die Vorlage war.`;

function slotsFor(postsPerWeek, weeks) {
  const slots = SLOTS[postsPerWeek] || SLOTS[7];
  const out = [];
  for (let w = 0; w < weeks; w++) for (const s of slots) out.push({ dayIndex: w * 7 + s, day: weeks > 1 ? `${WEEKDAYS[s]} (Woche ${w + 1})` : WEEKDAYS[s] });
  return out;
}

export function buildUserPrompt(input, analysis) {
  const weeks = Math.min(Math.max(Number(input.weeks) || 1, 1), 4);
  const slots = slotsFor(Number(input.postsPerWeek) || 7, weeks);
  const lines = [
    `<unternehmen>\n${input.description}\n</unternehmen>`,
    input.brand ? `Markenname: ${input.brand}` : '',
    INDUSTRIES[input.industry] ? `Branche: ${INDUSTRIES[input.industry].label}` : '',
    GOALS[input.goal] ? `Hauptziel: ${GOALS[input.goal].label}` : '',
    input.audience ? `Zielgruppe: ${input.audience}` : '',
    TONES[input.tone] ? `Tonalität: ${TONES[input.tone].label} (${TONES[input.tone].prompt})` : '',
    input.toneCustom ? `Zusätzliche Tonalitäts-Wünsche: ${input.toneCustom}` : '',
    VIDEO_LENGTHS[input.videoLength] ? `Videolänge: ${VIDEO_LENGTHS[input.videoLength].label}` : '',
    ON_CAMERA[input.onCamera] ? `Kamera: ${ON_CAMERA[input.onCamera].label}${input.onCamera === 'faceless' ? ' – Skripte ohne Gesicht im Bild (Voiceover, B-Roll, Text-Overlays)' : ''}` : '',
    CTAS[input.cta] ? `Call-to-Action in allen Posts: ${CTAS[input.cta].text}` : '',
    EMOJIS[input.emojis] ? `Emojis: ${EMOJIS[input.emojis].label}` : '',
    input.hashtagCount ? `Genau ${input.hashtagCount} Hashtags pro Post.` : '',
    `Plattform-Varianten nur für: ${(input.platforms?.length ? input.platforms : PLATFORMS).join(', ')}.`,
    input.formats?.length ? `Nutze nur diese Formate: ${input.formats.map((f) => FORMATS[f]?.name).filter(Boolean).join(', ')}.` : '',
    `Erstelle genau ${slots.length} Posts für diese Tage (day / dayIndex):\n${slots.map((s) => `- ${s.day} / ${s.dayIndex}`).join('\n')}`,
  ];
  if (analysis) {
    lines.push(`<nischenanalyse>
Analysierte Videos: ${analysis.videoCount}
Erkenntnisse:\n${analysis.insights.map((i) => `- ${i}`).join('\n')}
Stärkste Hook-Muster:\n${analysis.patterns.slice(0, 5).map((p) => `- ${p.label} (${Math.round(p.share * 100)} %): ${p.why} Beispiele: ${p.examples.map((e) => `„${e}“`).join(', ')}`).join('\n')}
Top-Videos:\n${analysis.topVideos.map((v) => `- „${v.hook}“${v.views ? ` – ${v.views.toLocaleString('de-DE')} Views` : ''}`).join('\n')}
</nischenanalyse>`);
  }
  return lines.filter(Boolean).join('\n\n');
}

let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function generatePlanAI(input, analysis) {
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: zodOutputFormat(PlanSchema) },
    // Route refused requests to a fallback model server-side instead of failing.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(input, analysis) }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'refusal') throw new Error('Anfrage wurde abgelehnt');
  if (message.stop_reason === 'max_tokens') throw new Error('Antwort wurde abgeschnitten');
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const parsed = PlanSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('Ungültiges Plan-Format von der KI');
  return { ...parsed.data, meta: { engine: 'claude', model: message.model } };
}

export async function generatePlan(input, analysis, { log = console } = {}) {
  if (aiEnabled()) {
    try {
      return await generatePlanAI(input, analysis);
    } catch (err) {
      log.warn?.(`[ai] Claude-Generierung fehlgeschlagen, nutze Offline-Engine: ${err.message}`);
    }
  }
  return generatePlanOffline(input, analysis);
}

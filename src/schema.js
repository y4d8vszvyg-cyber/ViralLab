import { z } from 'zod';

// Shared shape of a generated content plan. Used for Claude structured output
// and to validate plans from the offline engine.

export const PlatformVariantSchema = z.object({
  platform: z.enum(['TikTok', 'Instagram Reels', 'YouTube Shorts']),
  length: z.string().describe('Empfohlene Videolänge, z.B. "21–34 Sek."'),
  onScreenText: z.string().describe('Text-Overlay in den ersten 2 Sekunden'),
  adjustment: z.string().describe('Was auf dieser Plattform anders gemacht wird'),
  cta: z.string(),
});

export const ScriptBeatSchema = z.object({
  time: z.string().describe('Zeitfenster, z.B. "0–3s"'),
  visual: z.string().describe('Was man sieht / Kameraeinstellung'),
  voiceover: z.string().describe('Was gesprochen wird'),
});

export const PostSchema = z.object({
  day: z.string().describe('Wochentag, z.B. "Montag"'),
  dayIndex: z.number().int().describe('0-basierter Tag im Plan'),
  format: z.string().describe('Content-Format, z.B. "Fehler-Liste", "Produktvideo", "Storytelling"'),
  pillar: z.enum(['Reichweite', 'Vertrauen', 'Verkauf', 'Community']),
  title: z.string(),
  hooks: z.array(z.string()).describe('3 alternative Hooks, stärkster zuerst'),
  script: z.array(ScriptBeatSchema),
  caption: z.string(),
  hashtags: z.array(z.string()),
  variants: z.array(PlatformVariantSchema),
  postingTime: z.string().describe('Empfohlene Uhrzeit, z.B. "18:30"'),
  whyItWorks: z.string().describe('Welches Viral-Muster genutzt wird und warum'),
  inspiredBy: z.string().describe('Welches Muster aus der Nischenanalyse als Vorlage diente, oder leer'),
});

export const PlanSchema = z.object({
  summary: z.string().describe('2–3 Sätze Strategie-Zusammenfassung'),
  audience: z.string().describe('Zielgruppe in einem Satz'),
  contentPillars: z.array(z.string()),
  posts: z.array(PostSchema),
});

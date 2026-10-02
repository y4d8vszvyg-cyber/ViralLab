// Single source of truth for every selectable generator option. The server
// validates against it, the engine and the Claude prompt read it, and the
// frontend builds its form controls from /api/options (see catalog.js).

export const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube Shorts'];

export const TONES = {
  locker: { label: 'Locker & frech', prompt: 'locker, frech, Du-Ansprache, Umgangssprache erlaubt', closers: ['Speicher dir das für später 📌', 'Schick das deiner besten Freundin 👀', 'Na, ertappt? 😅'] },
  professionell: { label: 'Professionell & seriös', prompt: 'professionell, sachlich, kompetent, ohne Slang', closers: ['Speichern Sie sich diesen Beitrag für später.', 'Teilen Sie den Beitrag mit Ihrem Team.', 'Welche Erfahrung haben Sie gemacht?'] },
  humorvoll: { label: 'Humorvoll', prompt: 'witzig, selbstironisch, mit Pointen', closers: ['Markier jemanden, der genau so ist 😂', 'Ich kann nicht die Einzige sein, oder? 🙈', 'Teil 2? 👇'] },
  inspirierend: { label: 'Inspirierend', prompt: 'motivierend, emotional, mutmachend', closers: ['Du schaffst das. ✨', 'Speicher dir das für schwere Tage 💛', 'Wer braucht das heute? Teil es. 🙌'] },
  edel: { label: 'Edel & minimalistisch', prompt: 'hochwertig, ruhig, reduziert, wenige Worte', closers: ['Weniger, aber besser.', 'Für alle, die Qualität erkennen.', 'Speichern. Später ansehen.'] },
  nahbar: { label: 'Ehrlich & nahbar', prompt: 'ehrlich, persönlich, verletzlich, auf Augenhöhe', closers: ['Danke, dass du da bist ❤️', 'Erzähl mir deine Geschichte in den Kommentaren 👇', 'Ganz ehrlich: Wie geht es dir damit?'] },
  provokant: { label: 'Mutig & polarisierend', prompt: 'mutig, meinungsstark, polarisierend aber respektvoll', closers: ['Siehst du das anders? Diskutier mit mir 👇', 'Sag mir, dass ich falsch liege.', 'Das musste mal gesagt werden.'] },
  lehrreich: { label: 'Lehrreich & klar', prompt: 'erklärend, strukturiert, einfache Sprache', closers: ['Speicher dir das zum Nachschlagen 📌', 'Was soll ich als Nächstes erklären? 👇', 'Folge für mehr Tipps wie diesen.'] },
};

export const VIDEO_LENGTHS = {
  kurz: { label: 'Kurz (7–15 Sek.)', ranges: { TikTok: '7–12 Sek.', 'Instagram Reels': '8–15 Sek.', 'YouTube Shorts': '10–15 Sek.' } },
  mittel: { label: 'Mittel (15–30 Sek.)', ranges: { TikTok: '15–25 Sek.', 'Instagram Reels': '15–30 Sek.', 'YouTube Shorts': '20–30 Sek.' } },
  lang: { label: 'Lang (30–60 Sek.)', ranges: { TikTok: '30–60 Sek.', 'Instagram Reels': '30–60 Sek.', 'YouTube Shorts': '40–58 Sek.' } },
  mix: { label: 'Gemischt (empfohlen)', ranges: { TikTok: '15–30 Sek.', 'Instagram Reels': '20–45 Sek.', 'YouTube Shorts': '30–58 Sek.' } },
};

export const ON_CAMERA = {
  face: { label: 'Mit Gesicht vor der Kamera' },
  faceless: { label: 'Ohne Gesicht (faceless)' },
  mixed: { label: 'Gemischt' },
};

export const CTAS = {
  linkinbio: { label: 'Link in Bio', text: 'Link in Bio' },
  dm: { label: 'Per DM schreiben', text: 'Schreib mir „INFO“ per DM' },
  comment: { label: 'Kommentieren', text: 'Schreib „JA“ in die Kommentare' },
  website: { label: 'Website besuchen', text: 'Alle Infos auf unserer Website (Link in Bio)' },
  visit: { label: 'Vorbeikommen / Termin buchen', text: 'Termin buchen oder einfach vorbeikommen' },
  follow: { label: 'Folgen', text: 'Folge für mehr' },
  save: { label: 'Speichern & teilen', text: 'Speichern & mit jemandem teilen, der das braucht' },
};

export const EMOJIS = { viele: { label: 'Viele 🤩' }, wenige: { label: 'Wenige' }, keine: { label: 'Keine' } };

export const HASHTAG_COUNTS = [3, 5, 8, 12];
export const POSTS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7];
export const WEEKS = [1, 2, 3, 4];

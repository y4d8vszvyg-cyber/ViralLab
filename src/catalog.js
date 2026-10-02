// Everything the frontend needs to render the generator's option controls.

import { INDUSTRIES, GOALS } from './industries.js';
import { FORMATS } from './engine.js';
import { PLATFORMS, TONES, VIDEO_LENGTHS, ON_CAMERA, CTAS, EMOJIS, HASHTAG_COUNTS, POSTS_PER_WEEK, WEEKS } from './options.js';

const list = (obj) => Object.entries(obj).map(([value, o]) => ({ value, label: o.label }));

export function optionCatalog() {
  return {
    industries: list(INDUSTRIES).filter((o) => o.value !== 'generic').concat({ value: 'generic', label: 'Andere Branche' }),
    goals: list(GOALS),
    platforms: PLATFORMS,
    tones: list(TONES),
    videoLengths: list(VIDEO_LENGTHS),
    onCamera: list(ON_CAMERA),
    ctas: list(CTAS),
    emojis: list(EMOJIS),
    hashtagCounts: HASHTAG_COUNTS,
    postsPerWeek: POSTS_PER_WEEK,
    weeks: WEEKS,
    formats: Object.entries(FORMATS).map(([value, f]) => ({ value, label: f.name })),
  };
}

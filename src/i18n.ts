// Bilingual labels.
//
// English is the thing being learned, so it is the big text. Russian sits under
// it in small type as a safety net — the child should be able to read the
// English first and only drop to the hint when stuck, rather than learning to
// read the Russian and ignore the English.
//
// Every English span carries data-say, which the global tap handler speaks.

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Big English over a small Russian hint. Returns HTML. */
export function bi(en: string, ru: string): string {
  return `<span class="bi"><span class="en" data-say="${esc(en)}">${esc(en)}</span><span class="ru">${esc(ru)}</span></span>`;
}

/**
 * Bilingual label that does NOT speak when tapped. For the match action pads:
 * speaking "pass" on every pass would talk over the commentary.
 */
export function biQuiet(e: string, r: string): string {
  return `<span class="bi"><span class="en">${esc(e)}</span><span class="ru">${esc(r)}</span></span>`;
}

/** English only, still tappable to hear it. Use where a hint would be noise. */
export function en(text: string): string {
  return `<span class="en" data-say="${esc(text)}">${esc(text)}</span>`;
}

/** Plain bilingual text for places that cannot take markup (e.g. button alt). */
export const pair = (e: string, r: string) => `${e} — ${r}`;

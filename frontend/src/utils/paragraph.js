/** Split chapter content into non-empty paragraphs */
export function splitParagraphs(content = '') {
  return String(content)
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

/** MVP anchor: paragraph index encoded in pseudo-CFI */
export function paragraphCfi(index) {
  return `para:${index}`;
}

/** Build progress CFI with optional page index */
export function buildProgressCfi(paragraphIndex, pageIndex) {
  const para = Math.max(0, paragraphIndex || 0);
  if (pageIndex != null && pageIndex > 0) {
    return `para:${para}|page:${pageIndex}`;
  }
  return `para:${para}`;
}

/** Parse paragraph index from progress CFI */
export function parseProgressCfi(cfi) {
  const match = /^para:(\d+)/.exec(cfi || '');
  return match ? Number(match[1]) : 0;
}

/** Parse page index from progress CFI */
export function parseProgressPage(cfi) {
  const match = /\|page:(\d+)/.exec(cfi || '');
  return match ? Number(match[1]) : null;
}

/** Resolve paragraph index from CFI or text_quote fallback */
export function noteParagraphIndex(note, paragraphs) {
  if (!note) return -1;

  const cfi = note.cfi || '';
  const match = /^para:(\d+)$/.exec(cfi);
  if (match) {
    const index = Number(match[1]);
    if (index >= 0 && index < paragraphs.length) return index;
  }

  if (note.text_quote) {
    const idx = paragraphs.findIndex((p) => p === note.text_quote || p.includes(note.text_quote));
    if (idx >= 0) return idx;
  }

  return -1;
}

/** Group notes by paragraph index */
export function groupNotesByParagraph(notes, paragraphs) {
  const grouped = paragraphs.map(() => []);

  for (const note of notes || []) {
    const index = noteParagraphIndex(note, paragraphs);
    if (index >= 0) grouped[index].push(note);
    else grouped[0]?.push(note);
  }

  return grouped;
}

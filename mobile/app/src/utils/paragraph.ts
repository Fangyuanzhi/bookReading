export function splitParagraphs(content = ''): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function paragraphCfi(index: number): string {
  return `/peidu/para/${index}`;
}

export function buildProgressCfi(paragraphIndex: number, pageIndex?: number): string {
  const para = Math.max(0, paragraphIndex || 0);
  if (pageIndex != null && pageIndex > 0) {
    return `para:${para}|page:${pageIndex}`;
  }
  return `para:${para}`;
}

export function groupNotesByParagraph(
  notes: { cfi?: string; body: string; id: string; user?: { display_name?: string }; likes?: number }[],
  paragraphs: string[]
) {
  const map = new Map<number, typeof notes>();
  notes.forEach((note) => {
    const match = note.cfi?.match(/\/peidu\/para\/(\d+)/);
    const idx = match ? parseInt(match[1], 10) : -1;
    if (idx >= 0 && idx < paragraphs.length) {
      const list = map.get(idx) || [];
      list.push(note);
      map.set(idx, list);
    }
  });
  return map;
}

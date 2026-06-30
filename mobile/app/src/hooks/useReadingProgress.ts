import { useCallback, useEffect, useRef } from 'react';
import api from '../api';
import { buildProgressCfi } from '../utils/paragraph';

/** Debounced reading progress saver */
export function useReadingProgressSaver(
  bookId: string | undefined,
  chapterId: string | undefined,
  paragraphIndex: number
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ bookId, chapterId, paragraphIndex });

  latestRef.current = { bookId, chapterId, paragraphIndex };

  const flush = useCallback(async () => {
    const { bookId: bid, chapterId: cid, paragraphIndex: para } = latestRef.current;
    if (!bid || !cid) return;
    await api.reading.saveProgress(bid, {
      chapter_id: cid,
      cfi: buildProgressCfi(para),
    });
  }, []);

  useEffect(() => {
    if (!bookId || !chapterId) return undefined;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush().catch(() => {});
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bookId, chapterId, paragraphIndex, flush]);

  useEffect(() => {
    return () => {
      flush().catch(() => {});
    };
  }, [flush]);
}

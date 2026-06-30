import { useCallback, useEffect, useRef } from 'react';
import api from '../api/config';
import { buildProgressCfi } from '../utils/paragraph';

/** Debounced reading progress saver */
export function useReadingProgressSaver(bookId, chapterId, paragraphIndex, pageIndex) {
  const timerRef = useRef(null);
  const latestRef = useRef({ bookId, chapterId, paragraphIndex, pageIndex });

  latestRef.current = { bookId, chapterId, paragraphIndex, pageIndex };

  const flush = useCallback(async () => {
    const { bookId: bid, chapterId: cid, paragraphIndex: para, pageIndex: page } = latestRef.current;
    if (!bid || !cid) return;
    await api.reading.saveProgress(bid, {
      chapter_id: cid,
      cfi: buildProgressCfi(para, page),
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
  }, [bookId, chapterId, paragraphIndex, pageIndex, flush]);

  useEffect(() => {
    return () => {
      flush().catch(() => {});
    };
  }, [flush]);
}

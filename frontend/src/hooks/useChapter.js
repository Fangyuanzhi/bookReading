import { useCallback, useEffect, useRef, useState } from 'react';
import api, { CentrifugoClient } from '../api/config';
import { splitParagraphs, paragraphCfi } from '../utils/paragraph';
import { useAuthStore } from '../store/auth';

function normalizeNotes(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  return [];
}

function normalizeReviews(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reviews)) return data.reviews;
  return [];
}

export function useChapter(chapterId) {
  const { user } = useAuthStore();
  const [chapter, setChapter] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [presence, setPresence] = useState({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [paymentRequired, setPaymentRequired] = useState(null);
  const centrifugoRef = useRef(null);

  const reload = useCallback(async () => {
    if (!chapterId) return;

    const [chapterRes, notesRes, reviewsRes, presenceRes] = await Promise.all([
      api.chapters.detail(chapterId),
      api.chapters.notes(chapterId).catch(() => ({ data: [] })),
      api.chapters.reviews(chapterId).catch(() => ({ data: [] })),
      api.chapters.presence(chapterId).catch(() => ({ data: { count: 0, users: [] } })),
    ]);

    const chapterData = chapterRes.data;
    setChapter(chapterData);
    setParagraphs(splitParagraphs(chapterData?.content));
    setNotes(normalizeNotes(notesRes.data));
    setReviews(normalizeReviews(reviewsRes.data));
    setPresence(presenceRes.data || { count: 0, users: [] });
    setError('');
    setErrorStatus(null);
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId) return;

    let heartbeatId;
    let unsubscribe;
    let cancelled = false;

    const setup = async () => {
      try {
        setLoading(true);
        setError('');
        setErrorStatus(null);
        setPaymentRequired(null);
        await reload();
        if (cancelled) return;

        const displayName = user?.display_name || user?.email || '读者';
        await api.chapters.join(chapterId, { display_name: displayName });

        heartbeatId = setInterval(() => {
          api.presence.heartbeat(chapterId).catch(() => {});
        }, 30000);

        const centrifugo = new CentrifugoClient();
        centrifugoRef.current = centrifugo;
        centrifugo.connect();
        unsubscribe = centrifugo.subscribeChapter(chapterId, (payload) => {
          const event = payload?.type ? payload : payload?.data ? payload.data : payload;
          if (!event?.type) return;

          if (event.type === 'note_created' && event.data) {
            setNotes((prev) => {
              if (prev.some((n) => n.id === event.data.id)) return prev;
              return [event.data, ...prev];
            });
          }

          if (event.type === 'presence_update' && event.data) {
            setPresence((prev) => ({
              ...prev,
              count: event.data.count ?? prev.count,
              users: event.data.users ?? prev.users,
            }));
          }

          if (event.type === 'review_created' && event.data) {
            setReviews((prev) => {
              if (prev.some((r) => r.id === event.data.id)) return prev;
              return [event.data, ...prev];
            });
          }
        });
      } catch (err) {
        if (!cancelled) {
          if (err.status === 402 || err.code === 402) {
            setPaymentRequired(err.data || { reason: 'payment_required' });
            setError('');
            setErrorStatus(null);
          } else {
            setError(err.message || '加载失败');
            setErrorStatus(err.status || err.code || null);
            setChapter(null);
            setParagraphs([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (heartbeatId) clearInterval(heartbeatId);
      unsubscribe?.();
      centrifugoRef.current = null;
      api.chapters.leave(chapterId).catch(() => {});
    };
  }, [chapterId, reload, user?.display_name, user?.email]);

  const createNote = useCallback(
    async (paragraphIndex, body) => {
      if (!chapter) throw new Error('章节未加载');
      const textQuote = paragraphs[paragraphIndex] || '';
      const result = await api.notes.create({
        book_id: chapter.book_id,
        chapter_id: chapterId,
        cfi: paragraphCfi(paragraphIndex),
        text_quote: textQuote,
        body,
        is_public: true,
      });
      const created = result.data;
      setNotes((prev) => [created, ...prev.filter((n) => n.id !== created.id)]);
      return created;
    },
    [chapter, chapterId, paragraphs]
  );

  const likeNote = useCallback(async (noteId, hasLiked) => {
    if (hasLiked) {
      await api.notes.unlike(noteId);
    } else {
      await api.notes.like(noteId);
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, likes: (n.likes || 0) + (hasLiked ? -1 : 1), has_liked: !hasLiked }
          : n
      )
    );
  }, []);

  const createReview = useCallback(
    async (body) => {
      if (!chapter) throw new Error('章节未加载');
      const result = await api.reviews.create({
        book_id: chapter.book_id,
        chapter_id: chapterId,
        body,
      });
      const created = result.data;
      setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      return created;
    },
    [chapter, chapterId]
  );

  const likeReview = useCallback(async (reviewId, hasLiked) => {
    if (hasLiked) {
      await api.reviews.unlike(reviewId);
    } else {
      await api.reviews.like(reviewId);
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, likes: (r.likes || 0) + (hasLiked ? -1 : 1), has_liked: !hasLiked }
          : r
      )
    );
  }, []);

  return {
    chapter,
    paragraphs,
    notes,
    reviews,
    presence,
    loading,
    error,
    errorStatus,
    paymentRequired,
    reload,
    createNote,
    likeNote,
    createReview,
    likeReview,
  };
}

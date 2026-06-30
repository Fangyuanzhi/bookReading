import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api';
import { CentrifugoClient } from '../api/centrifugo';
import { Chapter, Note, PresenceInfo } from '../api/config';
import { getCachedChapter, setCachedChapter } from '../store/offlineCache';
import { splitParagraphs } from '../utils/paragraph';
import { useAuthStore } from '../store/auth';

function normalizeNotes(data: unknown): Note[] {
  if (Array.isArray(data)) return data as Note[];
  if (data && typeof data === 'object' && Array.isArray((data as { notes?: Note[] }).notes)) {
    return (data as { notes: Note[] }).notes;
  }
  return [];
}

interface WsEvent {
  type?: string;
  data?: Note & Partial<PresenceInfo> & { count?: number; users?: PresenceInfo['users'] };
}

function parseWsEvent(payload: unknown): WsEvent | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as WsEvent & { data?: WsEvent };
  if (p.type) return p;
  if (p.data?.type) return p.data;
  return null;
}

export function useChapter(chapterId: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [presence, setPresence] = useState<PresenceInfo>({ count: 0, users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const centrifugoRef = useRef<CentrifugoClient | null>(null);

  const reload = useCallback(async () => {
    if (!chapterId) return;
    const [chapterRes, notesRes, presenceRes] = await Promise.all([
      api.chapters.detail(chapterId),
      api.chapters.notes(chapterId),
      api.chapters.presence(chapterId).catch(() => ({ data: { count: 0, users: [] } })),
    ]);
    const chapterData = chapterRes.data!;
    const noteList = normalizeNotes(notesRes.data);
    setChapter(chapterData);
    setParagraphs(splitParagraphs(chapterData.content || ''));
    setNotes(noteList);
    setPresence(presenceRes.data || { count: 0, users: [] });
    setFromCache(false);
    await setCachedChapter(chapterId, chapterData, noteList);
  }, [chapterId]);

  useEffect(() => {
    if (!chapterId) return;
    let cancelled = false;
    let heartbeatId: ReturnType<typeof setInterval> | undefined;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      let hadLocalCache = false;
      try {
        setLoading(true);
        setError('');

        const cached = await getCachedChapter(chapterId);
        if (cached && !cancelled) {
          hadLocalCache = true;
          setChapter(cached.chapter);
          setParagraphs(splitParagraphs(cached.chapter.content || ''));
          setNotes(cached.notes);
          setFromCache(true);
        }

        await reload();
        if (cancelled) return;

        const name = user?.display_name || user?.email || '读者';
        await api.chapters.join(chapterId, { display_name: name });

        heartbeatId = setInterval(() => {
          api.presence.heartbeat(chapterId).catch(() => {});
        }, 30000);

        const centrifugo = new CentrifugoClient();
        centrifugoRef.current = centrifugo;
        await centrifugo.connect();

        unsubscribe = centrifugo.subscribeChapter(chapterId, (payload) => {
          const event = parseWsEvent(payload);
          if (!event?.type) return;

          if (event.type === 'note_created' && event.data) {
            setNotes((prev) => {
              if (prev.some((n) => n.id === event.data!.id)) return prev;
              return [event.data as Note, ...prev];
            });
          }

          if (event.type === 'presence_update' && event.data) {
            setPresence((prev) => ({
              ...prev,
              count: event.data!.count ?? prev.count,
              users: event.data!.users ?? prev.users,
            }));
          }
        });
      } catch (err) {
        if (!cancelled) {
          if (hadLocalCache) {
            setError('');
          } else {
            setError((err as Error).message || '加载失败');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (heartbeatId) clearInterval(heartbeatId);
      unsubscribe?.();
      centrifugoRef.current?.disconnect();
      centrifugoRef.current = null;
      api.chapters.leave(chapterId).catch(() => {});
    };
  }, [chapterId, reload, user?.display_name, user?.email]);

  const createNote = useCallback(
    async (paragraphIndex: number, body: string) => {
      if (!chapter || !chapterId) throw new Error('章节未加载');
      const result = await api.notes.create({
        book_id: chapter.book_id,
        chapter_id: chapterId,
        cfi: `/peidu/para/${paragraphIndex}`,
        text_quote: paragraphs[paragraphIndex] || '',
        body,
        is_public: true,
      });
      const created = result.data!;
      setNotes((prev) => [created, ...prev.filter((n) => n.id !== created.id)]);
      return created;
    },
    [chapter, chapterId, paragraphs]
  );

  const likeNote = useCallback(async (noteId: string, hasLiked?: boolean) => {
    if (hasLiked) return;
    await api.notes.like(noteId);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, likes: (n.likes ?? 0) + 1, has_liked: true }
          : n
      )
    );
  }, []);

  return {
    chapter,
    paragraphs,
    notes,
    presence,
    loading,
    error,
    fromCache,
    reload,
    createNote,
    likeNote,
  };
}

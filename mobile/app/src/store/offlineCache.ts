import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chapter, Note } from '../api/config';

const PREFIX = 'peidu:chapter:';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedChapter {
  chapter: Chapter;
  notes: Note[];
  cachedAt: number;
}

export async function getCachedChapter(chapterId: string): Promise<CachedChapter | null> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${chapterId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedChapter;
    if (Date.now() - parsed.cachedAt > MAX_AGE_MS) {
      await AsyncStorage.removeItem(`${PREFIX}${chapterId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedChapter(
  chapterId: string,
  chapter: Chapter,
  notes: Note[]
): Promise<void> {
  const payload: CachedChapter = { chapter, notes, cachedAt: Date.now() };
  await AsyncStorage.setItem(`${PREFIX}${chapterId}`, JSON.stringify(payload));
}

export async function clearChapterCache(chapterId: string): Promise<void> {
  await AsyncStorage.removeItem(`${PREFIX}${chapterId}`);
}

export async function clearExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const chapterKeys = keys.filter((k) => k.startsWith(PREFIX));
    for (const key of chapterKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as CachedChapter;
        if (Date.now() - parsed.cachedAt > MAX_AGE_MS) {
          await AsyncStorage.removeItem(key);
        }
      } catch {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch {
    // ignore
  }
}

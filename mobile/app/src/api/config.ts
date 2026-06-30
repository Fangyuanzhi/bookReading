import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Android 模拟器访问宿主机用 10.0.2.2；真机请设 EXPO_PUBLIC_API_URL */
function defaultApiBase(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:8080/api/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  defaultApiBase();

function defaultWsUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `ws://${host}:8000/connection/websocket`;
}

function deriveWsUrl(): string {
  if (process.env.EXPO_PUBLIC_WS_URL) return process.env.EXPO_PUBLIC_WS_URL;
  const extra = Constants.expoConfig?.extra?.wsUrl as string | undefined;
  if (extra) return extra;
  try {
    const u = new URL(API_BASE_URL);
    return `ws://${u.hostname}:8000/connection/websocket`;
  } catch {
    return defaultWsUrl();
  }
}

export const WS_URL = deriveWsUrl();

export const ENDPOINTS = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
    STATS: `${API_BASE_URL}/auth/me/stats`,
  },
  BOOKS: {
    LIST: `${API_BASE_URL}/books`,
    DETAIL: (id: string) => `${API_BASE_URL}/books/${id}`,
    CHAPTERS: (id: string) => `${API_BASE_URL}/books/${id}/chapters`,
  },
  CHAPTERS: {
    DETAIL: (id: string) => `${API_BASE_URL}/chapters/${id}`,
    NOTES: (id: string) => `${API_BASE_URL}/chapters/${id}/notes`,
    PRESENCE: (id: string) => `${API_BASE_URL}/chapters/${id}/presence`,
    JOIN: (id: string) => `${API_BASE_URL}/chapters/${id}/join`,
    LEAVE: (id: string) => `${API_BASE_URL}/chapters/${id}/leave`,
  },
  PRESENCE: {
    HEARTBEAT: `${API_BASE_URL}/presence/heartbeat`,
  },
  READING: {
    RECENT: `${API_BASE_URL}/reading/progress`,
    BOOK: (id: string) => `${API_BASE_URL}/books/${id}/progress`,
  },
  NOTES: {
    CREATE: `${API_BASE_URL}/notes`,
    MINE: `${API_BASE_URL}/notes/mine`,
    LIKE: (id: string) => `${API_BASE_URL}/notes/${id}/like`,
    UNLIKE: (id: string) => `${API_BASE_URL}/notes/${id}/like`,
  },
  SHELF: {
    LIST: `${API_BASE_URL}/shelf`,
    STATUS: (bookId: string) => `${API_BASE_URL}/shelf/${bookId}/status`,
    REMOVE: (bookId: string) => `${API_BASE_URL}/shelf/${bookId}`,
  },
  DISCOVER: `${API_BASE_URL}/discover`,
  REVIEWS: {
    CREATE: `${API_BASE_URL}/reviews`,
    MINE: `${API_BASE_URL}/reviews/mine`,
    LIKE: (id: string) => `${API_BASE_URL}/reviews/${id}/like`,
    UNLIKE: (id: string) => `${API_BASE_URL}/reviews/${id}/like`,
  },
  USERS: {
    PROFILE: (id: string) => `${API_BASE_URL}/users/${id}`,
    FOLLOW: (id: string) => `${API_BASE_URL}/users/${id}/follow`,
    FOLLOW_STATUS: (id: string) => `${API_BASE_URL}/users/${id}/follow/status`,
    FOLLOWERS: (id: string) => `${API_BASE_URL}/users/${id}/followers`,
    FOLLOWING: (id: string) => `${API_BASE_URL}/users/${id}/following`,
  },
} as const;

export interface ApiResponse<T = unknown> {
  code?: number;
  message?: string;
  data?: T;
  request_id?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface ProfileStats {
  note_likes: number;
  review_likes: number;
  total_likes: number;
  books_created: number;
}

export interface PublicProfile {
  user: User;
  stats: ProfileStats;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

export interface PaginatedResponse<T> {
  users?: T[];
  items?: T[];
  notes?: T[];
  reviews?: T[];
  total: number;
  page: number;
}

export type FollowListResponse = PaginatedResponse<User>;
export type NoteListResponse = PaginatedResponse<Note>;
export type ReviewListResponse = PaginatedResponse<Review>;

export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover_url?: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  content?: string;
  chapter_index?: number;
}

export interface Note {
  id: string;
  book_id?: string;
  chapter_id?: string;
  body: string;
  cfi?: string;
  text_quote?: string;
  likes?: number;
  has_liked?: boolean;
  created_at?: string;
  book?: Book;
  user?: { id?: string; display_name?: string; email?: string };
}

export interface ReadingProgressItem {
  book_id: string;
  chapter_id: string;
  book_title?: string;
  chapter_title?: string;
  cfi?: string;
}

export interface PresenceInfo {
  count: number;
  users?: { display_name?: string }[];
}

export interface ShelfItem {
  book_id: string;
  added_at?: string;
  book?: Book;
  progress?: {
    chapter_id?: string;
    chapter?: Chapter;
    cfi?: string;
    updated_at?: string;
  };
}

export interface Review {
  id: string;
  book_id: string;
  chapter_id?: string;
  body: string;
  likes?: number;
  has_liked?: boolean;
  created_at?: string;
  book?: Book;
  user?: { id?: string; display_name?: string };
}

export interface ActiveReader {
  user: { id: string; display_name?: string; email?: string };
  public_notes: number;
  reviews: number;
  total_likes: number;
}

export interface HotGroup {
  id: string;
  name: string;
  book_id?: string;
  book?: Book;
  member_count?: number;
}

export interface DiscoverFeed {
  daily_picks?: Book[];
  hot_notes?: Note[];
  hot_reviews?: Review[];
  new_books?: Book[];
  original_books?: Book[];
  active_readers?: ActiveReader[];
  hot_groups?: HotGroup[];
}

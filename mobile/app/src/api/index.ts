import { apiClient } from './client';
import {
  ENDPOINTS,
  Book,
  Chapter,
  DiscoverFeed,
  FollowListResponse,
  Note,
  NoteListResponse,
  PresenceInfo,
  ProfileStats,
  PublicProfile,
  ReadingProgressItem,
  Review,
  ReviewListResponse,
  ShelfItem,
  User,
} from './config';

export const api = {
  client: apiClient,

  auth: {
    register: (data: { email: string; password: string; display_name?: string }) =>
      apiClient.post<{ token: string; user: User }>(ENDPOINTS.AUTH.REGISTER, data),
    login: (data: { email: string; password: string }) =>
      apiClient.post<{ token: string; user: User }>(ENDPOINTS.AUTH.LOGIN, data),
    me: () => apiClient.get<User>(ENDPOINTS.AUTH.ME),
    stats: () => apiClient.get<ProfileStats>(ENDPOINTS.AUTH.STATS),
  },

  books: {
    list: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<{ books: Book[] }>(`${ENDPOINTS.BOOKS.LIST}?${query}`);
    },
    detail: (id: string) => apiClient.get<Book>(ENDPOINTS.BOOKS.DETAIL(id)),
    chapters: (id: string) =>
      apiClient.get<{ chapters: Chapter[] } | Chapter[]>(ENDPOINTS.BOOKS.CHAPTERS(id)),
  },

  chapters: {
    detail: (id: string) => apiClient.get<Chapter>(ENDPOINTS.CHAPTERS.DETAIL(id)),
    notes: (id: string) =>
      apiClient.get<{ notes: Note[] } | Note[]>(ENDPOINTS.CHAPTERS.NOTES(id)),
    presence: (id: string) =>
      apiClient.get<PresenceInfo>(ENDPOINTS.CHAPTERS.PRESENCE(id)),
    join: (id: string, body: { display_name: string }) =>
      apiClient.post(ENDPOINTS.CHAPTERS.JOIN(id), body),
    leave: (id: string) => apiClient.post(ENDPOINTS.CHAPTERS.LEAVE(id)),
  },

  presence: {
    heartbeat: (chapterId: string) =>
      apiClient.post(ENDPOINTS.PRESENCE.HEARTBEAT, { chapter_id: chapterId }),
  },

  reading: {
    recent: (params: { limit?: number } = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<{ items: ReadingProgressItem[] }>(
        `${ENDPOINTS.READING.RECENT}?${query}`
      );
    },
    bookProgress: (bookId: string) =>
      apiClient.get(ENDPOINTS.READING.BOOK(bookId)),
    saveProgress: (
      bookId: string,
      data: { chapter_id: string; cfi: string }
    ) => apiClient.put(ENDPOINTS.READING.BOOK(bookId), data),
  },

  notes: {
    create: (data: {
      book_id: string;
      chapter_id: string;
      cfi: string;
      text_quote: string;
      body: string;
      is_public: boolean;
    }) => apiClient.post<Note>(ENDPOINTS.NOTES.CREATE, data),
    mine: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<NoteListResponse>(`${ENDPOINTS.NOTES.MINE}?${query}`);
    },
    like: (id: string) => apiClient.post(ENDPOINTS.NOTES.LIKE(id)),
    unlike: (id: string) => apiClient.delete(ENDPOINTS.NOTES.UNLIKE(id)),
  },

  reviews: {
    create: (data: { book_id: string; chapter_id?: string; body: string }) =>
      apiClient.post<Review>(ENDPOINTS.REVIEWS.CREATE, data),
    mine: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<ReviewListResponse>(`${ENDPOINTS.REVIEWS.MINE}?${query}`);
    },
    like: (id: string) => apiClient.post(ENDPOINTS.REVIEWS.LIKE(id)),
    unlike: (id: string) => apiClient.delete(ENDPOINTS.REVIEWS.UNLIKE(id)),
  },

  shelf: {
    list: (params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<{ items: ShelfItem[]; total: number }>(
        `${ENDPOINTS.SHELF.LIST}?${query}`
      );
    },
    add: (bookId: string) =>
      apiClient.post<{ in_shelf: boolean }>(ENDPOINTS.SHELF.LIST, { book_id: bookId }),
    remove: (bookId: string) =>
      apiClient.delete<{ in_shelf: boolean }>(ENDPOINTS.SHELF.REMOVE(bookId)),
    status: (bookId: string) =>
      apiClient.get<{ in_shelf: boolean }>(ENDPOINTS.SHELF.STATUS(bookId)),
  },

  discover: {
    feed: () => apiClient.get<DiscoverFeed>(ENDPOINTS.DISCOVER),
  },

  social: {
    profile: (userId: string) => apiClient.get<PublicProfile>(ENDPOINTS.USERS.PROFILE(userId)),
    follow: (userId: string) => apiClient.post(ENDPOINTS.USERS.FOLLOW(userId)),
    unfollow: (userId: string) => apiClient.delete(ENDPOINTS.USERS.FOLLOW(userId)),
    followStatus: (userId: string) =>
      apiClient.get<{ is_following: boolean }>(ENDPOINTS.USERS.FOLLOW_STATUS(userId)),
    followers: (userId: string, params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<FollowListResponse>(
        `${ENDPOINTS.USERS.FOLLOWERS(userId)}?${query}`
      );
    },
    following: (userId: string, params: Record<string, string | number> = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      return apiClient.get<FollowListResponse>(
        `${ENDPOINTS.USERS.FOLLOWING(userId)}?${query}`
      );
    },
  },
};

export default api;

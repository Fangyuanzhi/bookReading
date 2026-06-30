import { create } from 'zustand';
import api from '../api';
import { User } from '../api/config';

interface AuthState {
  user: User | null;
  token: string;
  ready: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<User>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: '',
  ready: false,
  isLoading: false,
  error: null,

  setAuth: (token, user) => {
    api.client.setToken(token);
    set({ token, user, error: null });
  },

  logout: () => {
    api.client.clearToken();
    set({ token: '', user: null, error: null });
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.me();
      set({ user: res.data ?? null, isLoading: false });
      return res.data!;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, user: null });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login({ email, password });
      const { token, user } = res.data!;
      get().setAuth(token, user);
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register({
        email,
        password,
        display_name: displayName,
      });
      const { token, user } = res.data!;
      get().setAuth(token, user);
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  init: async () => {
    try {
      const token = await api.client.loadToken();
      if (token) {
        await get().fetchMe();
      }
    } catch {
      get().logout();
    } finally {
      set({ ready: true });
    }
  },
}));

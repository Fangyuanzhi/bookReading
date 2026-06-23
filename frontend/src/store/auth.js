import { create } from 'zustand';
import api from '../api/config';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || '',
  isLoading: false,
  error: null,

  setAuth: (token, user) => {
    api.client.setToken(token);
    set({ token, user, error: null });
  },

  logout: () => {
    api.client.clearToken();
    localStorage.removeItem('token');
    set({ token: '', user: null, error: null });
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.auth.me();
      set({ user: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false, user: null });
      throw err;
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.auth.login({ email, password });
      const { token, user } = res.data;
      get().setAuth(token, user);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.auth.register({ email, password, display_name: displayName });
      const { token, user } = res.data;
      get().setAuth(token, user);
      set({ isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  init: () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.client.setToken(token);
      get().fetchMe().catch(() => {
        get().logout();
      });
    }
  },
}));

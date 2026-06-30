import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from './config';

const TOKEN_KEY = 'token';

export class ApiClient {
  private token = '';

  async loadToken(): Promise<string> {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    this.token = stored || '';
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
  }

  clearToken() {
    this.token = '';
    AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  }

  getToken() {
    return this.token;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (this.token) {
      h.Authorization = `Bearer ${this.token}`;
    }
    return h;
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers(),
        ...(options.headers as Record<string, string>),
      },
    });

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new Error(`响应解析失败 (${response.status})`);
    }

    if (!response.ok || (data.code && data.code !== 200)) {
      const msg = data.message || '请求失败';
      const err = new Error(msg) as Error & { status?: number; code?: number; data?: unknown };
      err.status = response.status;
      err.code = data.code || response.status;
      err.data = data.data;
      throw err;
    }

    return data;
  }

  get<T>(url: string) {
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(url: string, body?: unknown) {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(url: string) {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

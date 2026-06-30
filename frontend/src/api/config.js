// 陪读前端 API 配置
// API 走 Vite 代理 /api → localhost:8080

import { logApiDebug, logApiError, logWs } from '../utils/logger';

const API_BASE_URL = '/api/v1';
const WS_URL = 'ws://localhost:8000/connection/websocket';

// API 端点
const ENDPOINTS = {
  // 认证
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
    STATS: `${API_BASE_URL}/auth/me/stats`,
  },
  // 书籍
  BOOKS: {
    LIST: `${API_BASE_URL}/books`,
    MINE: `${API_BASE_URL}/books/mine`,
    DETAIL: (id) => `${API_BASE_URL}/books/${id}`,
    STATUS: (id) => `${API_BASE_URL}/books/${id}/status`,
    CHAPTERS: (id) => `${API_BASE_URL}/books/${id}/chapters`,
    CHAPTER: (id) => `${API_BASE_URL}/books/${id}/chapter`,
    REVIEWS: (id) => `${API_BASE_URL}/books/${id}/reviews`,
  },
  // 章节
  CHAPTERS: {
    DETAIL: (id) => `${API_BASE_URL}/chapters/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/chapters/${id}`,
    DELETE: (id) => `${API_BASE_URL}/chapters/${id}`,
    NOTES: (id) => `${API_BASE_URL}/chapters/${id}/notes`,
    REVIEWS: (id) => `${API_BASE_URL}/chapters/${id}/reviews`,
    PRESENCE: (id) => `${API_BASE_URL}/chapters/${id}/presence`,
    JOIN: (id) => `${API_BASE_URL}/chapters/${id}/join`,
    LEAVE: (id) => `${API_BASE_URL}/chapters/${id}/leave`,
  },
  // 段评
  NOTES: {
    CREATE: `${API_BASE_URL}/notes`,
    MINE: `${API_BASE_URL}/notes/mine`,
    DETAIL: (id) => `${API_BASE_URL}/notes/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/notes/${id}`,
    DELETE: (id) => `${API_BASE_URL}/notes/${id}`,
    LIKE: (id) => `${API_BASE_URL}/notes/${id}/like`,
  },
  // 书评
  REVIEWS: {
    CREATE: `${API_BASE_URL}/reviews`,
    MINE: `${API_BASE_URL}/reviews/mine`,
    DETAIL: (id) => `${API_BASE_URL}/reviews/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/reviews/${id}`,
    DELETE: (id) => `${API_BASE_URL}/reviews/${id}`,
    LIKE: (id) => `${API_BASE_URL}/reviews/${id}/like`,
  },
  // 在场
  PRESENCE: {
    HEARTBEAT: `${API_BASE_URL}/presence/heartbeat`,
  },
  // 阅读进度
  READING: {
    RECENT: `${API_BASE_URL}/reading/progress`,
    BOOK: (id) => `${API_BASE_URL}/books/${id}/progress`,
  },
  // 书架
  SHELF: {
    LIST: `${API_BASE_URL}/shelf`,
    STATUS: (bookId) => `${API_BASE_URL}/shelf/${bookId}/status`,
    REMOVE: (bookId) => `${API_BASE_URL}/shelf/${bookId}`,
  },
  // 搜索
  SEARCH: `${API_BASE_URL}/search`,
  // 发现
  DISCOVER: `${API_BASE_URL}/discover`,
  // 轻社交
  FEED: `${API_BASE_URL}/feed`,
  USERS: {
    PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
    FOLLOW: (id) => `${API_BASE_URL}/users/${id}/follow`,
    FOLLOW_STATUS: (id) => `${API_BASE_URL}/users/${id}/follow/status`,
    FOLLOWERS: (id) => `${API_BASE_URL}/users/${id}/followers`,
    FOLLOWING: (id) => `${API_BASE_URL}/users/${id}/following`,
  },
  // 上传
  UPLOAD: {
    BOOK: `${API_BASE_URL}/upload/book`,
  },
  // 举报
  REPORTS: {
    CREATE: `${API_BASE_URL}/reports`,
  },
  // 支付 / VIP
  PAYMENTS: {
    PRICING: `${API_BASE_URL}/pricing`,
    LIST: `${API_BASE_URL}/payments`,
    CREATE: `${API_BASE_URL}/payments`,
    DETAIL: (id) => `${API_BASE_URL}/payments/${id}`,
    CONFIRM: (id) => `${API_BASE_URL}/payments/${id}/confirm`,
  },
  VIP: {
    STATUS: `${API_BASE_URL}/vip/status`,
  },
  ACCESS: {
    BOOK: `${API_BASE_URL}/books/access`,
  },
  // 共读小组
  GROUPS: {
    LIST: `${API_BASE_URL}/groups`,
    MINE: `${API_BASE_URL}/groups/mine`,
    DETAIL: (id) => `${API_BASE_URL}/groups/${id}`,
    JOIN: (id) => `${API_BASE_URL}/groups/${id}/join`,
    LEAVE: (id) => `${API_BASE_URL}/groups/${id}/leave`,
    POSTS: (id) => `${API_BASE_URL}/groups/${id}/posts`,
  },
};

// 请求封装
class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token') || '';
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = '';
    localStorage.removeItem('token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(url, options = {}) {
    const method = options.method || 'GET';
    let response;
    let data;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const requestId =
        response.headers.get('X-Request-ID') ||
        response.headers.get('x-request-id') ||
        '';

      try {
        data = await response.json();
      } catch (parseErr) {
        logApiError('API 响应非 JSON', {
          method,
          url,
          status: response.status,
          request_id: requestId,
          error: parseErr.message,
        });
        throw new Error(`响应解析失败 (${requestId || 'no-request-id'})`);
      }

      if (!response.ok || (data.code && data.code !== 200)) {
        const msg = data.message || 'Request failed';
        const rid = data.request_id || requestId;
        logApiError('API 请求失败', {
          method,
          url,
          status: response.status,
          code: data.code,
          message: msg,
          request_id: rid,
        });
        const err = new Error(rid ? `${msg} (request_id: ${rid})` : msg);
        err.status = response.status;
        err.code = data.code || response.status;
        err.data = data.data;
        throw err;
      }

      logApiDebug('API 请求成功', {
        method,
        url,
        status: response.status,
        request_id: data.request_id || requestId,
      });

      return data;
    } catch (err) {
      if (!response) {
        logApiError('API 网络错误', {
          method,
          url,
          error: err.message,
        });
      }
      throw err;
    }
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  async upload(url, file, fields = {}) {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        form.append(key, String(value));
      }
    });

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: form,
    });

    const requestId =
      response.headers.get('X-Request-ID') ||
      response.headers.get('x-request-id') ||
      '';

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      logApiError('上传响应非 JSON', { url, status: response.status, request_id: requestId });
      throw new Error(`响应解析失败 (${requestId || 'no-request-id'})`);
    }

    if (!response.ok || (data.code && data.code !== 200)) {
      const msg = data.message || 'Upload failed';
      const rid = data.request_id || requestId;
      logApiError('上传失败', { url, status: response.status, message: msg, request_id: rid });
      throw new Error(rid ? `${msg} (request_id: ${rid})` : msg);
    }

    logApiDebug('上传成功', { url, request_id: data.request_id || requestId });
    return data;
  }
}

// API 方法
const api = {
  client: new ApiClient(),

  auth: {
    register: (data) => api.client.post(ENDPOINTS.AUTH.REGISTER, data),
    login: (data) => api.client.post(ENDPOINTS.AUTH.LOGIN, data),
    me: () => api.client.get(ENDPOINTS.AUTH.ME),
    stats: () => api.client.get(ENDPOINTS.AUTH.STATS),
  },

  books: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.BOOKS.LIST}?${query}`);
    },
    mine: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.BOOKS.MINE}?${query}`);
    },
    detail: (id) => api.client.get(ENDPOINTS.BOOKS.DETAIL(id)),
    create: (data) => api.client.post(ENDPOINTS.BOOKS.LIST, data),
    update: (id, data) => api.client.put(ENDPOINTS.BOOKS.DETAIL(id), data),
    updateStatus: (id, status) => api.client.request(ENDPOINTS.BOOKS.STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
    delete: (id) => api.client.delete(ENDPOINTS.BOOKS.DETAIL(id)),
    chapters: (id) => api.client.get(ENDPOINTS.BOOKS.CHAPTERS(id)),
    createChapter: (bookId, data) => api.client.post(ENDPOINTS.BOOKS.CHAPTER(bookId), data),
    createChapters: (bookId, data) => api.client.post(ENDPOINTS.BOOKS.CHAPTERS(bookId), data),
    reviews: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.BOOKS.REVIEWS(id)}?${query}`);
    },
  },

  chapters: {
    detail: (id) => api.client.get(ENDPOINTS.CHAPTERS.DETAIL(id)),
    update: (id, data) => api.client.put(ENDPOINTS.CHAPTERS.UPDATE(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.CHAPTERS.DELETE(id)),
    notes: (id) => api.client.get(ENDPOINTS.CHAPTERS.NOTES(id)),
    reviews: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.CHAPTERS.REVIEWS(id)}?${query}`);
    },
    presence: (id) => api.client.get(ENDPOINTS.CHAPTERS.PRESENCE(id)),
    join: (id, data = {}) => api.client.post(ENDPOINTS.CHAPTERS.JOIN(id), data),
    leave: (id, data = {}) => api.client.post(ENDPOINTS.CHAPTERS.LEAVE(id), data),
  },

  notes: {
    create: (data) => api.client.post(ENDPOINTS.NOTES.CREATE, data),
    mine: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.NOTES.MINE}?${query}`);
    },
    detail: (id) => api.client.get(ENDPOINTS.NOTES.DETAIL(id)),
    update: (id, data) => api.client.put(ENDPOINTS.NOTES.UPDATE(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.NOTES.DELETE(id)),
    like: (id) => api.client.post(ENDPOINTS.NOTES.LIKE(id), {}),
    unlike: (id) => api.client.delete(ENDPOINTS.NOTES.LIKE(id)),
  },

  reviews: {
    create: (data) => api.client.post(ENDPOINTS.REVIEWS.CREATE, data),
    mine: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.REVIEWS.MINE}?${query}`);
    },
    detail: (id) => api.client.get(ENDPOINTS.REVIEWS.DETAIL(id)),
    update: (id, data) => api.client.put(ENDPOINTS.REVIEWS.UPDATE(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.REVIEWS.DELETE(id)),
    like: (id) => api.client.post(ENDPOINTS.REVIEWS.LIKE(id), {}),
    unlike: (id) => api.client.delete(ENDPOINTS.REVIEWS.LIKE(id)),
  },

  presence: {
    heartbeat: (chapterId) => api.client.post(ENDPOINTS.PRESENCE.HEARTBEAT, { chapter_id: chapterId }),
  },

  reading: {
    recent: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.READING.RECENT}?${query}`);
    },
    getBookProgress: (bookId) => api.client.get(ENDPOINTS.READING.BOOK(bookId)),
    saveProgress: (bookId, data) => api.client.put(ENDPOINTS.READING.BOOK(bookId), data),
  },

  shelf: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.SHELF.LIST}?${query}`);
    },
    add: (bookId) => api.client.post(ENDPOINTS.SHELF.LIST, { book_id: bookId }),
    remove: (bookId) => api.client.delete(ENDPOINTS.SHELF.REMOVE(bookId)),
    status: (bookId) => api.client.get(ENDPOINTS.SHELF.STATUS(bookId)),
  },

  search: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.client.get(`${ENDPOINTS.SEARCH}?${query}`);
  },

  discover: {
    feed: () => api.client.get(ENDPOINTS.DISCOVER),
  },

  upload: {
    book: (file, fields = {}) => api.client.upload(ENDPOINTS.UPLOAD.BOOK, file, fields),
  },

  reports: {
    create: (data) => api.client.post(ENDPOINTS.REPORTS.CREATE, data),
  },

  groups: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.GROUPS.LIST}?${query}`);
    },
    mine: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.GROUPS.MINE}?${query}`);
    },
    detail: (id) => api.client.get(ENDPOINTS.GROUPS.DETAIL(id)),
    create: (data) => api.client.post(ENDPOINTS.GROUPS.LIST, data),
    join: (id) => api.client.post(ENDPOINTS.GROUPS.JOIN(id), {}),
    leave: (id) => api.client.post(ENDPOINTS.GROUPS.LEAVE(id), {}),
    delete: (id) => api.client.delete(ENDPOINTS.GROUPS.DETAIL(id)),
    posts: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.GROUPS.POSTS(id)}?${query}`);
    },
    createPost: (id, data) => api.client.post(ENDPOINTS.GROUPS.POSTS(id), data),
  },

  payments: {
    pricing: () => api.client.get(ENDPOINTS.PAYMENTS.PRICING),
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.PAYMENTS.LIST}?${query}`);
    },
    create: (data) => api.client.post(ENDPOINTS.PAYMENTS.CREATE, data),
    detail: (id) => api.client.get(ENDPOINTS.PAYMENTS.DETAIL(id)),
    confirm: (id) => api.client.post(ENDPOINTS.PAYMENTS.CONFIRM(id), {}),
  },

  vip: {
    status: () => api.client.get(ENDPOINTS.VIP.STATUS),
  },

  access: {
    book: (bookId) => api.client.get(`${ENDPOINTS.ACCESS.BOOK}?book_id=${bookId}`),
  },

  social: {
    feed: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.FEED}?${query}`);
    },
    profile: (id) => api.client.get(ENDPOINTS.USERS.PROFILE(id)),
    follow: (id) => api.client.post(ENDPOINTS.USERS.FOLLOW(id), {}),
    unfollow: (id) => api.client.delete(ENDPOINTS.USERS.FOLLOW(id)),
    followStatus: (id) => api.client.get(ENDPOINTS.USERS.FOLLOW_STATUS(id)),
    followers: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.USERS.FOLLOWERS(id)}?${query}`);
    },
    following: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.USERS.FOLLOWING(id)}?${query}`);
    },
  },
};

// Centrifugo WebSocket 封装
class CentrifugoClient {
  constructor() {
    this.ws = null;
    this.token = localStorage.getItem('token') || '';
    this.subscriptions = new Map();
  }

  connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      logWs('info', 'Centrifugo connected');
      this.send({
        connect: {
          token: this.token,
        },
      });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      logWs('warn', 'Centrifugo disconnected, reconnecting...');
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error) => {
      logWs('error', 'Centrifugo error', { error: String(error) });
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    if (data.push) {
      const { channel, pub } = data.push;
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.forEach((cb) => cb(pub.data));
      }
    }
  }

  subscribe(channel, callback) {
    this.send({
      subscribe: {
        channel: channel,
      },
    });

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(callback);

    return () => {
      this.send({
        unsubscribe: {
          channel: channel,
        },
      });
      this.subscriptions.get(channel)?.delete(callback);
    };
  }

  subscribeChapter(chapterId, callback) {
    return this.subscribe(`chapter:${chapterId}`, callback);
  }

  subscribeBook(bookId, callback) {
    return this.subscribe(`book:${bookId}`, callback);
  }
}

export { API_BASE_URL, WS_URL, ENDPOINTS, ApiClient, api, CentrifugoClient };
export default api;

// 陪读前端 API 配置
// 将此文件复制到前端项目 src/api/config.js

const API_BASE_URL = 'http://localhost:8080/api/v1';
const WS_URL = 'ws://localhost:8000/connection/websocket';

// API 端点
const ENDPOINTS = {
  // 认证
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME: `${API_BASE_URL}/auth/me`,
  },
  // 书籍
  BOOKS: {
    LIST: `${API_BASE_URL}/books`,
    DETAIL: (id) => `${API_BASE_URL}/books/${id}`,
    CHAPTERS: (id) => `${API_BASE_URL}/books/${id}/chapters`,
    REVIEWS: (id) => `${API_BASE_URL}/books/${id}/reviews`,
  },
  // 章节
  CHAPTERS: {
    DETAIL: (id) => `${API_BASE_URL}/chapters/${id}`,
    NOTES: (id) => `${API_BASE_URL}/chapters/${id}/notes`,
    REVIEWS: (id) => `${API_BASE_URL}/chapters/${id}/reviews`,
    PRESENCE: (id) => `${API_BASE_URL}/chapters/${id}/presence`,
    JOIN: (id) => `${API_BASE_URL}/chapters/${id}/join`,
    LEAVE: (id) => `${API_BASE_URL}/chapters/${id}/leave`,
  },
  // 段评
  NOTES: {
    CREATE: `${API_BASE_URL}/notes`,
    DETAIL: (id) => `${API_BASE_URL}/notes/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/notes/${id}`,
    DELETE: (id) => `${API_BASE_URL}/notes/${id}`,
    LIKE: (id) => `${API_BASE_URL}/notes/${id}/like`,
  },
  // 书评
  REVIEWS: {
    CREATE: `${API_BASE_URL}/reviews`,
    DETAIL: (id) => `${API_BASE_URL}/reviews/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/reviews/${id}`,
    DELETE: (id) => `${API_BASE_URL}/reviews/${id}`,
    LIKE: (id) => `${API_BASE_URL}/reviews/${id}/like`,
  },
  // 在场
  PRESENCE: {
    HEARTBEAT: `${API_BASE_URL}/presence/heartbeat`,
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
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // GET 请求
  get(url) {
    return this.request(url, { method: 'GET' });
  }

  // POST 请求
  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // PUT 请求
  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // DELETE 请求
  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// API 方法
const api = {
  client: new ApiClient(),

  // 认证
  auth: {
    register: (data) => api.client.post(ENDPOINTS.AUTH.REGISTER, data),
    login: (data) => api.client.post(ENDPOINTS.AUTH.LOGIN, data),
    me: () => api.client.get(ENDPOINTS.AUTH.ME),
  },

  // 书籍
  books: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.BOOKS.LIST}?${query}`);
    },
    detail: (id) => api.client.get(ENDPOINTS.BOOKS.DETAIL(id)),
    create: (data) => api.client.post(ENDPOINTS.BOOKS.LIST, data),
    update: (id, data) => api.client.put(ENDPOINTS.BOOKS.DETAIL(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.BOOKS.DETAIL(id)),
    chapters: (id) => api.client.get(ENDPOINTS.BOOKS.CHAPTERS(id)),
    reviews: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.BOOKS.REVIEWS(id)}?${query}`);
    },
  },

  // 章节
  chapters: {
    detail: (id) => api.client.get(ENDPOINTS.CHAPTERS.DETAIL(id)),
    notes: (id) => api.client.get(ENDPOINTS.CHAPTERS.NOTES(id)),
    reviews: (id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return api.client.get(`${ENDPOINTS.CHAPTERS.REVIEWS(id)}?${query}`);
    },
    presence: (id) => api.client.get(ENDPOINTS.CHAPTERS.PRESENCE(id)),
    join: (id, data = {}) => api.client.post(ENDPOINTS.CHAPTERS.JOIN(id), data),
    leave: (id, data = {}) => api.client.post(ENDPOINTS.CHAPTERS.LEAVE(id), data),
  },

  // 段评
  notes: {
    create: (data) => api.client.post(ENDPOINTS.NOTES.CREATE, data),
    detail: (id) => api.client.get(ENDPOINTS.NOTES.DETAIL(id)),
    update: (id, data) => api.client.put(ENDPOINTS.NOTES.UPDATE(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.NOTES.DELETE(id)),
    like: (id) => api.client.post(ENDPOINTS.NOTES.LIKE(id), {}),
    unlike: (id) => api.client.delete(ENDPOINTS.NOTES.LIKE(id)),
  },

  // 书评
  reviews: {
    create: (data) => api.client.post(ENDPOINTS.REVIEWS.CREATE, data),
    detail: (id) => api.client.get(ENDPOINTS.REVIEWS.DETAIL(id)),
    update: (id, data) => api.client.put(ENDPOINTS.REVIEWS.UPDATE(id), data),
    delete: (id) => api.client.delete(ENDPOINTS.REVIEWS.DELETE(id)),
    like: (id) => api.client.post(ENDPOINTS.REVIEWS.LIKE(id), {}),
    unlike: (id) => api.client.delete(ENDPOINTS.REVIEWS.LIKE(id)),
  },

  // 在场
  presence: {
    heartbeat: (chapterId) => api.client.post(ENDPOINTS.PRESENCE.HEARTBEAT, { chapter_id: chapterId }),
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
      console.log('Centrifugo connected');
      // 发送连接请求
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
      console.log('Centrifugo disconnected');
      // 自动重连
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('Centrifugo error:', error);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    // 处理订阅消息
    if (data.push) {
      const { channel, pub } = data.push;
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.forEach((cb) => cb(pub.data));
      }
    }
  }

  subscribe(channel, callback) {
    // 发送订阅请求
    this.send({
      subscribe: {
        channel: channel,
      },
    });

    // 保存回调
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(callback);

    // 返回取消订阅函数
    return () => {
      this.send({
        unsubscribe: {
          channel: channel,
        },
      });
      this.subscriptions.get(channel)?.delete(callback);
    };
  }

  // 订阅章节频道（接收段评、在场更新）
  subscribeChapter(chapterId, callback) {
    return this.subscribe(`chapter:${chapterId}`, callback);
  }

  // 订阅书籍频道（接收书评更新）
  subscribeBook(bookId, callback) {
    return this.subscribe(`book:${bookId}`, callback);
  }
}

// 导出
export { API_BASE_URL, WS_URL, ENDPOINTS, ApiClient, api, CentrifugoClient };
export default api;

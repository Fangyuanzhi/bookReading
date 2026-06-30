import { WS_URL } from './config';
import { apiClient } from './client';

type MessageHandler = (payload: unknown) => void;

/** Centrifugo WebSocket client (mirrors Web frontend) */
export class CentrifugoClient {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  async connect() {
    this.closed = false;
    await apiClient.loadToken();
    const token = apiClient.getToken();

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.send({
        connect: { token },
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        this.handleMessage(data);
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onclose = () => {
      if (this.closed) return;
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = () => {
      // onclose handles reconnect
    };
  }

  disconnect() {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.subscriptions.clear();
  }

  private send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(data: { push?: { channel: string; pub?: { data?: unknown } } }) {
    const push = data.push;
    if (!push?.channel) return;
    const callbacks = this.subscriptions.get(push.channel);
    if (!callbacks) return;
    const payload = push.pub?.data;
    callbacks.forEach((cb) => cb(payload));
  }

  subscribe(channel: string, callback: MessageHandler) {
    this.send({ subscribe: { channel } });

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(callback);

    return () => {
      this.send({ unsubscribe: { channel } });
      this.subscriptions.get(channel)?.delete(callback);
    };
  }

  subscribeChapter(chapterId: string, callback: MessageHandler) {
    return this.subscribe(`chapter:${chapterId}`, callback);
  }
}

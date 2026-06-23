package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"sync"

	"github.com/gin-gonic/gin"
)

// SSEHub SSE 广播中心
type SSEHub struct {
	clients map[string]map[chan []byte]bool
	mu      sync.RWMutex
}

// NewSSEHub 创建 SSE Hub
func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients: make(map[string]map[chan []byte]bool),
	}
}

// Subscribe 订阅频道
func (h *SSEHub) Subscribe(channel string) chan []byte {
	ch := make(chan []byte, 10)
	h.mu.Lock()
	if h.clients[channel] == nil {
		h.clients[channel] = make(map[chan []byte]bool)
	}
	h.clients[channel][ch] = true
	h.mu.Unlock()
	return ch
}

// Unsubscribe 取消订阅
func (h *SSEHub) Unsubscribe(channel string, ch chan []byte) {
	h.mu.Lock()
	if clients, ok := h.clients[channel]; ok {
		delete(clients, ch)
		close(ch)
	}
	h.mu.Unlock()
}

// Broadcast 广播消息
func (h *SSEHub) Broadcast(channel string, data interface{}) {
	jsonData, _ := json.Marshal(data)
	h.mu.RLock()
	clients := h.clients[channel]
	h.mu.RUnlock()

	for ch := range clients {
		select {
		case ch <- jsonData:
		default:
		}
	}
}

// SSEHandler SSE 处理器
type SSEHandler struct {
	hub *SSEHub
}

// NewSSEHandler 创建 SSE 处理器
func NewSSEHandler(hub *SSEHub) *SSEHandler {
	return &SSEHandler{hub: hub}
}

// Subscribe 订阅 SSE 流
func (h *SSEHandler) Subscribe(c *gin.Context) {
	channel := c.Param("channel")

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	ch := h.hub.Subscribe(channel)
	defer h.hub.Unsubscribe(channel, ch)

	c.Stream(func(w io.Writer) bool {
		select {
		case data, ok := <-ch:
			if !ok {
				return false
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

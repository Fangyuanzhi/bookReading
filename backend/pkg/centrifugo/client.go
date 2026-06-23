package centrifugo

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/fangyuanzhi/bookreading-backend/internal/config"
)

// Client Centrifugo 客户端
type Client struct {
	apiURL string
	apiKey string
}

// NewClient 创建 Centrifugo 客户端
func NewClient(cfg *config.CentrifugoConfig) *Client {
	return &Client{
		apiURL: cfg.APIURL,
		apiKey: cfg.APIKey,
	}
}

// PublishRequest 发布请求
type PublishRequest struct {
	Channel string      `json:"channel"`
	Data    interface{} `json:"data"`
}

// Publish 向频道发布消息
func (c *Client) Publish(channel string, data interface{}) error {
	reqBody := PublishRequest{
		Channel: channel,
		Data:    data,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.apiURL+"/publish", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "apikey "+c.apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("centrifugo publish failed: %d", resp.StatusCode)
	}

	return nil
}

// Broadcast 向多个频道广播消息
func (c *Client) Broadcast(channels []string, data interface{}) error {
	reqBody := struct {
		Channels []string    `json:"channels"`
		Data     interface{} `json:"data"`
	}{
		Channels: channels,
		Data:     data,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.apiURL+"/broadcast", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "apikey "+c.apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("centrifugo broadcast failed: %d", resp.StatusCode)
	}

	return nil
}

// GenerateChannelName 生成频道名称
func GenerateChannelName(prefix string, id string) string {
	return fmt.Sprintf("%s:%s", prefix, id)
}

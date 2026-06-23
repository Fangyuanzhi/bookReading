// 实时推送测试
// 模拟前端接收推送

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func main() {
	// 测试直接调用 Centrifugo API 发布消息
	apiKey := "demo-api-key"
	apiURL := "http://localhost:8000/api/publish"

	payload := map[string]interface{}{
		"channel": "chapter:test",
		"data": map[string]interface{}{
			"type": "note_created",
			"data": map[string]string{
				"id":   "test-note-id",
				"body": "测试实时推送",
			},
		},
	}

	jsonData, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "apikey "+apiKey)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Centrifugo 未运行，跳过实时推送测试")
		fmt.Println("错误:", err)
		return
	}
	defer resp.Body.Close()

	fmt.Println("Centrifugo 响应状态:", resp.Status)
}

package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// BotWebhookRequest represents incoming webhook from Telegram
type BotWebhookRequest struct {
	UpdateID int64 `json:"update_id"`
	Message  *struct {
		MessageID int64 `json:"message_id"`
		From      struct {
			ID        int64  `json:"id"`
			FirstName string `json:"first_name"`
			Username  string `json:"username"`
		} `json:"from"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
		Date int64  `json:"date"`
	} `json:"message"`
}

// BotWebhookResponse represents response to send to Telegram
type BotWebhookResponse struct {
	Method string      `json:"method"`
	ChatID int64       `json:"chat_id"`
	Text   string      `json:"text,omitempty"`
	ReplyMarkup interface{} `json:"reply_markup,omitempty"`
}

// InlineKeyboardMarkup represents inline keyboard
type InlineKeyboardMarkup struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

// WebAppInfo represents web app info for button
type WebAppInfo struct {
	URL string `json:"url"`
}

// InlineKeyboardButton represents a button
type InlineKeyboardButton struct {
	Text   string     `json:"text"`
	WebApp *WebAppInfo `json:"web_app,omitempty"`
	URL    string     `json:"url,omitempty"`
}

type BotHandler struct {
	botToken       string
	webAppURL      string
	webhookSecret  string
}

func NewBotHandler(botToken, webAppURL, webhookSecret string) *BotHandler {
	return &BotHandler{
		botToken:      botToken,
		webAppURL:     webAppURL,
		webhookSecret: webhookSecret,
	}
}

// VerifyWebhookSignature verifies Telegram webhook X-Telegram-Bot-API-Secret-Token header
func (h *BotHandler) VerifyWebhookSignature(c *gin.Context) (bool, error) {
	if h.webhookSecret == "" {
		log.Println("⚠️  WARNING: Webhook secret is empty, skipping verification")
		return true, nil
	}

	token := c.GetHeader("X-Telegram-Bot-API-Secret-Token")
	if token == "" {
		return false, nil
	}

	// In production, you should validate the token against your configured webhook secret
	// For development, just check if the header exists
	return token == h.webhookSecret || h.webhookSecret == "", nil
}

// HandleWebhook processes incoming Telegram webhook
func (h *BotHandler) HandleWebhook(c *gin.Context) {
	var req BotWebhookRequest

	// Verify webhook (optional: can skip for development)
	verified, err := h.VerifyWebhookSignature(c)
	if err != nil {
		log.Printf("❌ Webhook verification error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "verification_failed"})
		return
	}

	if !verified && h.webhookSecret != "" {
		log.Println("❌ Webhook signature verification failed")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Failed to parse webhook: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("📨 Webhook received: update_id=%d", req.UpdateID)

	// Handle message
	if req.Message != nil {
		text := strings.TrimSpace(req.Message.Text)
		chatID := req.Message.Chat.ID
		userName := req.Message.From.Username
		firstName := req.Message.From.FirstName

		log.Printf("📬 Message from @%s (%s): %q", userName, firstName, text)

		// Handle /start command
		if strings.HasPrefix(text, "/start") {
			h.respondWithWebApp(c, chatID, userName)
			return
		}

		// Default response
		h.respondWithHelp(c, chatID)
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// respondWithWebApp sends WebApp launch button
func (h *BotHandler) respondWithWebApp(c *gin.Context, chatID int64, userName string) {
	greeting := "欢迎使用 TG HR Platform！"
	if userName != "" {
		greeting = "@" + userName + " 欢迎！"
	}

	resp := gin.H{
		"method":   "sendMessage",
		"chat_id":  chatID,
		"text":     greeting + "\n\n请点击下方按钮打开 HR 招聘平台",
		"reply_markup": gin.H{
			"inline_keyboard": [][]gin.H{
				{
					{
						"text": "📱 打开招聘平台",
						"web_app": gin.H{
							"url": h.webAppURL,
						},
					},
				},
			},
		},
	}

	c.JSON(http.StatusOK, resp)
	log.Printf("✅ Sent WebApp button to chat %d (webapp_url=%s)", chatID, h.webAppURL)
}

// respondWithHelp sends help message
func (h *BotHandler) respondWithHelp(c *gin.Context, chatID int64) {
	resp := gin.H{
		"method":  "sendMessage",
		"chat_id": chatID,
		"text":    "🤖 TG HR Platform Bot\n\n使用 /start 命令开始",
	}

	c.JSON(http.StatusOK, resp)
	log.Printf("✅ Sent help message to chat %d", chatID)
}

// SetBotCommands sets bot commands via Telegram Bot API
// Call this once during startup to register /start command in BotFather menu
func SetBotCommands(botToken string) error {
	if botToken == "" {
		log.Println("⚠️  No bot token provided, skipping SetBotCommands")
		return nil
	}

	// Call Telegram API: POST /bot<token>/setMyCommands
	url := "https://api.telegram.org/bot" + botToken + "/setMyCommands"

	// Would need to use http.Client to POST here
	// For now, just log instruction
	log.Printf("💡 To register /start command, visit BotFather or call: %s", url)

	return nil
}

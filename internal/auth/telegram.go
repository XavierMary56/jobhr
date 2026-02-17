package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"tg-hr-platform/internal/domain"
)

// TelegramAuthData represents data received from Telegram login widget
type TelegramAuthData struct {
	ID            int64  `json:"id"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Username      string `json:"username"`
	PhotoURL      string `json:"photo_url"`
	AuthDate      int64  `json:"auth_date"`
	Hash          string `json:"hash"`
}

type TelegramVerifier struct {
	botToken string
}

func NewTelegramVerifier(botToken string) *TelegramVerifier {
	return &TelegramVerifier{botToken: botToken}
}

// VerifyAuthData verifies Telegram login widget authenticity
// This implements Telegram bot API's Widget verification method
// See: https://core.telegram.org/widgets/login
func (v *TelegramVerifier) VerifyAuthData(data *TelegramAuthData) error {
	// 1. Check timestamp (data must be within 1 hour)
	now := time.Now().Unix()
	if now-data.AuthDate > 3600 {
		return errors.New("auth_data_expired")
	}

	// 2. Reconstruct data-check-string
	// Sort params (excluding hash) alphabetically
	params := map[string]string{
		"id":         strconv.FormatInt(data.ID, 10),
		"first_name": data.FirstName,
		"auth_date":  strconv.FormatInt(data.AuthDate, 10),
	}
	if data.LastName != "" {
		params["last_name"] = data.LastName
	}
	if data.Username != "" {
		params["username"] = data.Username
	}
	if data.PhotoURL != "" {
		params["photo_url"] = data.PhotoURL
	}

	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	for i, k := range keys {
		if i > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(params[k])
	}
	dataCheckString := sb.String()

	// 3. Compute HMAC-SHA256
	// secret_key = HMAC_SHA256("TelegramBotTokenWithGetMe", BotToken)
	secretKey := hmac.New(sha256.New, []byte("TelegramBotTokenWithGetMe"))
	secretKey.Write([]byte(v.botToken))
	secretKeyStr := hex.EncodeToString(secretKey.Sum(nil))

	// compute hash
	h := hmac.New(sha256.New, []byte(secretKeyStr))
	h.Write([]byte(dataCheckString))
	hash := hex.EncodeToString(h.Sum(nil))

	// 4. Compare with provided hash
	if hash != data.Hash {
		return errors.New("invalid_hash")
	}

	return nil
}

// GenerateTelegramClaims creates HR claims from Telegram auth data
func (v *TelegramVerifier) GenerateTelegramClaims(data *TelegramAuthData, companyID int64, hrUserID int64) *domain.HRClaims {
	return &domain.HRClaims{
		HRUserID:  hrUserID,
		CompanyID: companyID,
		Status:    "active",
		Role:      "recruiter",
	}
}

// TelegramUserInfo extracts display name from Telegram auth data
func (data *TelegramAuthData) GetDisplayName() string {
	name := data.FirstName
	if data.LastName != "" {
		name = fmt.Sprintf("%s %s", name, data.LastName)
	}
	return name
}

// GetUsername returns Telegram username or tg_user_id fallback
func (data *TelegramAuthData) GetUsername() string {
	if data.Username != "" {
		return data.Username
	}
	return fmt.Sprintf("tg_%d", data.ID)
}

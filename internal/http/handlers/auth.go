package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"tg-hr-platform/internal/auth"
	"tg-hr-platform/internal/domain"
)

type AuthHandler struct {
	telegramVerifier *auth.TelegramVerifier
	jwtSigner        JWTSigner
	userRepo         HRUserRepository
	cookieSecure     bool
}

type JWTSigner interface {
	SignClaims(claims *domain.HRClaims) (string, error)
}

type HRUserRepository interface {
	// GetOrCreateHRUserByTelegramID returns hr_user_id, company_id, status, error
	GetOrCreateHRUserByTelegramID(userID int64, username, displayName string) (hrUserID, companyID int64, status string, err error)
}

func NewAuthHandler(telegramVerifier *auth.TelegramVerifier, jwtSigner JWTSigner, userRepo HRUserRepository, cookieSecure bool) *AuthHandler {
	return &AuthHandler{
		telegramVerifier: telegramVerifier,
		jwtSigner:        jwtSigner,
		userRepo:         userRepo,
		cookieSecure:     cookieSecure,
	}
}

// TelegramLogin handles Telegram login widget callback
// POST /auth/telegram/login
// Body: { "id", "first_name", "username", "auth_date", "hash", ... }
func (h *AuthHandler) TelegramLogin(c *gin.Context) {
	var data auth.TelegramAuthData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	// 1. Verify Telegram auth data authenticity
	if err := h.telegramVerifier.VerifyAuthData(&data); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_auth_data"})
		return
	}

	// 2. Get or create HR user
	hrUserID, companyID, status, err := h.userRepo.GetOrCreateHRUserByTelegramID(
		data.ID,
		data.GetUsername(),
		data.GetDisplayName(),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error"})
		return
	}

	// 3. Generate JWT claims
	claims := &domain.HRClaims{
		HRUserID:  hrUserID,
		CompanyID: companyID,
		Status:    status,
		Role:      "recruiter",
	}

	// 4. Sign JWT token
	tokenStr, err := h.jwtSigner.SignClaims(claims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token_generation_failed"})
		return
	}

	// 5. Set secure cookie
	c.SetCookie(
		"hr_auth",
		tokenStr,
		24*3600, // 24 hours
		"/",
		"",             // domain: empty for current domain
		h.cookieSecure, // secure (HTTPS only in production)
		true,           // httponly
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user_id": hrUserID,
		"status":  status,
	})
}

// JWTClaims implements JWTSigner for signing HR claims
type JWTClaimsSigner struct {
	secret []byte
}

func NewJWTClaimsSigner(secret string) *JWTClaimsSigner {
	return &JWTClaimsSigner{secret: []byte(secret)}
}

func (s *JWTClaimsSigner) SignClaims(claims *domain.HRClaims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"hr_user_id": claims.HRUserID,
		"company_id": claims.CompanyID,
		"status":     claims.Status,
		"role":       claims.Role,
	})
	return token.SignedString(s.secret)
}

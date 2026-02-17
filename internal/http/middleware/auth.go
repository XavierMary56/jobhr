package middleware

import (
	"net/http"

	"tg-hr-platform/internal/domain"

	"github.com/gin-gonic/gin"
)

const CtxHRClaimsKey = "hr_claims"

type JWTVerifier interface {
    Parse(token string) (*domain.HRClaims, error)
}

type AuthMiddleware struct {
    JWT JWTVerifier
}

func (m *AuthMiddleware) Auth() gin.HandlerFunc {
    return func(c *gin.Context) {
        cookie, err := c.Request.Cookie("hr_auth")
        if err != nil || cookie.Value == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        claims, err := m.JWT.Parse(cookie.Value)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_token"})
            return
        }
        c.Set(CtxHRClaimsKey, claims)
        c.Next()
    }
}

func (m *AuthMiddleware) AuthActiveHR() gin.HandlerFunc {
    return func(c *gin.Context) {
        v, ok := c.Get(CtxHRClaimsKey)
        if !ok {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        claims := v.(*domain.HRClaims)
        switch claims.Status {
        case "active":
            c.Next()
        case "pending":
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "pending_approval"})
        default:
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "blocked"})
        }
    }
}

package auth

import (
    "errors"

    "github.com/golang-jwt/jwt/v5"
    "tg-hr-platform/internal/domain"
)

type JWTVerifier struct {
    secret []byte
}

func NewJWTVerifier(secret string) *JWTVerifier {
    return &JWTVerifier{secret: []byte(secret)}
}

// Parse implements middleware.JWTVerifier
func (v *JWTVerifier) Parse(tokenStr string) (*domain.HRClaims, error) {
    token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return v.secret, nil
    })
    if err != nil || token == nil || !token.Valid {
        return nil, errors.New("invalid token")
    }

    claimsMap, ok := token.Claims.(jwt.MapClaims)
    if !ok {
        return nil, errors.New("invalid claims")
    }

    // required fields
    hrUserID, _ := toInt64(claimsMap["hr_user_id"])
    companyID, _ := toInt64(claimsMap["company_id"])
    status, _ := claimsMap["status"].(string)
    role, _ := claimsMap["role"].(string)

    if hrUserID == 0 || companyID == 0 {
        return nil, errors.New("missing fields")
    }
    if status == "" {
        status = "active"
    }
    return &domain.HRClaims{
        HRUserID:  hrUserID,
        CompanyID: companyID,
        Status:    status,
        Role:      role,
    }, nil
}

func toInt64(v any) (int64, bool) {
    switch x := v.(type) {
    case float64:
        return int64(x), true
    case int64:
        return x, true
    case int:
        return int64(x), true
    case string:
        // ignore for MVP
        return 0, false
    default:
        return 0, false
    }
}

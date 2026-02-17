package domain

import "errors"

var (
    ErrNotFound           = errors.New("not_found")
    ErrQuotaExceeded      = errors.New("quota_exceeded")
    ErrQuotaNotConfigured = errors.New("quota_not_configured")
)

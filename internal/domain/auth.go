package domain

type HRClaims struct {
    HRUserID  int64  `json:"hr_user_id"`
    CompanyID int64  `json:"company_id"`
    Status    string `json:"status"` // pending/active/blocked
    Role      string `json:"role"`   // owner/admin/recruiter
}

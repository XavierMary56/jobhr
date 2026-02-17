package util

import "github.com/jackc/pgx/v5/pgtype"

func TextOrEmpty(t pgtype.Text) string {
    if t.Valid {
        return t.String
    }
    return ""
}

func Int4OrZero(n pgtype.Int4) int32 {
    if n.Valid {
        return n.Int32
    }
    return 0
}

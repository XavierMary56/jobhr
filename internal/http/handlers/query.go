package handlers

import (
    "strconv"

    "github.com/gin-gonic/gin"
)

func strPtr(v string) *string {
    if v == "" {
        return nil
    }
    return &v
}

func boolPtrFromQuery(c *gin.Context, key string) *bool {
    v := c.Query(key)
    if v == "true" || v == "false" {
        b := (v == "true")
        return &b
    }
    return nil
}

func int32PtrFromQuery(c *gin.Context, key string) *int32 {
    v := c.Query(key)
    if v == "" {
        return nil
    }
    n, err := strconv.Atoi(v)
    if err != nil {
        return nil
    }
    x := int32(n)
    return &x
}

func parsePagination(c *gin.Context) (page, pageSize int, limit, offset int32) {
    page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
    if page < 1 {
        page = 1
    }
    pageSize, _ = strconv.Atoi(c.DefaultQuery("page_size", "20"))
    if pageSize <= 0 || pageSize > 100 {
        pageSize = 20
    }
    limit = int32(pageSize)
    offset = int32((page - 1) * pageSize)
    return
}

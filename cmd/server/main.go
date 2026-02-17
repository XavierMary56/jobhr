package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"

	"tg-hr-platform/internal/auth"
	"tg-hr-platform/internal/cache"
	"tg-hr-platform/internal/db"
	"tg-hr-platform/internal/http/handlers"
	"tg-hr-platform/internal/http/middleware"
	"tg-hr-platform/internal/repo"
	"tg-hr-platform/internal/service"
)

func main() {
    _ = godotenv.Load()

    ctx := context.Background()

    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL is required")
    }
    pool, err := pgxpool.New(ctx, dbURL)
    if err != nil {
        log.Fatal(err)
    }
    defer pool.Close()

    // Redis (optional but recommended)
    rdb := redis.NewClient(&redis.Options{
        Addr:     getenv("REDIS_ADDR", "127.0.0.1:6379"),
        Password: os.Getenv("REDIS_PASSWORD"),
        DB:       0,
    })
    _ = rdb.Ping(ctx).Err() // ignore; app can still run without cache

    // db layer (sqlc-like placeholder)
    queries := db.New(pool)

    // Initialize services
    candRepo := &repo.CandidateRepo{Q: queries, Pool: pool}
    candCache := &cache.CandidateCache{RDB: rdb}
    candSvc := &service.CandidateService{Repo: candRepo, Cache: candCache}

    hrUserRepo := &repo.HRUserRepo{Q: queries, Pool: pool}
    auditSvc := &service.AuditLogService{Q: queries}

    jwtVerifier := auth.NewJWTVerifier(getenv("JWT_SECRET", "dev-secret-change-me"))
    jwtSigner := handlers.NewJWTClaimsSigner(getenv("JWT_SECRET", "dev-secret-change-me"))
    telegramVerifier := auth.NewTelegramVerifier(getenv("TELEGRAM_BOT_TOKEN", ""))
    authMw := &middleware.AuthMiddleware{JWT: jwtVerifier}

    r := gin.New()
    r.Use(gin.Recovery())
    r.Use(gin.Logger())

    r.GET("/healthz", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"ok": true, "ts": time.Now().UTC()})
    })

    // Public auth endpoints
    authHandler := handlers.NewAuthHandler(telegramVerifier, jwtSigner, hrUserRepo)
    r.POST("/auth/telegram/login", authHandler.TelegramLogin)

    // Protected API endpoints
    api := r.Group("/api")
    api.Use(authMw.Auth(), authMw.AuthActiveHR())

    candH := &handlers.CandidateHandler{Svc: candSvc, Audit: auditSvc}
    api.GET("/candidates", candH.List)
    api.GET("/candidates/:slug", candH.Get)
    api.POST("/candidates/:slug/unlock", candH.Unlock)

    auditH := &handlers.AuditLogHandler{Svc: auditSvc}
    api.GET("/audit-logs", auditH.GetAuditLogs)

    addr := getenv("ADDR", ":8080")
    log.Printf("listening on %s", addr)
    if err := r.Run(addr); err != nil {
        log.Fatal(err)
    }
}

func getenv(k, def string) string {
    v := os.Getenv(k)
    if v == "" {
        return def
    }
    return v
}

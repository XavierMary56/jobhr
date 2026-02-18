package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
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

    hrDefaultStatus := getenv("HR_DEFAULT_STATUS", "active")
    hrUserRepo := &repo.HRUserRepo{Q: queries, Pool: pool, DefaultStatus: hrDefaultStatus}
    auditSvc := &service.AuditLogService{Q: queries}

    jwtVerifier := auth.NewJWTVerifier(getenv("JWT_SECRET", "dev-secret-change-me"))
    jwtSigner := handlers.NewJWTClaimsSigner(getenv("JWT_SECRET", "dev-secret-change-me"))
    telegramVerifier := auth.NewTelegramVerifier(getenv("TELEGRAM_BOT_TOKEN", ""))

    // 开发模式开关（优先级高于 bot token）
    devMode := strings.EqualFold(getenv("TELEGRAM_DEV_MODE", ""), "true") || getenv("TELEGRAM_DEV_MODE", "") == "1"
    if devMode {
        telegramVerifier.SetDevMode(true)
        log.Println("⚠️  WARNING: Telegram verification is DISABLED (TELEGRAM_DEV_MODE=true)")
    } else if getenv("TELEGRAM_BOT_TOKEN", "") == "" {
        log.Println("⚠️  WARNING: TELEGRAM_BOT_TOKEN is empty; set TELEGRAM_DEV_MODE=true for local testing")
    }
    
    authMw := &middleware.AuthMiddleware{JWT: jwtVerifier}

    r := gin.New()
    r.Use(gin.Recovery())
    r.Use(gin.Logger())
    
    // CORS middleware
    allowedOrigins := getAllowedOrigins()
    r.Use(func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        
        // 检查请求的 origin 是否在允许列表中
        if origin != "" && isAllowedOrigin(origin, allowedOrigins) {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
            c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
            c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, Cookie")
            c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
        }

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    })

    r.GET("/healthz", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"ok": true, "ts": time.Now().UTC()})
    })

    // Telegram Bot webhook
    botToken := getenv("TELEGRAM_BOT_TOKEN", "")
    webAppURL := getenv("BOT_WEBAPP_URL", "http://localhost:3000")
    webhookSecret := getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if botToken != "" {
        botHandler := handlers.NewBotHandler(botToken, webAppURL, webhookSecret)
        r.POST("/bot/webhook", botHandler.HandleWebhook)
        log.Printf("✅ Bot webhook registered at POST /bot/webhook")
        log.Printf("📍 WebApp URL: %s", webAppURL)
    } else {
        log.Println("⚠️  TELEGRAM_BOT_TOKEN is empty, bot webhook is disabled")
    }

    // Public auth endpoints
    cookieSecure := strings.EqualFold(getenv("COOKIE_SECURE", "false"), "true") || getenv("COOKIE_SECURE", "") == "1"
        authHandler := handlers.NewAuthHandler(telegramVerifier, jwtSigner, hrUserRepo, cookieSecure)
    r.POST("/auth/telegram/login", authHandler.TelegramLogin)

    // Protected API endpoints
    api := r.Group("/api")
    api.Use(authMw.Auth(), authMw.AuthActiveHR())
    
        accountH := handlers.NewAccountHandler(queries)
        api.GET("/me", accountH.GetMe)

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

// getAllowedOrigins 从环境变量获取允许的源列表
// 支持多个源（逗号分隔），例如：ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://example.com
func getAllowedOrigins() []string {
    originsStr := getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
    origins := strings.Split(originsStr, ",")
    
    // 去除空格
    for i, origin := range origins {
        origins[i] = strings.TrimSpace(origin)
    }
    
    return origins
}

// isAllowedOrigin 检查 origin 是否在允许列表中
func isAllowedOrigin(origin string, allowedOrigins []string) bool {
    for _, allowed := range allowedOrigins {
        if origin == allowed {
            return true
        }
    }
    return false
}

# Multi-stage Dockerfile for tg-hr-platform

# Stage 1: Build
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go.mod and go.sum
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates postgresql-client curl

# Copy built binary from builder
COPY --from=builder /app/server .

# Copy migration files
COPY migrations ./migrations

# Copy schema files
COPY docs ./docs

# Expose port
EXPOSE 8080

# Run application
CMD ["./server"]

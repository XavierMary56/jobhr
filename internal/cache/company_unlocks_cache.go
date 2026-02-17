package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// CompanyUnlocksCache caches which candidates a company has unlocked
type CompanyUnlocksCache struct {
	RDB *redis.Client
}

func companyUnlocksKey(companyID int64) string {
	return fmt.Sprintf("company:unlocks:%d", companyID)
}

// AddUnlock adds a candidate to the company's unlocks set
func (c *CompanyUnlocksCache) AddUnlock(ctx context.Context, companyID, candidateID int64, ttl time.Duration) error {
	return c.RDB.SAdd(ctx, companyUnlocksKey(companyID), candidateID).Err()
}

// IsUnlocked checks if a company has already unlocked a candidate
func (c *CompanyUnlocksCache) IsUnlocked(ctx context.Context, companyID, candidateID int64) (bool, error) {
	val, err := c.RDB.SIsMember(ctx, companyUnlocksKey(companyID), candidateID).Result()
	return val, err
}

// GetUnlocks retrieves all unlocked candidates for a company
func (c *CompanyUnlocksCache) GetUnlocks(ctx context.Context, companyID int64) ([]int64, error) {
	members, err := c.RDB.SMembers(ctx, companyUnlocksKey(companyID)).Result()
	if err != nil {
		return nil, err
	}
	ids := make([]int64, len(members))
	for i, m := range members {
		fmt.Sscanf(m, "%d", &ids[i])
	}
	return ids, nil
}

// InvalidateCompanyUnlocks clears all unlocks for a company
func (c *CompanyUnlocksCache) InvalidateCompanyUnlocks(ctx context.Context, companyID int64) error {
	return c.RDB.Del(ctx, companyUnlocksKey(companyID)).Err()
}

// SetUnlocksTTL sets TTL for the company unlocks set (e.g., 30 days for a quota period)
func (c *CompanyUnlocksCache) SetUnlocksTTL(ctx context.Context, companyID int64, ttl time.Duration) error {
	return c.RDB.Expire(ctx, companyUnlocksKey(companyID), ttl).Err()
}

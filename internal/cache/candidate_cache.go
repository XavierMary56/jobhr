package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

type CandidateCache struct {
    RDB *redis.Client
}

func skillsKey(id int64) string { return fmt.Sprintf("cand:skills:%d", id) }

func (c *CandidateCache) GetSkillsBatch(ctx context.Context, ids []int64) (hit map[int64][]string, miss []int64, err error) {
    hit = make(map[int64][]string, len(ids))
    miss = make([]int64, 0)

    pipe := c.RDB.Pipeline()
    cmds := make([]*redis.StringCmd, 0, len(ids))
    for _, id := range ids {
        cmds = append(cmds, pipe.Get(ctx, skillsKey(id)))
    }
    _, _ = pipe.Exec(ctx)

    for i, id := range ids {
        val, e := cmds[i].Result()
        if e == redis.Nil || val == "" {
            miss = append(miss, id)
            continue
        }
        var skills []string
        if json.Unmarshal([]byte(val), &skills) != nil {
            miss = append(miss, id)
            continue
        }
        hit[id] = skills
    }
    return hit, miss, nil
}

func (c *CandidateCache) SetSkillsBatch(ctx context.Context, m map[int64][]string, ttl time.Duration) error {
    pipe := c.RDB.Pipeline()
    for id, skills := range m {
        b, _ := json.Marshal(skills)
        pipe.SetEx(ctx, skillsKey(id), string(b), ttl)
    }
    _, err := pipe.Exec(ctx)
    return err
}

func (c *CandidateCache) InvalidateSkills(ctx context.Context, candidateID int64) error {
    return c.RDB.Del(ctx, skillsKey(candidateID)).Err()
}

package service

import (
    "context"
    "time"

    "tg-hr-platform/internal/cache"
    "tg-hr-platform/internal/db"
    "tg-hr-platform/internal/domain"
    "tg-hr-platform/internal/repo"
    "tg-hr-platform/internal/util"
)

type CandidateService struct {
    Repo  *repo.CandidateRepo
    Cache *cache.CandidateCache
}

const skillsTTL = 24 * time.Hour

func (s *CandidateService) ListCandidates(ctx context.Context, f domain.CandidateListFilter) ([]domain.CandidateCard, error) {
    rows, err := s.Repo.ListPage(ctx, db.ListCandidatesPageParams{
        CompanyID:    f.CompanyID,
        EnglishLevel: f.English,
        BcExperience: f.BC,
        AvailMax:     f.AvailMax,
        SalaryMin:    f.SalaryMin,
        SalaryMax:    f.SalaryMax,
        Skill:        f.Skill,
        Q:            f.Q,
        Limit:        f.Limit,
        Offset:       f.Offset,
    })
    if err != nil {
        return nil, err
    }
    if len(rows) == 0 {
        return []domain.CandidateCard{}, nil
    }

    ids := make([]int64, 0, len(rows))
    out := make([]domain.CandidateCard, len(rows))
    idToIdx := make(map[int64]int, len(rows))

    for i, r := range rows {
        ids = append(ids, r.ID)
        idToIdx[r.ID] = i
        out[i] = domain.CandidateCard{
            Slug:              r.PublicSlug,
            DisplayName:       r.DisplayName,
            DesiredRole:       util.TextOrEmpty(r.DesiredRole),
            EnglishLevel:      util.TextOrEmpty(r.EnglishLevel),
            ExpectedSalaryMin: util.Int4OrZero(r.ExpectedSalaryMinCny),
            ExpectedSalaryMax: util.Int4OrZero(r.ExpectedSalaryMaxCny),
            AvailabilityDays:  util.Int4OrZero(r.AvailabilityDays),
            Timezone:          util.TextOrEmpty(r.Timezone),
            BCExperience:      r.BcExperience,
            Summary:           util.TextOrEmpty(r.Summary),
            UnlockedContact:   r.UnlockedContact,
            Skills:            []string{},
        }
    }

    hit, miss, err := s.Cache.GetSkillsBatch(ctx, ids)
    if err != nil {
        return nil, err
    }
    for id, skills := range hit {
        out[idToIdx[id]].Skills = skills
    }

    if len(miss) > 0 {
        skillRows, err := s.Repo.ListSkillsByIDs(ctx, miss)
        if err != nil {
            return nil, err
        }
        tmp := make(map[int64][]string, len(miss))
        for _, id := range miss {
            tmp[id] = []string{}
        }
        for _, r := range skillRows {
            tmp[r.CandidateID] = append(tmp[r.CandidateID], r.Name)
        }
        _ = s.Cache.SetSkillsBatch(ctx, tmp, skillsTTL)
        for id, skills := range tmp {
            out[idToIdx[id]].Skills = skills
        }
    }

    return out, nil
}

func (s *CandidateService) GetCandidateDetail(ctx context.Context, companyID int64, slug string) (*domain.CandidateDetail, error) {
    r, err := s.Repo.GetBySlugWithUnlocked(ctx, companyID, slug)
    if err != nil {
        return nil, err
    }

    d := &domain.CandidateDetail{
        CandidateCard: domain.CandidateCard{
            Slug:              r.PublicSlug,
            DisplayName:       r.DisplayName,
            DesiredRole:       util.TextOrEmpty(r.DesiredRole),
            EnglishLevel:      util.TextOrEmpty(r.EnglishLevel),
            ExpectedSalaryMin: util.Int4OrZero(r.ExpectedSalaryMinCny),
            ExpectedSalaryMax: util.Int4OrZero(r.ExpectedSalaryMaxCny),
            AvailabilityDays:  util.Int4OrZero(r.AvailabilityDays),
            Timezone:          util.TextOrEmpty(r.Timezone),
            BCExperience:      r.BcExperience,
            Summary:           util.TextOrEmpty(r.Summary),
            UnlockedContact:   r.UnlockedContact,
            Skills:            []string{},
        },
    }

    hit, miss, err := s.Cache.GetSkillsBatch(ctx, []int64{r.ID})
    if err != nil {
        return nil, err
    }
    if v, ok := hit[r.ID]; ok {
        d.Skills = v
    } else if len(miss) == 1 {
        skillRows, err := s.Repo.ListSkillsByIDs(ctx, miss)
        if err != nil {
            return nil, err
        }
        tmp := map[int64][]string{r.ID: []string{}}
        for _, sr := range skillRows {
            tmp[sr.CandidateID] = append(tmp[sr.CandidateID], sr.Name)
        }
        _ = s.Cache.SetSkillsBatch(ctx, tmp, skillsTTL)
        d.Skills = tmp[r.ID]
    }

    if r.UnlockedContact {
        cc, err := s.Repo.GetContactByID(ctx, r.ID)
        if err == nil {
            d.Contact = &cc
        }
    }

    return d, nil
}

func (s *CandidateService) UnlockContact(ctx context.Context, companyID, hrUserID int64, slug string) (*domain.CandidateContact, error) {
    candidateID, err := s.Repo.GetIDBySlug(ctx, slug)
    if err != nil {
        return nil, err
    }

    _, err = s.Repo.UnlockContactTx(ctx, companyID, hrUserID, candidateID)
    if err != nil {
        return nil, err
    }

    cc, err := s.Repo.GetContactByID(ctx, candidateID)
    if err != nil {
        return nil, err
    }
    return &cc, nil
}

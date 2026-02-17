package domain

type CandidateCard struct {
    Slug              string   `json:"slug"`
    DisplayName       string   `json:"display_name"`
    DesiredRole       string   `json:"desired_role"`
    EnglishLevel      string   `json:"english_level"`
    ExpectedSalaryMin int32    `json:"expected_salary_min_cny"`
    ExpectedSalaryMax int32    `json:"expected_salary_max_cny"`
    AvailabilityDays  int32    `json:"availability_days"`
    Timezone          string   `json:"timezone"`
    BCExperience      bool     `json:"bc_experience"`
    Summary           string   `json:"summary"`
    UnlockedContact   bool     `json:"unlocked_contact"`
    Skills            []string `json:"skills"`
}

type CandidateContact struct {
    TgUsername string `json:"tg_username,omitempty"`
    Email      string `json:"email,omitempty"`
    Phone      string `json:"phone,omitempty"`
}

type CandidateDetail struct {
    CandidateCard
    Contact *CandidateContact `json:"contact,omitempty"`
}

type CandidateListFilter struct {
    CompanyID int64
    Q         *string
    Skill     *string
    English   *string
    SalaryMin *int32
    SalaryMax *int32
    AvailMax  *int32
    BC        *bool
    Limit     int32
    Offset    int32
}

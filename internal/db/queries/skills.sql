-- name: ListSkillsByCandidateIDs :many
SELECT
  cs.candidate_id,
  s.name
FROM candidate_skills cs
JOIN skills s ON s.id = cs.skill_id
WHERE cs.candidate_id = ANY(sqlc.arg('candidate_ids')::bigint[])
ORDER BY cs.candidate_id;

CREATE INDEX IF NOT EXISTS member_roles_expires_at_idx
  ON member_roles (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS audit_logs_community_created_at_idx
  ON audit_logs (community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moderation_actions_community_created_at_idx
  ON moderation_actions (community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS warnings_member_created_at_idx
  ON warnings (member_id, created_at DESC);

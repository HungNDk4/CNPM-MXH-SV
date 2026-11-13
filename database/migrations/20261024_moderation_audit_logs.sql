-- EXT-03 additive SQL migration for reviewed existing MySQL8 database.
-- Operator must confirm DB and prior migrations; no automated production rollout.
USE mini_study_network;
-- EXT-03: Append-only through the API. No actor/post FK cascade: retain event IDs.
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_admin_id    INT UNSIGNED NOT NULL,
  post_id           INT UNSIGNED NOT NULL,
  previous_status   ENUM('active','hidden','deleted') NOT NULL,
  new_status        ENUM('hidden','deleted') NOT NULL,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_moderation_audit_recent (created_at, id),
  INDEX idx_moderation_audit_post_recent (post_id, created_at, id)
) ENGINE=InnoDB;

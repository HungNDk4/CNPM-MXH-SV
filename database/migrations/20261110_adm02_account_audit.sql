-- ADM-02: additive account moderation history only; NO account/auth column changes.
-- READ-ONLY PREFLIGHT before applying to a non-disposable database:
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()
--   AND TABLE_NAME='account_moderation_audit_logs';
-- Verify a backup/recovery point and obtain explicit operator approval.
-- Never execute this file against the shared TiDB main branch from CI.
CREATE TABLE IF NOT EXISTS account_moderation_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_admin_id INT UNSIGNED NOT NULL,
  target_user_id INT UNSIGNED NOT NULL,
  previous_active TINYINT(1) NOT NULL,
  new_active TINYINT(1) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_account_audit_recent (created_at, id),
  INDEX idx_account_audit_target_recent (target_user_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

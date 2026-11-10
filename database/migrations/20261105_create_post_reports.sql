-- ================================================================
-- Additive Migration: post_reports (Report Post & Moderation Queue)
-- Does not alter or drop any existing tables or data.
-- ================================================================
USE mini_study_network;

CREATE TABLE IF NOT EXISTS post_reports (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id  INT UNSIGNED NOT NULL,
  post_id      INT UNSIGNED NOT NULL,
  reason       ENUM('spam', 'inappropriate', 'copyright', 'harassment', 'other') NOT NULL,
  details      VARCHAR(500) DEFAULT NULL,
  status       ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_post_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_reports_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_post_reports_reporter_post (reporter_id, post_id),
  INDEX idx_post_reports_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- EXT-04 additive MySQL8 migration for a reviewed existing database.
USE mini_study_network;
-- EXT-04: user-only in-app notifications (no payload/body/PDF paths).
CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT UNSIGNED NOT NULL,
  actor_id     INT UNSIGNED NOT NULL,
  event_type   ENUM('follow','comment','reply','like_post','like_comment') NOT NULL,
  post_id      INT UNSIGNED DEFAULT NULL,
  comment_id   INT UNSIGNED DEFAULT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT chk_notifications_not_self CHECK (recipient_id <> actor_id),
  INDEX idx_notifications_recipient_recent (recipient_id, created_at, id),
  INDEX idx_notifications_recipient_read_recent (recipient_id, is_read, created_at, id)
) ENGINE=InnoDB;

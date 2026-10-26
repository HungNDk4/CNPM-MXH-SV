-- EXT-02 additive SQL migration (review DB before applying).
USE mini_study_network;
CREATE TABLE IF NOT EXISTS user_follows (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  follower_id INT UNSIGNED NOT NULL,
  following_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_follows_no_self CHECK (follower_id <> following_id),
  UNIQUE KEY uq_follows_pair (follower_id, following_id),
  INDEX idx_follows_followers (following_id, created_at, id),
  INDEX idx_follows_following (follower_id, created_at, id)
) ENGINE=InnoDB;

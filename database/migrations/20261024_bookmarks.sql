-- EXT-01 additive migration for existing MySQL8 databases.
-- Run against a backed-up reviewed database before exposing bookmark API.
USE mini_study_network;

-- EXT-01 Bookmarks: independent per-user saved-post collection.
CREATE TABLE IF NOT EXISTS bookmarks (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  post_id    INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_bookmarks_user_post (user_id, post_id),
  INDEX idx_bookmarks_user_created (user_id, created_at, id)
) ENGINE=InnoDB;

-- ================================================================
-- Additive Migration: post_images (Upload up to 4 images per post)
-- Does not alter or drop any existing tables or data.
-- ================================================================
USE mini_study_network;

CREATE TABLE IF NOT EXISTS post_images (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id       INT UNSIGNED NOT NULL,
  image_url     VARCHAR(500) NOT NULL,
  storage_key   VARCHAR(100) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(50)  NOT NULL DEFAULT 'image/jpeg',
  size_bytes    INT UNSIGNED NOT NULL,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_pi_post_order (post_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


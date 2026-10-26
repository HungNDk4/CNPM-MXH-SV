-- DOC-03: apply once on existing DB before enabling authenticated upload.
-- Safe to reapply; never drops/truncates existing user data.
USE mini_study_network;
CREATE TABLE IF NOT EXISTS document_files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NOT NULL,
  storage_key VARCHAR(70) NOT NULL,
  original_name VARCHAR(180) NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'application/pdf',
  size_bytes INT UNSIGNED NOT NULL,
  sha256 CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_df_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_df_post (post_id),
  UNIQUE KEY uq_df_key (storage_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

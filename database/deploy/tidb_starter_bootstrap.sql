-- DEP-01C isolated TiDB Cloud Starter bootstrap for Mini Study Network.
-- Derived from database/schema.sql plus database/migrations/20261021_document_files.sql.
-- FOR NEW, EMPTY mini_study_network DATABASE ONLY. Keep DB_AUTO_SYNC=false on Render.
-- No administrator seed: original schema.sql contains an example placeholder password hash.
-- SQL Editor: run ALL statements sequentially in this file on TiDB Starter (MySQL Compatible).
-- No DROP, TRUNCATE, DELETE or INSERT statements in this bootstrap.

-- ================================================================
-- Mini Study Network - Database Schema (MySQL)
-- ================================================================

CREATE DATABASE IF NOT EXISTS mini_study_network
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_study_network;

-- ----------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  avatar_url    VARCHAR(500)  DEFAULT NULL,
  bio           TEXT          DEFAULT NULL,
  university    VARCHAR(200)  DEFAULT NULL,
  major         VARCHAR(200)  DEFAULT NULL,
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00  COMMENT 'Số dư ví (VNĐ)',
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 2. POSTS (Bài viết / Tài liệu)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  title         VARCHAR(300) NOT NULL,
  content       TEXT         DEFAULT NULL              COMMENT 'Nội dung bài viết / mô tả tài liệu',
  post_type     ENUM('question','document','discussion') NOT NULL DEFAULT 'question',
  -- Trường dành cho tài liệu
  file_url      VARCHAR(500) DEFAULT NULL              COMMENT 'URL file (Google Drive / S3 / local)',
  file_name     VARCHAR(255) DEFAULT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '0 = miễn phí',
  subject       VARCHAR(200) DEFAULT NULL              COMMENT 'Môn học liên quan',
  tags          JSON         DEFAULT NULL              COMMENT '["java","oop","cnpm"]',
  view_count    INT UNSIGNED NOT NULL DEFAULT 0,
  status        ENUM('active','hidden','deleted') NOT NULL DEFAULT 'active',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_user    (user_id),
  INDEX idx_posts_type    (post_type),
  INDEX idx_posts_price   (price),
  INDEX idx_posts_status  (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 3. COMMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  parent_id   INT UNSIGNED DEFAULT NULL               COMMENT 'NULL = comment gốc, có giá trị = reply',
  content     TEXT         NOT NULL,
  status      ENUM('active','deleted') NOT NULL DEFAULT 'active',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL,
  INDEX idx_comments_post   (post_id),
  INDEX idx_comments_user   (user_id),
  INDEX idx_comments_parent (parent_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 4. LIKES (Post & Comment)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  target_type ENUM('post','comment') NOT NULL,
  target_id   INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_like (user_id, target_type, target_id),
  INDEX idx_likes_target (target_type, target_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 5. ORDERS / TRANSACTIONS (Mua tài liệu)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buyer_id        INT UNSIGNED NOT NULL               COMMENT 'Người mua',
  post_id         INT UNSIGNED NOT NULL               COMMENT 'Tài liệu được mua',
  seller_id       INT UNSIGNED NOT NULL               COMMENT 'Người đăng tài liệu',
  amount          DECIMAL(10,2) NOT NULL              COMMENT 'Số tiền giao dịch (VNĐ)',
  -- VNPay fields
  vnp_txn_ref     VARCHAR(100) UNIQUE DEFAULT NULL    COMMENT 'Mã tham chiếu gửi VNPay',
  vnp_transaction_no VARCHAR(100) DEFAULT NULL        COMMENT 'Mã giao dịch trả về từ VNPay',
  vnp_response_code VARCHAR(10)  DEFAULT NULL,
  payment_method  VARCHAR(50)   DEFAULT 'vnpay',
  status          ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at         DATETIME      DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer  FOREIGN KEY (buyer_id)  REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_post   FOREIGN KEY (post_id)   REFERENCES posts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_orders_buyer  (buyer_id),
  INDEX idx_orders_post   (post_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 6. DOCUMENT_ACCESS (Quyền truy cập tài liệu)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_access (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  post_id    INT UNSIGNED NOT NULL,
  order_id   INT UNSIGNED DEFAULT NULL COMMENT 'NULL nếu tài liệu miễn phí',
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_da_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_da_post  FOREIGN KEY (post_id)  REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_da_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE KEY uq_access (user_id, post_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 7. REFRESH_TOKENS (JWT Refresh Token)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  revoked    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user  (user_id),
  INDEX idx_rt_token (token(64))
) ENGINE=InnoDB;

-- DOC-03 private PDF metadata table
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


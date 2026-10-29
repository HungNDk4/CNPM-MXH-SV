-- ================================================================
-- Mini Study Network / MySQL 8 - SAFE POST & UPLOAD TEST QUERY
-- Location: CNPM_Sample_Database_Upload_Test/cnpm-upload-test-sample/seed_upload_test.sql
-- ================================================================
USE mini_study_network;

-- 1. Check current test accounts
SELECT id, full_name, email, role, university, major
FROM users
ORDER BY id;

-- 2. Verify sample posts
SELECT id, user_id, title, post_type, subject, view_count, status
FROM posts
ORDER BY id DESC;

-- 3. Verify interaction counts (Likes, Comments, Bookmarks)
SELECT 
  p.id AS post_id,
  p.title,
  p.post_type,
  (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'post' AND l.target_id = p.id) AS likes_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
  (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id) AS bookmarks_count
FROM posts p
ORDER BY p.id;

-- 4. After uploading a PDF through the UI (CreatePostPage / API POST /api/documents/upload),
-- Run this query to inspect document_files metadata:
SELECT 
  p.id AS post_id, 
  p.title, 
  p.post_type, 
  d.id AS doc_id,
  d.original_name, 
  d.mime_type, 
  d.size_bytes,
  d.created_at
FROM posts p 
INNER JOIN document_files d ON d.post_id = p.id
ORDER BY d.id DESC;

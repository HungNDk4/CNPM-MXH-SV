-- ================================================================
-- Mini Study Network - Campus Pop Sample Dataset (MySQL 8)
-- Location: CNPM_Sample_Database_Upload_Test/cnpm-upload-test-sample/seed_sample_data.sql
-- ================================================================
USE mini_study_network;

-- 1. Ensure required document_files table exists
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

-- 2. Clean old test data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bookmarks;
TRUNCATE TABLE comments;
TRUNCATE TABLE document_access;
TRUNCATE TABLE document_files;
TRUNCATE TABLE likes;
TRUNCATE TABLE moderation_audit_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE orders;
TRUNCATE TABLE posts;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE user_follows;

DELETE FROM users WHERE email LIKE 'fe01-%' OR email LIKE '%@example.invalid';
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Seed Users
-- Password for all students: 123456 ($2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG)
-- Password for Admin: Admin@123 ($2a$10$q2hY3Jq4K6583J4Z8lQ7aO6m54q265Z7aO6m54q265Z7aO6m54q26)
INSERT INTO users (id, full_name, email, password_hash, avatar_url, bio, university, major, role, wallet_balance, is_active, created_at, updated_at)
VALUES
(1, 'Quản trị viên Hệ thống', 'admin@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Hệ thống Quản trị & Điều hành Mini Study Network. Giữ gìn môi trường học tập văn minh, chia sẻ tài liệu minh bạch.', 'Đại học Quốc gia TP.HCM', 'Ban Quản trị Mạng học tập', 'admin', 0.00, 1, NOW(), NOW()),
(2, 'Nguyễn Hùng', 'hungnd13112004@gmail.com', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'Sinh viên năm cuối ngành Công nghệ Phần mềm. Đam mê thiết kế hệ thống phân tán, React, Node.js và Clean Architecture.', 'ĐH Công nghệ Thông tin (UIT) - ĐHQG TP.HCM', 'Kỹ thuật Phần mềm', 'student', 50000.00, 1, NOW(), NOW()),
(3, 'Trần Quốc Bảo', 'bao.tran@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', 'Chuyên gia cơ sở dữ liệu & DevOps tương lai. Đang nghiên cứu tối ưu hóa câu truy vấn MySQL và CI/CD GitHub Actions.', 'ĐH Bách Khoa TP.HCM', 'Khoa học Máy tính', 'student', 20000.00, 1, NOW(), NOW()),
(4, 'Nguyễn Thu Hà', 'ha.nguyen@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'UI/UX Designer & Frontend Developer. Yêu thích Bento Grid, Tailwind CSS và xây dựng trải nghiệm học tập trẻ trung.', 'ĐH Khoa học Tự nhiên - ĐHQG TP.HCM', 'Công nghệ Thông tin', 'student', 100000.00, 1, NOW(), NOW()),
(5, 'Lê Minh Khoa', 'khoa.le@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Lập trình viên backend Java Spring Boot & Go. Thích giải bài tập LeetCode và chia sẻ tài liệu ôn thi các môn cơ sở ngành.', 'ĐH Bách Khoa Hà Nội', 'Kỹ thuật Máy tính', 'student', 0.00, 1, NOW(), NOW()),
(6, 'Phạm Ngọc Anh', 'anh.pham@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', 'Nghiên cứu sinh Data Science & Machine Learning. Sẵn sàng giải đáp thắc mắc về Python, PyTorch và xác suất thống kê.', 'ĐH Quốc Tế - ĐHQG TP.HCM', 'Khoa học Dữ liệu', 'student', 45000.00, 1, NOW(), NOW()),
(7, 'Vũ Hoàng Long', 'long.vu@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'Đam mê An toàn thông tin, CTF và mạng máy tính. Đang làm đồ án tốt nghiệp về phát hiện xâm nhập bằng AI.', 'ĐH Sư Phạm Kỹ Thuật TP.HCM', 'An toàn Thông tin', 'student', 15000.00, 1, NOW(), NOW()),
(8, 'Bùi Phương Linh', 'linh.bui@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'Thành viên ban học tập khoa. Thích tổng hợp đề thi mẫu, cheatsheet và slide tóm tắt môn học trước mỗi mùa thi.', 'ĐH Kinh tế Quốc dân', 'Hệ thống Thông tin Quản lý', 'student', 80000.00, 1, NOW(), NOW()),
(9, 'Đặng Gia Huy', 'huy.dang@studynet.vn', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', 'Mobile App Developer (Flutter & React Native). Tự xây sản phẩm web & app từ ý tưởng đến bản chạy thực tế.', 'ĐH FPT', 'Kỹ thuật Phần mềm', 'student', 30000.00, 1, NOW(), NOW()),
(10, 'Tài khoản Demo', 'demo1@gmail.com', '$2a$10$2YJqbwASZEpCFLGjpKQ.yOJLKhZAc3nFrMCJwkvuueJsNlDmdvXiG', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', 'Tài khoản trải nghiệm người dùng nhanh. Dùng để kiểm thử các luồng bình luận, like, đăng bài và upload PDF.', 'ĐH Bách Khoa TP.HCM', 'Kỹ thuật Phần mềm', 'student', 10000.00, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  avatar_url = VALUES(avatar_url),
  bio = VALUES(bio),
  university = VALUES(university),
  major = VALUES(major),
  role = VALUES(role),
  updated_at = NOW();

-- 4. Seed Posts
INSERT INTO posts (id, user_id, title, content, post_type, file_url, file_name, price, subject, tags, view_count, status, created_at, updated_at)
VALUES
(1, 2, 'Chia sẻ kinh nghiệm làm Đồ án tốt nghiệp ngành Kỹ thuật Phần mềm đạt điểm 9.5',
'Chào các bạn, mình vừa hoàn thành buổi bảo vệ Đồ án tốt nghiệp đợt vừa rồi. Dưới đây là 5 bài học xương máu mình đúc kết được:\n\n1. Chọn đề tài thực tế: Thay vì làm những đề tài quá quen thuộc, hãy chọn giải quyết một bài toán cụ thể có người dùng thật.\n2. Thiết kế Architecture rõ ràng: Đừng vội code ngay, hãy vẽ Sequence diagram, ERD và phân tách Modules sạch sẽ.\n3. Viết Unit Test và E2E ngay từ Sprint 1: Giúp tự tin khi refactor và thuyết phục hội đồng phản biện.\n4. Giữ Git log và PR chỉn chu: Thầy cô đánh giá rất cao tinh thần làm việc nhóm qua lịch sử commit.\n5. Chuẩn bị Slide và Demo kịch bản kỹ: Chuẩn bị cả video demo dự phòng trường hợp mạng chập chờn.\n\nChúc các bạn sinh viên chuẩn bị bảo vệ đồ án đạt kết quả cao nhất nhé!',
'discussion', NULL, NULL, 0.00, 'Công nghệ phần mềm', '["cnpm", "doan-tot-nghiep", "kinh-nghiem", "kientruc"]', 342, 'active', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),

(2, 3, 'Cách tối ưu câu truy vấn JOIN nhiều bảng khi dữ liệu lên tới hàng triệu dòng trong MySQL?',
'Mình đang làm bài tập lớn môn CSDL nâng cao, gặp tình huống truy vấn bảng Posts JOIN với Comments, Likes và Users bị chậm mất hơn 4.2 giây khi dữ liệu test lớn. Các bạn cho mình hỏi:\n- Nên đánh composite index thế nào cho hiệu quả?\n- Có nên dùng denormalization (lưu sẵn like_count, comment_count vào bảng Posts) không?\n- Khi nào thì nên dùng EXPLAIN ANALYZE để đọc execution plan?\n\nRất mong nhận được gợi ý từ mọi người!',
'question', NULL, NULL, 0.00, 'Cơ sở dữ liệu', '["mysql", "database", "optimization", "index"]', 215, 'active', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR)),

(3, 4, 'Bộ tài liệu tổng hợp Fullstack Web: Từ RESTful API đến Modern React & Next.js 14',
'Tổng hợp tài liệu học tập toàn diện cho bạn nào muốn theo định hướng Fullstack Web Developer:\n- Phần 1: Kiến trúc Client-Server, HTTP Methods, Status Codes chuẩn RESTful.\n- Phần 2: React 18 Core: Hooks (useState, useEffect, useMemo, useCallback), Custom Hooks, Context API.\n- Phần 3: State Management & Data Fetching: TanStack Query v5 và Zustand.\n- Phần 4: Tailwind CSS Best Practices và thiết kế hệ thống giao diện Bento Grid hiện đại.\n- Phần 5: Node.js, Express, Sequelize ORM và JWT Authentication có Refresh Token.\n\nTài liệu dạng PDF đính kèm tóm tắt chi tiết 80 trang kèm sơ đồ minh họa, các bạn có thể tải về học tập miễn phí nhé!',
'document', NULL, NULL, 0.00, 'Lập trình Web', '["react", "nodejs", "fullstack", "tailieuhoc"]', 512, 'active', DATE_SUB(NOW(), INTERVAL 9 HOUR), DATE_SUB(NOW(), INTERVAL 9 HOUR)),

(4, 5, 'Phân biệt BCNF và 3NF trong thực tế thiết kế CSDL: Khi nào nên dừng ở 3NF?',
'Trong đề thi giữa kỳ môn Cơ sở dữ liệu thường có câu hỏi chuẩn hóa quan hệ lên 3NF hoặc BCNF. Mọi người cho mình hỏi trong thực tế phát triển phần mềm doanh nghiệp, có trường hợp nào mà việc chuẩn hóa lên BCNF làm mất đi tính bảo toàn phụ thuộc hàm (dependency preservation) không? Và tại sao hầu hết các hệ thống thực tế chỉ dừng lại ở 3NF?',
'question', NULL, NULL, 0.00, 'Cơ sở dữ liệu', '["bcnf", "3nf", "csdl", "chuanhoa"]', 188, 'active', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR)),

(5, 6, 'Slide bài giảng & Đề cương ôn thi môn Trí tuệ Nhân tạo (AI & Machine Learning)',
'Chia sẻ bộ slide tóm tắt kiến thức môn AI cho các bạn chuẩn bị thi kết thúc học phần:\n1. Các thuật toán tìm kiếm mù (BFS, DFS) và tìm kiếm có thông tin (A*, Heuristic).\n2. Thuật toán Minimax và Alpha-Beta Pruning trong trò chơi đối kháng.\n3. Machine Learning căn bản: Linear Regression, Logistic Regression, Decision Tree, SVM.\n4. Mạng Neural nhân tạo (ANN) và Convolutional Neural Network (CNN).\n\nTài liệu được cô đọng ngắn gọn, có ví dụ tính toán tay từng bước cho bài tập thi trắc nghiệm và tự luận.',
'document', NULL, NULL, 0.00, 'Trí tuệ nhân tạo', '["ai", "machine-learning", "slide", "ontap"]', 420, 'active', DATE_SUB(NOW(), INTERVAL 15 HOUR), DATE_SUB(NOW(), INTERVAL 15 HOUR)),

(6, 7, 'Xử lý Refresh Token Rotation và ngăn chặn Token Race Condition trong Single Page App (SPA)',
'Khi người dùng mở đồng thời 3 tab trình duyệt, access token hết hạn cùng một lúc khiến cả 3 tab cùng gửi request làm mới token. Nếu hệ thống áp dụng Refresh Token Rotation (hủy token cũ ngay sau khi dùng), 2 tab gửi sau sẽ bị từ chối và người dùng bị logout đột ngột. Có ai đã xử lý vấn đề Token Concurrency này trong Axios Interceptor hoặc TanStack Query chưa? Cùng chia sẻ giải pháp nhé!',
'question', NULL, NULL, 0.00, 'An toàn thông tin', '["jwt", "security", "auth", "axios"]', 279, 'active', DATE_SUB(NOW(), INTERVAL 18 HOUR), DATE_SUB(NOW(), INTERVAL 18 HOUR)),

(7, 2, 'Mẫu tài liệu Đặc tả Yêu cầu Phần mềm (SRS) chuẩn IEEE 830 kèm ví dụ đề tài Mạng xã hội',
'Tài liệu SRS chuẩn dành cho các nhóm đang làm Đồ án Công nghệ Phần mềm hoặc Phân tích Thiết kế Hệ thống:\n- Đầy đủ 3 phần: Giới thiệu tổng quan (Purpose, Scope), Mô tả chung hệ thống (Product perspective, User classes, Operating environment), và Đặc tả chi tiết yêu cầu chức năng / phi chức năng.\n- Có bảng Use Case Template, Data Dictionary, và ma trận truy vết yêu cầu (Traceability Matrix).\n- File PDF mẫu đính kèm được định dạng chuẩn font, canh lề theo quy định báo cáo của trường.',
'document', NULL, NULL, 0.00, 'Công nghệ phần mềm', '["srs", "ieee830", "dactayeucau", "doan-cnpm"]', 630, 'active', DATE_SUB(NOW(), INTERVAL 21 HOUR), DATE_SUB(NOW(), INTERVAL 21 HOUR)),

(8, 8, 'Làm sao để ước lượng thời gian (Estimation) và chia Sprint Scrum hiệu quả cho nhóm 2 người?',
'Nhóm mình chỉ có đúng 2 thành viên làm đồ án môn học. Bọn mình áp dụng Scrum nhưng thường xuyên gặp tình trạng Story Point ước lượng không chính xác, dẫn đến cuối Sprint bị dồn việc kiểm thử. Các bạn có kinh nghiệm quản lý đồ án nhóm nhỏ cho mình xin vài tips phân rã User Story và quản lý rủi ro với ạ!',
'question', NULL, NULL, 0.00, 'Quản lý dự án CNTT', '["scrum", "agile", "storypoint", "teamwork"]', 165, 'active', DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_SUB(NOW(), INTERVAL 24 HOUR)),

(9, 9, 'Review công cụ viết báo cáo kỹ thuật và đồ án tốt nghiệp: LaTeX vs Typst vs MS Word',
'Sau khi trải nghiệm viết tài liệu trên cả 3 nền tảng, mình xin chia sẻ góc nhìn cá nhân:\n\n1. LaTeX (Overleaf):\n- Điểm mạnh: Đánh số công thức toán học, tài liệu tham khảo (BibTeX) chuẩn xác tuyệt đối, xuất PDF đẹp.\n- Điểm yếu: Thời gian compile lâu, cú pháp phức tạp với người mới bắt đầu.\n\n2. Typst:\n- Hiện đại, tốc độ compile cực nhanh (tính bằng mili-giây), cú pháp trực quan như Markdown, rất đáng thử nghiệm!\n\n3. Microsoft Word:\n- Quen thuộc, dễ kéo thả hình ảnh, nhưng hay bị nhảy định dạng khi chuyển máy khác.\n\nCác bạn trong trường đang ưu tiên dùng công cụ nào hơn?',
'discussion', NULL, NULL, 0.00, 'Kỹ năng nghề nghiệp', '["latex", "typst", "word", "baocao"]', 310, 'active', DATE_SUB(NOW(), INTERVAL 27 HOUR), DATE_SUB(NOW(), INTERVAL 27 HOUR)),

(10, 3, 'Cẩm nang Đề cương & 100 câu hỏi trắc nghiệm ôn tập Kiến trúc Máy tính & Vi xử lý',
'Bộ tài liệu chuẩn bị cho kỳ thi kết thúc học phần môn Kiến trúc máy tính:\n- Kiến trúc tập lệnh MIPS, phân biệt R-type, I-type, J-type.\n- Kỹ thuật đường ống (Pipelining) và xử lý xung đột dữ liệu (Data Hazard, Control Hazard).\n- Cấu trúc bộ nhớ phân cấp: Cache L1, L2, L3, Direct Mapped vs Set Associative.\n- Virtual Memory và TLB.\n\nCó kèm đáp án giải thích chi tiết từng câu trắc nghiệm để các bạn tự chấm điểm.',
'document', NULL, NULL, 0.00, 'Kiến trúc máy tính', '["ktmt", "mips", "pipeline", "decuong"]', 485, 'active', DATE_SUB(NOW(), INTERVAL 30 HOUR), DATE_SUB(NOW(), INTERVAL 30 HOUR)),

(11, 4, 'Sự khác biệt giữa Clean Architecture, Hexagonal và Onion Architecture trong dự án Backend',
'Cả 3 kiến trúc trên đều hướng tới nguyên lý Độc lập Framework và Dependency Inversion (Domain nằm ở trung tâm, Database và UI nằm ở lớp ngoài cùng). Tuy nhiên, mỗi kiến trúc có cách đặt tên và tổ chức lớp khác nhau đôi chút. Cùng thảo luận xem dự án sinh viên cỡ vừa thì nên chọn mô hình nào để code không bị quá tải boilerplate code nhé!',
'discussion', NULL, NULL, 0.00, 'Kiến trúc phần mềm', '["clean-architecture", "onion", "hexagonal", "backend"]', 245, 'active', DATE_SUB(NOW(), INTERVAL 33 HOUR), DATE_SUB(NOW(), INTERVAL 33 HOUR)),

(12, 7, 'Tại sao React 18 lại re-render 2 lần trong StrictMode và cách xử lý đúng đắn?',
'Khi chạy React app ở môi trường Development với `<React.StrictMode>`, useEffect chạy 2 lần liên tiếp dẫn đến việc gọi API 2 lần hoặc vẽ biểu đồ bị trùng lặp. Đây là tính năng có chủ đích của React để kiểm tra xem component có idempotent hay không. Giải pháp chuẩn là dùng AbortController để cleanup request khi component unmount!',
'question', NULL, NULL, 0.00, 'Lập trình Web', '["react18", "strictmode", "useeffect", "frontend"]', 388, 'active', DATE_SUB(NOW(), INTERVAL 36 HOUR), DATE_SUB(NOW(), INTERVAL 36 HOUR))
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  post_type = VALUES(post_type),
  subject = VALUES(subject),
  tags = VALUES(tags),
  view_count = VALUES(view_count),
  status = VALUES(status),
  updated_at = NOW();

-- 5. Seed Comments
INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at, updated_at)
VALUES
(1, 1, 3, NULL, 'Bài viết chia sẻ rất tâm huyết! Phần viết Unit Test và giữ Git log sạch mình hoàn toàn đồng tình. Thầy cô hỏi rất kỹ phần này!', 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 1, 2, 1, 'Cảm ơn Bảo nha! Lúc phản biện thầy khen nhất là việc có ma trận test case rõ ràng đó.', 'active', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3, 1, 4, NULL, 'Slide thuyết trình bạn thiết kế bằng Figma hay Canva vậy bạn ơi? Nhìn chuyên nghiệp quá!', 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 1, 2, 3, 'Mình thiết kế template trên Figma rồi xuất ảnh SVG sang PowerPoint để trình chiếu mượt mà nhất bạn nhé.', 'active', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 2, 5, NULL, 'Về composite index, bạn hãy đặt cột có độ chọn lọc cao (cardinality lớn) lên đầu tiên trong index. Ví dụ (post_id, user_id, created_at).', 'active', DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(6, 2, 7, NULL, 'Với quy mô triệu dòng, nên denormalize cột like_count và comment_count trong bảng Posts luôn bạn nhé, giảm tải JOIN đáng kể.', 'active', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(7, 3, 6, NULL, 'Tài liệu quá đầy đủ cho các bạn ôn thi học phần Web! Mình đã bookmark lại để học.', 'active', DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(8, 4, 3, NULL, 'Trong thực tế hầu như dừng ở 3NF bạn nhé. BCNF quá chặt chẽ, đôi khi làm mất phụ thuộc hàm và phải tạo thêm bảng phụ gây tốn chi phí JOIN.', 'active', DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(9, 6, 2, NULL, 'Vấn đề concurrency này bọn mình giải quyết bằng hàng đợi Axios queue: khi có 1 request refresh token đang pending, các request khác sẽ đợi promise của request đó giải quyết xong mới retry.', 'active', DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(10, 7, 8, NULL, 'Mẫu SRS này chuẩn chỉ quá anh Hùng ơi, nhóm em vừa áp dụng vào đồ án tuần này được thầy hướng dẫn duyệt ngay!', 'active', DATE_SUB(NOW(), INTERVAL 10 HOUR), DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(11, 7, 2, 10, 'Rất vui vì tài liệu giúp ích được cho nhóm em nhé! Cần trao đổi gì thêm cứ nhắn anh nha.', 'active', DATE_SUB(NOW(), INTERVAL 9 HOUR), DATE_SUB(NOW(), INTERVAL 9 HOUR)),
(12, 9, 5, NULL, 'Typst dạo này hot thật sự, cú pháp viết công thức toán học nhanh hơn LaTeX nhiều!', 'active', DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(13, 12, 4, NULL, 'Chuẩn luôn, rất nhiều bạn mới học React bỡ ngỡ tưởng app bị bug khi thấy console.log 2 lần haha.', 'active', DATE_SUB(NOW(), INTERVAL 15 HOUR), DATE_SUB(NOW(), INTERVAL 15 HOUR))
ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW();

-- 6. Seed Likes
INSERT IGNORE INTO likes (user_id, target_type, target_id, created_at, updated_at) VALUES
(2, 'post', 1), (3, 'post', 1), (4, 'post', 1), (5, 'post', 1), (6, 'post', 1), (7, 'post', 1), (8, 'post', 1),
(2, 'post', 2), (5, 'post', 2), (6, 'post', 2), (7, 'post', 2),
(2, 'post', 3), (3, 'post', 3), (6, 'post', 3), (8, 'post', 3), (9, 'post', 3),
(4, 'post', 7), (3, 'post', 7), (5, 'post', 7), (8, 'post', 7), (9, 'post', 7), (10, 'post', 7),
(2, 'post', 10), (4, 'post', 10), (6, 'post', 10), (7, 'post', 10),
(3, 'comment', 1), (2, 'comment', 1), (4, 'comment', 3), (2, 'comment', 5);

-- 7. Seed Bookmarks
INSERT IGNORE INTO bookmarks (user_id, post_id, created_at) VALUES
(2, 3), (2, 5), (2, 7), (2, 10),
(3, 1), (4, 1), (5, 1), (6, 7), (8, 3);

-- 8. Seed Follows
INSERT IGNORE INTO user_follows (follower_id, following_id, created_at) VALUES
(2, 3), (2, 4), (2, 5), (2, 6),
(3, 2), (4, 2), (5, 2), (6, 2), (7, 2), (8, 2),
(3, 4), (4, 3), (5, 6), (6, 5), (7, 8), (8, 7);

-- 9. Seed In-app Notifications
INSERT INTO notifications (recipient_id, actor_id, event_type, post_id, comment_id, is_read, created_at) VALUES
(2, 3, 'like_post', 1, NULL, 0, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(2, 4, 'comment', 1, 3, 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(2, 5, 'follow', NULL, NULL, 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 8, 'comment', 7, 10, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 6, 'like_post', 7, NULL, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(3, 2, 'reply', 1, 2, 0, DATE_SUB(NOW(), INTERVAL 45 MINUTE));

-- 10. Summary verification query
SELECT
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM posts) AS total_posts,
  (SELECT COUNT(*) FROM comments) AS total_comments,
  (SELECT COUNT(*) FROM likes) AS total_likes,
  (SELECT COUNT(*) FROM bookmarks) AS total_bookmarks,
  (SELECT COUNT(*) FROM user_follows) AS total_follows,
  (SELECT COUNT(*) FROM notifications) AS total_notifications;


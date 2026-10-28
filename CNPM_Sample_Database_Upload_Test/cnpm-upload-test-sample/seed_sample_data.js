'use strict';
/**
 * Mini Study Network - Sample Data Seeder (JavaScript Runner)
 * Automatically locates dependencies in server/node_modules and seeds MySQL 8.
 */
const path = require('node:path');
const fs = require('node:fs');

// Attempt to resolve dependencies from server/node_modules if not globally installed
const serverModules = path.resolve(__dirname, '../../server/node_modules');
if (fs.existsSync(serverModules) && !module.paths.includes(serverModules)) {
  module.paths.push(serverModules);
}

let mysql, bcrypt;
try {
  mysql = require('mysql2/promise');
  bcrypt = require('bcryptjs');
} catch (err) {
  try {
    mysql = require(path.join(serverModules, 'mysql2/promise'));
    bcrypt = require(path.join(serverModules, 'bcryptjs'));
  } catch (innerErr) {
    console.error('Không tìm thấy mysql2 hoặc bcryptjs. Vui lòng chạy "cd server && npm install" trước.');
    process.exit(1);
  }
}

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mini_study_network',
  multipleStatements: true,
};

async function seed() {
  console.log('Connecting to MySQL at', DB_CONFIG.host + ':' + DB_CONFIG.port, 'database:', DB_CONFIG.database);
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    console.log('--- 1. Ensuring all required tables exist (including document_files) ---');
    await conn.query(`
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
    `);

    console.log('--- 2. Cleaning old test data while safely preserving primary user ---');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('TRUNCATE TABLE bookmarks;');
    await conn.query('TRUNCATE TABLE comments;');
    await conn.query('TRUNCATE TABLE document_access;');
    await conn.query('TRUNCATE TABLE document_files;');
    await conn.query('TRUNCATE TABLE likes;');
    await conn.query('TRUNCATE TABLE moderation_audit_logs;');
    await conn.query('TRUNCATE TABLE notifications;');
    await conn.query('TRUNCATE TABLE orders;');
    await conn.query('TRUNCATE TABLE posts;');
    await conn.query('TRUNCATE TABLE refresh_tokens;');
    await conn.query('TRUNCATE TABLE user_follows;');

    await conn.query("DELETE FROM users WHERE email LIKE 'fe01-%' OR email LIKE '%@example.invalid';");
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Cleaned old test tables successfully!');

    console.log('--- 3. Seeding Users (Admin + Students) ---');
    const studentPasswordHash = bcrypt.hashSync('123456', 10);
    const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);

    const usersData = [
      {
        id: 1,
        full_name: 'Quản trị viên Hệ thống',
        email: 'admin@studynet.vn',
        password_hash: adminPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Hệ thống Quản trị & Điều hành Mini Study Network. Giữ gìn môi trường học tập văn minh, chia sẻ tài liệu minh bạch.',
        university: 'Đại học Quốc gia TP.HCM',
        major: 'Ban Quản trị Mạng học tập',
        role: 'admin',
        wallet_balance: 0.00
      },
      {
        id: 2,
        full_name: 'Nguyễn Hùng',
        email: 'hungnd13112004@gmail.com',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Sinh viên năm cuối ngành Công nghệ Phần mềm. Đam mê thiết kế hệ thống phân tán, React, Node.js và Clean Architecture.',
        university: 'ĐH Công nghệ Thông tin (UIT) - ĐHQG TP.HCM',
        major: 'Kỹ thuật Phần mềm',
        role: 'student',
        wallet_balance: 50000.00
      },
      {
        id: 3,
        full_name: 'Trần Quốc Bảo',
        email: 'bao.tran@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        bio: 'Chuyên gia cơ sở dữ liệu & DevOps tương lai. Đang nghiên cứu tối ưu hóa câu truy vấn MySQL và CI/CD GitHub Actions.',
        university: 'ĐH Bách Khoa TP.HCM',
        major: 'Khoa học Máy tính',
        role: 'student',
        wallet_balance: 20000.00
      },
      {
        id: 4,
        full_name: 'Nguyễn Thu Hà',
        email: 'ha.nguyen@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'UI/UX Designer & Frontend Developer. Yêu thích Bento Grid, Tailwind CSS và xây dựng trải nghiệm học tập trẻ trung.',
        university: 'ĐH Khoa học Tự nhiên - ĐHQG TP.HCM',
        major: 'Công nghệ Thông tin',
        role: 'student',
        wallet_balance: 100000.00
      },
      {
        id: 5,
        full_name: 'Lê Minh Khoa',
        email: 'khoa.le@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Lập trình viên backend Java Spring Boot & Go. Thích giải bài tập LeetCode và chia sẻ tài liệu ôn thi các môn cơ sở ngành.',
        university: 'ĐH Bách Khoa Hà Nội',
        major: 'Kỹ thuật Máy tính',
        role: 'student',
        wallet_balance: 0.00
      },
      {
        id: 6,
        full_name: 'Phạm Ngọc Anh',
        email: 'anh.pham@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        bio: 'Nghiên cứu sinh Data Science & Machine Learning. Sẵn sàng giải đáp thắc mắc về Python, PyTorch và xác suất thống kê.',
        university: 'ĐH Quốc Tế - ĐHQG TP.HCM',
        major: 'Khoa học Dữ liệu',
        role: 'student',
        wallet_balance: 45000.00
      },
      {
        id: 7,
        full_name: 'Vũ Hoàng Long',
        email: 'long.vu@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Đam mê An toàn thông tin, CTF và mạng máy tính. Đang làm đồ án tốt nghiệp về phát hiện xâm nhập bằng AI.',
        university: 'ĐH Sư Phạm Kỹ Thuật TP.HCM',
        major: 'An toàn Thông tin',
        role: 'student',
        wallet_balance: 15000.00
      },
      {
        id: 8,
        full_name: 'Bùi Phương Linh',
        email: 'linh.bui@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        bio: 'Thành viên ban học tập khoa. Thích tổng hợp đề thi mẫu, cheatsheet và slide tóm tắt môn học trước mỗi mùa thi.',
        university: 'ĐH Kinh tế Quốc dân',
        major: 'Hệ thống Thông tin Quản lý',
        role: 'student',
        wallet_balance: 80000.00
      },
      {
        id: 9,
        full_name: 'Đặng Gia Huy',
        email: 'huy.dang@studynet.vn',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        bio: 'Mobile App Developer (Flutter & React Native). Tự xây sản phẩm web & app từ ý tưởng đến bản chạy thực tế.',
        university: 'ĐH FPT',
        major: 'Kỹ thuật Phần mềm',
        role: 'student',
        wallet_balance: 30000.00
      },
      {
        id: 10,
        full_name: 'Tài khoản Demo',
        email: 'demo1@gmail.com',
        password_hash: studentPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        bio: 'Tài khoản trải nghiệm người dùng nhanh. Dùng để kiểm thử các luồng bình luận, like, đăng bài và upload PDF.',
        university: 'ĐH Bách Khoa TP.HCM',
        major: 'Kỹ thuật Phần mềm',
        role: 'student',
        wallet_balance: 10000.00
      }
    ];

    for (const u of usersData) {
      await conn.query(`
        INSERT INTO users (id, full_name, email, password_hash, avatar_url, bio, university, major, role, wallet_balance, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          password_hash = VALUES(password_hash),
          avatar_url = VALUES(avatar_url),
          bio = VALUES(bio),
          university = VALUES(university),
          major = VALUES(major),
          role = VALUES(role),
          wallet_balance = VALUES(wallet_balance),
          updated_at = NOW();
      `, [u.id, u.full_name, u.email, u.password_hash, u.avatar_url, u.bio, u.university, u.major, u.role, u.wallet_balance]);
    }
    console.log(`Seeded ${usersData.length} users successfully!`);

    console.log('--- 4. Seeding Posts (Question, Discussion, Document) ---');
    const postsData = [
      {
        id: 1,
        user_id: 2,
        title: 'Chia sẻ kinh nghiệm làm Đồ án tốt nghiệp ngành Kỹ thuật Phần mềm đạt điểm 9.5',
        content: 'Chào các bạn, mình vừa hoàn thành buổi bảo vệ Đồ án tốt nghiệp đợt vừa rồi. Dưới đây là 5 bài học xương máu mình đúc kết được:\n\n1. Chọn đề tài thực tế: Thay vì làm những đề tài quá quen thuộc, hãy chọn giải quyết một bài toán cụ thể có người dùng thật.\n2. Thiết kế Architecture rõ ràng: Đừng vội code ngay, hãy vẽ Sequence diagram, ERD và phân tách Modules sạch sẽ.\n3. Viết Unit Test và E2E ngay từ Sprint 1: Giúp tự tin khi refactor và thuyết phục hội đồng phản biện.\n4. Giữ Git log và PR chỉn chu: Thầy cô đánh giá rất cao tinh thần làm việc nhóm qua lịch sử commit.\n5. Chuẩn bị Slide và Demo kịch bản kỹ: Chuẩn bị cả video demo dự phòng trường hợp mạng chập chờn.\n\nChúc các bạn sinh viên chuẩn bị bảo vệ đồ án đạt kết quả cao nhất nhé!',
        post_type: 'discussion',
        subject: 'Công nghệ phần mềm',
        tags: JSON.stringify(['cnpm', 'doan-tot-nghiep', 'kinh-nghiem', 'kientruc']),
        view_count: 342,
        status: 'active'
      },
      {
        id: 2,
        user_id: 3,
        title: 'Cách tối ưu câu truy vấn JOIN nhiều bảng khi dữ liệu lên tới hàng triệu dòng trong MySQL?',
        content: 'Mình đang làm bài tập lớn môn CSDL nâng cao, gặp tình huống truy vấn bảng Posts JOIN với Comments, Likes và Users bị chậm mất hơn 4.2 giây khi dữ liệu test lớn. Các bạn cho mình hỏi:\n- Nên đánh composite index thế nào cho hiệu quả?\n- Có nên dùng denormalization (lưu sẵn like_count, comment_count vào bảng Posts) không?\n- Khi nào thì nên dùng EXPLAIN ANALYZE để đọc execution plan?\n\nRất mong nhận được gợi ý từ mọi người!',
        post_type: 'question',
        subject: 'Cơ sở dữ liệu',
        tags: JSON.stringify(['mysql', 'database', 'optimization', 'index']),
        view_count: 215,
        status: 'active'
      },
      {
        id: 3,
        user_id: 4,
        title: 'Bộ tài liệu tổng hợp Fullstack Web: Từ RESTful API đến Modern React & Next.js 14',
        content: 'Tổng hợp tài liệu học tập toàn diện cho bạn nào muốn theo định hướng Fullstack Web Developer:\n- Phần 1: Kiến trúc Client-Server, HTTP Methods, Status Codes chuẩn RESTful.\n- Phần 2: React 18 Core: Hooks (useState, useEffect, useMemo, useCallback), Custom Hooks, Context API.\n- Phần 3: State Management & Data Fetching: TanStack Query v5 và Zustand.\n- Phần 4: Tailwind CSS Best Practices và thiết kế hệ thống giao diện Bento Grid hiện đại.\n- Phần 5: Node.js, Express, Sequelize ORM và JWT Authentication có Refresh Token.\n\nTài liệu dạng PDF đính kèm tóm tắt chi tiết 80 trang kèm sơ đồ minh họa, các bạn có thể tải về học tập miễn phí nhé!',
        post_type: 'document',
        subject: 'Lập trình Web',
        tags: JSON.stringify(['react', 'nodejs', 'fullstack', 'tailieuhoc']),
        view_count: 512,
        status: 'active'
      },
      {
        id: 4,
        user_id: 5,
        title: 'Phân biệt BCNF và 3NF trong thực tế thiết kế CSDL: Khi nào nên dừng ở 3NF?',
        content: 'Trong đề thi giữa kỳ môn Cơ sở dữ liệu thường có câu hỏi chuẩn hóa quan hệ lên 3NF hoặc BCNF. Mọi người cho mình hỏi trong thực tế phát triển phần mềm doanh nghiệp, có trường hợp nào mà việc chuẩn hóa lên BCNF làm mất đi tính bảo toàn phụ thuộc hàm (dependency preservation) không? Và tại sao hầu hết các hệ thống thực tế chỉ dừng lại ở 3NF?',
        post_type: 'question',
        subject: 'Cơ sở dữ liệu',
        tags: JSON.stringify(['bcnf', '3nf', 'csdl', 'chuanhoa']),
        view_count: 188,
        status: 'active'
      },
      {
        id: 5,
        user_id: 6,
        title: 'Slide bài giảng & Đề cương ôn thi môn Trí tuệ Nhân tạo (AI & Machine Learning)',
        content: 'Chia sẻ bộ slide tóm tắt kiến thức môn AI cho các bạn chuẩn bị thi kết thúc học phần:\n1. Các thuật toán tìm kiếm mù (BFS, DFS) và tìm kiếm có thông tin (A*, Heuristic).\n2. Thuật toán Minimax và Alpha-Beta Pruning trong trò chơi đối kháng.\n3. Machine Learning căn bản: Linear Regression, Logistic Regression, Decision Tree, SVM.\n4. Mạng Neural nhân tạo (ANN) và Convolutional Neural Network (CNN).\n\nTài liệu được cô đọng ngắn gọn, có ví dụ tính toán tay từng bước cho bài tập thi trắc nghiệm và tự luận.',
        post_type: 'document',
        subject: 'Trí tuệ nhân tạo',
        tags: JSON.stringify(['ai', 'machine-learning', 'slide', 'ontap']),
        view_count: 420,
        status: 'active'
      },
      {
        id: 6,
        user_id: 7,
        title: 'Xử lý Refresh Token Rotation và ngăn chặn Token Race Condition trong Single Page App (SPA)',
        content: 'Khi người dùng mở đồng thời 3 tab trình duyệt, access token hết hạn cùng một lúc khiến cả 3 tab cùng gửi request làm mới token. Nếu hệ thống áp dụng Refresh Token Rotation (hủy token cũ ngay sau khi dùng), 2 tab gửi sau sẽ bị từ chối và người dùng bị logout đột ngột. Có ai đã xử lý vấn đề Token Concurrency này trong Axios Interceptor hoặc TanStack Query chưa? Cùng chia sẻ giải pháp nhé!',
        post_type: 'question',
        subject: 'An toàn thông tin',
        tags: JSON.stringify(['jwt', 'security', 'auth', 'axios']),
        view_count: 279,
        status: 'active'
      },
      {
        id: 7,
        user_id: 2,
        title: 'Mẫu tài liệu Đặc tả Yêu cầu Phần mềm (SRS) chuẩn IEEE 830 kèm ví dụ đề tài Mạng xã hội',
        content: 'Tài liệu SRS chuẩn dành cho các nhóm đang làm Đồ án Công nghệ Phần mềm hoặc Phân tích Thiết kế Hệ thống:\n- Đầy đủ 3 phần: Giới thiệu tổng quan (Purpose, Scope), Mô tả chung hệ thống (Product perspective, User classes, Operating environment), và Đặc tả chi tiết yêu cầu chức năng / phi chức năng.\n- Có bảng Use Case Template, Data Dictionary, và ma trận truy vết yêu cầu (Traceability Matrix).\n- File PDF mẫu đính kèm được định dạng chuẩn font, canh lề theo quy định báo cáo của trường.',
        post_type: 'document',
        subject: 'Công nghệ phần mềm',
        tags: JSON.stringify(['srs', 'ieee830', 'dactayeucau', 'doan-cnpm']),
        view_count: 630,
        status: 'active'
      },
      {
        id: 8,
        user_id: 8,
        title: 'Làm sao để ước lượng thời gian (Estimation) và chia Sprint Scrum hiệu quả cho nhóm 2 người?',
        content: 'Nhóm mình chỉ có đúng 2 thành viên làm đồ án môn học. Bọn mình áp dụng Scrum nhưng thường xuyên gặp tình trạng Story Point ước lượng không chính xác, dẫn đến cuối Sprint bị dồn việc kiểm thử. Các bạn có kinh nghiệm quản lý đồ án nhóm nhỏ cho mình xin vài tips phân rã User Story và quản lý rủi ro với ạ!',
        post_type: 'question',
        subject: 'Quản lý dự án CNTT',
        tags: JSON.stringify(['scrum', 'agile', 'storypoint', 'teamwork']),
        view_count: 165,
        status: 'active'
      },
      {
        id: 9,
        user_id: 9,
        title: 'Review công cụ viết báo cáo kỹ thuật và đồ án tốt nghiệp: LaTeX vs Typst vs MS Word',
        content: 'Sau khi trải nghiệm viết tài liệu trên cả 3 nền tảng, mình xin chia sẻ góc nhìn cá nhân:\n\n1. LaTeX (Overleaf):\n- Điểm mạnh: Đánh số công thức toán học, tài liệu tham khảo (BibTeX) chuẩn xác tuyệt đối, xuất PDF đẹp.\n- Điểm yếu: Thời gian compile lâu, cú pháp phức tạp với người mới bắt đầu.\n\n2. Typst:\n- Hiện đại, tốc độ compile cực nhanh (tính bằng mili-giây), cú pháp trực quan như Markdown, rất đáng thử nghiệm!\n\n3. Microsoft Word:\n- Quen thuộc, dễ kéo thả hình ảnh, nhưng hay bị nhảy định dạng khi chuyển máy khác.\n\nCác bạn trong trường đang ưu tiên dùng công cụ nào hơn?',
        post_type: 'discussion',
        subject: 'Kỹ năng nghề nghiệp',
        tags: JSON.stringify(['latex', 'typst', 'word', 'baocao']),
        view_count: 310,
        status: 'active'
      },
      {
        id: 10,
        user_id: 3,
        title: 'Cẩm nang Đề cương & 100 câu hỏi trắc nghiệm ôn tập Kiến trúc Máy tính & Vi xử lý',
        content: 'Bộ tài liệu chuẩn bị cho kỳ thi kết thúc học phần môn Kiến trúc máy tính:\n- Kiến trúc tập lệnh MIPS, phân biệt R-type, I-type, J-type.\n- Kỹ thuật đường ống (Pipelining) và xử lý xung đột dữ liệu (Data Hazard, Control Hazard).\n- Cấu trúc bộ nhớ phân cấp: Cache L1, L2, L3, Direct Mapped vs Set Associative.\n- Virtual Memory và TLB.\n\nCó kèm đáp án giải thích chi tiết từng câu trắc nghiệm để các bạn tự chấm điểm.',
        post_type: 'document',
        subject: 'Kiến trúc máy tính',
        tags: JSON.stringify(['ktmt', 'mips', 'pipeline', 'decuong']),
        view_count: 485,
        status: 'active'
      },
      {
        id: 11,
        user_id: 4,
        title: 'Sự khác biệt giữa Clean Architecture, Hexagonal và Onion Architecture trong dự án Backend',
        content: 'Cả 3 kiến trúc trên đều hướng tới nguyên lý Độc lập Framework và Dependency Inversion (Domain nằm ở trung tâm, Database và UI nằm ở lớp ngoài cùng). Tuy nhiên, mỗi kiến trúc có cách đặt tên và tổ chức lớp khác nhau đôi chút. Cùng thảo luận xem dự án sinh viên cỡ vừa thì nên chọn mô hình nào để code không bị quá tải boilerplate code nhé!',
        post_type: 'discussion',
        subject: 'Kiến trúc phần mềm',
        tags: JSON.stringify(['clean-architecture', 'onion', 'hexagonal', 'backend']),
        view_count: 245,
        status: 'active'
      },
      {
        id: 12,
        user_id: 7,
        title: 'Tại sao React 18 lại re-render 2 lần trong StrictMode và cách xử lý đúng đắn?',
        content: 'Khi chạy React app ở môi trường Development với `<React.StrictMode>`, useEffect chạy 2 lần liên tiếp dẫn đến việc gọi API 2 lần hoặc vẽ biểu đồ bị trùng lặp. Đây là tính năng có chủ đích của React để kiểm tra xem component có idempotent hay không. Giải pháp chuẩn là dùng AbortController để cleanup request khi component unmount!',
        post_type: 'question',
        subject: 'Lập trình Web',
        tags: JSON.stringify(['react18', 'strictmode', 'useeffect', 'frontend']),
        view_count: 388,
        status: 'active'
      }
    ];

    for (const p of postsData) {
      await conn.query(`
        INSERT INTO posts (id, user_id, title, content, post_type, file_url, file_name, price, subject, tags, view_count, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NULL, NULL, 0.00, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR), DATE_SUB(NOW(), INTERVAL ? HOUR))
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          title = VALUES(title),
          content = VALUES(content),
          post_type = VALUES(post_type),
          subject = VALUES(subject),
          tags = VALUES(tags),
          view_count = VALUES(view_count),
          status = VALUES(status),
          updated_at = NOW();
      `, [p.id, p.user_id, p.title, p.content, p.post_type, p.subject, p.tags, p.view_count, p.status, p.id * 3, p.id * 3]);
    }
    console.log(`Seeded ${postsData.length} posts successfully!`);

    console.log('--- 5. Seeding Comments & Nested Replies ---');
    const commentsData = [
      { id: 1, post_id: 1, user_id: 3, parent_id: null, content: 'Bài viết chia sẻ rất tâm huyết! Phần viết Unit Test và giữ Git log sạch mình hoàn toàn đồng tình. Thầy cô hỏi rất kỹ phần này!' },
      { id: 2, post_id: 1, user_id: 2, parent_id: 1, content: 'Cảm ơn Bảo nha! Lúc phản biện thầy khen nhất là việc có ma trận test case rõ ràng đó.' },
      { id: 3, post_id: 1, user_id: 4, parent_id: null, content: 'Slide thuyết trình bạn thiết kế bằng Figma hay Canva vậy bạn ơi? Nhìn chuyên nghiệp quá!' },
      { id: 4, post_id: 1, user_id: 2, parent_id: 3, content: 'Mình thiết kế template trên Figma rồi xuất ảnh SVG sang PowerPoint để trình chiếu mượt mà nhất bạn nhé.' },
      { id: 5, post_id: 2, user_id: 5, parent_id: null, content: 'Về composite index, bạn hãy đặt cột có độ chọn lọc cao (cardinality lớn) lên đầu tiên trong index. Ví dụ (post_id, user_id, created_at).' },
      { id: 6, post_id: 2, user_id: 7, parent_id: null, content: 'Với quy mô triệu dòng, nên denormalize cột like_count và comment_count trong bảng Posts luôn bạn nhé, giảm tải JOIN đáng kể.' },
      { id: 7, post_id: 3, user_id: 6, parent_id: null, content: 'Tài liệu quá đầy đủ cho các bạn ôn thi học phần Web! Mình đã bookmark lại để học.' },
      { id: 8, post_id: 4, user_id: 3, parent_id: null, content: 'Trong thực tế hầu như dừng ở 3NF bạn nhé. BCNF quá chặt chẽ, đôi khi làm mất phụ thuộc hàm và phải tạo thêm bảng phụ gây tốn chi phí JOIN.' },
      { id: 9, post_id: 6, user_id: 2, parent_id: null, content: 'Vấn đề concurrency này bọn mình giải quyết bằng hàng đợi Axios queue: khi có 1 request refresh token đang pending, các request khác sẽ đợi promise của request đó giải quyết xong mới retry.' },
      { id: 10, post_id: 7, user_id: 8, parent_id: null, content: 'Mẫu SRS này chuẩn chỉ quá anh Hùng ơi, nhóm em vừa áp dụng vào đồ án tuần này được thầy hướng dẫn duyệt ngay!' },
      { id: 11, post_id: 7, user_id: 2, parent_id: 10, content: 'Rất vui vì tài liệu giúp ích được cho nhóm em nhé! Cần trao đổi gì thêm cứ nhắn anh nha.' },
      { id: 12, post_id: 9, user_id: 5, parent_id: null, content: 'Typst dạo này hot thật sự, cú pháp viết công thức toán học nhanh hơn LaTeX nhiều!' },
      { id: 13, post_id: 12, user_id: 4, parent_id: null, content: 'Chuẩn luôn, rất nhiều bạn mới học React bỡ ngỡ tưởng app bị bug khi thấy console.log 2 lần haha.' }
    ];

    for (const c of commentsData) {
      await conn.query(`
        INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', DATE_SUB(NOW(), INTERVAL ? HOUR), DATE_SUB(NOW(), INTERVAL ? HOUR))
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          updated_at = NOW();
      `, [c.id, c.post_id, c.user_id, c.parent_id, c.content, c.id * 2, c.id * 2]);
    }
    console.log(`Seeded ${commentsData.length} comments successfully!`);

    console.log('--- 6. Seeding Honest Likes, Bookmarks, and Follows ---');
    const likesData = [
      [2, 'post', 1], [3, 'post', 1], [4, 'post', 1], [5, 'post', 1], [6, 'post', 1], [7, 'post', 1], [8, 'post', 1],
      [2, 'post', 2], [5, 'post', 2], [6, 'post', 2], [7, 'post', 2],
      [2, 'post', 3], [3, 'post', 3], [6, 'post', 3], [8, 'post', 3], [9, 'post', 3],
      [4, 'post', 7], [3, 'post', 7], [5, 'post', 7], [8, 'post', 7], [9, 'post', 7], [10, 'post', 7],
      [2, 'post', 10], [4, 'post', 10], [6, 'post', 10], [7, 'post', 10],
      [3, 'comment', 1], [2, 'comment', 1], [4, 'comment', 3], [2, 'comment', 5]
    ];
    for (const [uid, type, tid] of likesData) {
      await conn.query(`
        INSERT IGNORE INTO likes (user_id, target_type, target_id, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW());
      `, [uid, type, tid]);
    }

    const bookmarksData = [
      [2, 3], [2, 5], [2, 7], [2, 10],
      [3, 1], [4, 1], [5, 1], [6, 7], [8, 3]
    ];
    for (const [uid, pid] of bookmarksData) {
      await conn.query(`
        INSERT IGNORE INTO bookmarks (user_id, post_id, created_at)
        VALUES (?, ?, NOW());
      `, [uid, pid]);
    }

    const followsData = [
      [2, 3], [2, 4], [2, 5], [2, 6],
      [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2],
      [3, 4], [4, 3], [5, 6], [6, 5], [7, 8], [8, 7]
    ];
    for (const [fid, tid] of followsData) {
      await conn.query(`
        INSERT IGNORE INTO user_follows (follower_id, following_id, created_at)
        VALUES (?, ?, NOW());
      `, [fid, tid]);
    }

    const notificationsData = [
      { recipient_id: 2, actor_id: 3, event_type: 'like_post', post_id: 1, comment_id: null, is_read: 0 },
      { recipient_id: 2, actor_id: 4, event_type: 'comment', post_id: 1, comment_id: 3, is_read: 0 },
      { recipient_id: 2, actor_id: 5, event_type: 'follow', post_id: null, comment_id: null, is_read: 0 },
      { recipient_id: 2, actor_id: 8, event_type: 'comment', post_id: 7, comment_id: 10, is_read: 1 },
      { recipient_id: 2, actor_id: 6, event_type: 'like_post', post_id: 7, comment_id: null, is_read: 1 },
      { recipient_id: 3, actor_id: 2, event_type: 'reply', post_id: 1, comment_id: 2, is_read: 0 }
    ];
    for (const n of notificationsData) {
      await conn.query(`
        INSERT INTO notifications (recipient_id, actor_id, event_type, post_id, comment_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW());
      `, [n.recipient_id, n.actor_id, n.event_type, n.post_id, n.comment_id, n.is_read]);
    }
    console.log('Seeded likes, bookmarks, follows, and notifications successfully!');

    console.log('--- 7. Verification Summary ---');
    const [[{ uCount }]] = await conn.query('SELECT COUNT(*) as uCount FROM users;');
    const [[{ pCount }]] = await conn.query('SELECT COUNT(*) as pCount FROM posts;');
    const [[{ cCount }]] = await conn.query('SELECT COUNT(*) as cCount FROM comments;');
    const [[{ lCount }]] = await conn.query('SELECT COUNT(*) as lCount FROM likes;');
    const [[{ bCount }]] = await conn.query('SELECT COUNT(*) as bCount FROM bookmarks;');
    const [[{ fCount }]] = await conn.query('SELECT COUNT(*) as fCount FROM user_follows;');
    const [[{ nCount }]] = await conn.query('SELECT COUNT(*) as nCount FROM notifications;');

    console.log('--------------------------------------------------');
    console.log('DATA SEED COMPLETE!');
    console.log(`- Users: ${uCount}`);
    console.log(`- Posts: ${pCount}`);
    console.log(`- Comments: ${cCount}`);
    console.log(`- Likes: ${lCount}`);
    console.log(`- Bookmarks: ${bCount}`);
    console.log(`- User Follows: ${fCount}`);
    console.log(`- In-app Notifications: ${nCount}`);
    console.log('--------------------------------------------------');
    console.log('Primary Test Account: hungnd13112004@gmail.com (Password: 123456)');
    console.log('Demo Account: demo1@gmail.com (Password: 123456)');
    console.log('Admin Account: admin@studynet.vn (Password: Admin@123)');
    console.log('--------------------------------------------------');
  } finally {
    await conn.end();
  }
}

seed().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});

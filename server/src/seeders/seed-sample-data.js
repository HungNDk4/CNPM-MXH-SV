/**
 * Mini Study Network - Sample Data Seeder
 * 
 * Safe, idempotent seed script for development and UI demo.
 * Does not overwrite or delete existing user data.
 * 
 * Usage:
 *   cd server
 *   node src/seeders/seed-sample-data.js
 */

'use strict';
require('dotenv').config();

const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Post,
  Comment,
  Like,
  Follow,
  Bookmark,
  Notification,
} = require('../models');

// Standard demo password for all seeded sample student accounts
const DEMO_PASSWORD = 'Student@123';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

// 10 Sample Student Accounts
const SAMPLE_STUDENTS = [
  {
    email: 'minhanh.tran@studynet.vn',
    full_name: 'Trần Minh Anh',
    university: 'ĐH Bách Khoa ĐHQG-HCM',
    major: 'Khoa học Máy tính',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Sinh viên năm 4 đam mê Hệ phân tán và Cloud Computing. Đang nghiên cứu Kubernetes & Go.',
    role: 'student',
  },
  {
    email: 'hoangnam.le@studynet.vn',
    full_name: 'Lê Hoàng Nam',
    university: 'ĐH Công nghệ Thông tin (UIT)',
    major: 'Kỹ thuật Phần mềm',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    bio: 'Fullstack Developer tập sự (React, Node.js, Spring Boot). Thích đọc sách và chạy bộ cuối tuần.',
    role: 'student',
  },
  {
    email: 'thutrang.pham@studynet.vn',
    full_name: 'Phạm Thu Trang',
    university: 'ĐH Khoa học Tự nhiên ĐHQG-HCM',
    major: 'Hệ thống Thông tin',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    bio: 'Nghiên cứu Data Engineering và Thiết kế CSDL quan hệ. Đang làm đồ án tốt nghiệp về Data Lakehouse.',
    role: 'student',
  },
  {
    email: 'quocbao.dang@studynet.vn',
    full_name: 'Đặng Quốc Bảo',
    university: 'ĐH Bách Khoa Hà Nội',
    major: 'Kỹ thuật Máy tính',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Yêu thích kiến trúc phần mềm, Clean Architecture và DDD. Đang tìm bạn cùng làm đồ án.',
    role: 'student',
  },
  {
    email: 'haiyen.vu@studynet.vn',
    full_name: 'Vũ Hải Yến',
    university: 'ĐH Sư phạm Kỹ thuật TP.HCM',
    major: 'Mạng máy tính & ATTT',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    bio: 'DevSecOps enthusiast. Thích tối ưu CI/CD pipeline và bảo mật ứng dụng Web.',
    role: 'student',
  },
  {
    email: 'ducthang.nguyen@studynet.vn',
    full_name: 'Nguyễn Đức Thắng',
    university: 'ĐH FPT TP.HCM',
    major: 'Kỹ thuật Phần mềm',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Frontend Engineer (React/Vue/TailwindCSS). Đam mê UI/UX đẹp mắt và tối ưu Core Web Vitals.',
    role: 'student',
  },
  {
    email: 'phuonglinh.bui@studynet.vn',
    full_name: 'Bùi Phương Linh',
    university: 'ĐH Quốc Tế ĐHQG-HCM',
    major: 'Khoa học Dữ liệu',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    bio: 'Học tập và chia sẻ kiến thức về Machine Learning, Python, và trực quan hóa dữ liệu.',
    role: 'student',
  },
  {
    email: 'quanghuy.do@studynet.vn',
    full_name: 'Đỗ Quang Huy',
    university: 'Học viện Công nghệ Bưu chính Viễn thông',
    major: 'Công nghệ Thông tin',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Backend Developer (Java Spring Boot, Microservices). Đang chuẩn bị thi chứng chỉ AWS SAA.',
    role: 'student',
  },
  {
    email: 'maichi.hoang@studynet.vn',
    full_name: 'Hoàng Mai Chi',
    university: 'ĐH Công nghệ - ĐHQGHN',
    major: 'Công nghệ Phần mềm',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Sinh viên năm cuối ngành CNPM. Thích kiểm thử phần mềm (QA/QC), Cypress và Jest.',
    role: 'student',
  },
  {
    email: 'tuankiet.trinh@studynet.vn',
    full_name: 'Trịnh Tuấn Kiệt',
    university: 'ĐH Bách Khoa ĐHQG-HCM',
    major: 'Kỹ thuật Phần mềm',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    bio: 'Mobile App Developer (Flutter & React Native). Thích xây dựng sản phẩm phục vụ cộng đồng sinh viên.',
    role: 'student',
  },
];

// Helper for relative timestamps
const daysAgo = (days, hours = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d;
};

// 18 Sample Posts definition
const SAMPLE_POSTS = [
  {
    authorEmail: 'minhanh.tran@studynet.vn',
    title: 'Chia sẻ kinh nghiệm làm Đồ án tốt nghiệp ngành Kỹ thuật Phần mềm đạt điểm A',
    content: `Chào các bạn! Mình vừa bảo vệ thành công đồ án tốt nghiệp kỳ vừa qua với điểm số 9.5/10. Dưới đây là 5 kinh nghiệm xương máu mình đúc kết được:

1. **Chọn đề tài thực tiễn**: Hãy giải quyết một bài toán có nhu cầu thực tế (ví dụ: tối ưu chia sẻ tài liệu, mạng xã hội chuyên ngành). Tránh làm lại các đề tài quản lý bán hàng chung chung nếu không có điểm đột phá.
2. **Đặc tả yêu cầu (SRS) kỹ lưỡng**: Viết tài liệu SRS và vẽ sơ đồ kiến trúc ngay từ 2 tuần đầu tiên. Khi hiểu rõ Use Case và Database Schema, việc code sẽ nhanh gấp ba lần.
3. **Quy trình Git chuẩn chỉ**: Áp dụng Git Flow hoặc GitHub Flow (Feature branches + Pull Request review), commit rõ ràng. Hội đồng đánh giá rất cao lịch sử commit đều đặn.
4. **Kiểm thử tự động**: Viết Unit Test và Integration Test cho các flow quan trọng (Auth, Payment, Permissions). Lúc demo trước hội đồng sẽ tự tin hơn 100%.
5. **Thuyết trình trọng tâm**: Dành 60% thời gian nói về bài toán, kiến trúc hệ thống và giải pháp kỹ thuật; 40% còn lại live demo các tính năng chính.

Chúc các bạn khóa dưới hoàn thành thật tốt đồ án của mình!`,
    post_type: 'discussion',
    subject: 'Công nghệ phần mềm',
    tags: ['Đồ án tốt nghiệp', 'Kỹ thuật phần mềm', 'Kinh nghiệm', 'Kiến trúc'],
    view_count: 184,
    created_at: daysAgo(6, 4),
  },
  {
    authorEmail: 'thutrang.pham@studynet.vn',
    title: 'Cách tối ưu câu truy vấn JOIN nhiều bảng khi dữ liệu lên tới hàng triệu dòng trong MySQL?',
    content: `Mọi người cho mình hỏi với bảng \`orders\` và \`order_items\` tầm 5 triệu bản ghi thì khi JOIN và GROUP BY theo tháng thường bị chậm (mất khoảng 3-4s).

Mình đã đánh index trên \`created_at\` và \`user_id\` nhưng EXPLAIN vẫn báo Using temporary; Using filesort. 

Có giải pháp nào tối ưu hiệu quả hơn không ạ? Có nên dùng summary table tính toán sẵn hàng đêm không, hay chuyển phần thống kê sang Elasticsearch / ClickHouse?`,
    post_type: 'question',
    subject: 'Cơ sở dữ liệu',
    tags: ['Cơ sở dữ liệu', 'MySQL', 'Tối ưu hóa', 'Indexing'],
    view_count: 142,
    created_at: daysAgo(5, 8),
  },
  {
    authorEmail: 'hoangnam.le@studynet.vn',
    title: 'Bộ tài liệu tổng hợp Fullstack Web: Từ RESTful API đến Modern React & Next.js',
    content: `Tài liệu tự học và ôn tập được mình tổng hợp trong 2 học kỳ vừa qua.

Nội dung bao gồm:
- Thiết kế RESTful API chuẩn chuẩn RFC: Status code, Error handling, Idempotency.
- Xử lý JWT Authentication bảo mật cao: Access Token ngắn hạn + HttpOnly Refresh Token Rotation.
- State Management hiện đại: Tại sao nên dùng TanStack Query (React Query) cho Server-state kết hợp Zustand cho Client-state.
- Tối ưu hiệu năng React 18: memo, useMemo, useCallback và kỹ thuật Virtualization cho danh sách dài.

Rất phù hợp cho các bạn sinh viên chuẩn bị đi thực tập hoặc làm đồ án chuyên ngành!`,
    post_type: 'document',
    subject: 'Lập trình Web',
    tags: ['Lập trình Web', 'React', 'Node.js', 'RESTful API'],
    view_count: 230,
    created_at: daysAgo(5, 2),
  },
  {
    authorEmail: 'quocbao.dang@studynet.vn',
    title: 'Nên chọn Monolith hay Microservices cho đề tài Đồ án môn học / Khởi nghiệp sinh viên?',
    content: `Dạo gần đây mình thấy nhiều nhóm sinh viên làm đồ án môn học hoặc ứng dụng demo cũng chia thành 5-6 services riêng biệt (Auth, Product, Order, Notification...) rồi gặp vô số rắc rối về latency, distributed transactions, và deployment hạ tầng.

Theo góc nhìn cá nhân:
- Với quy mô đồ án hoặc startup sinh viên (< 10.000 active users), **Modular Monolith** kết hợp kiến trúc Clean / Hexagonal là sự lựa chọn vượt trội nhất về tốc độ phát triển và sự ổn định.
- Microservices chỉ thực sự phát huy sức mạnh khi tổ chức có nhiều team kỹ thuật độc lập cần release song song.

Mọi người nghĩ sao về vấn đề này? Có ai từng gặp "trái đắng" khi chia nhỏ service quá sớm chưa?`,
    post_type: 'discussion',
    subject: 'Công nghệ phần mềm',
    tags: ['Kiến trúc', 'Microservices', 'Monolith', 'Đồ án tốt nghiệp'],
    view_count: 198,
    created_at: daysAgo(4, 6),
  },
  {
    authorEmail: 'quanghuy.do@studynet.vn',
    title: 'Phân biệt BCNF và 3NF trong thực tế thiết kế CSDL quan hệ: Khi nào nên dừng ở 3NF?',
    content: `Thầy giáo giao bài tập chuẩn hóa CSDL về hệ thống quản lý phòng khám và lịch hẹn bác sĩ.

Có trường hợp bảng đã đạt 3NF nhưng vẫn tồn tại phụ thuộc hàm X -> Y với X không phải là siêu khóa. Nếu tách lên BCNF thì lại làm mất một phụ thuộc hàm quan trọng (không bảo toàn phụ thuộc hàm).

Trong thực tế các dự án doanh nghiệp thì người ta thường ưu tiên giữ 3NF để tránh câu lệnh JOIN phức tạp hay ép buộc lên BCNF vậy mọi người? Mong các tiền bối có kinh nghiệm đi làm chia sẻ thêm!`,
    post_type: 'question',
    subject: 'Cơ sở dữ liệu',
    tags: ['Cơ sở dữ liệu', 'Chuẩn hóa', '3NF', 'BCNF'],
    view_count: 115,
    created_at: daysAgo(4, 1),
  },
  {
    authorEmail: 'maichi.hoang@studynet.vn',
    title: 'Template tài liệu Đặc tả yêu cầu phần mềm (SRS) chuẩn IEEE 830 kèm ví dụ mẫu',
    content: `Bộ mẫu tài liệu SRS hoàn chỉnh theo chuẩn IEEE 830 dành cho sinh viên CNTT, bao gồm:
1. Mô tả tổng quan sản phẩm và bối cảnh người dùng.
2. Sơ đồ Use Case phân rã chức năng toàn hệ thống.
3. Đặc tả kịch bản Use Case chi tiết (Luồng chính, luồng phụ, ngoại lệ).
4. Yêu cầu phi chức năng (Performance, Security, Availability, Usability).
5. Ma trận truy vết yêu cầu (Traceability Matrix).

Tài liệu này từng được nhóm mình áp dụng và đạt điểm 10 môn Nhập môn Công nghệ phần mềm. Mọi người có thể tham khảo cấu trúc để áp dụng cho bài tập lớn nhé!`,
    post_type: 'document',
    subject: 'Công nghệ phần mềm',
    tags: ['Công nghệ phần mềm', 'SRS', 'Tài liệu mẫu', 'IEEE 830'],
    view_count: 310,
    created_at: daysAgo(3, 11),
  },
  {
    authorEmail: 'ducthang.nguyen@studynet.vn',
    title: 'Xử lý Refresh Token Rotation và ngăn chặn Token Race Condition trong React SPA',
    content: `Khi người dùng mở đồng thời nhiều tab hoặc trang web kích hoạt nhiều API requests đồng thời lúc Access Token hết hạn (401), Axios Interceptor gửi cùng lúc 4-5 request refresh token.

Do phía backend áp dụng cơ chế Refresh Token Rotation (1 refresh token chỉ dùng 1 lần), request đầu tiên thành công nhưng các request sau bị từ chối và hiểu là Token Reuse -> User bị tự động logout.

Có bạn nào có pattern xử lý Promise queue để các request sau đứng đợi request refresh đầu tiên hoàn tất rồi mới retry không?`,
    post_type: 'question',
    subject: 'Lập trình Web',
    tags: ['Lập trình Web', 'JWT', 'React', 'Axios', 'Bảo mật'],
    view_count: 167,
    created_at: daysAgo(3, 5),
  },
  {
    authorEmail: 'minhanh.tran@studynet.vn',
    title: 'Kinh nghiệm thiết kế Database Schema cho hệ thống mạng xã hội: Like, Comment, Follow',
    content: `Vừa qua nhóm mình có triển khai các tính năng mạng xã hội học tập, xin chia sẻ lại vài kinh nghiệm thiết kế bảng:

1. **Like**: Tạo bảng riêng \`likes\` với khóa duy nhất \`UNIQUE(user_id, target_type, target_id)\`. Không nên lưu mảng ID trong bảng Post vì sẽ gây write lock và khó phân trang.
2. **Follow**: Tạo bảng \`user_follows\` có CHECK constraint \`follower_id <> following_id\` để ngăn user tự theo dõi chính mình.
3. **Composite Index**: Đánh index \`(user_id, created_at, id)\` giúp việc phân trang (cursor-based pagination) cực nhanh và không bao giờ bị lệch khi có bản ghi mới chèn vào.
4. **Bình luận đa cấp**: Hạn chế lồng vô hạn (nested comments), chỉ nên hỗ trợ 1 cấp reply (\`parent_id\`) là đủ đáp ứng 95% nhu cầu người dùng mà UI lại gọn gàng.`,
    post_type: 'discussion',
    subject: 'Cơ sở dữ liệu',
    tags: ['Cơ sở dữ liệu', 'Hệ thống', 'Database Design', 'Mạng xã hội'],
    view_count: 275,
    created_at: daysAgo(2, 18),
  },
  {
    authorEmail: 'haiyen.vu@studynet.vn',
    title: 'Tuyển tập 50 câu hỏi phản biện thường gặp khi bảo vệ Đồ án tốt nghiệp CNTT',
    content: `Tổng hợp từ các hội đồng bảo vệ Kỹ thuật Phần mềm, Khoa học Máy tính và Hệ thống Thông tin các năm gần đây:

- **Kiến trúc**: Tại sao chọn SQL thay vì NoSQL? Hệ thống chịu tải tối đa bao nhiêu RPS? Điểm nghẽn (bottleneck) nằm ở đâu?
- **Bảo mật**: Làm sao chống SQL Injection, XSS, CSRF? Lưu trữ mật khẩu người dùng thế nào?
- **Quy trình**: Phân chia công việc giữa các thành viên ra sao? Test coverage đạt bao nhiêu phần trăm?
- **Đóng góp**: Sản phẩm của nhóm có gì vượt trội so với các giải pháp hiện có trên thị trường?

Tài liệu có kèm theo gợi ý trả lời tự tin, đúng trọng tâm và các ví dụ minh họa thực tế.`,
    post_type: 'document',
    subject: 'Đồ án tốt nghiệp',
    tags: ['Đồ án tốt nghiệp', 'Hỏi đáp', 'Bảo vệ đồ án', 'Kỹ năng'],
    view_count: 289,
    created_at: daysAgo(2, 12),
  },
  {
    authorEmail: 'tuankiet.trinh@studynet.vn',
    title: 'Sự khác biệt giữa Clean Architecture và Onion Architecture trong dự án Backend Node.js?',
    content: `Mình đang tìm hiểu để áp dụng vào đồ án tốt nghiệp kỳ này. Thấy cả 2 mô hình đều nhấn mạnh Dependency Inversion Principle và đặt Business Logic (Entities & Use Cases) ở trung tâm.

Tuy nhiên khi tổ chức cấu trúc thư mục thực tế trong Express / NestJS thì ranh giới giữa Domain, Application Services và Infrastructure nên chia như thế nào để vừa rõ ràng mà không bị boilerplate quá mức ạ?

Rất mong được các anh chị đi trước cho lời khuyên!`,
    post_type: 'question',
    subject: 'Công nghệ phần mềm',
    tags: ['Công nghệ phần mềm', 'Clean Architecture', 'Node.js', 'Kiến trúc'],
    view_count: 153,
    created_at: daysAgo(2, 6),
  },
  {
    authorEmail: 'ducthang.nguyen@studynet.vn',
    title: 'React Query (TanStack Query) v5 vs Redux Toolkit: Khi nào thì không cần Redux nữa?',
    content: `Sau khi chuyển toàn bộ Server-state (fetch data, caching, re-fetching on window focus, pagination, optimistic updates) sang React Query v5, nhóm mình nhận thấy ứng dụng chỉ còn lại rất ít Client-state (như modal open, theme mode, active tab).

Lúc này, kết hợp Zustand cho vài biến global state phía client giúp giảm tới 70% lượng code thừa so với Redux Toolkit.

Theo kinh nghiệm của các bạn, trong trường hợp nào thì một ứng dụng Web vẫn bắt buộc phải dùng Redux Toolkit thay vì stack React Query + Zustand?`,
    post_type: 'discussion',
    subject: 'Lập trình Web',
    tags: ['Lập trình Web', 'React', 'TanStack Query', 'Zustand'],
    view_count: 221,
    created_at: daysAgo(1, 16),
  },
  {
    authorEmail: 'thutrang.pham@studynet.vn',
    title: 'Cẩm nang tra cứu SQL Cheatsheet: Từ Basic đến Window Functions & CTEs',
    content: `Tài liệu tóm tắt toàn bộ ngữ pháp SQL thường dùng nhất cho sinh viên ôn thi môn CSDL và phỏng vấn vị trí Backend / Data Analyst:

- Cú pháp chuẩn: SELECT, JOIN (INNER, LEFT, RIGHT, FULL OUTER), GROUP BY / HAVING.
- Subqueries và Common Table Expressions (WITH clause) giúp câu truy vấn trong sáng, dễ debug.
- Window Functions đỉnh cao: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD() và PARTITION BY.
- Kỹ thuật tối ưu EXPLAIN PLAN và mẹo tránh Full Table Scan.

Tài liệu được trình bày dạng bảng và sơ đồ minh họa rất trực quan!`,
    post_type: 'document',
    subject: 'Cơ sở dữ liệu',
    tags: ['Cơ sở dữ liệu', 'SQL', 'Cheatsheet', 'Tài liệu học tập'],
    view_count: 340,
    created_at: daysAgo(1, 10),
  },
  {
    authorEmail: 'phuonglinh.bui@studynet.vn',
    title: 'Làm sao để ước lượng thời gian (Estimation) và chia sprint Scrum hiệu quả cho nhóm 2 người?',
    content: `Nhóm mình gồm 2 bạn làm đồ án tốt nghiệp trong 15 tuần. Hiện tại gặp tình trạng sprint đầu ước lượng story point bị sai lệch nhiều, dẫn đến tồn đọng task sang sprint sau.

Có phương pháp nào phù hợp cho nhóm quy mô siêu nhỏ (2 người) không ạ? Mọi người thường dùng Planning Poker hay T-Shirt Sizing? Và dùng công cụ nào nhẹ nhàng nhất: GitHub Projects, Trello hay Notion?`,
    post_type: 'question',
    subject: 'Đồ án tốt nghiệp',
    tags: ['Đồ án tốt nghiệp', 'Scrum', 'Agile', 'Quản lý dự án'],
    view_count: 108,
    created_at: daysAgo(1, 4),
  },
  {
    authorEmail: 'quocbao.dang@studynet.vn',
    title: 'Cách viết Unit Test có ý nghĩa thay vì chỉ viết để đối phó Code Coverage 80%',
    content: `Nhiều bạn sinh viên khi làm bài tập lớn thường chỉ mock toàn bộ các dependencies rồi assert những thứ hiển nhiên để chạy report cho đủ chỉ tiêu 80% coverage. 

Tuy nhiên khi đổi cấu trúc code một chút thì test đỏ lòm mà trong suốt quá trình phát triển không hề bắt được con bug nghiệp vụ nào.

Quan điểm của mình:
1. Test hành vi (Behavior-driven) quan trọng hơn test chi tiết triển khai (Implementation details).
2. Tập trung test các Edge Cases: Số âm, chuỗi rỗng, ranh giới thời gian, dữ liệu null.
3. Không lạm dụng mock: Nếu có thể, hãy dùng in-memory SQLite / Testcontainers để test gần nhất với môi trường thực tế.`,
    post_type: 'discussion',
    subject: 'Công nghệ phần mềm',
    tags: ['Công nghệ phần mềm', 'Testing', 'Unit Test', 'Chất lượng phần mềm'],
    view_count: 176,
    created_at: daysAgo(0, 18),
  },
  {
    authorEmail: 'hoangnam.le@studynet.vn',
    title: 'Hướng dẫn xây dựng Hệ thống Thiết kế UI (Design System) với Tailwind CSS & React',
    content: `Tài liệu chia sẻ quy trình xây dựng UI components có thể tái sử dụng cao trong các dự án học tập:

- Thiết lập Design Tokens (Colors, Font sizes, Spacing) bằng CSS variables kết hợp Tailwind config.
- Hỗ trợ hoàn hảo Dark Mode / Light Mode không bị chớp màn hình khi tải trang (FOUC).
- Xây dựng các components nền tảng: Button, Input, Modal, Dropdown, Toast notifications với Accessibility (a11y) cơ bản.
- Áp dụng các thư viện icon hiện đại như Lucide React để giao diện vừa chuyên nghiệp vừa nhẹ nhàng.`,
    post_type: 'document',
    subject: 'Lập trình Web',
    tags: ['Lập trình Web', 'TailwindCSS', 'UI/UX', 'Design System'],
    view_count: 260,
    created_at: daysAgo(0, 14),
  },
  {
    authorEmail: 'quanghuy.do@studynet.vn',
    title: 'Xử lý Deadlock trong MySQL InnoDB khi thực hiện Transaction đồng thời',
    content: `Hệ thống thanh toán ví điện tử mô phỏng của nhóm mình thỉnh thoảng bị lỗi 'Deadlock found when trying to get lock; try restarting transaction' khi 2 user chuyển tiền qua lại cùng một tích tắc.

Mình tìm hiểu thì do thứ tự khóa tài nguyên bị chéo: User A lock A rồi chờ lock B, User B lock B rồi chờ lock A.

Có phải cách giải quyết chuẩn là luôn sắp xếp thứ tự lock tài nguyên theo ID tăng dần (ví dụ luôn lock tài khoản có ID nhỏ hơn trước) không ạ? Ngoài ra phía ứng dụng có nên thêm retry logic với exponential backoff không?`,
    post_type: 'question',
    subject: 'Cơ sở dữ liệu',
    tags: ['Cơ sở dữ liệu', 'MySQL', 'InnoDB', 'Transaction', 'Deadlock'],
    view_count: 132,
    created_at: daysAgo(0, 8),
  },
  {
    authorEmail: 'maichi.hoang@studynet.vn',
    title: 'Review công cụ hỗ trợ viết báo cáo Đồ án tốt nghiệp: LaTeX vs Microsoft Word',
    content: `Kỳ này nhóm mình bắt đầu bước vào giai đoạn viết quyển báo cáo đồ án tốt nghiệp. Đang phân vân giữa LaTeX và MS Word:

- **LaTeX**: Đẹp xuất sắc, căn lề và công thức toán học chuẩn chỉ từng milimet, quản lý trích dẫn tài liệu tham khảo với BibTeX cực kỳ nhàn. Tuy nhiên học cú pháp hơi mất thời gian lúc đầu.
- **MS Word**: Trực quan, dễ viết, các thầy cô hướng dẫn dễ comment track changes. Nhưng khi tài liệu dài trên 80 trang có nhiều bảng và hình vẽ thì căn lề hay bị nhảy trang rất ức chế.

Các anh chị đã bảo vệ đồ án rồi cho mình xin lời khuyên nên chọn phương án nào thì tối ưu thời gian hơn ạ?`,
    post_type: 'discussion',
    subject: 'Đồ án tốt nghiệp',
    tags: ['Đồ án tốt nghiệp', 'LaTeX', 'Báo cáo', 'Kinh nghiệm'],
    view_count: 185,
    created_at: daysAgo(0, 4),
  },
  {
    authorEmail: 'ducthang.nguyen@studynet.vn',
    title: 'Tối ưu hiệu năng render danh sách lớn (Infinite Scroll) trong React',
    content: `Khi người dùng cuộn xem feed hơn 100 bài viết có chứa hình ảnh và tương tác, số lượng DOM nodes tăng vọt khiến thao tác cuộn trang bắt đầu bị giật lag trên các thiết bị cấu hình thấp.

Mình đang thử nghiệm 2 giải pháp:
1. Thư viện Virtualization như \`@tanstack/react-virtual\` (chỉ render các items đang nhìn thấy trong viewport).
2. Tự viết Intersection Observer để unmount bớt nội dung của các card ở quá xa.

Bạn nào đã từng tối ưu bài toán này trong thực tế có thể chia sẻ ưu nhược điểm và kinh nghiệm xử lý dynamic item height không?`,
    post_type: 'question',
    subject: 'Lập trình Web',
    tags: ['Lập trình Web', 'React', 'Performance', 'Virtualization'],
    view_count: 94,
    created_at: daysAgo(0, 2),
  },
];

// Seed function
async function seedSampleData() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU MẪU CHO MINI STUDY NETWORK ---');

  // Step 1: Ensure existing core users remain untouched
  const existingUsers = await User.findAll({ attributes: ['id', 'email', 'full_name'] });
  console.log(`Tìm thấy ${existingUsers.length} tài khoản người dùng hiện tại.`);

  // Target user 2 (Nguyễn Hùng) if exists
  const targetUser = existingUsers.find(u => u.id === 2 || u.email === 'hungnd13112004@gmail.com');
  if (targetUser) {
    console.log(`Tài khoản chính để kiểm thử: ${targetUser.full_name} (${targetUser.email}, ID: ${targetUser.id})`);
  }

  // Step 2: Seed or update 10 sample students
  console.log('\n--- 1. TẠO 10 TÀI KHOẢN SINH VIÊN MẪU ---');
  const userMap = new Map(); // email -> user record

  for (const stu of SAMPLE_STUDENTS) {
    const [user, created] = await User.findOrCreate({
      where: { email: stu.email },
      defaults: {
        ...stu,
        password_hash: DEMO_PASSWORD_HASH,
        wallet_balance: 0.00,
        is_active: true,
      },
    });
    userMap.set(stu.email, user);
    console.log(` ${created ? '[TẠO MỚI]' : '[ĐÃ TỒN TẠI]'} ${user.full_name} (${user.email}) - ID: ${user.id}`);
  }

  // Also map existing user 2 and 3 if present
  if (targetUser) userMap.set(targetUser.email, targetUser);
  const demo1User = existingUsers.find(u => u.email === 'demo1@gmail.com');
  if (demo1User) userMap.set(demo1User.email, demo1User);

  const studentList = Array.from(userMap.values());

  // Step 3: Seed 18 sample posts
  console.log('\n--- 2. TẠO 18 BÀI VIẾT MẪU (THẢO LUẬN, HỎI ĐÁP, TÀI LIỆU) ---');
  const postList = [];

  for (const postData of SAMPLE_POSTS) {
    const author = userMap.get(postData.authorEmail);
    if (!author) continue;

    const [post, created] = await Post.findOrCreate({
      where: { title: postData.title },
      defaults: {
        user_id: author.id,
        title: postData.title,
        content: postData.content,
        post_type: postData.post_type,
        price: 0.00,
        subject: postData.subject,
        tags: postData.tags,
        view_count: postData.view_count,
        status: 'active',
        created_at: postData.created_at,
        updated_at: postData.created_at,
      },
    });
    postList.push(post);
    console.log(` ${created ? '[TẠO MỚI]' : '[ĐÃ TỒN TẠI]'} [${post.post_type.toUpperCase()}] "${post.title.slice(0, 45)}..." - Tác giả: ${author.full_name}`);
  }

  // Step 4: Seed Comments & 1-level Replies
  console.log('\n--- 3. TẠO BÌNH LUẬN VÀ TRẢ LỜI BÌNH LUẬN ---');
  let commentCount = 0;
  const sampleCommentsConfig = [
    // Post 0 (Kinh nghiệm đồ án)
    {
      postIndex: 0,
      authorEmail: 'hoangnam.le@studynet.vn',
      content: 'Bài viết quá chi tiết và thực tế! Em rất đồng ý với ý số 3 về việc chia branch và PR review nghiêm túc, lúc bảo vệ thầy cô mở commit log ra xem khen nhóm chuyên nghiệp lắm.',
      replies: [
        {
          authorEmail: 'minhanh.tran@studynet.vn',
          content: 'Cảm ơn Nam nhé! Làm nhóm từ 2 người trở lên mà không có Git review là rất dễ conflict code lúc gần ngày nộp.',
        },
      ],
    },
    {
      postIndex: 0,
      authorEmail: 'quanghuy.do@studynet.vn',
      content: 'Cho mình hỏi về phần Unit test thì thường nhóm bạn viết bao nhiêu test case và dùng thư viện nào vậy?',
      replies: [
        {
          authorEmail: 'minhanh.tran@studynet.vn',
          content: 'Nhóm mình dùng Jest và Supertest cho backend, viết khoảng 45 test cases bao phủ các luồng auth, xử lý đơn hàng và phân quyền bạn nhé.',
        },
      ],
    },
    // Post 1 (MySQL Optimization)
    {
      postIndex: 1,
      authorEmail: 'quocbao.dang@studynet.vn',
      content: 'Với 5 triệu dòng thì không nên GROUP BY trực tiếp ở runtime nữa bạn ơi. Giải pháp chuẩn là tạo bảng `monthly_order_summary` chạy job cron tính sẵn mỗi đêm, query dashboard chỉ đọc từ bảng summary đó là dưới 50ms ngay.',
      replies: [
        {
          authorEmail: 'thutrang.pham@studynet.vn',
          content: 'Ý kiến rất hay ạ! Em sẽ áp dụng summary table cho các báo cáo lịch sử, cảm ơn anh Bảo nhiều!',
        },
      ],
    },
    {
      postIndex: 1,
      authorEmail: 'haiyen.vu@studynet.vn',
      content: 'Kiểm tra xem composite index `(created_at, user_id)` thứ tự cột đã tối ưu cho mệnh đề WHERE và GROUP BY chưa nhé, nếu WHERE user_id trước thì index phải là `(user_id, created_at)`.',
    },
    // Post 2 (Bộ tài liệu Fullstack)
    {
      postIndex: 2,
      authorEmail: 'ducthang.nguyen@studynet.vn',
      content: 'Tài liệu trình bày rất trực quan và có tâm. Phần giải thích TanStack Query v5 đọc xong thông suốt luôn, bookmark lại để ôn tập!',
    },
    // Post 3 (Monolith vs Microservices)
    {
      postIndex: 3,
      authorEmail: 'minhanh.tran@studynet.vn',
      content: 'Chuẩn luôn! Nhóm mình kỳ trước đâm đầu vào microservices với Docker Swarm, mất cả tuần debug mạng nội bộ giữa các container mà tính năng nghiệp vụ thì chưa xong.',
      replies: [
        {
          authorEmail: 'quocbao.dang@studynet.vn',
          content: 'Đúng vậy bạn, quy tắc vàng là: Hãy bắt đầu với Monolith kiến trúc sạch sẽ, khi nào một module chịu tải riêng quá lớn thì mới tách nó ra.',
        },
      ],
    },
    // Post 4 (BCNF vs 3NF)
    {
      postIndex: 4,
      authorEmail: 'thutrang.pham@studynet.vn',
      content: 'Trong thực tế hầu hết các hệ thống OLTP đều dừng ở 3NF bạn nhé. Việc cố ép lên BCNF làm mất phụ thuộc hàm sẽ phải dùng Trigger hoặc Application code để kiểm tra ràng buộc, vừa tốn chi phí vừa dễ lỗi dữ liệu.',
    },
    // Post 6 (Refresh Token Rotation)
    {
      postIndex: 6,
      authorEmail: 'quanghuy.do@studynet.vn',
      content: 'Bạn dùng pattern `isRefreshing` kết hợp `failedQueue = []` trong axios interceptor nhé. Request 401 đầu tiên sẽ set `isRefreshing = true` và gọi API refresh; các request đến sau sẽ push callback vào `failedQueue`. Khi refresh xong thì duyệt queue để resolve tất cả.',
      replies: [
        {
          authorEmail: 'ducthang.nguyen@studynet.vn',
          content: 'Mình đã thử áp dụng pattern queue này và giải quyết triệt để lỗi rồi, cảm ơn Huy nhiều nhé!',
        },
      ],
    },
    // Post 7 (Database Schema MXH)
    {
      postIndex: 7,
      authorEmail: 'tuankiet.trinh@studynet.vn',
      content: 'Phần giới hạn 1 cấp reply rất hợp lý, các app như Twitter hay Threads cũng chỉ cho comment dạng phẳng hoặc 1 cấp để tối ưu UX di động.',
    },
    // Post 10 (React Query vs Redux)
    {
      postIndex: 10,
      authorEmail: 'hoangnam.le@studynet.vn',
      content: 'Hoàn toàn đồng ý. Hiện tại team mình chỉ dùng React Query cho API data và Zustand cho theme/auth user info, dự án nhẹ và dễ bảo trì hơn hẳn.',
    },
    // Post 15 (Deadlock InnoDB)
    {
      postIndex: 15,
      authorEmail: 'minhanh.tran@studynet.vn',
      content: 'Đúng rồi bạn! Luôn sắp xếp ID tài nguyên cần khóa theo thứ tự tăng dần `ORDER BY id ASC` trước khi SELECT ... FOR UPDATE sẽ triệt tiêu hoàn toàn chu trình chờ chéo (Deadlock).',
    },
  ];

  for (const cfg of sampleCommentsConfig) {
    const post = postList[cfg.postIndex];
    if (!post) continue;
    const author = userMap.get(cfg.authorEmail);
    if (!author) continue;

    // Check if root comment exists
    let [rootComment, rCreated] = await Comment.findOrCreate({
      where: {
        post_id: post.id,
        user_id: author.id,
        parent_id: null,
        content: cfg.content,
      },
      defaults: {
        status: 'active',
      },
    });
    if (rCreated) commentCount++;

    // Replies
    if (cfg.replies && cfg.replies.length > 0) {
      for (const rep of cfg.replies) {
        const repAuthor = userMap.get(rep.authorEmail);
        if (!repAuthor) continue;
        const [, repCreated] = await Comment.findOrCreate({
          where: {
            post_id: post.id,
            user_id: repAuthor.id,
            parent_id: rootComment.id,
            content: rep.content,
          },
          defaults: {
            status: 'active',
          },
        });
        if (repCreated) commentCount++;
      }
    }
  }
  console.log(` Đã kiểm tra và thiết lập các bình luận & câu trả lời mẫu.`);

  // Step 5: Seed Likes on posts and comments
  console.log('\n--- 4. TẠO LƯỢT THÍCH (LIKES) BÀI VIẾT VÀ BÌNH LUẬN ---');
  let likeCount = 0;
  // Distribute likes across posts
  for (let i = 0; i < postList.length; i++) {
    const post = postList[i];
    // Each post gets 3-7 likes from various students
    const likerCount = 3 + (i % 5);
    for (let j = 0; j < likerCount; j++) {
      const liker = studentList[(i + j) % studentList.length];
      const [, created] = await Like.findOrCreate({
        where: {
          user_id: liker.id,
          target_type: 'post',
          target_id: post.id,
        },
      });
      if (created) likeCount++;
    }

    // Target user (user 2) likes some interesting posts
    if (targetUser && (i === 0 || i === 2 || i === 5 || i === 7 || i === 10)) {
      const [, created] = await Like.findOrCreate({
        where: {
          user_id: targetUser.id,
          target_type: 'post',
          target_id: post.id,
        },
      });
      if (created) likeCount++;
    }
  }

  // Like some top comments
  const allComments = await Comment.findAll({ where: { status: 'active' }, limit: 10 });
  for (const c of allComments) {
    const likers = studentList.slice(0, 3);
    for (const l of likers) {
      const [, created] = await Like.findOrCreate({
        where: {
          user_id: l.id,
          target_type: 'comment',
          target_id: c.id,
        },
      });
      if (created) likeCount++;
    }
  }
  console.log(` Đã cập nhật ${likeCount} lượt thích mới (hoặc đã có sẵn).`);

  // Step 6: Seed Follow relationships
  console.log('\n--- 5. THIẾT LẬP MỐI QUAN HỆ THEO DÕI (FOLLOWS) ---');
  let followCount = 0;
  // Inter-student follows
  for (let i = 0; i < studentList.length; i++) {
    const follower = studentList[i];
    // Follow 2-3 other students
    for (let step = 1; step <= 3; step++) {
      const following = studentList[(i + step) % studentList.length];
      if (follower.id !== following.id) {
        const [, created] = await Follow.findOrCreate({
          where: {
            follower_id: follower.id,
            following_id: following.id,
          },
        });
        if (created) followCount++;
      }
    }
  }

  // Connect with Target User (Nguyễn Hùng - user 2)
  if (targetUser) {
    // 6 students follow targetUser
    const followersOfTarget = studentList.slice(0, 6);
    for (const f of followersOfTarget) {
      if (f.id !== targetUser.id) {
        const [, created] = await Follow.findOrCreate({
          where: {
            follower_id: f.id,
            following_id: targetUser.id,
          },
        });
        if (created) followCount++;
      }
    }

    // targetUser follows 4 students
    const targetFollowings = studentList.slice(3, 7);
    for (const f of targetFollowings) {
      if (targetUser.id !== f.id) {
        const [, created] = await Follow.findOrCreate({
          where: {
            follower_id: targetUser.id,
            following_id: f.id,
          },
        });
        if (created) followCount++;
      }
    }
    console.log(` Đã kết nối tương tác follow cho người dùng chính (${targetUser.full_name}).`);
  }
  console.log(` Tổng số quan hệ theo dõi: ${followCount} mới tạo.`);

  // Step 7: Seed Bookmarks
  console.log('\n--- 6. TẠO BÀI VIẾT ĐÃ LƯU (BOOKMARKS) ---');
  let bookmarkCount = 0;
  if (targetUser && postList.length >= 8) {
    // Target user bookmarks useful posts (e.g. SRS template, Fullstack doc, Kinh nghiệm đồ án, MySQL tips)
    const bookmarkedPostIndices = [0, 2, 5, 7, 11];
    for (const idx of bookmarkedPostIndices) {
      const post = postList[idx];
      if (post) {
        const [, created] = await Bookmark.findOrCreate({
          where: {
            user_id: targetUser.id,
            post_id: post.id,
          },
        });
        if (created) bookmarkCount++;
      }
    }
  }

  // Other students also bookmark some documents
  for (let i = 0; i < 5; i++) {
    const student = studentList[i];
    const post = postList[(i * 2 + 1) % postList.length];
    if (student && post) {
      const [, created] = await Bookmark.findOrCreate({
        where: {
          user_id: student.id,
          post_id: post.id,
        },
      });
      if (created) bookmarkCount++;
    }
  }
  console.log(` Đã cập nhật ${bookmarkCount} bookmarks.`);

  // Step 8: Seed In-app Notifications for target user
  console.log('\n--- 7. TẠO THÔNG BÁO MẪU (NOTIFICATIONS) ---');
  let notificationCount = 0;
  if (targetUser) {
    // Collect posts and comments belonging to targetUser, or post 1 (existing)
    const targetPosts = await Post.findAll({ where: { user_id: targetUser.id } });
    const targetPost = targetPosts[0] || postList[0];

    const notificationEvents = [
      {
        actor: studentList[0],
        event_type: 'like_post',
        post_id: targetPost.id,
        comment_id: null,
        is_read: false,
      },
      {
        actor: studentList[1],
        event_type: 'comment',
        post_id: targetPost.id,
        comment_id: null,
        is_read: false,
      },
      {
        actor: studentList[2],
        event_type: 'follow',
        post_id: null,
        comment_id: null,
        is_read: false,
      },
      {
        actor: studentList[3],
        event_type: 'follow',
        post_id: null,
        comment_id: null,
        is_read: true,
      },
      {
        actor: studentList[4],
        event_type: 'like_post',
        post_id: targetPost.id,
        comment_id: null,
        is_read: true,
      },
    ];

    for (const ev of notificationEvents) {
      if (ev.actor && ev.actor.id !== targetUser.id) {
        const existing = await Notification.findOne({
          where: {
            recipient_id: targetUser.id,
            actor_id: ev.actor.id,
            event_type: ev.event_type,
            post_id: ev.post_id,
          },
        });
        if (!existing) {
          await Notification.create({
            recipient_id: targetUser.id,
            actor_id: ev.actor.id,
            event_type: ev.event_type,
            post_id: ev.post_id,
            comment_id: ev.comment_id,
            is_read: ev.is_read,
            created_at: new Date(),
          });
          notificationCount++;
        }
      }
    }
    console.log(` Đã tạo ${notificationCount} thông báo mẫu cho người dùng ${targetUser.full_name}.`);
  }

  // Summary
  console.log('\n======================================================');
  console.log(' SEED DỮ LIỆU MẪU THÀNH CÔNG VÀ AN TOÀN!');
  console.log(`- Tài khoản sinh viên demo: ${SAMPLE_STUDENTS.length} tài khoản`);
  console.log(`- Mật khẩu đăng nhập demo: "${DEMO_PASSWORD}"`);
  console.log(`- Bài viết phong phú: ${postList.length} bài viết (Hỏi đáp, Tài liệu, Thảo luận)`);
  console.log(`- Thống kê DB hiện tại:`);
  console.log(`  + Users:         ${await User.count()}`);
  console.log(`  + Posts:         ${await Post.count()}`);
  console.log(`  + Comments:      ${await Comment.count()}`);
  console.log(`  + Likes:         ${await Like.count()}`);
  console.log(`  + Follows:       ${await Follow.count()}`);
  console.log(`  + Bookmarks:     ${await Bookmark.count()}`);
  console.log(`  + Notifications: ${await Notification.count()}`);
  console.log('======================================================\n');
}

seedSampleData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi khi seed dữ liệu mẫu:', err);
    process.exit(1);
  });

'use strict';

const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/src/models');
const { Op } = require(path.join(__dirname, '../server/node_modules/sequelize'));

async function seed() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU MẪU HỌC THUẬT (30 BÀI + 4-5 BÌNH LUẬN) ---');
  
  // 1. Phục hồi 2 bài ID 1 và ID 14 thành active
  await db.Post.update({ status: 'active' }, { where: { id: [1, 14] } });
  console.log('✓ Đã kích hoạt lại 2 bài ID 1 & 14');

  // 2. Dọn các bài rác test
  const deletedCount = await db.Post.destroy({
    where: {
      [Op.or]: [
        { title: { [Op.like]: '%bác bỏ%' } },
        { title: { [Op.like]: '%rollback%' } },
        { title: { [Op.like]: '%đồng thời%' } },
        { title: { [Op.like]: '%kiểm thử sâu%' } },
        { title: { [Op.like]: '%Test Post For Moderation%' } },
        { title: { [Op.like]: '%Bài viết kiểm thử%' } },
        { title: { [Op.like]: '%Tài liệu Kiểm chứng Tải lên%' } },
        { title: 'ádsasdasd' }
      ]
    }
  });
  console.log(`✓ Đã dọn dẹp ${deletedCount} bài viết rác test`);

  // Lấy danh sách ID user sinh viên thực
  const studentUsers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  // 3. Danh sách 18 bài viết học thuật mới để đạt tổng 31 bài viết chất lượng
  const samplePosts = [
    {
      user_id: 2,
      title: 'Thiết kế hệ cơ sở dữ liệu quan hệ cho sàn thương mại điện tử: Tránh Race Condition khi flash sale',
      content: 'Chào các bạn, trong đồ án môn Hệ quản trị CSDL, nhóm mình gặp bài toán khi có 1000 request cùng đặt 1 sản phẩm chỉ còn 5 tồn kho. Giải pháp là dùng `SELECT ... FOR UPDATE` (Pessimistic Locking) trong MySQL hoặc dùng Redis DECR làm distributed counter. Anh em có kinh nghiệm thực chiến chia sẻ thêm ưu nhược điểm từng cách với nhé!',
      post_type: 'discussion',
      subject: 'Cơ sở dữ liệu',
      tags: ['mysql', 'database', 'transaction', 'locking', 'concurrency'],
      status: 'active',
      view_count: 320,
      comments: [
        { user_id: 3, content: 'Pessimistic locking dễ làm chậm toàn bộ DB nếu transaction giữ lock lâu. Nếu traffic lớn nên đẩy counter lên Redis trước rồi sync async về MySQL qua RabbitMQ hoặc Kafka nhé.' },
        { user_id: 5, content: 'Bên cạnh đó có thể dùng Optimistic Locking với cột version: `UPDATE items SET stock = stock - 1, version = version + 1 WHERE id = 1 AND version = :current_version`. Nhẹ nhàng hơn nhiều!' },
        { user_id: 7, content: 'Chuẩn luôn, kết hợp Optimistic Locking cho DB và Redis atomic decrement là bài toán kinh điển trong phỏng vấn Backend senior đấy bạn.' },
        { user_id: 8, content: 'Cảm ơn bài viết rất thực tế. Nhóm mình chuẩn bị bảo vệ đồ án môn CSDL tuần sau, kiến thức này áp dụng vào slide phản biện quá đẹp.' }
      ]
    },
    {
      user_id: 4,
      title: 'Tài liệu Tổng hợp Lý thuyết & 50 bài tập Mạng máy tính: Phân tích gói tin với Wireshark',
      content: 'Mình vừa tổng hợp lại toàn bộ kiến thức ôn thi cuối kỳ môn Mạng máy tính: mô hình OSI 7 tầng vs TCP/IP 4 tầng, bắt tay 3 bước TCP (Three-way handshake), thuật toán định tuyến Dijkstra/Bellman-Ford và cách dùng Wireshark bắt phân tích bản tin HTTP/DNS/ARP. Tài liệu đính kèm file PDF tóm tắt súc tích, chúc cả lớp qua môn điểm A!',
      post_type: 'document',
      subject: 'Mạng máy tính',
      tags: ['networking', 'wireshark', 'tcpip', 'tailieuhoc', 'ontap'],
      status: 'active',
      view_count: 485,
      comments: [
        { user_id: 6, content: 'Tài liệu cực kỳ tâm huyết! Phần phân tích cờ SYN, ACK, FIN trên Wireshark được vẽ flowchart rất dễ hiểu.' },
        { user_id: 9, content: 'Môn này thầy hay hỏi vấn đáp phần cơ chế Sliding Window và Congestion Control, tài liệu này có mục đó luôn, 10 điểm!' },
        { user_id: 11, content: 'Đã tải về in ra học, cảm ơn bạn Thu Hà nhiều nhé.' },
        { user_id: 2, content: 'Rất bổ ích, mình xin phép bookmark lại để ôn thi cùng nhóm đồ án.' }
      ]
    },
    {
      user_id: 5,
      title: 'Hỏi đáp: Tại sao dùng useMemo quá đà trong React lại làm app chạy chậm hơn bình thường?',
      content: 'Mình thấy nhiều bạn mới học React bọc tất cả các hàm và biến tính toán trong `useMemo` và `useCallback`. Tuy nhiên theo React Docs, chi phí so sánh dependency array và cấp phát bộ nhớ closure đôi khi còn tốn tài nguyên hơn phép tính đơn giản. Mọi người thường đặt ngưỡng benchmark thế nào để quyết định khi nào NÊN bọc useMemo?',
      post_type: 'question',
      subject: 'Lập trình Web',
      tags: ['react', 'performance', 'frontend', 'javascript', 'hooks'],
      status: 'active',
      view_count: 290,
      comments: [
        { user_id: 2, content: 'Nguyên tắc vàng: Chỉ bọc `useMemo` khi phép tính là expensive (ví dụ lặp qua array > 1,000 phần tử có filter/sort/reduce phức tạp) hoặc khi object/array đó truyền xuống component con bọc `React.memo`.' },
        { user_id: 3, content: 'Đúng vậy! Bọc useMemo cho `a + b` hay `items.length` chỉ làm tăng memory overhead chứ không có bất kỳ lợi ích nào.' },
        { user_id: 12, content: 'Có thể dùng React DevTools Profiler để đo render duration trước và sau khi thêm useMemo, có số liệu cụ thể sẽ dễ giải thích với thầy hướng dẫn hơn.' },
        { user_id: 4, content: 'Thêm nữa là trong React 19 tới đây với React Compiler (Forget), việc ghi nhớ memoization này sẽ được trình biên dịch tự động tối ưu hoàn toàn.' }
      ]
    },
    {
      user_id: 6,
      title: 'Đề cương & Slide tóm tắt Môn học Trí tuệ Nhân tạo: Thuật toán tìm kiếm A*, Heuristic & Minimax Alpha-Beta',
      content: 'Chia sẻ bộ slide tóm tắt 8 chương môn Trí tuệ nhân tạo (AI): Tìm kiếm mù (BFS, DFS, UCS), tìm kiếm có thông tin (Greedy Best-First, A* Search kèm tính chất admissible/consistent của Heuristic), và thuật toán trò chơi đối kháng Minimax có tỉa nhánh Alpha-Beta. Có code mẫu Python mô phỏng 8-puzzle và cờ Caro.',
      post_type: 'document',
      subject: 'Trí tuệ nhân tạo',
      tags: ['ai', 'heuristic', 'minimax', 'python', 'thuattoan'],
      status: 'active',
      view_count: 610,
      comments: [
        { user_id: 7, content: 'Thuật toán A* giải bài toán 8-puzzle dùng khoảng cách Manhattan tính heuristic chạy nhanh hơn hẳn khoảng cách Hamming.' },
        { user_id: 8, content: 'Slide thiết kế đẹp, trực quan quá bạn ơi. Cảm ơn bạn rất nhiều!' },
        { user_id: 10, content: 'Code mẫu Python viết rất trong sáng, có chú thích từng dòng. Rất hữu ích cho bài tập lớn.' },
        { user_id: 13, content: 'Môn này thi trắc nghiệm hay có câu hỏi về tính tối ưu của A* khi h(n) thỏa mãn điều kiện, tài liệu làm rõ điểm này rất chuẩn.' },
        { user_id: 2, content: 'Tài liệu giá trị cao, cộng đồng UIT rất cảm ơn bạn!' }
      ]
    },
    {
      user_id: 7,
      title: 'Kinh nghiệm chuẩn bị slide và trả lời phản biện Đồ án Công nghệ Phần mềm trước hội đồng',
      content: 'Nhóm mình vừa bảo vệ xong đồ án CNPM kỳ vừa rồi với số điểm 9.6. Một số kinh nghiệm xương máu rút ra:\n1. Slide tối đa 20-25 trang, tập trung vào Vấn đề (Problem), Giải pháp (Solution), Kiến trúc hệ thống (Architecture) và Demo thực tế.\n2. Chuẩn bị trước video demo phòng trường hợp mạng hoặc server localhost gặp trục trặc.\n3. Thầy cô hỏi rất sâu về: Sơ đồ CSDL chuẩn hóa, quy trình kiểm thử (Unit test/Integration test) và cách nhóm phân chia công việc qua Git.\nChúc các bạn tự tin đạt kết quả cao nhất!',
      post_type: 'discussion',
      subject: 'Công nghệ phần mềm',
      tags: ['cnpm', 'doan', 'kinhnghiem', 'phanbien', 'scrum'],
      status: 'active',
      view_count: 520,
      comments: [
        { user_id: 2, content: 'Điểm lưu ý số 2 cực kỳ quan trọng! Hôm bảo vệ nhóm bạn mình bị rớt mạng không load được database, may mà có chuẩn bị video backup nên hội đồng vẫn chấm điểm tốt.' },
        { user_id: 4, content: 'Thầy cô phản biện rất hay xoáy vào phần kiến trúc: tại sao dùng monolithic mà không dùng microservices, hoặc tại sao dùng JWT mà không dùng Session.' },
        { user_id: 9, content: 'Bài viết chia sẻ rất có tâm, xin vía điểm 9+ đồ án kỳ này nhé bạn!' },
        { user_id: 11, content: 'Các bạn nhớ in sẵn cuốn tài liệu báo cáo đóng bìa cứng có chữ ký của giảng viên hướng dẫn trước khi vào phòng phản biện nhé.' }
      ]
    },
    {
      user_id: 8,
      title: 'Hỏi về cách thiết kế CSDL lưu trữ cây danh mục đa cấp (Tree Hierarchy): Adjacency List hay Nested Sets?',
      content: 'Chào cả nhà, mình đang làm chức năng thư mục tài liệu lồng nhau (không giới hạn cấp độ). Có các hướng: 1. Adjacency List (parent_id) 2. Path Enumeration (dạng /1/4/12/) 3. Nested Sets 4. Closure Table. Với hệ thống vừa và nhỏ (vài chục ngàn thư mục), phương án nào cân bằng tốt nhất giữa tốc độ truy vấn và độ phức tạp khi INSERT/UPDATE?',
      post_type: 'question',
      subject: 'Cơ sở dữ liệu',
      tags: ['database', 'sqldesign', 'hierarchy', 'tree', 'mysql'],
      status: 'active',
      view_count: 240,
      comments: [
        { user_id: 3, content: 'Với quy mô vừa và nhỏ thì dùng Path Enumeration (lưu chuỗi `path` dạng `1/4/12`) hoặc Closure Table là chân ái bạn nhé. Truy vấn lấy toàn bộ con cháu chỉ cần `WHERE path LIKE "1/4/%"` có index B-Tree cực nhanh.' },
        { user_id: 5, content: 'Tránh xa Nested Sets nếu hệ thống thường xuyên thêm sửa xóa node vì mỗi lần update phải update lại toàn bộ lft, rgt của các node khác, rất dễ deadlock!' },
        { user_id: 10, content: 'Nếu dùng MySQL 8.0 trở lên thì dùng Adjacency List (cột parent_id) kết hợp Recursive CTE `WITH RECURSIVE` là chuẩn nhất, không cần thêm cột dư thừa nào.' },
        { user_id: 7, content: 'Chuẩn, MySQL 8.0 CTE giải quyết bài toán này cực kỳ sạch sẽ và tuân thủ chuẩn 3NF.' }
      ]
    },
    {
      user_id: 9,
      title: 'Tài liệu Kiến trúc Máy tính: Tập lệnh MIPS, Pipeline 5 giai đoạn & Cơ chế Hazard Handling',
      content: 'Tài liệu ôn tập toàn diện môn Kiến trúc Máy tính & Vi xử lý cho sinh viên Kỹ thuật máy tính & CNTT. Nội dung gồm: Bảng mã lệnh MIPS (R-type, I-type, J-type), cơ chế Datapath đơn chu kỳ vs đa chu kỳ, kỹ thuật Pipeline 5 tầng (IF, ID, EX, MEM, WB) và 3 loại Hazard kinh điển (Structural, Data, Control Hazard) kèm bài tập tính chu kỳ xung clock (CPI).',
      post_type: 'document',
      subject: 'Kiến trúc máy tính',
      tags: ['mips', 'pipeline', 'ktmt', 'tailieuhoc', 'hardware'],
      status: 'active',
      view_count: 375,
      comments: [
        { user_id: 13, content: 'Phần giải thích Data Hazard với kỹ thuật Forwarding (Bypassing) vẽ sơ đồ thanh ghi và ALU rất rõ ràng.' },
        { user_id: 6, content: 'Tài liệu này cứu cánh mình kỳ thi giữa kỳ vừa rồi, cảm ơn bạn Gia Huy nhé!' },
        { user_id: 11, content: 'Bài tập tính CPI và thời gian thực thi (Execution Time) có lời giải từng bước rất chuẩn.' },
        { user_id: 2, content: 'Môn này khá trừu tượng, có tài liệu hệ thống hóa như này học nhẹ nhàng hơn hẳn.' }
      ]
    },
    {
      user_id: 10,
      title: 'So sánh Tailwind CSS vs CSS Modules vs Styled-Components: Đâu là chân ái cho dự án React 2026?',
      content: 'Trong quá trình phát triển đồ án môn Công nghệ phần mềm, nhóm mình đã cân nhắc nhiều giải pháp CSS: Tailwind CSS (Utility-first), CSS Modules (Scoping truyền thống), và Styled-Components (CSS-in-JS). Cuối cùng nhóm chọn Tailwind vì tốc độ code nhanh, bundle size cực nhỏ và không bị runtime overhead. Mọi người có ý kiến gì về xu hướng này không?',
      post_type: 'discussion',
      subject: 'Lập trình Web',
      tags: ['frontend', 'tailwindcss', 'css', 'react', 'uidesign'],
      status: 'active',
      view_count: 410,
      comments: [
        { user_id: 4, content: 'Tailwind v3/v4 kết hợp với class-variance-authority (cva) và clsx/tailwind-merge để tạo Design System UI Component tái sử dụng là chuẩn bài hiện nay.' },
        { user_id: 2, content: 'CSS-in-JS như styled-components hiện tại đã dần lỗi thời vì không tương thích tốt với React Server Components (RSC) và gây giảm INP (Interaction to Next Paint).' },
        { user_id: 5, content: 'Tailwind lúc đầu nhìn HTML có vẻ hơi rối class, nhưng làm quen rồi thì không muốn quay lại viết CSS file riêng nữa vì nhảy qua lại rất tốn thời gian.' },
        { user_id: 8, content: 'Đồng ý 100%, dự án hiện tại của nhóm mình dùng Tailwind viết responsive cực kỳ mượt mà trên cả mobile lẫn desktop.' }
      ]
    },
    {
      user_id: 11,
      title: 'Hỏi về cách cấu hình CORS và Secure Cookie khi deploy Frontend và Backend ở 2 subdomain khác nhau?',
      content: 'Frontend của mình chạy tại `app.mydomain.com` còn Backend chạy tại `api.mydomain.com`. Khi login thành công, Backend set cookie Refresh Token với thuộc tính `httpOnly`, `secure`, `sameSite: none`. Tuy nhiên trình duyệt vẫn chặn không gửi cookie trong các request tiếp theo. Có anh em nào từng xử lý lỗi này chưa?',
      post_type: 'question',
      subject: 'Lập trình Web',
      tags: ['cors', 'cookie', 'security', 'frontend', 'backend'],
      status: 'active',
      view_count: 280,
      comments: [
        { user_id: 2, content: 'Có 2 điểm cần lưu ý: 1. Ở axios/fetch phía client bạn phải bật `withCredentials: true`. 2. Ở backend Express middleware CORS bạn phải cấu hình `credentials: true` và `origin: "https://app.mydomain.com"` (tuyệt đối không được để "*").' },
        { user_id: 3, content: 'Chuẩn rồi, ngoài ra nếu chạy trên cùng domain chính `mydomain.com` thì có thể set `domain: ".mydomain.com"` trong thuộc tính Cookie để cả 2 subdomain cùng đọc được.' },
        { user_id: 7, content: 'Nếu test trên localhost thì nhớ `sameSite: "lax"` và `secure: false`, khi lên production HTTPS mới đổi thành `sameSite: "none"` và `secure: true` nhé.' },
        { user_id: 11, content: 'Cảm ơn các bạn nhiều, mình bật `withCredentials: true` trên axios là cookie gửi lên ngon lành rồi!' }
      ]
    },
    {
      user_id: 12,
      title: 'Tài liệu hướng dẫn triển khai CI/CD với GitHub Actions: Tự động chạy Unit Test và Build Docker',
      content: 'Tài liệu thực hành từng bước xây dựng quy trình CI/CD hoàn chỉnh cho đồ án sinh viên: Khi push code hoặc tạo Pull Request vào nhánh `main`, GitHub Actions sẽ tự động:\n1. Cài đặt dependencies (npm ci)\n2. Chạy Linter và kiểm tra cú pháp mã nguồn\n3. Chạy toàn bộ test suites (backend & contract test)\n4. Tự động build Docker Image và đẩy lên Docker Hub.\nCó sẵn template workflow YAML cho anh em chỉ việc copy paste.',
      post_type: 'document',
      subject: 'Công nghệ phần mềm',
      tags: ['cicd', 'githubactions', 'devops', 'docker', 'automation'],
      status: 'active',
      view_count: 490,
      comments: [
        { user_id: 2, content: 'Rất cần thiết cho các nhóm làm đồ án lớn! Việc có CI chặn các PR lỗi trước khi merge giúp branch chính luôn ở trạng thái deployable.' },
        { user_id: 5, content: 'Workflow viết rất gọn, có tận dụng GitHub Actions Cache cho `~/.npm` nên thời gian build giảm từ 3 phút xuống còn 40 giây.' },
        { user_id: 9, content: 'Thầy hướng dẫn nhóm mình rất thích nhóm nào biết setup CI/CD tự động như này, cộng điểm chuyên cần luôn.' },
        { user_id: 10, content: 'Cảm ơn bạn Mai Chi, tài liệu hướng dẫn rất chi tiết và dễ áp dụng!' }
      ]
    },
    {
      user_id: 3,
      title: 'Kinh nghiệm quản lý xung đột (Merge Conflict) và quy ước Git Flow chuẩn chỉnh cho nhóm sinh viên',
      content: 'Trong làm việc nhóm, merge conflict là ác mộng nếu không có quy ước rõ ràng. Nhóm mình áp dụng nguyên tắc: Không ai commit thẳng lên `main`, mỗi tính năng tách 1 nhánh `feat/<ten-tinh-nang>`, rebase từ nhánh tích hợp trước khi tạo PR, và bắt buộc có ít nhất 1 thành viên review code trước khi merge. Anh em chia sẻ thêm quy ước làm việc nhóm của mình nhé!',
      post_type: 'discussion',
      subject: 'Công nghệ phần mềm',
      tags: ['git', 'gitflow', 'teamwork', 'cnpm', 'bestpractices'],
      status: 'active',
      view_count: 360,
      comments: [
        { user_id: 2, content: 'Đặc biệt là không bao giờ dùng `git push --force` trên nhánh chung! Nếu rebase local thì dùng `--force-with-lease` để đảm bảo an toàn.' },
        { user_id: 6, content: 'Nên chia task theo chiều dọc (Vertical Slice) từng màn hình hoặc tính năng riêng để tránh nhiều người cùng sửa 1 file route hoặc 1 file component.' },
        { user_id: 7, content: 'Nhóm mình còn đặt quy ước commit message theo Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, nhìn git log rất chuyên nghiệp.' },
        { user_id: 13, content: 'Quy ước này chuẩn như môi trường doanh nghiệp rồi, sinh viên rèn luyện từ đồ án sau này đi làm thích nghi rất nhanh.' }
      ]
    },
    {
      user_id: 13,
      title: 'Hỏi đáp: Thuật toán gợi ý bạn bè (Friend Recommendation) trên Mạng xã hội sinh viên dùng Graph DB hay RDBMS?',
      content: 'Mình đang làm tính năng gợi ý kết bạn "Bạn bè chung" (Mutual Friends) và gợi ý bạn cùng lớp/cùng khoa. Nếu dùng MySQL với câu query self-join 3 lần trên bảng quan hệ `friendships` thì khi dữ liệu lớn (khoảng 50.000 người dùng) query chạy rất chậm (>1.5s). Có giải pháp tối ưu câu SQL nào không hay bắt buộc phải chuyển qua đồ thị Neo4j?',
      post_type: 'question',
      subject: 'Cơ sở dữ liệu',
      tags: ['graph', 'database', 'socialnetwork', 'mysql', 'algorithm'],
      status: 'active',
      view_count: 310,
      comments: [
        { user_id: 2, content: 'Với 50.000 users thì MySQL hoàn toàn gánh tốt nếu đánh chỉ mục 2 chiều: bảng `friendships` có composite primary key `(user_id, friend_id)` và một index ngược `(friend_id, user_id)`. Tốc độ quét index sẽ dưới 10ms.' },
        { user_id: 3, content: 'Ngoài ra không nên tính toán real-time mỗi khi user mở trang. Hãy chạy cronjob ban đêm hoặc background worker tính trước top 20 gợi ý rồi lưu vào bảng đệm `suggested_friends` hoặc Redis.' },
        { user_id: 5, content: 'Nếu làm đồ án nghiên cứu sâu về thuật toán đồ thị thì Neo4j với ngôn ngữ Cypher viết cực kỳ thanh thoát: `MATCH (u:User)-[:FRIEND]->(f)-[:FRIEND]->(foaf) WHERE NOT (u)-[:FRIEND]->(foaf) RETURN foaf, count(f)`. Thầy cô sẽ đánh giá rất cao.' },
        { user_id: 10, content: 'Cảm ơn các gợi ý chất lượng, mình sẽ thử phương án cache Redis kết hợp composite index trước.' }
      ]
    },
    {
      user_id: 2,
      title: 'Tài liệu Tổng hợp 100 câu hỏi vấn đáp bảo vệ đồ án ngành Khoa học Máy tính & Kỹ thuật Phần mềm',
      content: 'Bộ tài liệu đúc kết từ 5 kỳ bảo vệ đồ án tốt nghiệp tại trường: Tổng hợp 100 câu hỏi thường gặp nhất của hội đồng chấm điểm, phân loại theo 4 mảng chính: 1. Kiến trúc hệ thống & Clean Code 2. Bảo mật (SQL Injection, XSS, CSRF, JWT) 3. Tối ưu cơ sở dữ liệu & Caching 4. Quy trình Scrum & Quản lý chất lượng phần mềm. Kèm gợi ý trả lời ngắn gọn, thuyết phục.',
      post_type: 'document',
      subject: 'Công nghệ phần mềm',
      tags: ['vandaobao', 'doan', 'phongvan', 'tailieuhoc', 'totnghiep'],
      status: 'active',
      view_count: 730,
      comments: [
        { user_id: 3, content: 'Tài liệu đỉnh nhất kỳ này! Phần giải thích cơ chế chống SQL Injection qua Prepared Statements và Parameterized Queries viết cực chuẩn.' },
        { user_id: 4, content: 'Câu hỏi số 42 về sự khác nhau giữa Authentication và Authorization hội đồng rất thích hỏi sinh viên mở đầu phần vấn đáp.' },
        { user_id: 6, content: 'Cảm ơn Hùng nhiều nha, tài liệu quý báu giúp các bạn khóa dưới vững tâm lý hơn rất nhiều!' },
        { user_id: 8, content: 'Đã bookmark ngay lập tức. Chúc nhóm bảo vệ xuất sắc!' },
        { user_id: 12, content: 'Tài liệu rất chi tiết, có ví dụ code minh họa trực quan.' }
      ]
    },
    {
      user_id: 4,
      title: 'Chiến lược đánh Index trong CSDL: Khi nào B-Tree phát huy sức mạnh và khi nào Hash Index tối ưu hơn?',
      content: 'Index là chìa khóa vàng tăng tốc hệ thống nhưng đánh sai index sẽ phản tác dụng khi ghi (INSERT/UPDATE/DELETE). B-Tree Index thích hợp cho các truy vấn phạm vi (`BETWEEN`, `<`, `>`), sắp xếp `ORDER BY` và so sánh tiền tố `LIKE "abc%"`. Trong khi đó Hash Index chỉ tối ưu cho so sánh bằng tuyệt đối (`=`). Anh em cùng thảo luận các trường hợp không nên đánh index nhé!',
      post_type: 'discussion',
      subject: 'Cơ sở dữ liệu',
      tags: ['mysql', 'index', 'btree', 'database', 'optimization'],
      status: 'active',
      view_count: 340,
      comments: [
        { user_id: 5, content: 'Không nên đánh index cho các cột có cardinality thấp (độ phân tán thấp), ví dụ như cột `gender` (nam/nữ) hay cột `status` chỉ có 2-3 giá trị, vì MySQL Query Optimizer sẽ bỏ qua index và quét bảng toàn bộ (Table Scan) luôn.' },
        { user_id: 7, content: 'Thêm nữa là các bảng có tần suất ghi cực cao (logs, audit trails) thì hạn chế tối đa index để tránh chi phí re-balancing B-Tree trên đĩa cứng.' },
        { user_id: 9, content: 'Nhớ dùng câu lệnh `EXPLAIN` hoặc `EXPLAIN ANALYZE` để xem Execution Plan thực tế xem câu query có ăn đúng Index (Using index) hay không nhé.' },
        { user_id: 13, content: 'Kiến thức rất bài bản, cảm ơn bạn đã chia sẻ!' }
      ]
    },
    {
      user_id: 5,
      title: 'Hỏi đáp: Xử lý vấn đề N+1 Query trong Sequelize ORM khi lấy bài viết kèm danh sách tác giả và bình luận?',
      content: 'Khi mình gọi `Post.findAll()` sau đó trong vòng lặp map gọi `post.getComments()` và `comment.getUser()`, hệ thống phát sinh hàng chục câu query con làm thời gian phản hồi API tăng vọt lên 800ms. Trong Sequelize làm thế nào để fetch toàn bộ dữ liệu chỉ trong 1 hoặc 2 query duy nhất?',
      post_type: 'question',
      subject: 'Lập trình Web',
      tags: ['sequelize', 'nodejs', 'orm', 'nplusone', 'backend'],
      status: 'active',
      view_count: 305,
      comments: [
        { user_id: 2, content: 'Bạn dùng thuộc tính `include` (Eager Loading) trong Sequelize nhé:\n`Post.findAll({ include: [{ model: User, as: "author" }, { model: Comment, include: [User] }] })`.\nSequelize sẽ tự động sinh LEFT JOIN hoặc IN query rất gọn, tốc độ giảm về dưới 30ms ngay!' },
        { user_id: 3, content: 'Đúng rồi, tuy nhiên lưu ý chỉ `attributes` những cột cần thiết (ví dụ id, full_name, avatar_url) để tránh fetch cả password_hash hay các cột text nặng không cần thiết.' },
        { user_id: 10, content: 'Nếu quan hệ có phân trang (pagination) cho bình luận con thì nên tách làm 2 API riêng: 1 API lấy chi tiết bài viết, 1 API phân trang danh sách bình luận để app mượt hơn.' },
        { user_id: 11, content: 'Lời khuyên rất chính xác, cảm ơn cả nhà nhiều!' }
      ]
    },
    {
      user_id: 7,
      title: 'Tài liệu Thực hành Lập trình Hướng đối tượng (OOP) nâng cao: 5 nguyên lý SOLID áp dụng trong TypeScript',
      content: 'Tài liệu hướng dẫn chi tiết cách áp dụng 5 nguyên lý thiết kế phần mềm hướng đối tượng SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) trong các dự án TypeScript và JavaScript hiện đại. Kèm theo ví dụ so sánh trước và sau khi refactor code (Code Smell vs Clean Code).',
      post_type: 'document',
      subject: 'Công nghệ phần mềm',
      tags: ['solid', 'oop', 'typescript', 'cleancode', 'tailieuhoc'],
      status: 'active',
      view_count: 515,
      comments: [
        { user_id: 2, content: 'Nguyên lý D (Dependency Inversion) kết hợp Inversion of Control (IoC) là nền tảng cốt lõi của NestJS và Spring Boot. Đọc tài liệu này hiểu sâu bản chất luôn.' },
        { user_id: 4, content: 'Ví dụ về Liskov Substitution Principle (hình chữ nhật và hình vuông) giải thích rất dễ thấm.' },
        { user_id: 6, content: 'Tài liệu rất hay, phù hợp cho sinh viên năm 2 năm 3 đang học môn Thiết kế mẫu (Design Patterns).' },
        { user_id: 8, content: 'Cảm ơn tác giả nhiều, code TypeScript trình bày sạch đẹp và có type safety chuẩn.' }
      ]
    },
    {
      user_id: 8,
      title: 'Trải nghiệm tối ưu hóa trải nghiệm người dùng (UX) và hiệu năng tải trang với Vite + React 18',
      content: 'Khi chuyển đổi dự án từ Create React App (Webpack) sang Vite, nhóm mình nhận thấy tốc độ khởi động server dev giảm từ 25 giây xuống còn 300 mili-giây. Ngoài ra, việc kết hợp Code Splitting bằng `React.lazy` và `Suspense` giúp giảm kích thước bundle ban đầu từ 2.8MB xuống còn 450KB. Các bạn có tip tối ưu nào thêm cho Vite không?',
      post_type: 'discussion',
      subject: 'Lập trình Web',
      tags: ['vite', 'react', 'performance', 'frontend', 'bundler'],
      status: 'active',
      view_count: 275,
      comments: [
        { user_id: 3, content: 'Nên dùng plugin `vite-plugin-compression` để nén gzip/brotli cho production assets, server trả về dung lượng siêu nhỏ.' },
        { user_id: 5, content: 'Phần font chữ nên dùng `font-display: swap` và self-host font thay vì kéo trực tiếp từ Google Fonts để tránh chặn hiển thị trang (Render-blocking).' },
        { user_id: 9, content: 'Nhóm mình cũng vừa chuyển qua Vite, trải nghiệm phát triển sướng hơn hẳn, hot reload tức thì!' },
        { user_id: 12, content: 'Bài viết chia sẻ hữu ích, cảm ơn bạn.' }
      ]
    },
    {
      user_id: 9,
      title: 'Hỏi đáp: Cách bảo vệ file PDF tài liệu có phí không bị truy cập trực tiếp qua đường dẫn công khai (Public URL)?',
      content: 'Trong đề tài đồ án môn An toàn thông tin và CNPM, nhóm mình có chức năng tải tài liệu nghiên cứu. Làm sao để ngăn chặn người dùng chưa mua hoặc khách vãng lai đoán được link file `/uploads/document.pdf` để tải chùa? Có nên lưu file ngoài thư mục static và phân phối qua signed URL hoặc stream trung gian?',
      post_type: 'question',
      subject: 'Công nghệ phần mềm',
      tags: ['security', 'pdf', 'authorization', 'blob', 'backend'],
      status: 'active',
      view_count: 360,
      comments: [
        { user_id: 2, content: 'Tuyệt đối không lưu file tài liệu bí mật trong thư mục public static (`public/uploads`)! Hãy lưu vào thư mục protected riêng trên server, tạo API `GET /api/documents/:id/download`. Trong API đó kiểm tra Token, quyền sở hữu hoặc trạng thái thanh toán, sau đó dùng `res.download()` hoặc `stream` file về cho client.' },
        { user_id: 3, content: 'Nếu lưu trên Cloud Storage như AWS S3 hay Google Cloud Storage thì hãy dùng Pre-signed URL có thời hạn ngắn (ví dụ hết hạn sau 5 phút), vừa an toàn vừa tiết kiệm băng thông cho server backend.' },
        { user_id: 7, content: 'Giải pháp stream qua controller có kiểm tra quyền là giải pháp chuẩn chỉnh mà đồ án môn học nhóm mình áp dụng, thầy cô chấm 10 điểm phần bảo mật!' },
        { user_id: 11, content: 'Cảm ơn các câu trả lời rất chất lượng, mình sẽ refactor lại endpoint download theo đúng hướng dẫn này.' }
      ]
    }
  ];

  // 4. Chèn 18 bài viết và bình luận vào DB
  for (const postData of samplePosts) {
    const { comments, ...postFields } = postData;
    const post = await db.Post.create(postFields);
    console.log(`+ Đã tạo bài viết ID ${post.id}: "${post.title.substring(0, 50)}..."`);
    
    if (comments && comments.length > 0) {
      for (const c of comments) {
        await db.Comment.create({
          post_id: post.id,
          user_id: c.user_id,
          content: c.content,
          status: 'active'
        });
      }
      console.log(`  └─ Đã thêm ${comments.length} bình luận sinh viên thực tế`);
    }
  }

  // 5. Kiểm tra và bổ sung bình luận cho các bài viết cũ (ID 2 đến 12) nếu chưa đủ 4 bình luận
  const oldPostIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
  const sampleExtraComments = [
    'Phân tích rất sắc bén và đúng trọng tâm vấn đề, cảm ơn bạn đã chia sẻ kiến thức hữu ích!',
    'Kiến thức này áp dụng vào bài tập lớn của nhóm mình tuần này chuẩn không cần chỉnh.',
    'Mình đã thử giải pháp này trên môi trường local và chạy rất mượt, cảm ơn tác giả.',
    'Mong bạn tiếp tục ra thêm các bài viết chia sẻ kinh nghiệm đồ án chuyên sâu như thế này nữa nha!'
  ];

  for (const pid of oldPostIds) {
    const currentCount = await db.Comment.count({ where: { post_id: pid } });
    const needed = Math.max(0, 4 - currentCount);
    for (let i = 0; i < needed; i++) {
      const randomUserId = studentUsers[(pid + i) % studentUsers.length];
      await db.Comment.create({
        post_id: pid,
        user_id: randomUserId,
        content: sampleExtraComments[i % sampleExtraComments.length],
        status: 'active'
      });
    }
    if (needed > 0) {
      console.log(`✓ Đã bổ sung ${needed} bình luận cho bài viết ID ${pid}`);
    }
  }

  // 6. Cập nhật view count và tương tác likes cho chân thực
  const allActivePosts = await db.Post.findAll({ where: { status: 'active' } });
  console.log(`\n=== TỔNG KẾT: HIỆN CÓ ${allActivePosts.length} BÀI VIẾT ACTIVE HỌC THUẬT ĐẠT CHUẨN ===`);
  const totalComments = await db.Comment.count();
  console.log(`=== TỔNG CỘNG ${totalComments} BÌNH LUẬN TRONG HỆ THỐNG ===`);
  
  process.exit(0);
}

seed().catch(err => {
  console.error('LỖI SEED:', err);
  process.exit(1);
});

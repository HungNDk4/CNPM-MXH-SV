# Tech Stack Playbook — Web CNPM-MXH-SV
**Ngày nghiên cứu:** 2026-10-17. **Áp dụng cho source hiện tại; không tự động nâng phiên bản package.** Thông tin `package.json` chỉ thể hiện dải version, bản thực tế do `package-lock.json` khóa. Không nhầm tài liệu `latest` với docs của major đang cài.

## 1. Inventory source-backed
| Layer | Công nghệ (major hiện có) | File đọc trước | Mục đích |
|---|---|---|---|
| UI | React 18 | client/src/App.jsx, pages/, components/ | Components, hooks, form |
| Bundler | Vite 5 | client/vite.config.js, client/package.json | Build, dev proxy, ESM |
| Router | React Router DOM 6 | client/src/App.jsx | Routes/nested layouts/guards |
| Styles | Tailwind CSS 3 | client/tailwind.config.js, src/index.css | UI tokens, responsive |
| Server state | @tanstack/react-query 5 | client/src/main.jsx, pages/HomePage.jsx | Fetch/cache/mutation |
| Client state | Zustand 4 | client/src/stores/authStore.js | Auth session state |
| HTTP | Axios 1 | client/src/lib/axios.js, services/api.js | REST, interceptors |
| API | Express 4 | server/src/app.js, routes/, controllers/ | HTTP, middleware |
| DB / ORM | MySQL + Sequelize 6 | database/schema.sql, server/src/models/ | Relations, transactions |
| Auth | jsonwebtoken 9, bcryptjs 2 | auth.controller.js, auth.middleware.js | JWT & password hashing |
| Sandbox | VNPay | payment.controller.js | Chỉ thử nghiệm, chưa bảo mật hoàn chỉnh |

## 2. Quy tắc thực hành Frontend
- **React 18:** render bằng component thuần, hooks đúng quy tắc; không dùng useEffect làm pipeline fetch nếu TanStack Query đã sở hữu server state. Mọi mutation ghi dữ liệu qua API thật; hiển thị loading/empty/error/success.
- **React Router 6:** `App.jsx` quản lý route; `ProtectedRoute` hỗ trợ UX nhưng backend phải kiểm tra quyền. Không bê nguyên các API của React Router 7.
- **TanStack Query 5:** `queryKey` có filter/pagination; sau mutation `invalidateQueries` theo key; phân biệt cache server với auth/form trong Zustand hoặc component state.
- **Zustand 4:** dùng cho session/local state; hiện `authStore` persist cả access+refresh token trong localStorage → có rủi ro XSS; mọi thay đổi mô hình session/cookie cần threat-model và duyệt trước, không thay lén.
- **Axios 1:** giữ một client API, làm rõ semantics 401/403; xử lý refresh token một lần cho request đồng thời, guard retry/loop; không log token.
- **Tailwind 3:** đang dùng `tailwind.config.js`, PostCSS và `@tailwind` directives. Docs v4 dùng cách cài đặt khác; không áp dụng nhầm cú pháp v4 khi chưa migrate.
- **Vite 5:** `client/vite.config.js` dùng ESM, alias URL qua `fileURLToPath`; build CI trước khi merge.

## 3. Quy tắc Backend
- **Express 4:** route → validation middleware → authenticate/authorize → controller → Sequelize; với `async` phải bắt lỗi và gọi `next(error)` đúng cách (không mặc định semantics Express 5).
- **Sequelize 6:** mô hình khóa ngoại/associations cần tương thích SQL; transaction cho những cập nhật liên quan nhiều bảng; cân nhắc row lock và trạng thái chuyển tiếp khi xử lý concurrent callback; không mặc định mọi truy vấn nằm trong transaction.
- **MySQL:** validate cả ở app và DB (FK, UNIQUE, NOT NULL); migration có rollback, seed an toàn; dùng DECIMAL cho số tiền, tránh floating-point arithmetic.
- **JWT/bcrypt:** kiểm tra account active và quyền sở hữu resource ở mọi endpoint; giới hạn đăng nhập, bảo vệ refresh token, không tin `role` từ frontend.
- **Upload:** validate MIME/extension/size, randomize storage key và bảo vệ download; không công khai file trả phí trong `/uploads`.

## 4. Security gates cần biết trước coding
1. `GET /api/posts` hiện trả `file_url` không lọc theo quyền → **P0**.
2. VNPay callback return/IPN có đường cộng ví trùng và thiếu idempotency gate → **P0**.
3. Guest feed hiện route buộc `authenticate`, trái kỳ vọng public → **P1**.
4. Đường dẫn file public là vấn đề thiết kế, không sửa bằng cách đơn thuần ẩn button.
5. **Không dùng return URL/browser query làm nguồn quyết định paid**. IPN phải kiểm chứng checksum, mã giao dịch, amount, merchant, trạng thái, và áp dụng transition một lần. Đọc đúng tài liệu VNPay áp dụng cho loại tài khoản/version đang cấu hình.
6. Với mọi ID từ client: check resource tồn tại và chủ thể có quyền; che field nhạy cảm bằng response DTO, không `res.json(model)` tùy tiện.
7. Dev console hiện có thể in stack trace; không đưa log đó ra môi trường công khai.

## 5. Testing: hiện có và ứng viên bổ sung
**Đang có:** GitHub Actions kiểm tra `node --check` backend, `npm ci && npm run build` frontend. Chưa có unit/integration/E2E tests.
**Đề xuất (chưa cài):** Vitest + React Testing Library (frontend), Supertest + framework test Node/Vitest phù hợp (API), Playwright (E2E sau khi có seed DB). Mọi library mới cần kiểm tra peer dependencies/Node/Vite versions và làm PR riêng.
Prioritize: auth/ownership → post DTO/privacy → payments idempotence → FE core flows → E2E.

## 6. Runtime policy
- Baseline Node **24 LTS** (`.nvmrc`; chỉ coi là verified khi GitHub CI pass); Node 20 trong commit setup đầu tiên đã EOL theo lịch Node.js.
- Không nâng đồng thời React/Router/Tailwind/Sequelize. Đánh giá migration major, tác động và tests trong ADR/PR riêng.

## 7. Nguồn tham khảo chính thức (ưu tiên các nhánh version phù hợp)
- React: https://18.react.dev/reference/react
- Vite 5: https://v5.vite.dev/guide/
- React Router v6: https://reactrouter.com/docs/en/v6/start/overview
- Tailwind v3: https://v3.tailwindcss.com/docs/guides/vite
- TanStack Query v5: https://tanstack.com/query/v5/docs/framework/react/overview ; https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
- Zustand: https://zustand.docs.pmnd.rs/middlewares/persist ; https://github.com/pmndrs/zustand
- Axios: https://axios-http.com/docs/interceptors
- Express: https://expressjs.com/en/advanced/best-practice-security/
- Sequelize v6: https://sequelize.org/docs/v6/ ; https://sequelize.org/docs/v6/other-topics/transactions/
- MySQL 8.0 docs: https://dev.mysql.com/doc/refman/8.0/en/
- Node support/EOL: https://nodejs.org/en/about/previous-releases
- OWASP API Top 10: https://api-security.owasp.org/editions/2023/en/0x11-t10/
- VNPay Sandbox: https://sandbox.vnpayment.vn/apis/docs/ (chọn đúng API theo hợp đồng/phiên bản)

## 8. Before implementing a module
Đọc `docs/ANALYSIS_DESIGN_PROCESS.md`, `docs/AI_SKILLS_PLAYBOOK.md`, `docs/TEAM_WORKFLOW.md` và đoạn mã thực tế; kiểm tra version lockfile; tạo brief→review→PR. Nếu docs online đổi, ưu tiên đúng major và ghi ngày xác minh.

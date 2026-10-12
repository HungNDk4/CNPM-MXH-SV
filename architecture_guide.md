# 📚 Mini Study Network — Hướng dẫn Setup & Architecture Guide

## 🗂️ Cấu trúc thư mục đầy đủ

```
GIUAKI/
├── .gitignore
├── README.md
│
├── database/
│   └── schema.sql              ← DDL MySQL cho tất cả bảng
│
├── server/                     ← Node.js + Express Backend
│   ├── package.json
│   ├── .env                    ← (copy từ .env.example)
│   ├── .env.example
│   ├── uploads/                ← File upload (không commit)
│   └── src/
│       ├── index.js            ← Entry point (bootstrap DB + Server)
│       ├── app.js              ← Express app + Middleware + Routes
│       ├── config/
│       │   └── database.js     ← Sequelize connection config
│       ├── models/
│       │   ├── index.js        ← Import + Associations tất cả models
│       │   ├── User.js
│       │   ├── Post.js
│       │   ├── Comment.js
│       │   └── Order.js
│       ├── controllers/
│       │   ├── auth.controller.js      ← Register, Login, Refresh, Logout
│       │   ├── post.controller.js      ← CRUD Posts + Access Control
│       │   └── payment.controller.js   ← Order + VNPay URL + Callback
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── user.routes.js
│       │   ├── post.routes.js
│       │   ├── comment.routes.js
│       │   ├── like.routes.js
│       │   ├── order.routes.js
│       │   └── payment.routes.js
│       └── middlewares/
│           ├── auth.middleware.js      ← authenticate() + authorize()
│           ├── error.middleware.js     ← Global error handler
│           └── validate.middleware.js  ← express-validator wrapper
│
└── client/                     ← React + Vite Frontend
    ├── package.json
    ├── vite.config.js           ← Proxy /api → localhost:5000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx            ← React + QueryClient + Router setup
        ├── App.jsx             ← Route definitions
        ├── index.css           ← Tailwind + Custom component classes
        ├── stores/
        │   └── authStore.js    ← Zustand auth state (localStorage persist)
        ├── lib/
        │   └── axios.js        ← Axios instance + Auto JWT refresh
        ├── services/
        │   └── api.js          ← API service functions (authAPI, postAPI...)
        ├── layouts/
        │   ├── MainLayout.jsx  ← Navbar + Outlet
        │   └── AuthLayout.jsx  ← Centered auth card
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── NotFoundPage.jsx
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   ├── posts/
        │   │   ├── PostDetailPage.jsx  (stub)
        │   │   └── CreatePostPage.jsx
        │   ├── profile/
        │   │   └── ProfilePage.jsx     (stub)
        │   └── payment/
        │       └── PaymentResultPage.jsx
        └── components/
            └── PostCard.jsx
```

---

## 🗄️ Database Schema Diagram

```
users ──────────────────────────────────────────────────────────
  id, full_name, email, password_hash, avatar_url, bio,
  university, major, wallet_balance, role, is_active

posts ──────────────────────────────────────────────────────────
  id, user_id(FK→users), title, content, post_type,
  file_url, file_name, price, subject, tags, view_count, status

comments ───────────────────────────────────────────────────────
  id, post_id(FK→posts), user_id(FK→users),
  parent_id(self-ref FK), content, status

likes ──────────────────────────────────────────────────────────
  id, user_id(FK→users), target_type(post|comment), target_id
  [UNIQUE: user_id + target_type + target_id]

orders ─────────────────────────────────────────────────────────
  id, buyer_id(FK→users), post_id(FK→posts), seller_id(FK→users),
  amount, vnp_txn_ref, vnp_transaction_no, vnp_response_code,
  payment_method, status(pending|paid|failed|refunded), paid_at

document_access ─────────────────────────────────────────────────
  id, user_id(FK→users), post_id(FK→posts), order_id(FK→orders)
  [UNIQUE: user_id + post_id]

refresh_tokens ──────────────────────────────────────────────────
  id, user_id(FK→users), token, expires_at, revoked
```

---

## 🚀 CLI Commands — Hướng dẫn từng bước

### Bước 1: Tạo Database MySQL

```bash
# Kết nối MySQL và chạy DDL script
mysql -u root -p < database/schema.sql

# Hoặc trong MySQL Workbench: File > Open SQL Script > schema.sql > Execute
```

### Bước 2: Cấu hình Backend

```bash
cd server

# Sao chép file env (nếu chưa có)
copy .env.example .env

# Mở .env và điền thông tin:
# DB_PASSWORD=your_mysql_password
# JWT_ACCESS_SECRET=random_64_char_string
# JWT_REFRESH_SECRET=another_random_64_char_string
# VNPAY_TMN_CODE=your_vnpay_code   (đăng ký tại sandbox.vnpayment.vn)
# VNPAY_HASH_SECRET=your_vnpay_secret
```

### Bước 3: Chạy Dev Server

```bash
# Terminal 1 — Backend
cd server
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev
# → http://localhost:5173
```

### Bước 4: Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Đăng ký user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Nguyễn Văn A","email":"test@test.com","password":"123456"}'

# Đăng nhập
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

---

## 🔐 Luồng JWT Authentication

```
Client                         Server
  │                              │
  ├── POST /auth/login ─────────>│
  │                              ├── Verify password (bcrypt)
  │                              ├── Generate accessToken (15m)
  │                              ├── Generate refreshToken (7d) → DB
  │<─── { accessToken, refreshToken } ─────
  │                              │
  ├── GET /api/posts             │
  │   Authorization: Bearer <at>─>│
  │                              ├── authenticate() verify JWT
  │                              ├── Load user from DB
  │<─── Posts data ─────────────┤
  │                              │
  │  [accessToken hết hạn]       │
  ├── POST /auth/refresh ───────>│
  │   { refreshToken }           ├── Verify refreshToken from DB
  │                              ├── Rotate: revoke old, create new
  │<─── { newAccessToken, newRefreshToken }
```

## 💳 Luồng Thanh toán VNPay

```
Client                 Backend                  VNPay
  │                       │                       │
  ├── POST /orders ───────>│                       │
  │   { post_id }          ├── Tạo Order (pending) │
  │                        ├── Build VNPay URL      │
  │<── { payment_url } ────┤                       │
  │                        │                       │
  ├── Redirect to VNPay ──────────────────────────>│
  │                        │          User thanh toán
  │<─── Redirect về /payment/result ───────────────┤
  │                        │                       │
  │   (song song)          │<── IPN Webhook ────────┤
  │                        ├── Verify signature     │
  │                        ├── Update order→paid    │
  │                        ├── Create DocumentAccess│
  │                        ├── Cộng wallet seller   │
  │                        └── Response { RspCode: '00' }
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | ❌ | Đăng ký |
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/refresh` | ❌ | Refresh token |
| POST | `/api/auth/logout` | ❌ | Đăng xuất |
| GET | `/api/auth/me` | ✅ | Thông tin bản thân |
| GET | `/api/posts` | Optional | Danh sách bài viết |
| GET | `/api/posts/:id` | Optional | Chi tiết bài viết |
| POST | `/api/posts` | ✅ | Tạo bài viết |
| PUT | `/api/posts/:id` | ✅ | Sửa bài viết |
| DELETE | `/api/posts/:id` | ✅ | Xóa bài viết |
| GET | `/api/comments?post_id=` | ❌ | Lấy comments |
| POST | `/api/comments` | ✅ | Thêm comment |
| DELETE | `/api/comments/:id` | ✅ | Xóa comment |
| POST | `/api/likes` | ✅ | Toggle like |
| GET | `/api/likes/count` | ❌ | Đếm like |
| POST | `/api/orders` | ✅ | Tạo đơn + URL VNPay |
| GET | `/api/orders/my` | ✅ | Lịch sử mua |
| GET | `/api/payment/vnpay-return` | ❌ | VNPay redirect callback |
| GET | `/api/payment/vnpay-ipn` | ❌ | VNPay IPN webhook |
| GET | `/api/users/:id` | ❌ | Profile công khai |
| PUT | `/api/users/profile` | ✅ | Cập nhật profile |
| PUT | `/api/users/change-password` | ✅ | Đổi mật khẩu |

---

## ⚠️ Lưu ý VNPay Sandbox

1. Đăng ký tại: https://sandbox.vnpayment.vn/devreg/
2. Lấy `vnp_TmnCode` và `vnp_HashSecret` từ portal
3. Test card: **9704198526191432198** (NCBVN Bank, tên: NGUYEN VAN A, ngày: 07/15, OTP: 123456)
4. `VNPAY_RETURN_URL` phải dùng domain public hoặc ngrok khi test IPN

> [!IMPORTANT]
> Trước khi deploy production, đổi tất cả secret keys trong `.env` và không bao giờ commit file `.env` lên git.

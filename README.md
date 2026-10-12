# 📚 Mini Study Network
> Mạng xã hội học tập sinh viên & Chia sẻ tài liệu

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + Tailwind CSS + Axios |
| Backend | Node.js + Express.js + JWT |
| Database | MySQL + Sequelize ORM |
| Payment | VNPay Sandbox |

## Cấu trúc thư mục
```
GIUAKI/
├── client/          # React + Vite Frontend
├── server/          # Node.js + Express Backend
├── database/        # SQL DDL Scripts
└── README.md
```

## Khởi chạy nhanh
```bash
# 1. Setup database
mysql -u root -p < database/schema.sql

# 2. Backend
cd server && npm install && npm run dev

# 3. Frontend
cd client && npm install && npm run dev
```

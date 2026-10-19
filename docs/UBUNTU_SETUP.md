# Ubuntu 24.04 LTS — Chạy Mini Study Network (local development)
**Status:** Ubuntu scripts + MySQL CI trên Draft PR; máy thành viên chưa được cài đặt hay kiểm thử trực tiếp. Không liên quan Vercel cloud PoC.

## Yêu cầu
- Ubuntu Desktop/Server 24.04 LTS; Node.js **24** theo `.nvmrc`, npm, Git, **MySQL 8**.
- Frontend React/Vite: http://localhost:5173; Backend Express: http://localhost:5000/api/health; DB: 127.0.0.1:3306.
- Nếu chạy Ubuntu WSL2 chưa bật systemd, dùng `sudo service mysql start` thay `systemctl`.

## 1. Cài hệ thống
```bash
sudo apt update
sudo apt install -y git curl build-essential mysql-server default-mysql-client
sudo systemctl enable --now mysql
mysql --version
```
Cài nvm từ [dự án chính thức](https://github.com/nvm-sh/nvm#installing-and-updating), kiểm tra mã installer trước khi chạy. Sau đó:
```bash
nvm install 24
nvm use 24
node -v && npm -v
```

## 2. Clone và chuẩn bị
Script hiện trên **branch riêng**, chưa được merge vào `main`:
```bash
git clone https://github.com/HungNDk4/CNPM-MXH-SV.git
cd CNPM-MXH-SV
git fetch origin
git switch --track origin/chore/ubuntu-dev-setup-20261019
bash scripts/ubuntu/doctor.sh
bash scripts/ubuntu/setup.sh
```
`doctor.sh` chỉ đọc thông tin máy. `setup.sh` copy `.env.example` nếu chưa có và chạy `npm ci` trên server/client, không cấp sudo, không tạo database, không ghi đè `.env` và không khởi động cloud.

## 3. Tạo database DEV TRỐNG
```bash
sudo mysql
```
Trong MySQL shell, tự đặt mật khẩu dài (không gửi qua ChatGPT):
```sql
CREATE DATABASE IF NOT EXISTS mini_study_network CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'studynet_dev'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_LONG_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON mini_study_network.* TO 'studynet_dev'@'127.0.0.1';
EXIT;
```
**Chỉ import vào DB chưa có bảng/dữ liệu**, tránh ghi đè:
```bash
mysql --protocol=tcp -h127.0.0.1 -P3306 -ustudynet_dev -p < database/schema.sql
```
Schema chứa seed admin với bcrypt hash **placeholder**, không phải account đăng nhập được. Schema trên branch Ubuntu bổ sung `updated_at` cho `likes` và `refresh_tokens` (chỉ áp dụng DB tạo mới, không phải migration cho DB đã có dữ liệu).

## 4. Sửa server/.env
Chạy `nano server/.env`, giữ và thay các giá trị chính:
```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mini_study_network
DB_USER=studynet_dev
DB_PASSWORD=REPLACE_WITH_LOCAL_DB_PASSWORD
DB_AUTO_SYNC=false
JWT_ACCESS_SECRET=REPLACE_WITH_NEW_RANDOM_SECRET_ONE
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_RANDOM_SECRET_TWO
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```
Tạo **hai** secret riêng bằng `openssl rand -hex 32` (chạy hai lần). Không chia sẻ/commit `.env`. `DB_AUTO_SYNC=false` ngăn backend dev tự `sequelize.sync({ alter:true })` thay đổi schema đã import.

## 5. Chạy app với hai Ubuntu terminal
Terminal backend:
```bash
cd CNPM-MXH-SV/server
npm run dev
```
Terminal frontend:
```bash
cd CNPM-MXH-SV/client
npm run dev
```
Lệnh kiểm tra `curl -fsS http://127.0.0.1:5000/api/health`, mở http://localhost:5173. Vite dev proxy `/api` sang localhost:5000.

## 6. Chẩn đoán và bảo mật
- `ECONNREFUSED`: kiểm tra `sudo systemctl status mysql`; `Access denied`: kiểm tra host 127.0.0.1/user/mật khẩu.
- `ER_TABLE_EXISTS_ERROR`: không import đè database đã có dữ liệu. `Unknown column updated_at`: DB cũ cần migration có backup hoặc tạo DB DEV mới.
- `npm ci` fail: kiểm tra Node 24 và lockfile. Không chạy `npm audit fix --force` trên nhánh nhóm.
- **Không mở port Express cho Internet:** legacy `/api/payment`, `/api/orders`, public `/uploads` và upload PDF an toàn chưa được xử lý. Chỉ test local.
- GitHub Actions Ubuntu/MySQL kiểm thử kết nối DB, đăng ký/đăng nhập/refresh và bài hỏi đáp trên dữ liệu giả; không chứng minh PDF, thanh toán, bảo mật hoặc uptime.

## Kiểm tra PASS
1. `doctor.sh` PASS, import SQL trên DB trống.
2. Health API 200 và trang React hiển thị.
3. GitHub Actions Ubuntu 24.04 + MySQL 8 PASS trên exact PR HEAD.
4. Máy Ubuntu của nhóm: sau khi chạy, gửi terminal kết quả để xác thực thật; CI không thay thế kiểm thử laptop.

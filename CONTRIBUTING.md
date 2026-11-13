# Hướng dẫn đóng góp — Mini Study Network

## Quy trình hợp tác GitHub
1. Sync `main`: `git switch main && git pull origin main`.
2. Tạo nhánh độc lập: `git switch -c feat/post-detail` (ví dụ).
3. Chỉ sửa file đúng phạm vi nhiệm vụ; commit rõ ràng (`feat(posts): add post detail`, `fix(auth): ...`).
4. Push branch và mở **Pull Request tới `main`** (Draft nếu chưa hoàn thành).
5. Tự review diff; đảm bảo CI và test case phù hợp; nhờ tối thiểu 1 thành viên review (đề xuất quy trình, chưa được enforce trên GitHub).
6. Chỉ merge khi đã review và các lỗi nghiêm trọng được xử lý; cập nhật nhánh trước khi giải quyết conflict. **Không force push main**.

## Phân chia công việc / tránh đè source
- Mỗi người/AI dùng branch riêng. Không dùng chung một working branch cho nhiều AI đồng thời.
- Giao nhiệm vụ theo module hoặc luồng nghiệp vụ: Auth, Posts/Comments, Profiles, Documents/Payments, QA/Docs.
- Nếu hai PR chạm cùng file thì thống nhất thứ tự merge; rebase/merge cập nhật từ `main` trên branch riêng và giải quyết conflict tại đó.
- Chưa có CODEOWNERS hoặc branch-protection; thành viên sở hữu quyền admin cần thiết lập trên GitHub nếu muốn bắt buộc review.

## Chuẩn nghiệm thu trong PR
- Ghi lý do, yêu cầu `FR-xx`, ảnh/demo nếu thay đổi giao diện, lệnh kiểm tra và kết quả.
- Đề cập schema/API compatibility, rủi ro và hướng rollback.
- Không ghi secret, không đưa node_modules / dist / uploads vào commit.
- Khi có lỗi bảo mật/chi trả sai, ưu tiên khóa luồng nguy hiểm và mở issue trước khi mở rộng feature.

## Phạm vi đồ án
SRS và Roadmap trong `docs/` là baseline **DRAFT** để nhóm thảo luận. Không tự thêm chat realtime, mạng lưới bạn bè, thanh toán production hay ví rút tiền ngoài phạm vi đã duyệt.

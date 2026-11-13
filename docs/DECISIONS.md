# Decision Log — các điểm cần nhóm thống nhất
**DRAFT**. Không suy diễn mục chưa chốt thành quyết định được duyệt.

| ID | Câu hỏi | Đề xuất hiện tại | Trạng thái |
|---|---|---|---|
| ADR-001 | Tên chính thức đề tài | Mini Study Network — Mạng xã hội học tập sinh viên | PROPOSED |
| ADR-002 | Ai xem được feed | Guest được đọc nội dung public, login cho thao tác ghi | PROPOSED |
| ADR-003 | Phạm vi tài liệu | **MVP chỉ chia sẻ miễn phí**; paid-doc phần mở rộng, **DOC-01 = upload PDF trực tiếp** (Human A đã chốt 2026-10-17) | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-004 | Thanh toán đồ án | **Option B** — VNPay Sandbox DEFERRED, không phải điều kiện MVP; bật lại cần review riêng | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-005 | File storage | Upload PDF website **đã chốt về mặt sản phẩm**; nơi lưu trữ và chính sách truy cập vẫn PROPOSED. Không dùng URL tĩnh công khai cho file chưa được phép. | PRODUCT CHOICE CONFIRMED; technical design OPEN |
| ADR-006 | Quy trình nhóm | Mỗi thành viên/AI branch riêng, PR review trước merge | PROPOSED |
| ADR-007 | DB strategy | Dùng migration có kiểm soát, không chạy alter trong production | PROPOSED |
| ADR-008 | Xác minh sinh viên | Chưa có yêu cầu cụ thể; không tuyên bố đã verify | OPEN |
| ADR-009 | Phân công, deadline, tiêu chí chấm | Cần nhóm và giảng viên cung cấp | OPEN |
| ADR-010 | DOC-01: phương thức chia sẻ tài liệu miễn phí | **Phương án B: upload PDF trực tiếp vào website**, không chỉ dán external URL; dung lượng/giới hạn số file cần duyệt riêng | CONFIRMED Human A (2026-10-17); detailed design DRAFT |
| ADR-011 | Quyền xem / tải PDF miễn phí | **Guest được xem danh sách, tiêu đề, mô tả; phải đăng nhập mới tải PDF**. Sinh viên đã đăng nhập được tải tài liệu miễn phí còn active | CONFIRMED Human A (2026-10-18); triển khai/QA chưa thực hiện |
| ADR-012 | Giới hạn upload PDF MVP | **Tối đa 10 MiB = 10.485.760 byte (bao gồm biên); 1 PDF duy nhất/bài tài liệu**. Từ chối 0 byte, sai loại, >10 MiB hoặc nhiều file | CONFIRMED Human A (2026-10-18); triển khai/QA chưa thực hiện |
| ADR-013 | Xuất bản PDF sau upload | **Phương án A**: PDF tự chuyển `active`, xuất hiện ngay khi kiểm tra kỹ thuật và lưu thành công; không chờ Admin duyệt. Admin được ẩn/xóa vi phạm sau đăng; file ẩn/xóa phải chặn tải trực tiếp | CONFIRMED Human A (2026-10-18); code/QA NOT RUN |
| ADR-014 | Ngân sách vận hành cho nhóm sinh viên | Ưu tiên chi phí thấp, không để chi phí phình to; 0đ phí dịch vụ định kỳ là mục tiêu ĐỀ XUẤT chứ chưa phải ngân sách được phê duyệt | COST CONSTRAINT CONFIRMED Human A (2026-10-18); budget/provider PROPOSED |
| ADR-015 | Hình thức triển khai bắt buộc | Website phải có **link HTTPS công khai để giảng viên truy cập bất kỳ lúc nào**, không phụ thuộc laptop sinh viên đang bật; không suy diễn SLA 100% | CONFIRMED Human A (2026-10-18); provider/hosting PROPOSED |

## Decision evidence — 2026-10-17
Human A explicitly chose: "Chốt phương án B: VNPay Sandbox là chức năng mở rộng. Ưu tiên mạng xã hội và chia sẻ miễn phí." This approves the **product priority only**, not full SRS, detailed upload method, payment security, G0/G1, or teammate acceptance.

**Implementation impact:** FR-01..FR-12 proposed MVP; FR-13/14 and PAY-01/02 DEFERRED; SEC-03 must deny unsafe payment routes and paid resources before demo. See [MVP_SCOPE.md](MVP_SCOPE.md).

**DOC-01 decision (Human A, 2026-10-17):** “B — Upload tài liệu trực tiếp, trước mắt giới hạn PDF và kích thước file phù hợp.” Không tự coi 10 MB hay số file/bài là đã phê duyệt. Tham khảo [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md). Các quyết định tiếp theo: ai được xem/tải PDF, giới hạn dung lượng cuối, chính sách duyệt/xóa tài liệu.

Khi chốt quyết định: bổ sung ngày, người phê duyệt, phương án chọn và hệ quả tới SRS/schema/API. Tránh thay đổi âm thầm trong code.

## ADR-011 — Evidence and scope (2026-10-18)
- **Human A decision:** chấp nhận quy tắc guest xem danh sách/tiêu đề/mô tả tài liệu, nhưng bắt buộc login để tải PDF.
- **In scope:** metadata tài liệu miễn phí công khai (active); guest không được truy cập bytes PDF, file path, storage key, public static URL; unauthenticated download returns 401 from backend. Authenticated active users may download free public PDFs; post status and moderation checks still apply.
- **Not decided by this ADR:** guest đọc tất cả bài hỏi đáp/thảo luận (ADR-002), xác minh email trường, PDF inline preview, giới hạn dung lượng/số file, storage provider.
- **Reference:** [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md); SRS FR-11; test IDs T-DOCFREE-01..06. Human B/instructor and complete SRS sign-off remain pending.

## ADR-012 — PDF upload maximum size and file count (2026-10-18)
- **Human A confirmed:** 10 MiB PDF upload limit and one PDF attachment per document post. 1 MiB = 1,048,576 bytes; the inclusive maximum is **10,485,760 bytes**. This is not decimal 10 MB.
- **Functional bounds:** accept valid nonempty PDF of size 1..10,485,760 bytes; reject 0 bytes, non-PDF, >=10,485,761 bytes or more than one file in one request. Client prevalidation improves UX; **backend enforcement is mandatory**.
- **One file per post** is a business constraint; an optional post-edit replacement/versioning workflow is **NOT APPROVED** by this decision. New post requires exactly one PDF and valid metadata.
- **Storage, quotas per user, retention, moderation, deployment provider:** still OPEN. Keep these proposals separate from approved limits.
- **Source/test status:** Current source does not implement PDF upload; no runtime tests performed. See [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md), [TEST_PLAN.md](TEST_PLAN.md), and Task DOC-02/03/04.
- **Historical note:** At the time ADR-011 was written the 10 MiB/one-file caps were proposals. They are confirmed later by **ADR-012**; don't revise old approvals retroactively.

## ADR-013 — Publish immediately after successful upload (2026-10-18)
- **Human A selected option A:** newly uploaded FREE PDF appears publicly as `active` immediately after required technical checks, protected file storage and DB commit succeed. **No manual admin approval queue** in MVP.
- Admin may hide/delete violating PDFs after publication. Hidden/deleted content disappears from public metadata, and even authenticated download requests must be denied (including the original uploader). Server-side post status must be checked on each download.
- Invalid, too large, interrupted, failed-to-store or failed-to-commit uploads must **not** be published; no orphaned public file. This choice does not waive safe content validation.
- **Not decided by this choice:** user report/flag workflow, appeals/unhide, detailed moderation UI, storage/provider, scanning implementation, university verification or general feed Guest access.
- **Engineering evidence:** [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md), tests `T-PUBLISH-01..06` in [TEST_PLAN.md](TEST_PLAN.md). Existing source is not yet implementing/QA-verifying this flow.

## ADR-014 — Student budget guardrail (2026-10-18)
- **Confirmed user constraint:** This is a two-person student course project; hosting, file storage, database and infrastructure costs **must be kept minimal and should not expand unnecessarily**.
- **Proposal for approval, NOT a spending authorization or provider selection:** target **zero recurring paid service fees** during development/classroom demo by running Node/Express, MySQL and protected PDF file storage on a teammate's local computer. This excludes existing electricity/internet/hardware costs; does not guarantee 24/7 internet availability.
- **Cloud alternatives, only if remotely accessible demo is needed:** Cloudflare R2 Standard currently lists free 10 GB-month, 1M Class A and 10M Class B operations monthly; usage over quotas can be billed and R2 requires account activation. Supabase Free currently lists 1 GB storage and usage/egress caps; no guarantee of always-on public hosting. Figures must be checked at the time of onboarding and **storage is not a free backend/MySQL host**.
- **Require explicit human approval** before entering payment method, enabling a billed service, buying domains/hosting, or opting into automatic paid overages. No recurring paid dependency is authorized by the user statement.
- **Security constraints remain non-negotiable on local storage:** PDFs outside Express static `/uploads`, authenticated streaming download, reject hidden/deleted and deferred paid files, bounded validated uploads, backups of sanitized demo data, no secrets in Git.
- **Technical storage provider/retention choice OPEN:** the local-first approach is a recommendation, **NOT final ADR approval**. Investigate portability of a `DocumentStorage` interface if/when remote hosting becomes a hard requirement; avoid unnecessary engineering before demo requirements are known.
- **Research checked:** https://developers.cloudflare.com/r2/pricing/ ; https://supabase.com/docs/guides/platform/billing-on-supabase ; https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions (not suitable to assume deployed functions persist local uploads).
- **Next question:** does the group require a publicly accessible online demo or just a demo running on one student's laptop/classroom network?

## ADR-015 — Instructor-accessible public online website (Human A CONFIRMED, 2026-10-18)
- User explicitly requires public online website link usable at arbitrary times, without either teammate's laptop running. Local-only demo is **not a valid final delivery**. The **low-cost/no-cost-inflation constraint** ADR-014 remains applicable.
- Need reachable HTTPS frontend and backend, persistent relational database and persistent **private** PDF storage across redeploy/restart; include operational recovery/monitoring. This is a practical availability requirement, **not** an unconditional 100% uptime SLA from a free provider.
- **No provider chosen:** candidate Vercel Hobby (React+Express Functions), TiDB Cloud Starter MySQL-compatible (test Sequelize/schema first), and Vercel Blob Private (authenticated direct browser upload) is **PROPOSED, NOT APPROVED**. See [ONLINE_DEPLOYMENT_OPTIONS.md](ONLINE_DEPLOYMENT_OPTIONS.md).
- Upload: Vercel Functions' 4.5 MB request payload limit **cannot** accept a 10 MiB PDF multipart body. If Vercel chosen, browser uploads directly to private storage using short-lived authenticated permission; backend verifies actual file bytes/size/type, ownership and database state **before** activating post. Login-required download streams via backend and checks latest active/hidden status. Free quota and service outage remain risks.
- No purchase, payment card, cloud service creation, deployment or 24/7 performance claim authorized. Academic report and team review still pending.

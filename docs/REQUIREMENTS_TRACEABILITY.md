# Requirements Traceability — Khung FR → thiết kế → test
**DRAFT**, chưa phải nghiệm thu. `UC TBD` là use case chưa được đặc tả; các test trong TEST_PLAN đang ở trạng thái NOT RUN.

| FR | Module | UC Spec | API/design baseline | Test mapping | Mức độ hoàn thiện |
|---|---|---|---|---|---|
| FR-01 | Auth/register | UC TBD | POST /auth/register | T-AUTH-01/02 | Có source, chưa QA |
| FR-02 | Auth/session | UC TBD | login/refresh/logout | T-AUTH-01/02 | Có source, chưa QA |
| FR-03 | Feed | UC TBD | GET /posts | T-FEED-01 | Route auth sai kỳ vọng |
| FR-04 | Posts | UC TBD | POST /posts | T-POST-01 | Có source, chưa QA |
| FR-05 | Posts ownership | UC TBD | PUT/DELETE /posts/:id | T-POST-01/02 | BE, FE thiếu |
| FR-06 | Post detail/privacy | UC TBD | GET /posts/:id; posts DTO | T-DOC-01 + T-POST-01 | FE stub, privacy P0 |
| FR-07 | Comments | UC TBD | GET/POST/DELETE /comments | T-COMMENT-01/02 | BE, FE thiếu |
| FR-08 | Likes | UC TBD | POST /likes, GET /likes/count | T-LIKE-01 | BE, FE thiếu |
| FR-09 | Search | UC TBD | GET /posts params | T-POST-03 | BE một phần |
| FR-10 | Profile | UC TBD | GET /users/:id + PUT | T-PROFILE-01 | FE stub |
| FR-11 | Free documents **MVP** | UC TBD | DOC-01 PDF direct upload; ADR-011 Guest metadata/login download; **ADR-012 1 PDF/post and size 1..10,485,760 bytes** CONFIRMED; schema/routes proposed | T-UP-01..10; **T-UP-LIM-01..06**; T-DOCFREE-01..06 | Source URL-only, upload and download unimplemented / untested |
| FR-12 | Admin moderation | UC TBD | **ADR-013:** Admin can hide/delete published PDF violations; exact moderation endpoint DRAFT | T-ADMIN-01; T-PUBLISH-04..06 | No verified moderation workflow |
| FR-13 | Paid documents **DEFERRED** | UC TBD | POST /orders, payment callbacks | T-PAY-01/02/03 | Optional extension; SEC-03 shutdown required first |
| FR-14 | Paid access **DEFERRED** | UC TBD | document_access, download TBD | T-DOC-01/02 | Optional extension; paid URLs must not leak |

Trước khi ghi `VERIFIED`: link đầy đủ UC spec/diagram, source commit, testcase PASS và reviewer sign-off.

**Reference for FR-11:** [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md) defines approved guest metadata and authenticated download; no code/test PASS yet.

**ADR-012 acceptance boundary:** one valid PDF per new document post; size 10,485,760 inclusive; 10,485,761 rejected. See [DECISIONS.md](DECISIONS.md) and [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md). All T-UP-LIM tests NOT RUN.

**ADR-013 for FR-11/12:** valid uploaded PDF becomes `active` immediately after validation+storage+DB success, and Admin can hide/delete after publication; hidden/deleted cannot be downloaded. Acceptance T-PUBLISH-01..06 (NOT RUN); see [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md) and [DECISIONS.md](DECISIONS.md).

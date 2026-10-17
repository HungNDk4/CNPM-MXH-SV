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
| FR-11 | Free documents **MVP** | UC TBD | **PDF direct upload DOC-01 confirmed**; proposed POST /documents and GET /documents/:id/download (design pending) | T-DOC-01/02; T-UP-01..10 | Source URL-only; backend upload NOT implemented |
| FR-12 | Admin moderation | UC TBD | admin endpoints TBD | T-ADMIN-01 | Cần thiết kế |
| FR-13 | Paid documents **DEFERRED** | UC TBD | POST /orders, payment callbacks | T-PAY-01/02/03 | Optional extension; SEC-03 shutdown required first |
| FR-14 | Paid access **DEFERRED** | UC TBD | document_access, download TBD | T-DOC-01/02 | Optional extension; paid URLs must not leak |

Trước khi ghi `VERIFIED`: link đầy đủ UC spec/diagram, source commit, testcase PASS và reviewer sign-off.

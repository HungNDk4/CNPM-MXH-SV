# Research & Skills Backlog — Evidence-based
**DRAFT, 2026-10-17.** Research is scoped to the package major locked by the repo; this queue is NOT a claim that extra plugins or tooling have been installed.

| ID | Skill/topic | Source starting point | When needed | Expected output |
|---|---|---|---|---|
| RS-01 | Requirements engineering & UCs | SRS; templates; ISO/IEC 25010 concepts as applicable | P1 | traceable functional/NFR specs, UC flows |
| RS-02 | UML / database normalization | schema.sql, Sequelize v6 docs | P2 | ERD cardinalities, activity/sequence |
| RS-03 | React 18 component/Hook patterns | https://18.react.dev/reference/react | P4 | tested responsive components |
| RS-04 | Vite 5 / Tailwind 3 / Router 6 | https://v5.vite.dev/guide/ ; https://v3.tailwindcss.com ; https://reactrouter.com/docs/en/v6 | P4 | source-consistent UI behavior |
| RS-05 | TanStack Query 5 / Zustand 4 / Axios 1 | https://tanstack.com/query/v5/docs/framework/react/overview ; https://zustand.docs.pmnd.rs ; https://axios-http.com/docs/interceptors | P4 | cache/state/token integration |
| RS-06 | Express 4 errors, JWT, roles, validation | https://expressjs.com/en/advanced/best-practice-security/ | P3/4 | secure route contracts + tests |
| RS-07 | Sequelize 6/MySQL transaction & constraints | https://sequelize.org/docs/v6/other-topics/transactions/ | P2/3 | migration plan & consistent write paths |
| RS-08 | OWASP API Security, BOLA, field-level access | https://owasp.org/API-Security/ | P3 | threat model, negative tests |
| RS-09 | VNPay Sandbox IPN and response validation | https://sandbox.vnpayment.vn/apis/docs/ | P3/5 | idempotent payment design and replay tests |
| RS-10 | Testing: Vitest, React Testing Library, Supertest, Playwright | Official docs; validate Node/Vite peer deps | P3/6 | test architecture proposal, new tools in separate PR |
| RS-11 | Git worktrees & review workflows | https://git-scm.com/docs/git-worktree ; https://docs.github.com/en/pull-requests/reference/stacked-pull-requests | Always | safe branch and handoff playbook |

## Research evidence template
```text
Research ID:
Checked date:
Code version / lockfile:
Primary official sources:
What is directly documented:
How it applies to our source:
Risk/unsupported assumption:
Decision needed / status: PROPOSED | APPROVED
Tests needed to verify:
```
Plan to open dedicated research/ADR PR when a dependency needs deeper investigation. Cite source URL and matching major version; do not cargo-cult newer APIs.

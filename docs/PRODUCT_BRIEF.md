# Product Brief: SolEmpleo

Version 1.0 (baseline) · 2026-11-09 · Owner: Murat Çay

## 1. Vision
SolEmpleo is a simple, free job-application tracker, live at solempleo.work. It is also a **reference implementation**: it answers *"what must the smallest web app have to deserve production?"* and sets the production-grade baseline for new projects.

- The domain stays small. Scope grows only in quality and non-functional requirements, never in domain features.
- "Smallest" means today's standard, not a bare minimum. There is no MVP cut: this baseline is the final product.

## 2. Personas
| Persona | Goal | Today's pain |
|---|---|---|
| **Job seeker** (registered user) | Track own applications, see progress at a glance, own their data | No password reset, account deletion or data export; some flows break (edit on refresh, stale data) |
| **Evaluator** (demo visitor, code reviewer) | Judge quality through the live demo and the public repo | The shared demo account is writable; gaps are visible in the code |

## 3. Goals and success measures
| Goal | Measure |
|---|---|
| Production-grade baseline | All Must FR/NFRs below pass their acceptance criteria; release QA and security review signed off |
| Trustworthy for real users | Users can do the full account lifecycle (verify, reset, change, export, delete) themselves |
| Reusable reference | The NFR list and its checks (CI, runbooks) can be copied to a new project without changes to their wording |

## 4. Scope
**In scope:** the current features (accounts, job CRUD, search/filter/sort/pagination, statistics, profile, demo), fixed and hardened, plus the account lifecycle, privacy basics and operational quality.

**Out of scope (Won't, this version):** new domain features (reminders, notes, attachments, sharing), i18n/other languages, active-session list, CSV export, delayed (grace-period) account deletion, deleting inactive accounts, an uptime SLO, high availability across several servers, paid tiers.

**Later version (planned, not in this baseline):** MFA (TOTP) and OAuth/social login.

## 5. Constraints and assumptions
- Free product, no revenue; running cost stays near zero (free tiers wherever possible).
- Expected scale: fewer than 100 active users.
- Stack and hosting are fixed: Node.js/Express + MongoDB Atlas M0, Angular, Docker Swarm on Hetzner, GitHub Actions. A merge to `main` deploys to production.
- No real user data in production today, so data-format fixes need no data migration.
- The email provider is chosen in the architecture step (free tier, EU or GDPR-compliant).
- English only (en-US formats).

## 6. Functional requirements
Priority: M = Must, S = Should. Source: O = owner decision 2026-11-09, E = existing feature.

### Accounts and sessions
| ID | Requirement | Pri | Src |
|---|---|---|---|
| FR-001 | Register with name, email and password | M | E |
| FR-002 | Verify email before first login | M | O |
| FR-003 | Log in with email and password | M | E |
| FR-004 | Log out | M | E |
| FR-005 | Log out of all devices | S | O |
| FR-006 | Reset a forgotten password by email | M | O |
| FR-007 | Change password | M | O |
| FR-008 | View and edit profile (name, last name, location) | M | E |
| FR-009 | Change email address | M | E |
| FR-010 | Delete account | M | O |
| FR-011 | Export own data (JSON) | M | O |
| FR-012 | Route access and navigation | M | E |
| FR-013 | Read-only demo | M | O |

### Job applications
| ID | Requirement | Pri | Src |
|---|---|---|---|
| FR-020 | Create an application | M | E |
| FR-021 | List with search, filter, sort and pagination | M | E |
| FR-022 | View an application | M | E |
| FR-023 | Edit an application | M | E |
| FR-024 | Delete an application | M | E |
| FR-025 | Ownership: users reach only their own applications | M | E |
| FR-026 | Statistics | M | E |

### Privacy
| ID | Requirement | Pri | Src |
|---|---|---|---|
| FR-030 | Privacy policy page | M | O |
| FR-031 | Unverified accounts are deleted after 7 days | M | O |

### Acceptance criteria
**FR-001 Register**
- Given a new email, when I submit valid data, then an unverified account is created, a verification email is sent, and I see "check your email".
- Given an email that already exists (in any letter case or with spaces around it), when I register, then I see the same "check your email" response, no second account is created, and the existing owner gets an "account already exists" email.
- Given emails, then they are stored trimmed and lowercased; `A@x.com` and `a@x.com` are the same account.
- Given a password, then the rules in NFR-006 apply.

**FR-002 Verify email**
- Given a verification link under 24 h old and not used yet, when I open it, then the account is verified and I can log in.
- Given an expired or used link, when I open it, then I see an error and can request a new link.
- Given an unverified account, when I log in with the correct password, then login is refused with a message that offers to resend the link. Resending is rate limited (NFR-007).

**FR-003 Log in**
- Given a verified account and the correct password, when I log in, then a session lasting 1 day starts and I land on the dashboard (or on the return URL, see FR-012).
- Given a wrong password or an unknown email, then I see the same generic error, and the response time does not reveal which one it was (NFR-007).

**FR-004 Log out**
- Given I am logged in, when I log out (POST), then the session is revoked on the server and the cookie is cleared; reusing the old token returns 401.
- Then no data from my session stays visible in the tab (see FR-021, FR-026).

**FR-005 Log out of all devices**
- Given sessions on two devices, when I choose "log out of all devices", then both sessions return 401 on their next request.

**FR-006 Reset password**
- Given any email, when I request a reset, then I see the same response whether or not an account exists; for an existing, verified account a link valid for 1 h is sent.
- Given a valid link, when I set a new password (NFR-006), then the link stops working, all sessions are revoked, and a "password changed" email is sent.

**FR-007 Change password**
- Given I am logged in, when I enter my current password correctly and a valid new one, then the password changes, my other sessions are revoked, and a "password changed" email is sent.
- Given a wrong current password, then nothing changes.

**FR-008 Profile**
- Given I am logged in, when I open my profile, then I see my data; if loading fails, I see a load error (not an update error).
- When I save valid changes, then they are stored and shown at once.

**FR-009 Change email**
- Given I enter my current password and a new email, then a verification link is sent to the new address and a notice to the old one; the email changes only after the new address is verified.
- Given the new email is already used, then I see the same response as for a free one, and no change happens.

**FR-010 Delete account**
- Given I confirm with my password, when I delete my account, then my user record and all my applications are deleted at once, every session is revoked, and a confirmation email is sent.
- Then deleted data leaves the backups within the backup retention period (NFR-005, NFR-010).

**FR-011 Export data**
- Given I am logged in, when I export, then I download one JSON file with my profile and all my applications (including timestamps).
- Then the file never contains the password hash, tokens or internal fields.

**FR-012 Route access and navigation**
- Given I am a guest, when I open a protected URL, then I am sent to login, and after login I return to that URL.
- Given I am logged in, when I open login or register, then I am sent to the dashboard.
- Given my session has expired, when any API call returns 401, then I am sent to login.
- Every page has its own title.

**FR-013 Read-only demo**
- Given the demo login, then I see seeded sample data and a "demo mode" banner.
- When I try any write (job create/edit/delete, profile, password, email, delete account, export), then the API returns 403, and the UI does not show these actions.
- Given a deploy, then the demo data is seeded again in an idempotent way (same result each run).

**FR-020 Create application**
- Given valid fields (company, position, status, job type, location, company website, job posting URL; limits as in `backend/shared/schemas/job.schemas.js`), when I save, then the application is stored and appears in the list and statistics at once.
- Given text with special characters (for example `R&D`, `<`, `"`), then it is stored and shown exactly as typed.

**FR-021 List**
- Given my applications, then I can search company and position (case-insensitive; special characters match literally), filter by status and job type, sort a–z, z–a, newest or oldest, and page through them (10 per page by default, at most 100).
- Then the list state is in the URL, so reload and back/forward restore it.
- Given I log out and another user logs in in the same tab, then none of my applications are shown to them.

**FR-022 View** — Given my application ID, when I open its URL directly, then I see its details.

**FR-023 Edit**
- Given my application, when I open its edit URL directly or reload the page, then the form is filled with the current data.
- When I save valid changes, then the list, detail and statistics show them at once.

**FR-024 Delete** — Given my application, when I confirm in an accessible dialog (NFR-011), then it is deleted and leaves the list and statistics at once.

**FR-025 Ownership** — Given another user's application ID, when I read, edit or delete it, then I get 404 and nothing changes.

**FR-026 Statistics**
- Given my applications, then I see counts per status and applications per month for the last 6 months (months with no data show 0).
- While loading I see a loading state; on error I see an error message and the spinner stops; with no data I see an empty state.
- Derived numbers (for example averages) are computed from the real data, not from fixed constants.

**FR-030 Privacy policy**
- A privacy page, linked from the footer and the register form, states: what data is stored and why, processors (hosting, database, email provider), retention periods (NFR-010), user rights and how to use them (export, delete, contact), and the contact address.

**FR-031 Unverified-account cleanup** — Given an account still unverified 7 days after registration, then a scheduled job deletes it.

## 7. Non-functional requirements
| ID | Area | Requirement (measurable) | Pri |
|---|---|---|---|
| NFR-001 | Performance (API) | Read endpoints: p95 < 500 ms at expected load, measured on production-like infrastructure; password-hashing endpoints are excluded | M |
| NFR-002 | Performance (web) | Lighthouse mobile Performance ≥ 90; LCP < 2.5 s; initial JS ≤ 300 KB gzip | S |
| NFR-003 | Capacity | Works for < 100 active users within Atlas M0 limits (512 MB storage); an alert fires at 80 % of storage | M |
| NFR-004 | Availability | Best effort, no SLO. Deploys do not take the app down (rolling update, ≥ 2 backend replicas); the container health check calls the HTTP `/health` endpoint | M |
| NFR-005 | Backup | Automated daily, encrypted database backup stored outside the database provider; kept 30 days; restore procedure documented and tested at least once. No RPO/RTO commitment | M |
| NFR-006 | Security: authentication | Passwords: 12–128 characters, no composition rules, rejected if on a local list of common or breached passwords (no external call), no forced periodic change; stored with bcrypt. Session: httpOnly, Secure, SameSite cookie; token and cookie lifetime both 1 day; tokens can be revoked on the server (logout, password change/reset, account deletion) | M |
| NFR-007 | Security: abuse | Rate limits apply per real client IP on auth and email-sending endpoints; register, login, reset and resend responses do not reveal whether an account exists, by content or by timing | M |
| NFR-008 | Security: input and output | Every API input is validated by a schema; input is stored as entered (no input encoding); output is encoded by the frontend framework; user input never reaches a database query operator or regex unescaped | M |
| NFR-009 | Security: supply chain and secrets | CI fails on High/Critical vulnerabilities (image and dependency scan); no secrets in the repo or images; production secrets only as Docker secrets | M |
| NFR-010 | Privacy (GDPR/KVKK baseline) | Only one strictly necessary cookie (no consent banner needed); data minimisation; application logs kept 30 days with email and IP masked; backups kept 30 days; export and deletion per FR-010/011; unverified accounts deleted after 7 days | M |
| NFR-011 | Accessibility | WCAG 2.2 AA. Automated axe check finds no serious or critical issues on any page (in CI); register, login, job CRUD and account actions can be done by keyboard alone; dialogs have a dialog role and trap focus; status messages use `aria-live` | M |
| NFR-012 | Browser and device support | Last 2 versions of Chrome, Firefox, Safari, Edge; iOS Safari and Android Chrome; usable from 360 px width without horizontal scroll | M |
| NFR-013 | Consistency | After a successful write, the same user's next read returns the new data (read-your-writes) | M |
| NFR-014 | Error handling | Every API error, including 404, is JSON with one consistent shape; every data screen has loading, error and empty states | M |
| NFR-015 | Maintainability | Lint and format checks pass in CI; backend coverage thresholds stay as they are or rise; frontend critical services and flows have real tests with coverage reported in CI (threshold set in the engineering standards); no dead code | M |
| NFR-016 | Deployability | Database indexes are created by an idempotent script that is part of the repo; the production frontend nginx config is in the repo; rollback steps are documented; version bumps only by the workflow | M |
| NFR-017 | Email delivery | Transactional emails (verification, reset, notices) are sent through the chosen provider with SPF, DKIM and DMARC set for the sending domain; links are single-use and expire (24 h verification, 1 h reset) | M |
| NFR-018 | Observability | Structured logs with a request ID; error tracking; an external uptime check with alerting (no target, see NFR-004); details set in the observability step | M |
| NFR-019 | Language | English UI only, en-US date and number formats | M |

## 8. Open questions
- Email provider (decided during architecture design, recorded as an ADR).
- Backup storage target and how backups are encrypted (decided during architecture design, recorded as an ADR).

## 9. Traceability
The columns are filled in as the work progresses: Design from the architecture docs and ADRs, Tickets from the issue tracker, Tests from the test plan.

| Req | Design | Tickets | Tests |
|---|---|---|---|
| FR-001 … FR-031 | TBD | TBD | TBD |
| NFR-001 … NFR-019 | TBD | TBD | TBD |

## 10. Change log
| Date | Change | Why | Approved by |
|---|---|---|---|
| 2026-11-09 | v0.1 draft | Discovery interview | — |
| 2026-11-09 | v1.0 baseline: MFA and OAuth moved to a later version | Owner sign-off | Owner |

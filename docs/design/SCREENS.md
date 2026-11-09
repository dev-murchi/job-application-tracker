# Screens: account lifecycle, privacy, demo mode

Scope: new screens and the new parts of existing screens from the product brief v1.0. The current UI stays as it is. Flows: [USER_FLOWS.md](USER_FLOWS.md).
Visual language: reuse what exists — the auth shell (`features/auth/auth.html`: gradient, logo bar, centered `form-container` card, footer), `card` panels from the profile page, `app-input`, `app-submit-button`, `app-loading-spinner`, `app-alert`, the color tokens (`--color-brand-*`, `--color-status-*`, `--color-text-*`), and the delete modal look from job detail.
Wireframes are low fidelity: they show order and content, not exact styling.

### Existing frontend this design builds on (checked in the code and in the running dev app)
| Area | Today | Impact on this design |
|---|---|---|
| Forms | `app-input` (`shared/components/form-items/input`) renders label, input and generated errors ("{Label} is required", "{Label} must be at least N characters long."), shown once the field is dirty. No hint text, no show-password toggle, no `aria-invalid` / `aria-describedby`. | Extend `app-input` (hint, show-password toggle, ARIA links, server error message) instead of a new component. Keep the generated message style. |
| Submit | `app-submit-button` is disabled while the form is invalid; no busy state. | Keep the disabled-until-valid pattern; add a busy state (spinner + label). |
| Feedback | `AlertService` toasts (`success`, `error`, `warn`) for every result, e.g. "Login failed! Please check your credentials." | Existing forms keep their toasts. New screens use inline status where the user must read or act on it. |
| Register | Fields: first name, last name, email, password, location. Password: min 8 + upper/lower/digit pattern. On success: toast "Registration successful!" and go to login. | Password rules change to NFR-006 (12–128, no composition). Success goes to S-02 instead of login. |
| Login | Generic error toast. "Forgot Password?" is `href="#"`. Demo button logs in with fixed demo credentials. | Add the unverified notice and a real forgot link. |
| Logout | In the topbar dropdown; toast "You have been logged out." and go to `/` (landing). | Log-out-all and account deletion end the same way (landing + toast). |
| Profile | Header card (avatar, name, email, location), then "Profile Information" with an **Edit Profile** button (icon only below `sm`). "Email Address" is an editable field and is sent with the profile update. Load failure shows "Something went wrong...". At 360 px a long email in the header is clipped, not wrapped. | Email becomes read-only there and leaves the update payload (FR-009 needs password + verification). Emails shown in new cards wrap (`break-all`); the header gets the same fix. |
| Navigation | Sidebar: Dashboard, Add Job, All Jobs, Statistics, with a bottom area holding **Collapse**. Profile and **Logout** are in the topbar dropdown (desktop) and the mobile menu. Dashboard "Quick Actions" has **Add Application**. Job list rows only link to detail; Edit and Delete are on job detail. | Defines which write actions demo mode hides (S-10). |
| Page titles | Only the first page after login gets its title; other dashboard pages and 404 show "Frontend" (dashboard routes set `data.title`, which is not applied). 404 has no `h1`. | New routes use the router `title`. The dashboard title gap belongs to FR-012, not to this design. |
| Demo user | A normal account with fixed credentials; `UserProfile` has no role or demo flag. Not seeded: in a fresh dev environment it must be registered by hand. Writes succeed today (e.g. creating a job returns 201). | The frontend needs a demo flag from the API (architecture step); seeding and the 403s come with FR-013. |
| Mobile menu | Drawer: nav items + Profile, **Logout** at the bottom. | "Add Job" is hidden here too in demo mode. |
| Routes | `/auth/*` has no guard today; FR-012's redirect of logged-in users is not built yet. Login always goes to `/` (no return URL). On a 401 the interceptor only marks the user as guest; it does not go to login. | Link-target pages sit outside `/auth` so they work either way. |
| Auth shell | `features/auth/auth.ts` is the parent component of the `/auth` route. Its bottom prompt ("Don't have an account? Register here" / "Already have an account? Login here") is set per route for login and register only; other routes get none. The logo is not a link. Login and register titles are `h2`; there is no `h1`. | Pages outside `/auth` (S-03, S-03b, S-06, S-11) need the shell as a shared layout (architecture step). New `/auth` routes need their own prompt entries. |
| Footers | Landing, auth shell and 404: "© 2025 Solempleo. All rights reserved." Dashboard layout has no footer. | Privacy link goes into these three footers and into S-07. |
| Theme | Light and dark via `body[data-theme]` and CSS tokens. | New screens use tokens only, checked in both themes. |
| Dialog | Job delete modal: blurred dark overlay + card (warning icon, title, text, **Cancel** / red confirm), closes on overlay click. No dialog role; on open, focus stays on the page behind it; no focus trap. | New dialogs reuse its look via one accessible dialog component. |

## 1. Screen inventory

| ID | Screen | Route | FR | Who | New / changed |
|---|---|---|---|---|---|
| S-01 | Register: privacy note | `/auth/register` | FR-001, FR-030 | Guest | Changed |
| S-02 | Check your email | `/auth/check-email` | FR-001, FR-002 | Guest | New |
| S-03 | Verify email (link target) | `/verify-email?token=…` | FR-002 | Anyone | New |
| S-03b | Confirm email change (link target) | `/confirm-email-change?token=…` | FR-009 | Anyone | New |
| S-04 | Login: unverified notice, forgot link, status messages | `/auth/login` | FR-002, FR-003, FR-006 | Guest | Changed |
| S-05 | Forgot password | `/auth/forgot-password` | FR-006 | Guest | New |
| S-06 | Set new password (link target) | `/reset-password?token=…` | FR-006 | Anyone | New |
| S-07 | Profile: Security, Your data, Delete account cards | `/profile` | FR-005, FR-007, FR-009, FR-011, FR-010 | User (not demo) | Changed |
| S-08 | Dialog: log out of all devices | on S-07 | FR-005 | User | New |
| S-09 | Dialog: delete account | on S-07 | FR-010 | User | New |
| S-10 | Demo banner + hidden write actions | dashboard layout | FR-013 | Demo user | Changed |
| S-11 | Privacy policy | `/privacy` | FR-030 | Anyone | New |
| — | Footer privacy link | landing, auth shell, 404 | FR-030 | Anyone | Changed |

Route notes:
- Link targets (S-03, S-03b, S-06) and `/privacy` live outside `/auth` and have no guest or auth guard, because a link can be opened while logged in or out (FR-012 will send logged-in users away from `/auth/*`).
- Every new route gets its own page title (FR-012): "Check your email", "Verify email", "Confirm email change", "Forgot password", "Set new password", "Privacy policy".

## 2. Shared patterns (apply to every screen below)

**Status messages.** Two kinds:
- Inline status inside the card or form: used on new screens when the user must read or act on it (verification notice, neutral "link sent", link invalid, form-level errors).
- Toast (`app-alert`, existing): short confirmations after an action that also changes the page (e.g. "Password changed"), and the existing login/register error toasts, which stay as they are.

**Standard error texts** (used where the screen says "standard errors"):
| Case | Text |
|---|---|
| Network / 5xx | "Something went wrong on our side. Please try again." + **Try again** |
| 429 | "Too many attempts. Please wait a few minutes and try again." |
| 401 on a logged-in screen | go to login (FR-012; today the user is only marked as guest) |

**Password field (new password).** `app-input` with a **Show** toggle, no confirm field (the toggle replaces it). Hint under the field: "12 to 128 characters. A few unrelated words make a strong password." Errors in the existing generated style: "Password must be at least 12 characters long." / "Password must be at most 128 characters long." Server-side error: "This password is too common. Choose a different one." (NFR-006). The same field replaces the current register password rules.

**Resend cooldown.** After any resend, the button is disabled for 60 s and reads "Resend in 0:59". The server rate limit (NFR-007) is the real control; the cooldown only prevents double clicks.

**Buttons.** As today, submit is disabled until the form is valid. While a request runs, the pressed button shows a spinner and a busy label ("Sending…", "Saving…"), stays disabled, and the form keeps its values.

**Empty state.** These screens are forms or messages, so most have no empty state; the few that do are listed.

## 3. Screens

### S-01 Register: privacy note (changed)

```
┌──────────── auth card (existing) ────────────┐
│ Create Your Account                          │
│ [ First Name ] [ Last Name ] (existing)      │
│ [ Email ]                    (existing)      │
│ [ Password            ] [Show]  (CHANGED)    │
│   12 to 128 characters. A few unrelated…     │
│ [ Location ]                 (existing)      │
│ (NEW) We use your data only to run your      │
│ account. See our Privacy policy ↗.           │
│ [ Create Account ]                           │
│ ──────────────────────────────────────────── │
│ Already have an account? Login here          │
└──────────────────────────────────────────────┘
 footer: © 2025 Solempleo. All rights reserved. · Privacy policy  (NEW link)
```
- The title "Create Your Account" becomes the page `h1` (today `h2`), so focus-on-page-change has a target.
- The privacy link opens in a new tab so the form is not lost; link text says so for screen readers ("Privacy policy (opens in a new tab)").
- It is an information note, not a consent checkbox (no consent needed, NFR-010).
- On success → S-02 with the typed email passed along (not in the URL). This replaces today's "Registration successful!" toast and redirect to login.

States: loading = button busy · error = field errors + existing "Registration failed!" toast (429 gets the standard 429 text) · success = go to S-02.

### S-02 Check your email (new)

```
┌──────────── auth card ───────────────────────┐
│ (mail icon)                                  │
│ Check your email                             │
│ We sent a verification link to               │
│ ana@example.com. The link works for 24 hours.│
│                                              │
│ Didn't get it? Check spam, or                │
│ [ Resend link ]   (cooldown: Resend in 0:59) │
│ (status area, aria-live)                     │
│ ──────────────────────────────────────────── │
│ Wrong address? Register again                │
│ Already verified? Log in                     │
└──────────────────────────────────────────────┘
```
- Same text whether the email was new or already registered (FR-001, NFR-007).
- The bottom prompt ("Wrong address? … / Already verified? …") is a new entry in the auth shell's per-route prompts.
- If the page is opened directly or refreshed (no email in memory): text becomes "If you just registered, we sent you a verification link." and Resend shows an email field.

States: loading = Resend busy · success = "If this address needs verifying, we sent a new link." · error = standard errors · empty = no email in memory (above).

### S-03 Verify email (new, link target)

```
Loading                     Success                       Link invalid
┌───────────────────┐  ┌──────────────────────────┐  ┌──────────────────────────────┐
│ (spinner)         │  │ (check icon)             │  │ (warning icon)               │
│ Verifying your    │  │ Email verified           │  │ This link has expired or     │
│ email…            │  │ Your account is ready.   │  │ was already used             │
│                   │  │ [ Log in ]               │  │ Enter your email and we'll   │
└───────────────────┘  └──────────────────────────┘  │ send a new link.             │
                                                     │ [ Email ]  [ Send new link ] │
                                                     │ (status, aria-live)          │
                                                     │ Already verified? Log in     │
                                                     └──────────────────────────────┘
```
- Auth shell look (gradient, logo, card, footer), as a shared layout outside `/auth`.
- Resending from Link invalid stays on this page: the form is replaced by the neutral status "If this address needs verifying, we sent a new link." and the cooldown starts.
- The token is read once, then removed from the address bar.
- If a logged-in user opens it, Success shows **Go to dashboard** instead of **Log in**.
- No token in the URL → same as Link invalid.

States: loading, success, link invalid (doubles as error for 400/404/410), error = standard errors + **Try again** (re-sends the same token).

### S-03b Confirm email change (new, link target)

Same layout as S-03.
- Loading: "Confirming your new email…"
- Success: "Email changed. You now log in with **new@example.com**." + **Go to profile** (logged in) or **Log in** (logged out).
- Link invalid: "This link has expired or was already used. Your email was not changed. To try again, go to your profile." + **Go to profile** / **Log in**. No resend form here (resend needs the password, which lives on S-07).

### S-04 Login (changed)

```
┌──────────── auth card (existing) ────────────┐
│ (NEW status area, aria-live, shown on arrival│
│  e.g. "Password changed. Log in with your    │
│  new password." / "Email verified. You can   │
│  log in now.")                               │
│ Welcome Back                                 │
│ [ Email ]                                    │
│ [ Password ] [Show]                          │
│                         Forgot password? →S-05│
│ ┌ (NEW) inline notice, only if unverified ──┐ │
│ │ Please verify your email first.           │ │
│ │ We sent a link when you registered.       │ │
│ │ [ Resend link ]  (cooldown)               │ │
│ │ (status: "New link sent. Check your inbox")│ │
│ └───────────────────────────────────────────┘ │
│ [ Login ]                                    │
│ [ Demo ]                                     │
└──────────────────────────────────────────────┘
```
- "Forgot password?" becomes a real link to S-05 (today it is `href="#"`).
- The password field gets the **Show** toggle too (no hint, no length rules on login).
- "Welcome Back" becomes the page `h1` (today `h2`).
- The arrival status area is new; it shows the result of a flow that ended on login (reset, verification).
- The unverified notice appears only after a correct password (FR-002), so it reveals nothing to someone without the password. It is inline, not a toast, because it holds a button. Resend uses the email already typed (no re-entry).
- Wrong password / unknown email: existing "Login failed! Please check your credentials." toast, unchanged.

States: loading = Login busy · error = existing toast + standard errors · unverified = notice above.

### S-05 Forgot password (new)

```
Form                                      Sent
┌──────────────────────────────────┐     ┌──────────────────────────────────────┐
│ Reset your password              │     │ Check your email                     │
│ Enter your account email and     │     │ If an account exists for             │
│ we'll send you a reset link.     │     │ ana@example.com, we sent a reset     │
│ [ Email ]                        │     │ link. It works for 1 hour.           │
│ [ Send reset link ]              │     │ [ Send again ] (cooldown)            │
│ ──────────────────────────────── │     │ ──────────────────────────────────── │
│ Remember it? Log in              │     │ Back to log in                       │
└──────────────────────────────────┘     └──────────────────────────────────────┘
```
- Same "Sent" text for every email, including unknown and unverified ones (FR-006, NFR-007).
- The bottom prompts ("Remember it? Log in" / "Back to log in") are new entries in the auth shell's per-route prompts.

States: loading = button busy · error = invalid email format + standard errors · success = Sent.

### S-06 Set new password (new, link target)

```
Checking            Form                               Link invalid
┌─────────────┐   ┌────────────────────────────┐   ┌──────────────────────────────┐
│ (spinner)   │   │ Set a new password         │   │ This reset link has expired  │
│ Checking    │   │ [ New password ] [Show]    │   │ or was already used          │
│ your link…  │   │   12 to 128 characters…    │   │ Reset links work for 1 hour  │
└─────────────┘   │ This logs you out on all   │   │ and only once.               │
                  │ devices.                   │   │ [ Request a new link ] → S-05│
                  │ [ Save new password ]      │   └──────────────────────────────┘
                  └────────────────────────────┘
```
- The link is checked on load so the user does not type a password into a dead link (needs a "check token" API call; decided in the architecture step).
- Success → S-04 with "Password changed. Log in with your new password."
- If the link expires while the user types, submit shows Link invalid.

States: loading = Checking, then button busy · error = password errors + standard errors · link invalid · success = redirect.

### S-07 Profile (changed): new cards below the existing ones

Existing header and Profile Information cards stay. Today the email is an editable field in "Profile Information" and is saved with the profile; it becomes read-only text with a hint "Change it in Security below.", and the profile update no longer sends it. New cards, in this order:

```
┌ Security ──────────────────────────────────────────────┐
│ Password                                  [ Change ]   │
│   (expanded) [ Current password ]                       │
│              [ New password ] [Show]  hint…            │
│              [ Cancel ] [ Save password ]               │
│ ────────────────────────────────────────────────────── │
│ Email  ana@example.com                    [ Change ]   │
│   (expanded) [ New email ]                              │
│              [ Current password ]                       │
│              [ Cancel ] [ Send verification link ]      │
│   (status) Check new@example.com. Your email changes   │
│            only after you click the link we sent.      │
│ ────────────────────────────────────────────────────── │
│ Sessions                                               │
│ Log out everywhere, including this device.             │
│                               [ Log out of all devices ]│→ S-08
└────────────────────────────────────────────────────────┘
┌ Your data ─────────────────────────────────────────────┐
│ Download a copy of your profile and all applications   │
│ as a JSON file.                    [ Download my data ] │
│ How we handle your data: Privacy policy → S-11         │
└────────────────────────────────────────────────────────┘
┌ Delete account (red border) ───────────────────────────┐
│ Permanently delete your account and all applications.  │
│ This cannot be undone.             [ Delete account ]  │→ S-09
└────────────────────────────────────────────────────────┘
```
- Only one of the Password / Email sections is expanded at a time; **Change** is a disclosure button (`aria-expanded`).
- Change password success: section collapses, toast "Password changed. Other devices were logged out." (this session stays, FR-007).
- Change email success: section collapses, inline status shown above (same text whether the new email is free or taken, FR-009). The displayed email stays the old one until verified.
- Export: button busy "Preparing…", then the browser downloads `solempleo-export-YYYY-MM-DD.json` and status "Download started." With zero applications the file still downloads (profile + empty list); no special empty state.

States per section: loading = button busy · error = field errors (wrong current password: "Current password is incorrect.") + standard errors · success as above. Page-level loading and load error: existing profile behavior.

### S-08 Dialog: log out of all devices (new)

```
┌ Log out of all devices? ──────────────────────┐
│ You will be logged out everywhere, including  │
│ this device. You can log in again right away. │
│ (error area)                                  │
│                  [ Cancel ] [ Log out all ]   │
└───────────────────────────────────────────────┘
```
- Success → landing page with toast "You were logged out on all devices." (same ending as the existing logout).

States: loading = confirm busy, Cancel disabled · error = standard errors inside the dialog.

### S-09 Dialog: delete account (new)

```
┌ Delete your account? ──────────────────────────┐
│ (warning icon)                                 │
│ This permanently deletes:                      │
│  • your profile                                │
│  • all your job applications                   │
│ This cannot be undone. Want a copy first?      │
│ Download my data                               │
│ [ Current password ]                           │
│ (error area)                                   │
│            [ Cancel ] [ Delete my account ]    │
└────────────────────────────────────────────────┘
```
- No application count: the profile page does not load applications, and an extra call only for this text is not worth it.
- **Delete my account** is enabled only when the password field is not empty. No "type DELETE" step; the password is the confirmation (FR-010).
- Wrong password: "Password is incorrect." Dialog stays open, focus returns to the field.
- Success → landing page with toast "Your account has been deleted. We sent a confirmation to your email."

States: loading = confirm busy "Deleting…", Cancel disabled · error = field error + standard errors.

### S-10 Demo mode (changed)

```
┌ topbar (existing) ─────────────────────────────────────┐
├ (NEW) Demo mode: sample data, read-only.               │
│        [ Create your own account ]                     │
├ sidebar ───┬ content ──────────────────────────────────┤
│ Dashboard  │                                           │
│ All Jobs   │  (no "Add Job" item, no "Add Application" │
│ Statistics │   quick action, no Edit/Delete on detail) │
```
- Banner: full width under the topbar, not dismissible, part of the layout flow (not overlaying content, so it never hides focused elements). Info-tinted background with dark text: white text on `--color-status-info` (sky-500, as on today's Demo button) does not reach 4.5:1 contrast. Checked in light and dark theme.
- **Create your own account** runs the existing logout, then opens S-01.
- Not rendered for the demo user: "Add Job" (sidebar and mobile menu), the **Add Application** quick action on the dashboard, Edit and Delete on job detail, **Edit Profile**, and on S-07 the Security, Your data and Delete account cards. In their place S-07 shows one line: "Account settings are not available in demo mode." The job list has no write actions today, so it does not change.
- Needs a demo flag from the API: the demo user is a normal account today and the profile has no role field.
- Write routes (`/create-job`, `/jobs/:id/edit`) redirect to the dashboard with toast "Not available in demo mode."

States: none of its own; the existing screens keep their loading, error and empty states.

### S-11 Privacy policy (new)

```
┌ logo bar (auth shell look, logo links home) ─ theme ┐
│ ┌ card, max ~65ch text width ──────────────────────┐ │
│ │ ← Back                                           │ │
│ │ Privacy policy            Last updated: <date>   │ │
│ │ On this page: (links to sections)                │ │
│ │ 1 What we store and why                          │ │
│ │ 2 Who processes it (hosting, database, email)    │ │
│ │ 3 How long we keep it                            │ │
│ │ 4 Your rights and how to use them                │ │
│ │   (export, delete, contact; links to Profile)    │ │
│ │ 5 Cookies (one session cookie, no tracking)      │ │
│ │ 6 Contact                                        │ │
│ └──────────────────────────────────────────────────┘ │
│ footer: © 2025 Solempleo. All rights reserved. · Privacy policy │
└──────────────────────────────────────────────────────┘
```
- **← Back** goes to the previous page (or home if the page was opened directly, e.g. in a new tab from register). The logo links to `/`, which shows the landing page or the dashboard. A logged-in user has no app navigation here, so these two links are the way back.
- Public and static: no loading, error or empty states.
- Final text is written after the email provider and retention details are fixed (sections required by FR-030 and NFR-010).

**Footer link (changed).** Landing, auth shell and 404 footers ("© 2025 Solempleo. All rights reserved.") get a "Privacy policy" link after the text. The dashboard layout has no footer; there the link is in S-07 "Your data". (Alternative: the sidebar's bottom area next to **Collapse**, desktop only.)

## 4. Accessibility notes (WCAG 2.2 AA, NFR-011)

Global:
- **Focus on page change:** after navigation to any new or changed screen, focus moves to the page `h1`; the page title changes (FR-012). Each of these screens has exactly one `h1` (S-01 and S-04 promote their `h2` titles).
- **Keyboard:** everything above works with Tab, Shift+Tab, Enter, Space and Esc. Visible focus ring on every control (do not remove outlines; the current auth link uses `focus:outline-none`, so new links must not copy it).
- **Focus not obscured (2.4.11):** the sticky topbar and demo banner must not cover a focused element; use `scroll-padding-top` equal to their height.
- **Target size (2.5.8):** all buttons, links and toggles at least 24 × 24 px; inline text links are exempt.
- **Forms:** visible labels (already in `app-input`); add `autocomplete` = `email`, `current-password`, `new-password`; paste and password managers allowed (3.3.8); errors and hints linked with `aria-describedby`, `aria-invalid` on invalid fields. Because submit stays disabled until valid, a server error (wrong password, too common) is shown on the field and focus moves to it.
- **Redundant entry (3.3.7):** resend and reset forms prefill the email the user already typed.
- **Status messages:** inline status areas are `role="status"` (`aria-live="polite"`); errors that block an action use `role="alert"`. The live region exists in the page before text is put in it. Cooldown countdowns are not announced each second; only "You can resend now" is announced.
- **Busy buttons:** `aria-disabled` + busy label; the result is announced through the status area.
- **Show password toggle:** a real `button` with `aria-pressed` and label "Show password".
- **Color:** status meaning never by color alone (icon + text); contrast 4.5:1 for text, 3:1 for UI borders, in light and dark theme.
- **360 px width (NFR-012):** all wireframes stack to one column; dialog buttons stack full width; no horizontal scroll.

Dialogs (S-08, S-09):
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title), `aria-describedby` (body).
- Focus moves into the dialog on open: S-09 to the password field, S-08 to **Cancel** (safe default). Focus is trapped; Esc and **Cancel** close it; focus returns to the button that opened it.
- Background click closes only when no request is running.
- These dialogs should be one shared accessible dialog component. The existing job delete modal does not have a dialog role or focus trap; it should use the same component (FR-024 requires it).

Disclosures (S-07): **Change** buttons use `aria-expanded` and `aria-controls`; on expand, focus moves to the first field; on Cancel or success, focus returns to the **Change** button.

Existing components reused here that need fixes to pass axe and keyboard checks:
- `app-alert` (toast): add a live region; the close icon is an `svg` with a click handler, so it must become a `button` with a label.
- `app-input`: ARIA links, hint, show-password toggle (see the table in section 1).
- `app-submit-button`: busy state; `disabled` keeps it out of the tab order, so the form needs a visible reason why it cannot be sent yet (field errors once touched).
- Auth shell link focus style (see above).

## 5. Open points for later steps

- Check-token endpoint for S-06 and how S-03 sends the token (automatic on load vs a "Verify" button, which protects single-use links from email scanners): architecture and security review.
- Removing tokens from the URL and the referrer policy on link-target pages: security review.
- Privacy policy final text: after the email provider is chosen.
- Demo flag in the profile API response (S-10): architecture.
- Auth shell as a shared layout for pages outside `/auth`: architecture.

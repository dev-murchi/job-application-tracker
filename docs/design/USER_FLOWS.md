# User Flows: account lifecycle, privacy, demo mode

Scope: only the new flows from the product brief v1.0 (FR-001/002/003 verification parts, FR-005, FR-006, FR-007, FR-009, FR-010, FR-011, FR-013, FR-030). Existing flows (job CRUD, statistics, profile edit) are unchanged.
Screen IDs (S-xx) refer to [SCREENS.md](SCREENS.md).

Conventions for every flow:
- Responses for register, reset request, resend and email change never reveal whether an account exists (NFR-007). The UI shows one neutral message for both cases.
- `429 Too many requests` and network or server errors are shown inline with a retry option; the form keeps what the user typed.

## F1. Register and verify email (FR-001, FR-002)

```mermaid
flowchart TD
  A[Register form S-01] -->|submit valid data| B{API}
  A -->|invalid field| A1[Field errors shown, submit stays disabled] --> A
  B -->|201 new or existing email| C[Check your email S-02]
  B -->|429 / 5xx| A2[Error toast, data kept] --> A
  C -->|Resend, after cooldown| C1[Neutral 'link sent' status] --> C
  C -->|user opens link in email| D[Verify email S-03: verifying...]
  D -->|valid, < 24 h, unused| E[Success: 'Email verified'] --> E1{Logged in?}
  E1 -->|no| F[Log in button → Login S-04]
  E1 -->|yes| F2[Go to dashboard button]
  D -->|expired or used| G[Link invalid + resend form]
  G -->|enter email, submit| G1[Inline neutral status on S-03: 'if this address needs verifying, we sent a new link'] --> G
  D -->|network / 5xx| H[Error + Try again] --> D
```

## F2. Log in with an unverified account (FR-002, FR-003)

```mermaid
flowchart TD
  A[Login S-04] -->|correct password, unverified| B[Inline notice: verify first + Resend button]
  A -->|wrong password / unknown email| A1[Existing generic error toast] --> A
  A -->|verified| D[Dashboard; return URL comes with FR-012]
  B -->|Resend| C[Status: 'new link sent', button cooldown 60 s] --> E[User opens link: F1 from D]
```

## F3. Forgot and reset password (FR-006)

```mermaid
flowchart TD
  A[Login S-04] -->|Forgot password?| B[Forgot password S-05]
  B -->|submit email| C[Neutral 'if an account exists, link sent, valid 1 h']
  C -->|Send again, after cooldown| C1[Neutral 'link sent' status] --> C
  C -->|user opens link| D[Set new password S-06: checking link...]
  D -->|link valid| E[New password form]
  D -->|expired / used / malformed| F[Link invalid + 'Request a new link'] --> B
  E -->|password too short / common| E1[Field error] --> E
  E -->|valid| G[All sessions revoked, email sent] --> H[Login S-04 with 'Password changed' status]
  E -->|link expired while typing| F
```

## F4. Change password (FR-007)

```mermaid
flowchart TD
  A[Profile S-07: Security card] -->|Change password| B[Inline form: current + new]
  B -->|wrong current password| B1[Field error on current password, nothing changes] --> B
  B -->|new password invalid| B2[Field error on new password] --> B
  B -->|valid| C[Section collapses + toast 'Password changed. Other devices were logged out.'] --> A
```

## F5. Change email (FR-009)

```mermaid
flowchart TD
  A[Profile S-07: Security card] -->|Change email| B[Inline form: new email + current password]
  B -->|wrong password| B1[Field error] --> B
  B -->|valid, new email free or taken| C[Neutral status: 'Check the new inbox. Your email changes after you click the link.']
  C -->|user opens link in new inbox| D[Confirm email change S-03b]
  D -->|valid| E[Success: 'Email changed'] --> F{Logged in?}
  F -->|yes| G[Profile with new email]
  F -->|no| H[Login]
  D -->|expired / used| I[Link invalid: 'Start again from your profile']
```

## F6. Log out of all devices (FR-005)

```mermaid
flowchart TD
  A[Profile S-07: Security card] -->|Log out of all devices| B[Confirm dialog S-08]
  B -->|Cancel / Esc| A
  B -->|Confirm| C[All sessions revoked incl. this one] --> D[Landing with toast 'You were logged out on all devices']
  B -->|error| B1[Error in dialog, dialog stays open] --> B
```

## F7. Export data (FR-011)

```mermaid
flowchart TD
  A[Profile S-07: Your data card] -->|Download my data| B[Button busy: 'Preparing...']
  B -->|200| C[Browser downloads solempleo-export-YYYY-MM-DD.json + status 'Download started']
  B -->|error| D[Inline error + retry] --> A
```

## F8. Delete account (FR-010)

```mermaid
flowchart TD
  A[Profile S-07: Delete account card] -->|Delete account| B[Confirm dialog S-09: consequences + password]
  B -->|Cancel / Esc| A
  B -->|wrong password| B1[Field error, dialog stays open] --> B
  B -->|correct password| C[Account and data deleted, sessions revoked, email sent]
  C --> D[Landing with toast 'Your account has been deleted. We sent a confirmation to your email.']
```

## F9. Demo mode (FR-013)

```mermaid
flowchart TD
  A[Login S-04] -->|Demo| B[Dashboard + demo banner S-10]
  B --> C[Read-only: write actions not rendered]
  B -->|Create your own account| D[Log out demo session] --> E[Register S-01]
  C -->|types a write URL, e.g. /create-job| F[Redirect to dashboard + status 'Not available in demo mode']
```

## F10. Privacy policy (FR-030)

```mermaid
flowchart TD
  A[Footer link: landing, auth pages, 404] --> P[Privacy policy S-11]
  B[Register form note, opens in new tab] --> P
  C[Profile S-07: Your data card] --> P
  P -->|Back link| D[Previous page]
  P -->|Logo| E[Home: landing or dashboard]
```

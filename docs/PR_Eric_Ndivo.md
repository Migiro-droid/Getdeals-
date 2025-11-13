PR title: feat(auth): prompt/confirm delivery address after login (Address modal)

Target reviewer: Eric Ndivo (@ericndivo)  
Branch suggestion: feature/address-prompt-after-login

Summary
-------
This PR adds a required/confirmable delivery address flow that appears immediately after a user signs in. The goal is to ensure users confirm or update their delivery address every time they log in, improving delivery accuracy and reducing failed deliveries.

Why
---
- Users often change delivery locations; prompting them after login reduces address-related delivery errors.
- Ensures new users provide an address before shopping.
- Makes address confirmation an explicit step after authentication.

What changed (files)
---------------------
- ADDED: `src/components/AddressRequiredModal.tsx`
  - New modal component that wraps the existing `AddressForm` and enforces saving (shows relevant UI and copy for confirming/updating address).

- MODIFIED: `src/components/AuthModals.tsx`
  - Added `onLoginSuccess` callback prop.
  - `handleSignIn` now calls `onLoginSuccess()` after a successful login.
  - Renamed login-related UI strings: "Sign In" -> "Login" and normalized `signin` -> `login` to maintain compatibility.
  - Updated signup flow: removed `organization` and `organizationId` fields and updated copies (signup header now shows "Signup" when on signup tab).
  - IDs changed for login inputs from `signin-*` to `login-*` (handled internally in the form handlers).

- MODIFIED: `src/pages/HomePage.tsx`
  - Imports `AddressRequiredModal` and `useAccount`.
  - Adds `addressModalOpen` state.
  - Registers `onLoginSuccess` on `AuthModals` to open the address modal after login.
  - Also added a `useEffect` that watches global `isAuthenticated` and opens the address modal on fresh login (handles other login flows such as OAuth or external redirects).

- MODIFIED: `src/components/AddressForm.tsx` (usage only)
  - `AddressRequiredModal` uses `AddressForm`'s existing `onSave` / `onCancel` contract.

Notes / Decisions
-----------------
- The address modal appears every time a user logs in (explicit requirement). A future enhancement could add a setting to let users opt-out or only show for first login per session.
- The signup form now excludes organization fields as requested and sends empty strings to the backend signUp call to preserve API signature.
- I kept internal variable names like `showSignInPassword` for clarity; only visible labels were changed.
- `AuthModals` still accepts `defaultTab` values of `"signin"` for backwards compatibility — it normalizes to "login".

Behavior & Acceptance Criteria
------------------------------
- After successful login (any flow), the Address modal appears and allows the user to fill or confirm their address.
- Saving the address persists it via `AccountContext` (localStorage) and closes the modal.
- The modal is non-blocking only after the user saves; we currently show a short toast and then close.
- On subsequent logins the modal still appears (per spec) allowing updates.

Testing steps (local)
---------------------
1. Start dev server

```bash
npm install
npm run dev
```

2. Clear existing local storage for account (optional) to test fresh flows:

```bash
# in browser devtools console
localStorage.removeItem('account_settings_v1')
```

3. Open the app in the browser. Log out if already signed in.
4. Use the login modal (or auth page / OAuth) to sign in.
5. After sign-in completes, the "Delivery Address" modal should automatically appear.
6. Fill the address form (Name, Phone, Email, Street, City, etc.) and click Save.
7. Confirm the address is persisted by checking localStorage (key `account_settings_v1`) or via the Account page.
8. Log out and log in again — the modal should appear again (per current requirement).

Commands to create the branch, commit and push
----------------------------------------------
```bash
# from repo root
git checkout -b feature/address-prompt-after-login
# Review and add changed files
git add src/components/AuthModals.tsx src/components/AddressRequiredModal.tsx src/pages/HomePage.tsx
# create a focused commit
git commit -m "feat(auth): prompt/confirm delivery address after login (Address modal)"
# push branch
git push -u origin feature/address-prompt-after-login
```

Suggested PR body (copy/paste)
------------------------------
Title: feat(auth): prompt/confirm delivery address after login (Address modal)

Summary:
This PR introduces a post-login flow that prompts users to confirm or update their delivery address. It adds a new modal (`AddressRequiredModal`) and wires it to the auth flow so it appears after any successful login. The signup form was simplified to remove organization fields as requested.

Files changed:
- Added `src/components/AddressRequiredModal.tsx`
- Modified `src/components/AuthModals.tsx`
- Modified `src/pages/HomePage.tsx`

Why:
To ensure delivery accuracy and make address confirmation an explicit, visible step after authentication.

Testing:
Follow the steps in the "Testing steps (local)" section in this document.

Reviewer: @ericndivo
Labels: enhancement, auth, ux

Follow-ups / TODOs (suggested):
- Optionally add an account setting to disable the post-login prompt.
- Persist addresses to the backend (currently stored in `localStorage` via `AccountContext`); add API integration.
- Add unit / integration tests for Auth -> address modal flow.

Additional notes
----------------
If you want, I can open the PR for you (I’ll need permission to push/PR on your fork or upstream). I can also replace remaining `"signin"` occurrences in the codebase to standardize on `"login"` if you prefer.

---

Let me know if you want this written to a different file, or if you'd like me to open the PR automatically.
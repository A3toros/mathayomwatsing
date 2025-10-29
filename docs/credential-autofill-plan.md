Credential Autofill & “Remember Password” Plan

Goals
- Prompt browsers to save credentials on login (native password manager prompt).
- Improve autofill reliability across Chrome, Safari, Firefox, and iOS/Android.
- Zero backend changes; minimal, safe frontend edits.

Scope
- Login pages/components only (no signup/change password flows here).
- Works with current JWT-based auth and fetch/XHR requests.
- Usernames are numeric IDs (student/teacher IDs), passwords can be changed later.

Constraints & Notes
- Browsers trigger save prompts based on semantics: field names, input types, labels, and successful form submissions.
- When using fetch (not a real form POST), save prompts are less reliable; the Credential Management API can help.
- Must not break current login function or token storage.
- Numeric usernames may need special handling for autocomplete hints.

Implementation Steps
1) Form semantics (strong signal for all browsers)
   - Ensure username input (numeric ID):
     - type="text" (not "number" - browsers prefer text for usernames)
     - name="username"
     - id is stable, with a <label for="..."> bound to it
     - autocomplete="username"
     - inputmode="numeric" (for mobile numeric keypad)
     - autocapitalize="none", spellcheck="false"
   - Ensure password input:
     - type="password"
     - name="password"
     - autocomplete="current-password"
   - Do NOT set autocomplete="off" on form or inputs.

2) Keep a real <form> submit wrapper
   - Wrap with <form onSubmit={handleSubmit}> and a <button type="submit">.
   - Even if handleSubmit uses fetch, browsers get better signals than a pure onclick handler.

3) Optional: Credential Management API (for JS-driven flows)
   - After successful login (token received & user set), call:
     - navigator.credentials?.store(new PasswordCredential({ id: username, password }))
   - This improves the chance of a native “Save password” prompt in Chrome/Edge/Android.
   - Guard with feature detection; fail silently on unsupported browsers.

4) Integration Points (where to add minimal code)
   - src/components/forms/LoginForm.jsx
     - Inputs: add autocomplete attrs and stable name/id/label.
     - After handleLoginSuccess returns true, call storePasswordCredential(username, password).
   - src/shared/LoginPage.jsx (if used)
     - Same treatment if this route bypasses LoginForm.jsx.
   - src/contexts/AuthContext.jsx
     - No changes required; ensure post-login success point is identifiable for the API call from component.

5) Minimal helper (optional)
   - Create a tiny helper (inline or util) that:
     - Applies autocomplete hints to refs (username/password).
     - Stores credentials via Credential Management API after success.
   - Keep it optional to avoid coupling.

6) Testing Matrix
   - Desktop Chrome/Edge (Windows/Mac):
     - Enter new creds; ensure native save prompt appears.
     - Reload; check autofill and submit.
   - Desktop Firefox/Safari:
     - Confirm prompts/autofill (Safari requires form semantics; no CM API).
   - iOS Safari:
     - Ensure the keyboard accessory suggests saving/Keychain.
   - Android Chrome:
     - Check Google Password Manager prompt and autofill.

7) Security & Privacy Considerations
  - Use HTTPS only (secure origins required for Credential Management API; avoid mixed content).
  - Never store passwords in localStorage/sessionStorage/IndexedDB. Rely on the browser’s password manager.
  - Do not log plain passwords or auth tokens (frontend or functions). Scrub sensitive fields in error logs.
  - Only call navigator.credentials.store() after an explicit, successful, user-initiated login.
  - Respect private/incognito sessions where saving may be disabled; fail silently if the browser blocks it.
  - Keep login page minimal: avoid third‑party scripts on the login route; set a strong CSP (disallow inline scripts; restrict script-src to self and vetted CDNs).
  - Tokens: use short-lived JWTs with refresh, limit scope/claims, and avoid storing tokens in query strings or logs.
  - Autocomplete hints are safe: they guide the browser; they don’t expose credentials beyond user input.
  - Prefer form semantics for the login flow; it improves native prompts without adding client-side storage.
  - Service Worker/Caching: do not cache the login HTML; ensure no sensitive responses are cached. Set Cache-Control appropriately.
  - Logout flow: clear auth state and advise users that saved passwords live in the browser’s password manager (not the site).

8) Rollout & Verification
   - Ship behind no flags (safe, additive attributes).
   - Verify in production by doing a fresh login and confirming save prompt.
   - Monitor login error rates; prompts do not affect auth logic.

Task Checklist
- [ ] Add autocomplete attributes to username/password inputs
- [ ] Ensure stable name/id/label bindings
- [ ] Keep form submit semantics (<form> + submit button)
- [ ] Invoke navigator.credentials.store() on success (Chrome/Edge/Android)
- [ ] Test across Chrome, Firefox, Safari, iOS, Android
- [ ] Validate no regressions to current auth/token flows

Code Snippets (for reference)
- Username input example (numeric ID):
  <input id="login-username" name="username" type="text" autocomplete="username" inputmode="numeric" autocapitalize="none" spellcheck="false" />
- Password input example:
  <input id="login-password" name="password" type="password" autocomplete="current-password" />
- Store credentials after success (guarded):
  if ('credentials' in navigator && window.PasswordCredential) {
    try { await navigator.credentials.store(new PasswordCredential({ id: username, password })); } catch {}
  }
- Label example:
  <label for="login-username">Student/Teacher ID</label>



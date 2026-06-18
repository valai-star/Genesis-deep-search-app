# GENESIS Secure Security Specification (Phase 0 TDD)

This document establishes the security architecture constraints and the test vectors ("Dirty Dozen") designed to compromise the system. The final security rules must mathematically deny all malicious payloads.

## 1. Zero-Trust Data Invariants
1. **Strict User Identity Boundary:** A user can only access, write, edit, or list documents resident in their own nested subfolders under `/users/{userId}/*`.
2. **Read Restrictiveness (PII / Private Isolation):** Profiles and personal holdings contain sensitive data fields. Signed-in users CANNOT read other users' metrics or keys.
3. **Immutability Invariants:** Vital timestamps (`createdAt`, `updatedAt`) must strictly coincide with the server-determined timestamp (`request.time`). Custom clients cannot post spoofed historical timestamps.
4. **ID Sanitization & Length Guard:** All document IDs (such as project files, watchlist tickers, or community signal IDs) must match alphanumeric sequences (`^[a-zA-Z0-9_\-]+$`) and never exceed 128 characters (Denial of Wallet mitigation).
5. **Community Signals Gate:** Community signals can be read by any signed-in verified account. Creating a signal requires verified status, with the `authorEmail` field matching the user token email precisely.

---

## 2. The "Dirty Dozen" Malicious Exploitation Payloads

The nested structures attempt to bypass authorization or injection blockades.

### Attempt 1: The Identity Spoof (User Profile)
*   **Path:** `/users/HACKER_ID`
*   **Target Operation:** `create`
*   **Payload:** `{ "userId": "VICTIM_USER_ID", "email": "victim@domain.com", "createdAt": "2020-01-01T00:00:00Z", "brokerConnected": true, "activeMode": "genesis" }`
*   **Vulnerability Target:** Forging a different `userId` in the payload compared to authenticated user token.
*   **Rule Prevention Indicator:** `isValidUser` logic rejects because `incoming().userId != request.auth.uid`.

### Attempt 2: The Time Machine (Spoof Profile Timestamp)
*   **Path:** `/users/CURRENT_USER_ID`
*   **Target Operation:** `create`
*   **Payload:** `{ "userId": "CURRENT_USER_ID", "email": "user@domain.com", "createdAt": "2010-06-15T22:31:42Z", "brokerConnected": false, "activeMode": "genesis" }`
*   **Vulnerability Target:** Forging custom past timestamp.
*   **Rule Prevention Indicator:** `incoming().createdAt == request.time`.

### Attempt 3: The Ghost Watcher (Inject Watchlist into Another Account)
*   **Path:** `/users/VICTIM_USER_ID/watchlist/NVDA`
*   **Target Operation:** `create`
*   **Payload:** `{ "ticker": "NVDA", "addedAt": "request.time" }`
*   **Vulnerability Target:** Writing data inside another citizen's list.
*   **Rule Prevention Indicator:** Match pattern enforce `userId == request.auth.uid`.

### Attempt 4: The Shadow Update (Unlisted Field Injection)
*   **Path:** `/users/CURRENT_USER_ID`
*   **Target Operation:** `update`
*   **Payload:** `{ "userId": "CURRENT_USER_ID", "email": "user@domain.com", "createdAt": "2026-06-15T22:31:42Z", "brokerConnected": true, "activeMode": "expert", "isSystemAdmin": true }`
*   **Vulnerability Target:** Appending unmapped security field `"isSystemAdmin"` to user profile.
*   **Rule Prevention Indicator:** `affectedKeys().hasOnly(...)` ensures only authorized keys modify the user profile.

### Attempt 5: The Arbitrary Quantity Manipulation (Holding Shares Value Injection)
*   **Path:** `/users/CURRENT_USER_ID/holdings/AAPL`
*   **Target Operation:** `create`
*   **Payload:** `{ "ticker": "AAPL", "shares": -1000000, "avgCost": -12, "updatedAt": "request.time" }`
*   **Vulnerability Target:** Injecting negative shares or cost assets to trick computation.
*   **Rule Prevention Indicator:** `isValidHolding` verifies `shares > 0 && avgCost > 0`.

### Attempt 6: The Long-ID Poisoning Attack (Denial of Wallet)
*   **Path:** `/users/CURRENT_USER_ID/watchlist/AAPL_A_REALLY_REALLY_LONG_ID_CONTAINING_2048_BYTES_TO_EXHAUST_FIRESTORE_INDEX_MEMORY_SPACE_FOR_DENIAL_OF_WALLET...`
*   **Target Operation:** `create`
*   **Payload:** `{ "ticker": "AAPL", "addedAt": "request.time" }`
*   **Vulnerability Target:** Poisoning indexing service with excessive document sizes.
*   **Rule Prevention Indicator:** `isValidId(ticker)` enforces size limits.

### Attempt 7: The Unverified PII Scraper (Global List Profile Attack)
*   **Path:** `/users`
*   **Target Operation:** `list`
*   **Payload:** `N/A`
*   **Vulnerability Target:** Trying to retrieve user lists to harvest contact emails.
*   **Rule Prevention Indicator:** Rules forbid global query or blanket list without explicit owner filter.

### Attempt 8: The Email Spoof Contribution (Community Signal)
*   **Path:** `/community_signals/malicious_sig_001`
*   **Target Operation:** `create`
*   **Payload:** `{ "id": "malicious_sig_001", "ticker": "DELL", "sourceUrl": "https://trusted-news.com", "textContribution": "Clipped text", "userObservation": "Observation", "authorEmail": "admin@genesis-intelligence.com", "timestamp": "request.time", "verified": true }`
*   **Vulnerability Target:** Forging a different author email to pose as an administrator or high-trust contributor.
*   **Rule Prevention Indicator:** `request.auth.token.email == incoming().authorEmail && incoming().verified == false` (cannot pre-verify own input).

### Attempt 9: The Self-Verification Escapade (Community Signal Verification)
*   **Path:** `/community_signals/malicious_sig_002`
*   **Target Operation:** `update`
*   **Payload:** `{ "id": "malicious_sig_002", "ticker": "DELL", "sourceUrl": "https://trusted-news.com", "textContribution": "Clipped", "userObservation": "Observation", "authorEmail": "user@domain.com", "timestamp": "some-date", "verified": true }`
*   **Vulnerability Target:** Overriding the verified property from false to true via update action.
*   **Rule Prevention Indicator:** Only genuine system administrators can write values here or update verified properties.

### Attempt 10: The Rogue PII Read
*   **Path:** `/users/VICTIM_USER_ID`
*   **Target Operation:** `get`
*   **Payload:** `N/A`
*   **Vulnerability Target:** Reading sensitive profile details belonging to another user.
*   **Rule Prevention Indicator:** `userId == request.auth.uid`.

### Attempt 11: The Subcollection Orphan Leak
*   **Path:** `/users/CURRENT_USER_ID/sources/custom_rss`
*   **Target Operation:** `create`
*   **Payload:** `{ "id": "custom_rss", "name": "Fake RSS", "type": "Scraper", "url": "not-a-valid-url-format", "addedAt": "request.time" }`
*   **Vulnerability Target:** Injecting malformed URLs or types in scrapers.
*   **Rule Prevention Indicator:** `incoming().url.matches('^https?://.*')` regex checking.

### Attempt 12: Anonymous Spammer Barrage
*   **Path:** `/community_signals/spam_123`
*   **Target Operation:** `create`
*   **Payload:** `{ "id": "spam_123", "ticker": "NVDA", "sourceUrl": "https://spam.com", "textContribution": "Buy crypto!", "userObservation": "Spam", "authorEmail": "anonymous@nowhere.com", "timestamp": "request.time", "verified": false }`
*   **Vulnerability Target:** Spanning network resources without verified token emails.
*   **Rule Prevention Indicator:** `request.auth.token.email_verified == true`.

---

## 3. Test Runner Design Blueprint
The target tests expect `PERMISSION_DENIED` on all twelve exploitation payloads, validating complete system compliance!

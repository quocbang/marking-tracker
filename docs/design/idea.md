# 1) Ý tưởng lớn (overview)

Mục tiêu: đo **t## B. Frontend behavior (tracking.html)

1. Khi trang load:

   * Lấy `name` và `doc` từ query string.
   * Kiểm tra `localStorage` có `sessionId` hợp lệ không (chưa expire):
     - **Có** → reuse session (cho phép reload, thời gian tiếp tục tích lũy)
     - **Không** → gọi `/start` để tạo session mới
   * Gán `iframe.src = doc` để hiển thị Google Doc.
2. Heartbeat:

   * Bắt event hoạt động (`mousemove`, `keydown`, `click`, `scroll`, `touchstart`) để cập nhật `lastActivityTs`.
   * Gửi POST `/heartbeat` mỗi 5s: `{ sessionId, ts, active }` (active = true nếu có activity trong 10s).
3. End:

   * **Reload page** → session KHÔNG kết thúc, heartbeat tiếp tục sau khi page load lại.
   * **Nhấn "Finish" button** → `isIntentionalExit = true`, gọi `navigator.sendBeacon('/end', payload)`.
   * **Session expire (4h TTL)** → backend tự động đánh dấu session timeout.
   * Sau `end`, xóa `localStorage` sessionId.
4. LocalStorage:

   * Lưu `sessionId` kèm `expiresAt` để survive reload nhưng không tồn tại vô hạn (4h).
   * **Reload = reuse session** → thời gian tracking tiếp tục, không mất dữ liệu.
   * Điều này cho phép evaluator reload trang thoải mái mà không ảnh hưởng tracking.một người dùng dành để *chấm* 1 Google Doc, chống reload/forging đơn giản, dễ triển khai, và lưu log để phân tích.

Flow ngắn gọn:

1. Người chấm mở link tracking (ví dụ `https://tracking.example.com/?name=Thai&doc=<docUrl>`).
2. Trang static (host bằng GitHub Pages trên custom domain) tải `tracking.html` — iframe chứa Google Doc.
3. Client (JS) kiểm tra localStorage:
   - Nếu có session hợp lệ (chưa expire) → **reuse session** (cho phép reload)
   - Nếu không → gọi `start` tới n8n (webhook) để tạo sessionId mới
4. Client gửi **heartbeat** mỗi 5s (kèm `active` flag).
5. **Reload page** → session được giữ nguyên, heartbeat tiếp tục (thời gian vẫn tích lũy).
6. Khi nhấn nút "Finish" hoặc session expire (4h) → client gửi `end` (dùng `navigator.sendBeacon`).
7. n8n chịu trách nhiệm lưu session state (startTime, lastHeartbeat, accumulatedActive) vào storage (Google Sheet / DB) và khi nhận `end` tính `activeDuration` dựa trên heartbeats rồi lưu kết quả cuối cùng.

---

# 2) Thành phần (components)

* **Static frontend**: `tracking.html` (host GitHub Pages, custom domain `tracking.example.com`, có favicon).
* **n8n workflow**: 3 webhook nodes: `/start`, `/heartbeat`, `/end`. Các node tương tác với storage (Google Sheets, PostgreSQL, Redis).
* **Storage**: Google Sheet (dễ), hoặc PostgreSQL/Redis (production).
* **Dashboard**: Looker Studio / Google Sheets pivot hoặc bảng tổng hợp n8n.

---

# 3) Chi tiết step-by-step triển khai

## A. Host frontend (GitHub Pages + custom domain)

1. Tạo repo `tracking-page`, thêm file `tracking.html` (file bạn đã có).
2. Commit & push.
3. Repo Settings → Pages → Source: `main` branch → `/ (root)`. Lưu.
4. Tạo file `CNAME` ở root repo với nội dung `tracking.example.com` → commit.
5. DNS provider: thêm CNAME record:

   * Type: `CNAME`, Name: `tracking`, Value: `yourname.github.io` (hoặc `yourname.github.io.`)
6. Chờ DNS propagate, quay lại GitHub Pages để verify. Bật **Enforce HTTPS**.
7. Triển khai favicon: upload `tracking.png` vào repo và trong `<head>` thêm `<link rel="icon" href="/tracking.png">`.

> Kết quả: tracking page public tại `https://tracking.example.com/?name=...&doc=...`

---

## B. Frontend behavior (tracking.html)

1. Khi trang load:

   * Lấy `name` và `doc` từ query string.
   * Nếu `localStorage` có `sessionId` hợp lệ → reuse; nếu không → gọi `/start` để tạo session.
   * Gán `iframe.src = doc` để hiển thị Google Doc.
2. Heartbeat:

   * Bắt event hoạt động (`mousemove`, `keydown`, `click`, `scroll`, `touchstart`) để cập nhật `lastActivityTs`.
   * Gửi POST `/heartbeat` mỗi 5s: `{ sessionId, ts, active }` (active = true nếu có activity trong 10s).
3. End:

   * Khi `beforeunload` (đóng tab/refresh) hoặc khi người dùng nhấn “Finish”, gọi `navigator.sendBeacon('/end', payload)` để đảm bảo gửi tin khi tab đóng.
   * Sau `end` có thể xóa `localStorage` sessionId (tuỳ policy).
4. LocalStorage:

   * Lưu `sessionId` kèm `expiresAt` để survive reload nhưng không tồn tại vô hạn.
   * Điều này ngăn reload tạo session mới.

---

## C. n8n workflow (serverless-style)

Bạn chuyển logic server vào n8n nodes. Mô tả 3 webhook chính:

### 1) `/start` webhook

* Input: `{ name, docUrl }`
* Steps:

  * Generate `sessionId` (UUID). Optionally sign HMAC: `sessionId = uuid + '.' + hmac(secret, uuid)`.
  * Write a new row / DB record: `{ sessionId, name, docUrl, startTime = now, lastHeartbeat = now, accumulatedActiveMs = 0, used=false, ttlAt = now + 4h }`.
  * Return `{ sessionId, ttlMs }` to client.

### 2) `/heartbeat` webhook

* Input: `{ sessionId, ts, active }`
* Steps:

  * Lookup session record by `sessionId`. If not found → ignore/return 404.
  * Compute delta = now - lastHeartbeat.
  * If `active == true` OR delta small (<30s), add delta to `accumulatedActiveMs`.
  * Update `lastHeartbeat = now`, refresh `ttlAt`.
  * (Optional) store raw heartbeat row for debugging.

### 3) `/end` webhook

* Input: `{ sessionId, reason, ts }` (sent by sendBeacon)
* Steps:

  * Lookup session.
  * If not found / already used → return.
  * Optionally handle final gap: if lastHeartbeat recent and final delta small, add final delta to accumulatedActiveMs.
  * Compute `activeSec = round(accumulatedActiveMs / 1000)`.
  * Sanity checks: cap max value, reject absurd.
  * Mark session used; write final row (name, docUrl, activeSec, reason, startTime, endTime).
  * Respond OK.

**Storage options in n8n**:

* Google Sheets Node: append/update rows.
* PostgreSQL Node: insert/update.
* Redis Node (with HTTP/Redis integration) for ephemeral sessions — but n8n has limited native Redis nodes; using DB is simpler.

---

# 4) Payload examples

**Start request** (client → n8n):

```json
POST /start
{ "name":"Thai", "docUrl":"https://docs.google.com/document/d/ABC" }
```

**Start response**:

```json
{ "sessionId":"uuid-xxx", "ttlMs":14400000 }
```

**Heartbeat**:

```json
POST /heartbeat
{ "sessionId":"uuid-xxx", "ts":"2025-10-28T08:00:05Z", "active": true }
```

**End** (via sendBeacon):

```json
POST /end
{ "sessionId":"uuid-xxx", "ts":"2025-10-28T08:12:05Z", "reason":"closed" }
```

---

# 5) Bảo mật & chống gian lận (quan trọng)

* **Không tin client** về `duration` — server tính dựa trên heartbeats và startTime.
* **Session signing**: n8n tạo sessionId có HMAC để ngăn client tạo session giả: `sessionId = uuid + '.' + base64(HMAC(secret, uuid))`. Khi n8n nhận sessionId xác thực HMAC. (n8n phải có secret stored in credentials.)
* **Session single-use**: mark used when /end arrives; không chấp nhận multiple `/end` cho cùng session.
* **Rate limiting / sanity checks**:

  * Reject durations > 12h.
  * Ignore too-frequent start requests from same IP.
* **Server-to-server secret**: nếu forwarding logs giữa n8n và downstream, use secret header (X-Tracker-Secret).
* **LocalStorage caveat**: user có thể xóa localStorage — fallback sẽ tạo new session. Nhưng đây là tradeoff để support reload.
* **Audit fields**: lưu IP, UserAgent, hostname client (if possible) để phát hiện pattern lạ.
* **HTTPS** everywhere (GitHub Pages + n8n domain must be HTTPS).

---

# 6) Handling reloads & multiple tabs

* **Reload behavior (UPDATED)**:
  * `localStorage` preserves sessionId across reloads.
  * Page reload → session **continues**, heartbeat resumes, time keeps accumulating.
  * `beforeunload` event **does NOT** call `/end` unless `isIntentionalExit = true`.
  * Backend handles heartbeat gaps: gaps < 30s are counted as active, gaps > 5 min are ignored.
  
* **Session termination**:
  * User clicks "Finish" button → explicitly calls `/end` with reason='finished'.
  * Session expires after 4h TTL → backend marks as timeout.
  * **NOT terminated** on page reload or refresh.

* **Multiple tabs**:
  * `localStorage` is per-origin: multiple tabs share the same sessionId by default.
  * If you want one session per tab, use `sessionStorage` instead.
  * For this case (preserve across reloads), `localStorage` is correct.
  * If user opens same document in two tabs: both share same sessionId, heartbeats from both will merge — you can detect this via multiple concurrent heartbeats and choose to accept or ignore duplicates.

---

# 7) Testing checklist (step-by-step)

1. Host `tracking.html` to GitHub Pages; test at `https://tracking.example.com`.
2. Point `doc` param to a public Google Doc preview link (or any page). Open page — confirm iframe loads.
3. Setup n8n webhooks `/start`, `/heartbeat`, `/end` to simply log payloads first.
4. Open tracking page: confirm `/start` called and response `sessionId` stored in localStorage.
5. Confirm `/heartbeat` called every 5s (check n8n execution logs).
6. **Test reload**: press F5 — same sessionId reused (check console log), heartbeats continue.
7. **Test multiple reloads**: reload 3-4 times, verify same sessionId, accumulated time increases.
8. Close tab: ensure `/end` NOT called automatically (unless using finish button).
9. Test finish button: click "Finish" → `/end` received (sendBeacon), final duration computed.
10. Test manipulating client (DevTools) — try to POST fake `/end` without /start — n8n should reject (no record).
11. Test corner cases: long idle (>5 min) behavior and if inactivity doesn't add time (deltaMs > 5min → rejected).

---

# 8) Implementation tips / recommended defaults

* Heartbeat interval: **5s** (you chose) — good balance. Could increase to 10s to reduce load.
* Active threshold: consider `active` if lastActivity within 10s.
* Idle threshold to consider "inactive": 300s (5 min).
* TTL for session: 4 hours (or per-day).
* Storage: start with Google Sheets for speed; switch to PostgreSQL when stable.
* Use `navigator.sendBeacon` for reliable end sends.
* Show a visible **“Finish”** button on header to allow users to end session deliberately (good UX).

---

# 9) Example n8n node mapping (concise)

* Workflow A: Webhook `/start` → Set (generate sessionId) → Google Sheets Append Row → Respond.
* Workflow B: Webhook `/heartbeat` → Google Sheets Lookup (find session row) → If found: Update accumulatedActiveMs & lastHeartbeat → Respond.
* Workflow C: Webhook `/end` → Google Sheets Lookup → Function (calculate final activeSec) → Append final row / Update → Respond.

(If you prefer single workflow, use Switch node on incoming path to route start/heartbeat/end, but separate workflows simpler.)

---

# 10) Tradeoffs & final notes

* Pro: không cần server riêng (dùng n8n + GitHub Pages), dễ deploy, quick to iterate.
* Con: n8n storage model (Google Sheets) không as fast/reliable as Redis + DB for high scale. If scale grows, move sessions to Redis and use a small server to compute — or use a DB node in n8n with stronger ACID.
* Transparency: thông báo người dùng (vì cảm giác bị theo dõi). Tốt nhất hiển thị message: *“System records time for productivity stats only.”*

---

Nếu bạn muốn mình làm tiếp phần nào *thực tế* ngay bây giờ:

* A. Tạo sẵn n8n workflow JSON (3 webhook flows) để import?
* B. Viết final `tracking.html` (favicon + finish button + retry/backoff) sẵn cho bạn push lên GitHub Pages?
* C. Viết sample n8n workflow mapping sử dụng Google Sheets as session store?

Chọn 1 trong A/B/C và mình sẽ làm tiếp chi tiết (code + file ready-to-import).

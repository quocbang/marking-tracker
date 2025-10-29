# 1) Ý tưởng lớn (overview)

Mục tiêu: đo **t## B. Frontend behavior (tracking.html)

1. Khi trang load:

   * Lấy `name` và `doc` từ query string.
   * Kiểm tra `localStorage` có `sessionId` hợp lệ không (chưa expire):
     - **Có** → reuse session (cho phép reload, thời gian tiếp tục tích lũy)
     - **Không** → gọi `/start` để tạo session mới
   * Gán `iframe.src = doc` để hiển thị Google Doc.
2. Heartbeat:

   * Bắt event hoạt động để cập nhật `lastActivityTs`:
     - **User interaction**: `mousemove`, `keydown`, `click`, `scroll`, `touchstart` trên trang tracking
     - **Tab focus**: `window.focus`, `visibilitychange` (khi tab được focus hoặc chuyển từ hidden→visible)
     - **Iframe focus**: Khi user click vào Google Doc iframe, cập nhật `lastActivityTs`
   * Gửi POST `/heartbeat` mỗi 5s: `{ sessionId, ts, active }` (active = true nếu có activity trong 10s).
   * **Lưu ý**: Do cross-origin policy, không thể bắt trực tiếp sự kiện typing trong Google Doc. Chỉ có thể detect khi user focus vào iframe.
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
* **n8n workflow**: 4 workflows chính:
  - `/start`: Tạo tracking session mới
  - `/heartbeat`: Nhận heartbeat và cập nhật thời gian hoạt động
  - `/end`: Kết thúc session và tính toán metrics
  - **Status Monitor**: Tự động kết thúc session khi status thay đổi trên sheet "Bài Chấm"
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

   * Bắt event hoạt động để cập nhật `lastActivityTs`:
     - **User interaction**: `mousemove`, `keydown`, `click`, `scroll`, `touchstart` trên trang tracking
     - **Tab focus**: `window.focus`, `visibilitychange` (khi tab được focus hoặc chuyển từ hidden→visible)
     - **Iframe focus**: Khi user click vào Google Doc iframe, cập nhật `lastActivityTs`
   * Gửi POST `/heartbeat` mỗi 5s: `{ sessionId, ts, active }` (active = true nếu có activity trong 10s).
   * **Lưu ý**: Do cross-origin policy, không thể bắt trực tiếp sự kiện typing trong Google Doc. Chỉ có thể detect khi user focus vào iframe.
   * **Implementation code**:
     ```javascript
     // Track user interactions
     ['mousemove','keydown','click','scroll','touchstart'].forEach(evt=>{
       window.addEventListener(evt, ()=>{ lastActivityTs = Date.now(); });
     });
     
     // Track tab focus
     window.addEventListener('focus', ()=>{ lastActivityTs = Date.now(); });
     document.addEventListener('visibilitychange', ()=>{
       if (!document.hidden) lastActivityTs = Date.now();
     });
     
     // Track iframe focus (when user clicks into Google Doc)
     const iframe = document.getElementById('docFrame');
     iframe.addEventListener('load', ()=>{
       iframe.addEventListener('focus', ()=>{ lastActivityTs = Date.now(); });
     });
     ```
3. End:

   * Khi `beforeunload` (đóng tab/refresh) hoặc khi người dùng nhấn “Finish”, gọi `navigator.sendBeacon('/end', payload)` để đảm bảo gửi tin khi tab đóng.
   * Sau `end` có thể xóa `localStorage` sessionId (tuỳ policy).
4. LocalStorage:

   * Lưu `sessionId` kèm `expiresAt` để survive reload nhưng không tồn tại vô hạn.
   * Điều này ngăn reload tạo session mới.

---

## C. n8n workflow (serverless-style)

Bạn chuyển logic server vào n8n nodes. Mô tả 4 workflows chính:

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
  * **Only add delta to `accumulatedActiveMs` if `active == true`** (user is actively interacting).
  * Cap delta at maximum 5 minutes to prevent huge jumps from network issues.
  * Update `lastHeartbeat = now`, refresh `ttlAt`.
  * (Optional) store raw heartbeat row for debugging.

**Important:** Time is only accumulated when the user is actually active (has interacted within the last 45 seconds). If the user switches tabs or stops interacting, heartbeats will have `active=false` and no time will be added to `accumulatedActiveMs`, even though heartbeats continue to be sent.

### 3) `/end` webhook

* Input: `{ sessionId, reason, ts }` (sent by sendBeacon)
* Steps:

  * Lookup session by `sessionId`. If not found / already used → return error.
  * **Calculate final active duration**:
    - Get `endTimeMs` (current time), `lastHeartbeatMs`, `accumulatedActiveMs`, `startTimeMs` from session
    - Calculate `finalDeltaMs = endTimeMs - lastHeartbeatMs` (gap between last heartbeat and end)
    - If `0 < finalDeltaMs < 30000` (< 30 seconds), add it to accumulated time: `finalAccumulatedActiveMs = accumulatedActiveMs + finalDeltaMs`
    - Otherwise: `finalAccumulatedActiveMs = accumulatedActiveMs`
    - Convert to seconds: `activeSec = round(finalAccumulatedActiveMs / 1000)`
    - Apply sanity check: `activeSec = min(activeSec, 43200)` (cap at 12 hours)
  * **Calculate metrics**:
    - `totalElapsedSec = round((endTimeMs - startTimeMs) / 1000)` (total time from start to end)
    - `activityPercentage = round((activeSec / totalElapsedSec) * 100)` if totalElapsedSec > 0, else 0
    - `activeMinutes = round(activeSec / 60 * 10) / 10` (rounded to 1 decimal place)
  * Mark session as `used = true`; update session record with final metrics
  * Write final row to Completed sheet: `{ sessionId, name, docUrl, startTime, endTime, activeSec, activeMinutes, totalElapsedSec, activityPercentage, reason }`
  * Respond OK with final metrics

**Calculation pseudo-code**:
```python
# Get session data
endTimeMs = current_timestamp_ms
lastHeartbeatMs = session.lastHeartbeatMs
accumulatedActiveMs = session.accumulatedActiveMs
startTimeMs = session.startTimeMs

# Handle final gap (time between last heartbeat and end)
finalDeltaMs = endTimeMs - lastHeartbeatMs
finalAccumulatedActiveMs = accumulatedActiveMs
if 0 < finalDeltaMs < 30000:  # If gap < 30 seconds, count it as active
    finalAccumulatedActiveMs += finalDeltaMs

# Convert to seconds and apply limits
activeSec = round(finalAccumulatedActiveMs / 1000)
activeSec = min(activeSec, 43200)  # Max 12 hours

# Calculate additional metrics
totalElapsedSec = round((endTimeMs - startTimeMs) / 1000)
activityPercentage = round((activeSec / totalElapsedSec) * 100) if totalElapsedSec > 0 else 0
activeMinutes = round(activeSec / 60 * 10) / 10
```

### 4) Status Monitor workflow (NEW)

* **Purpose**: Automatically end tracking session when status is updated on "Bài Chấm" sheet
* **Trigger**: Google Sheets Trigger (polls every 1 minute by default)
* **Input**: Row changes from sheet "Bài Chấm"
* **Steps**:
  
  1. **Monitor "Bài Chấm" Sheet**: Poll for changes (every 1 min)
  2. **Check Status = "Đã chữa"**: 
     - Column "Trạng Thái" equals "Đã chữa"
     - Row has valid `sessionId`
  3. **Lookup Session**: Find session in "Sessions" sheet by `sessionId`
  4. **Check Session Not Used**: Verify `used = FALSE`
  5. **Call End Endpoint**: HTTP POST to `/end` with:
     ```json
     {
       "sessionId": "...",
       "reason": "status_updated",
       "ts": "current_timestamp"
     }
     ```

* **Requirements**:
  - Sheet "Bài Chấm" must have columns: `sessionId`, `Trạng Thái`
  - Link between "Bài Chấm" and "Sessions" via `sessionId`
  - Proper gid configuration for "Bài Chấm" sheet

* **Edge Cases Handled**:
  - User closes tab + status updated simultaneously → only one `/end` call (checks `used` flag)
  - Status updated multiple times → only first update triggers `/end` (subsequent calls ignored as `used=TRUE`)
  - No sessionId in row → ignored
  - Session already ended → ignored

* **Benefits**:
  - Dual termination methods: manual (Finish button) OR automatic (status update)
  - Synchronization between grading workflow and time tracking
  - No need for user to manually close tracking page after finishing

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
* Active threshold: consider `active` if lastActivity within **30-60s** (increased from 10s to account for reading/thinking time).
* Idle threshold to consider "inactive": 300s (5 min).
* **Activity detection**: Track not only mouse/keyboard events but also tab focus and iframe focus to capture reading/grading behavior.
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

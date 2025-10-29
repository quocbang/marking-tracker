# n8n Tracking Workflows

This directory contains three n8n workflows for the marking-tracker system that measure real active time spent on Google Docs.

## Overview

The system consists of three webhook endpoints:
1. **`/start`** - Creates a new tracking session
2. **`/heartbeat`** - Updates session with activity heartbeats (every 5 seconds)
3. **`/end`** - Finalizes the session and calculates total active time

## Prerequisites

1. **n8n instance** (v1.84.3 or later)
   - Cloud: https://n8n.io
   - Self-hosted: https://docs.n8n.io/hosting/

2. **Google Sheets** with two sheets:
   - **Sheet 1: "Sessions"** (active sessions)
   - **Sheet 2: "Completed"** (finished sessions)

3. **Google Sheets API credentials** configured in n8n

## Google Sheets Setup

### Sheet 1: "Sessions" (gid=0)
Create a sheet with these columns:

| Column | Type | Description |
|--------|------|-------------|
| sessionId | string | Unique session identifier |
| name | string | User name |
| docUrl | string | Google Doc URL |
| startTime | string | ISO timestamp when session started |
| startTimeMs | number | Milliseconds timestamp for calculations |
| lastHeartbeat | string | ISO timestamp of last heartbeat |
| lastHeartbeatMs | number | Milliseconds timestamp for delta calculations |
| accumulatedActiveMs | number | Total active time in milliseconds |
| used | boolean | Whether session has ended (false=active, true=ended) |
| ttlAt | string | Session expiry time (4 hours from creation) |
| endTime | string | ISO timestamp when session ended |
| endTimeMs | number | Milliseconds timestamp of end |
| reason | string | End reason (closed, finished, etc.) |
| activeSec | number | Final active time in seconds |
| activeMinutes | number | Final active time in minutes (1 decimal) |
| totalElapsedSec | number | Total elapsed time from start to end |
| activityPercentage | number | Percentage of time user was active |
| finalAccumulatedActiveMs | number | Final accumulated active time |

### Sheet 2: "Completed" (gid=1)
Create a sheet with these columns:

| Column | Type | Description |
|--------|------|-------------|
| sessionId | string | Unique session identifier |
| name | string | User name |
| docUrl | string | Google Doc URL |
| startTime | string | Session start time |
| endTime | string | Session end time |
| activeSec | number | Total active seconds |
| activeMinutes | number | Total active minutes (1 decimal) |
| totalElapsedSec | number | Total elapsed seconds |
| activityPercentage | number | Activity percentage |
| reason | string | End reason |

## Installation Steps

### 1. Import Workflows

1. Open n8n
2. Click **"Workflows"** → **"Add workflow"** → **"Import from file"**
3. Import each workflow:
   - `1-start-workflow.json`
   - `2-heartbeat-workflow.json`
   - `3-end-workflow.json`

### 2. Configure Google Sheets

For each workflow, update the Google Sheets nodes:

1. Click on any **Google Sheets** node
2. Update `documentId`: Replace `YOUR_GOOGLE_SHEET_ID` with your actual Google Sheet ID
   - Find in URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Configure credentials:
   - Click **"Credential to connect with"**
   - Select or create Google Sheets OAuth2 credentials
   - Follow authentication flow

### 3. Activate Webhooks

1. **Start Workflow**:
   - Open workflow → Click **"Webhook Start"** node
   - Note the webhook URL (e.g., `https://your-n8n.app/webhook/start`)
   - Activate workflow (toggle in top-right)

2. **Heartbeat Workflow**:
   - Same process, note URL ending in `/heartbeat`

3. **End Workflow**:
   - Same process, note URL ending in `/end`

### 4. Update Frontend

Update your `tracking.html` to use the webhook URLs:

```javascript
const API_BASE_URL = 'https://your-n8n.app/webhook';

// In your code:
const startUrl = `${API_BASE_URL}/start`;
const heartbeatUrl = `${API_BASE_URL}/heartbeat`;
const endUrl = `${API_BASE_URL}/end`;
```

## Workflow Details

### 1. Start Workflow (`/start`)

**Input (POST request body):**
```json
{
  "name": "Thai",
  "docUrl": "https://docs.google.com/document/d/ABC123"
}
```

**Output:**
```json
{
  "sessionId": "Thai-2025-10-29-1730198400000-0",
  "ttlMs": 14400000,
  "startTime": "2025-10-29T10:00:00.000Z"
}
```

**Flow:**
1. Receives name and docUrl
2. Generates unique sessionId
3. Creates session record in "Sessions" sheet
4. Returns sessionId and TTL to client

### 2. Heartbeat Workflow (`/heartbeat`)

**Input (POST request body):**
```json
{
  "sessionId": "Thai-2025-10-29-1730198400000-0",
  "ts": "2025-10-29T10:00:05.000Z",
  "active": true
}
```

**Output:**
```json
{
  "status": "ok",
  "sessionId": "Thai-2025-10-29-1730198400000-0",
  "deltaMs": 5000,
  "accumulatedActiveMs": 5000
}
```

**Flow:**
1. Looks up session by sessionId
2. Validates session exists and not used
3. Calculates time delta from last heartbeat
4. If `active=true` OR delta < 30s, adds delta to accumulated time
5. Updates session with new accumulated time and lastHeartbeat
6. Caps max delta at 5 minutes to prevent abuse

**Logic:**
- Only counts time if user is active OR gap is small (< 30s)
- Rejects large gaps (> 5 min) to prevent manipulation
- Refreshes TTL on each heartbeat

### 3. End Workflow (`/end`)

**Input (POST request body - via navigator.sendBeacon):**
```json
{
  "sessionId": "Thai-2025-10-29-1730198400000-0",
  "ts": "2025-10-29T10:12:30.000Z",
  "reason": "closed"
}
```

**Output:**
```json
{
  "status": "ok",
  "sessionId": "Thai-2025-10-29-1730198400000-0",
  "activeSec": 720,
  "activeMinutes": 12.0,
  "activityPercentage": 96
}
```

**Flow:**
1. Looks up session by sessionId
2. Validates session exists and not used
3. Calculates final delta (time since last heartbeat)
4. Adds final delta if < 30s
5. Converts accumulated milliseconds to seconds
6. Applies sanity checks (max 12 hours)
7. Calculates activity percentage
8. Marks session as used in "Sessions" sheet
9. Appends final results to "Completed" sheet

**Sanity Checks:**
- Max duration: 12 hours (43,200 seconds)
- Only adds final delta if < 30 seconds
- Prevents double-ending (checks `used` flag)

## Security Features

1. **Session Validation**: All endpoints verify session exists and hasn't been used
2. **Time Caps**: Maximum 5-minute delta per heartbeat, 12-hour total duration
3. **Single-Use Sessions**: Sessions marked as `used=true` after ending
4. **TTL**: Sessions expire after 4 hours
5. **CORS Headers**: Configured for cross-origin requests

## Testing

### Manual Testing

1. **Test Start**:
```bash
curl -X POST https://your-n8n.app/webhook/start \
  -H "Content-Type: application/json" \
  -d '{"name":"TestUser","docUrl":"https://docs.google.com/document/d/test"}'
```

2. **Test Heartbeat** (use sessionId from start):
```bash
curl -X POST https://your-n8n.app/webhook/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"TestUser-2025-10-29-1730198400000-0","ts":"2025-10-29T10:00:05.000Z","active":true}'
```

3. **Test End**:
```bash
curl -X POST https://your-n8n.app/webhook/end \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"TestUser-2025-10-29-1730198400000-0","ts":"2025-10-29T10:12:30.000Z","reason":"finished"}'
```

### Check Results

1. Open your Google Sheet
2. Check "Sessions" sheet for active session
3. Check "Completed" sheet for finished session with calculated times

## Monitoring

### n8n Execution Logs

1. Go to **"Executions"** in n8n
2. View execution history for each workflow
3. Check for errors or failed executions

### Google Sheets Analytics

Create formulas in your Google Sheet:

```
// Average active time
=AVERAGE(Completed!F:F)

// Total sessions today
=COUNTIF(Completed!D:D, ">="&TODAY())

// Activity percentage distribution
=AVERAGEIF(Completed!I:I, ">0")
```

## Troubleshooting

### Common Issues

1. **"Session not found" error**
   - Check sessionId matches exactly
   - Verify session wasn't already ended
   - Check TTL hasn't expired

2. **Google Sheets not updating**
   - Verify credentials are valid
   - Check sheet permissions (edit access)
   - Ensure column names match exactly

3. **Webhook not responding**
   - Verify workflow is active
   - Check n8n execution logs
   - Test webhook URL in browser

4. **Large accumulated times**
   - Check heartbeat interval (should be 5s)
   - Verify active flag logic in frontend
   - Review delta calculations in workflow

## Optimization Tips

1. **For high traffic**: Consider using PostgreSQL instead of Google Sheets
2. **For better performance**: Cache session lookups in Redis
3. **For analytics**: Use Looker Studio connected to Google Sheets
4. **For debugging**: Enable raw heartbeat logging (add append node in heartbeat workflow)

## Next Steps

1. Add HMAC signing to sessionId for security
2. Implement rate limiting per IP
3. Add user authentication
4. Create dashboard for real-time monitoring
5. Add notifications for long sessions

## Support

- n8n Docs: https://docs.n8n.io
- Community Forum: https://community.n8n.io
- GitHub Issues: Create issue in your repo

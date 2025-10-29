# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid time value" Error in Calculate Delta Node

**Error Message:**
```
Error: Invalid time value [line 33]
```

**Cause:**
The `currentTimeMs` variable was undefined because after the Google Sheets lookup, the data from the "Extract Heartbeat Data" node was being overwritten.

**Solution:**
Updated the "Calculate Delta" code to:
- Use `Date.now()` directly instead of relying on passed `currentTimeMs`
- Add `parseInt()` to ensure numeric values from Google Sheets
- Add fallback values for safety

**Fixed Code:**
```javascript
// Get current time directly
const currentTimeMs = Date.now();

// Parse values from Google Sheets (they might come as strings)
const lastHeartbeatMs = parseInt(item.lastHeartbeatMs) || Date.now();
const accumulatedActiveMs = parseInt(item.accumulatedActiveMs) || 0;
```

### 2. Missing `ttlMs` in Start Response

**Symptom:**
Start API returns:
```json
{
    "sessionId": "bangthong-2025-10-29-1761701339293-0",
    "startTime": "2025-10-29T08:28:59.295+07:00"
}
```

But `ttlMs` is missing.

**Expected Response:**
```json
{
    "sessionId": "bangthong-2025-10-29-1761701339293-0",
    "ttlMs": 14400000,
    "startTime": "2025-10-29T08:28:59.295+07:00"
}
```

**Cause:**
The "Set Session Data" node might not be properly setting the `ttlMs` field, or the Google Sheets append is not passing it through.

**Solution:**
Check that the "Set Session Data" node has this assignment:
```json
{
  "id": "ttlMs",
  "name": "ttlMs",
  "value": "=14400000",
  "type": "number"
}
```

### 3. Session Not Found on Heartbeat

**Symptom:**
Heartbeat returns 404:
```json
{
  "status": "error",
  "message": "Session not found or already used"
}
```

**Possible Causes:**

1. **Session not created yet**
   - Check Google Sheets "Sessions" sheet
   - Verify the start API was called successfully

2. **SessionId mismatch**
   - Frontend sessionId: `bangthong-2025-10-29-1761701339293-0`
   - Google Sheets sessionId must match exactly
   - Check for extra spaces or formatting issues

3. **Session already ended**
   - Check if `used` column is `TRUE`
   - Once ended, session cannot receive heartbeats

**Debug Steps:**
```bash
# 1. Test start endpoint
curl -X POST https://your-n8n.app/webhook/marking-log/start \
  -H "Content-Type: application/json" \
  -d '{"name":"test","docUrl":"https://example.com"}'

# 2. Check Google Sheets manually for the session row

# 3. Test heartbeat with the exact sessionId
curl -X POST https://your-n8n.app/webhook/marking-log/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"EXACT_SESSION_ID","ts":"2025-10-29T10:00:05.000Z","active":true}'
```

### 4. Google Sheets Type Errors

**Symptom:**
Boolean or number values not working correctly in conditions.

**Solution:**
Google Sheets can return values as strings. Always parse:

```javascript
// For numbers
const value = parseInt(item.fieldName) || 0;
const valueMs = parseInt(item.lastHeartbeatMs) || Date.now();

// For booleans
const isUsed = item.used === true || item.used === 'true' || item.used === 'TRUE';
```

### 5. CORS Errors from Frontend

**Symptom:**
```
Access to fetch at 'https://n8n...' from origin 'https://...' has been blocked by CORS policy
```

**Solution:**
Check all webhook response nodes have CORS headers:
```json
{
  "responseHeaders": {
    "entries": [
      {
        "name": "Access-Control-Allow-Origin",
        "value": "*"
      },
      {
        "name": "Access-Control-Allow-Methods",
        "value": "POST, OPTIONS"
      },
      {
        "name": "Access-Control-Allow-Headers",
        "value": "Content-Type"
      }
    ]
  }
}
```

### 6. Heartbeat Not Updating Accumulated Time

**Symptom:**
`accumulatedActiveMs` stays at 0 even though heartbeats are being sent.

**Possible Causes:**

1. **`active` flag always false**
   - Check frontend logic: `(Date.now() - lastActivityTs) < 10000`
   - Verify user events are being captured

2. **Delta too large**
   - If gap > 5 minutes, delta is ignored
   - Check heartbeat interval is 5 seconds

3. **Google Sheets update failing**
   - Check n8n execution logs
   - Verify Google Sheets credentials

**Debug:**
Check the heartbeat response for `deltaMs` and `accumulatedActiveMs`:
```json
{
  "status": "ok",
  "sessionId": "...",
  "deltaMs": 5000,  // Should be ~5000ms
  "accumulatedActiveMs": 5000  // Should increase each heartbeat
}
```

### 7. Activity Percentage is 0 or Wrong

**Symptom:**
After ending session, `activityPercentage` is 0 or doesn't match expectations.

**Cause:**
This is calculated in the end workflow:
```javascript
activityPercentage = (activeSec / totalElapsedSec) * 100
```

**Debug:**
Check the "Completed" sheet values:
- `activeSec`: Total active time in seconds
- `totalElapsedSec`: Total time from start to end
- `activityPercentage`: Should be (activeSec / totalElapsedSec) * 100

**Common Issues:**
- `totalElapsedSec` is 0 (start and end times are the same)
- `activeSec` is 0 (no heartbeats were active)
- Timezone issues causing wrong time calculations

## Best Practices

1. **Always check n8n execution logs** for detailed error messages
2. **Monitor Google Sheets** to see actual data being written
3. **Test with curl** before testing with frontend
4. **Use n8n's "Test workflow"** feature to debug individual nodes
5. **Add console logging** in Code nodes for debugging:
   ```javascript
   console.log('Current Time:', currentTimeMs);
   console.log('Last Heartbeat:', lastHeartbeatMs);
   console.log('Delta:', deltaMs);
   ```

## Getting Help

If you encounter an issue not covered here:

1. Check n8n execution logs (Executions → Click on failed execution)
2. Verify Google Sheets data matches expected format
3. Test each workflow independently with curl
4. Check browser console for frontend errors
5. Verify all webhook URLs are correct and active

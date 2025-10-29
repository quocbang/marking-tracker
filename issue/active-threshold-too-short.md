# Issue: Active Threshold Too Short for Teacher Grading Behavior

## Status
🟡 **OPEN** - Pending Implementation

## Created
- **Date**: 2025-10-29
- **Reporter**: System Analysis

## Priority
🔴 **HIGH** - Affects accuracy of time tracking

---

## Problem Description

### Current Behavior
- System considers user "active" only if there's interaction within **10 seconds**
- Activities tracked: `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
- If no interaction for ≥10 seconds → `active = false` → time NOT counted

### Issue
When teachers grade student essays, they need to:
1. **Read carefully** - no mouse/keyboard interaction
2. **Think and evaluate** - consider content quality
3. **Decide on scoring** - mental process requiring time

During these cognitive activities (reading/thinking), there's typically **NO interaction** for 30-60 seconds or longer, causing significant **underreporting** of actual grading time.

---

## Impact Analysis

### Time Loss Example
```
Real grading session: 20 minutes
- Reading/thinking time: 12 minutes (no interaction)
- Active interaction time: 8 minutes

Current system records: ~8 minutes ❌
Actual time spent: 20 minutes ✅

→ 60% time loss!
```

### User Experience
- Teachers feel their effort is not accurately tracked
- Analytics show artificially low grading times
- Cannot accurately measure teacher workload

---

## Root Cause

**Code Location**: `index.html` line ~65
```javascript
body.active = (Date.now() - lastActivityTs) < 10000;
```

The 10-second threshold is too aggressive for cognitive work patterns.

---

## Proposed Solutions

### Solution 1: Increase Active Threshold (Recommended)
**Change threshold from 10s → 45-60s**

```javascript
// Current
body.active = (Date.now() - lastActivityTs) < 10000; // 10s

// Proposed
body.active = (Date.now() - lastActivityTs) < 45000; // 45s
```

**Pros:**
- Simple one-line change
- Accounts for reading/thinking time
- Still detects genuine inactivity (>1 minute)

**Cons:**
- May count some idle time if teacher gets distracted

---

### Solution 2: Add Tab Visibility Detection
Track whether page is visible/focused

```javascript
// Check if tab is visible
const isTabVisible = !document.hidden;
body.active = isTabVisible || (Date.now() - lastActivityTs) < 10000;
```

**Pros:**
- More accurate - if tab visible, user likely working
- Complements interaction tracking

**Cons:**
- Doesn't detect if user switches to another tab temporarily

---

### Solution 3: Hybrid Approach (Best)
Combine multiple signals:

```javascript
const timeSinceActivity = Date.now() - lastActivityTs;
const isTabVisible = !document.hidden;

// Active if:
// - Tab visible AND recent activity (<60s), OR
// - Very recent activity (<15s) even if tab hidden
body.active = (isTabVisible && timeSinceActivity < 60000) || 
              (timeSinceActivity < 15000);
```

**Pros:**
- Most accurate representation of actual work
- Balances all factors

**Cons:**
- Slightly more complex logic

---

## Implementation Plan

1. **Research Phase**
   - [ ] Study typical teacher grading patterns
   - [ ] Analyze average reading time per paragraph
   - [ ] Review existing heartbeat logs for activity gaps

2. **Code Changes**
   - [ ] Update active threshold in `index.html`
   - [ ] Add tab visibility detection
   - [ ] Test various threshold values (30s, 45s, 60s)

3. **Testing**
   - [ ] Conduct A/B testing with different thresholds
   - [ ] Gather feedback from actual teachers
   - [ ] Compare recorded vs. self-reported times

4. **Documentation**
   - [ ] Update `docs/design/idea.md` with new threshold
   - [ ] Document decision rationale
   - [ ] Add to changelog

---

## Testing Scenarios

### Scenario 1: Continuous Reading
- Teacher reads for 2 minutes without interaction
- **Expected**: Time should be counted
- **Current**: Only first 10s counted ❌

### Scenario 2: Reading + Scrolling
- Teacher scrolls every 30s while reading
- **Expected**: All time counted
- **Current**: Gaps between scrolls not counted ❌

### Scenario 3: Genuine Break
- Teacher leaves desk for 5 minutes
- **Expected**: Time NOT counted
- **Current**: Correctly not counted ✅

---

## Metrics to Track

After implementation, monitor:
- Average session duration (should increase)
- Active time percentage (should increase from ~40% to ~80%)
- Teacher feedback on accuracy
- Comparison with manual time tracking

---

## References

- **Related Files**: 
  - `index.html` (frontend tracking logic)
  - `docs/design/idea.md` (system design)
  - `n8n-workflows/2-heartbeat-workflow.json` (backend processing)

- **Related Issues**:
  - None yet

---

## Notes

- This is a **fundamental issue** affecting data accuracy
- Should be prioritized before production deployment
- Consider teacher feedback essential for validation

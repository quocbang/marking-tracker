# Issue Tracking - Marking Tracker Project

> **Last Updated**: 2025-10-29

This file tracks all issues, bugs, features, and technical debt for the Marking Tracker project.

---

## 📊 Summary

| Status | Count |
|--------|-------|
| 🟡 Open | 0 |
| 🟢 Fixed | 1 |
| 🔵 In Progress | 0 |
| ⚪ Closed | 0 |
| **Total** | **1** |

---

## 🟡 Open Issues

_No open issues_

---

## 🔵 In Progress

_No issues currently in progress_

---

## 🟢 Fixed Issues

| ID | Issue Name | Priority | Created | Fixed Date | File | Description | Solution |
|----|------------|----------|---------|------------|------|-------------|----------|
| #001 | Active Threshold Too Short | 🔴 HIGH | 2025-10-29 | 2025-10-29 | [active-threshold-too-short.md](active-threshold-too-short.md) | Current 10s active threshold doesn't capture reading/thinking time during grading | Increased threshold to 45s, added tab focus & iframe focus tracking |

---

## ⚪ Closed Issues

_No issues closed yet_

---

## 📋 Issue Templates

### Creating a New Issue

1. Create a new file: `./issue/{issue-name}.md`
2. Use the template below
3. Add entry to this ISSUE_LIST.md
4. Commit both files

### Issue File Template

```markdown
# Issue: [Title]

## Status
🟡 **OPEN** | 🔵 **IN PROGRESS** | 🟢 **FIXED** | ⚪ **CLOSED**

## Created
- **Date**: YYYY-MM-DD
- **Reporter**: [Name]

## Priority
🔴 **HIGH** | 🟠 **MEDIUM** | 🟢 **LOW**

---

## Problem Description
[Describe the issue clearly]

## Impact Analysis
[How does this affect users/system?]

## Root Cause
[Technical details, code location]

## Proposed Solutions
[List possible solutions with pros/cons]

## Implementation Plan
- [ ] Step 1
- [ ] Step 2

## Testing Scenarios
[How to verify the fix]

## References
- Related files
- Related issues
```

---

## 🏷️ Labels & Categories

### Priority Levels
- 🔴 **HIGH**: Critical issues affecting core functionality or data accuracy
- 🟠 **MEDIUM**: Important issues that should be addressed soon
- 🟢 **LOW**: Nice-to-have improvements or minor bugs

### Categories
- 🐛 **Bug**: Something isn't working correctly
- ✨ **Feature**: New functionality request
- 📈 **Enhancement**: Improvement to existing feature
- 🔧 **Technical Debt**: Code quality, refactoring needs
- 📚 **Documentation**: Docs need updating
- 🔒 **Security**: Security-related issues

---

## 📝 Update Process

### When Opening an Issue
1. Create detailed issue file in `./issue/`
2. Add row to "Open Issues" section above
3. Update summary counts
4. Commit with message: `docs: add issue #XXX - [title]`

### When Starting Work
1. Move issue from "Open" to "In Progress"
2. Update status in issue file to 🔵 **IN PROGRESS**
3. Commit with message: `docs: start work on issue #XXX`

### When Fixing an Issue
1. Implement the fix
2. Update status in issue file to 🟢 **FIXED**
3. Move issue from "In Progress" to "Fixed"
4. Add "Fixed Date" and "Fixed By" to issue file
5. Update summary counts
6. Commit with message: `fix: resolve issue #XXX - [title]`

### When Closing an Issue
1. Update status to ⚪ **CLOSED**
2. Move to "Closed Issues" section
3. Add closure reason/notes
4. Update summary counts

---

## 🔍 Quick Search

Find issues by category:
```bash
# List all open issues
grep "🟡 Open" issue/*.md

# List high priority issues
grep "🔴 HIGH" issue/*.md

# Search for specific keyword
grep -r "threshold" issue/*.md
```

---

## 📞 Contact

For questions about issue tracking:
- Check existing issues first
- Create new issue using template
- Update this file when status changes

---

_This file is auto-maintained. Keep it updated when creating, fixing, or closing issues._

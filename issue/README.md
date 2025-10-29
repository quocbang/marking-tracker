# Issue Tracking System

This directory contains all tracked issues for the Marking Tracker project.

## 📁 Directory Structure

```
issue/
├── README.md                          # This file - overview of issue system
├── ISSUE_LIST.md                      # Master list tracking all issues
└── {issue-name}.md                    # Individual issue files
```

## 🚀 Quick Start

### View All Issues
Open [`ISSUE_LIST.md`](ISSUE_LIST.md) to see the master list with status, priority, and links to detailed files.

### Create New Issue
1. Copy the template from `ISSUE_LIST.md`
2. Create new file: `./issue/{descriptive-name}.md`
3. Fill in all sections
4. Add entry to `ISSUE_LIST.md`
5. Commit both files

### Update Issue Status
1. Edit the individual issue file
2. Update status emoji (🟡→🔵→🟢→⚪)
3. Update corresponding entry in `ISSUE_LIST.md`
4. Update summary counts in `ISSUE_LIST.md`

## 📊 Status Flow

```
🟡 OPEN → 🔵 IN PROGRESS → 🟢 FIXED → ⚪ CLOSED
```

- **🟡 OPEN**: Issue identified, not started
- **🔵 IN PROGRESS**: Actively being worked on
- **🟢 FIXED**: Implementation complete, needs verification
- **⚪ CLOSED**: Verified and closed

## 🏷️ Priority Levels

- **🔴 HIGH**: Critical - affects core functionality or data accuracy
- **🟠 MEDIUM**: Important - should be addressed soon
- **🟢 LOW**: Nice-to-have - can be deferred

## 📝 Issue File Format

Each issue file should contain:

1. **Header**: Title, status, metadata
2. **Problem Description**: What's wrong?
3. **Impact Analysis**: Who/what is affected?
4. **Root Cause**: Technical details
5. **Proposed Solutions**: Options with pros/cons
6. **Implementation Plan**: Step-by-step checklist
7. **Testing Scenarios**: How to verify the fix
8. **References**: Related files, issues, docs

## 🔍 Finding Issues

### By Status
```bash
# Open issues
grep "🟡 \*\*OPEN\*\*" issue/*.md

# In progress
grep "🔵 \*\*IN PROGRESS\*\*" issue/*.md

# Fixed issues
grep "🟢 \*\*FIXED\*\*" issue/*.md
```

### By Priority
```bash
# High priority
grep "🔴 \*\*HIGH\*\*" issue/*.md

# Medium priority
grep "🟠 \*\*MEDIUM\*\*" issue/*.md
```

### By Keyword
```bash
# Search all issues
grep -r "keyword" issue/*.md

# Search only open issues
grep -l "🟡 OPEN" issue/*.md | xargs grep "keyword"
```

## 📂 Current Issues

See [`ISSUE_LIST.md`](ISSUE_LIST.md) for the complete, up-to-date list.

## 🤝 Best Practices

### Writing Good Issues
- **Be specific**: Clear problem statement
- **Provide context**: Why is this important?
- **Include examples**: Show the problem with examples
- **Propose solutions**: Don't just complain, suggest fixes
- **Link references**: Related code, docs, issues

### Maintaining Issues
- **Update regularly**: Keep status current
- **Cross-reference**: Link related issues
- **Document decisions**: Record why a solution was chosen
- **Close when done**: Don't leave issues hanging

### Commit Messages
```bash
# Creating issue
git commit -m "docs: add issue #001 - active threshold too short"

# Starting work
git commit -m "docs: start work on issue #001"

# Fixing issue
git commit -m "fix: resolve issue #001 - increase active threshold to 45s"

# Closing issue
git commit -m "docs: close issue #001 - verified in production"
```

## 🛠️ Tools & Scripts

### List All Open Issues
```bash
grep "🟡 Open" issue/ISSUE_LIST.md
```

### Count Issues by Status
```bash
grep -c "🟡 \*\*OPEN\*\*" issue/*.md
grep -c "🔵 \*\*IN PROGRESS\*\*" issue/*.md
grep -c "🟢 \*\*FIXED\*\*" issue/*.md
```

### Generate Issue Report
```bash
echo "=== OPEN ISSUES ==="
grep -l "🟡 \*\*OPEN\*\*" issue/*.md | while read f; do
  echo "- $(basename $f)"
  grep "## Problem Description" -A 1 "$f" | tail -1
done
```

## 📚 Resources

- [ISSUE_LIST.md](ISSUE_LIST.md) - Master tracking file
- [../docs/design/idea.md](../docs/design/idea.md) - System design document
- [../README.md](../README.md) - Project README

## 💡 Tips

1. **Check before creating**: Search existing issues first
2. **One issue per file**: Don't combine multiple problems
3. **Update ISSUE_LIST.md**: Always keep master list in sync
4. **Use templates**: Consistent format helps readability
5. **Document thoroughly**: Future you will thank you

---

_For questions or suggestions about the issue tracking system, create an issue about it!_

# Dũng English Speaking - Marking & Submission System

A comprehensive system for tracking marking time and managing student submissions for English speaking exercises.

## Components

### 1. Marking Tracker

Real-time tracking system for measuring teacher marking activity on Google Docs. Available in two implementations:

#### Option A: Web App (`index.html`) - Quick Start
Iframe-based web application that embeds Google Docs.

**Features:**
- ✅ No installation required - works immediately
- ✅ Cross-platform (any browser)
- ✅ Activity detection (mouse, keyboard, focus events)
- ✅ Session persistence across page reloads
- ✅ Google Sheets integration for data storage
- ✅ Automated reporting and analytics
- ⚠️ Some console warnings from Google Docs (harmless)
- ⚠️ Limited iframe integration due to CSP policies

**Technologies:** HTML/CSS/JavaScript, n8n workflows, Google Sheets

**Use When:** You need immediate access without installing anything.

#### Option B: Chrome Extension (`chrome-extension/`) - Enhanced Integration
Native Chrome extension that integrates directly with Google Docs.

**Features:**
- ✅ **No console errors** - proper Chrome extension APIs
- ✅ **Better performance** - direct page access, no iframe
- ✅ **Enhanced tracking** - full access to Google Docs events
- ✅ **Background processing** - service worker manages sessions
- ✅ **Multi-tab support** - track multiple documents simultaneously
- ✅ **Floating action button** - injected directly into Google Docs
- ✅ **Offline capability** - works without internet for tracking
- ✅ **Settings page** - customizable preferences
- ✅ **Statistics dashboard** - daily and total session counts
- ❌ Requires manual installation (one-time setup)
- ❌ Chrome/Edge only

**Technologies:** Chrome Extension Manifest V3, Service Workers, Content Scripts

**Use When:** You want the best performance and integration quality.

**Installation:**
1. Download or clone this repository
2. Open Chrome → Extensions → Enable "Developer mode"
3. Click "Load unpacked" → Select `chrome-extension/` folder
4. Extension installed! See [chrome-extension/README.md](chrome-extension/README.md) for details

**Comparison:**

| Feature | Web App | Chrome Extension |
|---------|---------|------------------|
| Installation | None (instant) | One-time manual |
| Console Errors | Yes (harmless) | No |
| Performance | Good | Excellent |
| Integration | Limited (iframe) | Full (native) |
| Multi-tab | Manual | Automatic |
| Platform | Any browser | Chrome/Edge only |
| Updates | Automatic | Manual reload |
| **Best For** | Quick access | Daily use |

### 2. Student Submission Portal (`submit.html`)
Student-facing form for submitting speaking exercise audio files.

**Features:**
- **Multiple file upload** with drag-and-drop support (MP3, WAV, M4A)
- **Real-time progress tracking** for individual files and overall progress
- Form validation and progress indicators
- Individual file management (add/remove files)
- Automatic email confirmations with file count
- Integration with marking workflow

**Technologies:** HTML/CSS/JavaScript, n8n workflows, Google Drive

#### Progress Tracking Implementation

The submission form implements sophisticated progress tracking to provide users with clear feedback during long uploads (1-3 minutes per file):

**Individual File Progress:**
- Each file shows real-time upload percentage (0-100%)
- Visual progress bar with gradient colors
- Status indicators: "Chờ tải lên" → "Đang tải lên..." → "Hoàn thành ✓" → "Lỗi tải lên ✗"
- Color-coded states: Blue (uploading), Green (completed), Red (error)

**Overall Progress:**
- Combined progress bar showing total completion across all files
- Calculated as: `(completed_files / total_files) * 100`

**Technical Implementation:**
- Uses `XMLHttpRequest` instead of `fetch` for upload progress events
- Files uploaded sequentially (one at a time) to prevent server overload
- `xhr.upload.addEventListener('progress')` tracks bytes uploaded vs total bytes
- Real-time DOM updates for progress bars and status text
- Error handling per file with visual feedback

**Upload Flow:**
```
1. User selects multiple files
2. Form validates files (type, size, duplicates)
3. Sequential upload begins:
   - File 1: Upload → Progress 0-100% → Complete
   - File 2: Upload → Progress 0-100% → Complete
   - ...
4. Overall progress updates with each completed file
5. Email confirmation sent with total file count
6. Form resets after 3 seconds
```

## Quick Start

### For Students
1. Visit `submit.html` to access the submission form
2. Fill in your details (email, name, phone, topic)
3. Upload your audio file (max 50MB)
4. Receive confirmation email

### For Markers
1. Receive marking links via existing system
2. Open links in `index.html` interface
3. Mark submissions with real-time activity tracking
4. System automatically logs marking time

## Setup Instructions

### Prerequisites
- n8n instance (v1.84.3+)
- Google account with Sheets and Drive API access
- SMTP email service for notifications

### Installation
1. **Import Workflows:**
   ```bash
   # Import existing marking workflows
   # 1-start-workflow.json
   # 2-heartbeat-workflow.json
   # 3-end-workflow.json
   # 4-status-monitor-workflow.json

   # Import new submission workflow
   # 5-speaking-submit-workflow.json
   ```

2. **Configure Google Services:**
   - Create Google Sheet for submissions ("SpeakingSubmissions" sheet)
   - Set up Google Drive folder for audio files
   - Configure OAuth2 credentials in n8n

3. **Deploy Frontend:**
   - Host `index.html` and `submit.html` on GitHub Pages or web server
   - Update webhook URLs in frontend code

4. **Configure Email:**
   - Set up SMTP credentials in n8n
   - Test email delivery

## API Endpoints

### Marking System
- `POST /webhook/start` - Initialize marking session
- `POST /webhook/heartbeat` - Track activity heartbeats
- `POST /webhook/end` - Finalize marking session

### Submission System
- `POST /webhook/speaking/submit` - Handle student submissions

## File Structure

```plaintext
/
├── index.html                 # Marking tracker web interface
├── submit.html               # Student submission form
├── chrome-extension/         # Chrome extension (enhanced tracker)
│   ├── manifest.json        # Extension configuration
│   ├── background.js        # Service worker
│   ├── content.js          # Google Docs integration
│   ├── popup.html/js       # Extension popup
│   ├── options.html/js     # Settings page
│   ├── report.html/js      # Error reporting
│   ├── icons/              # Extension icons
│   └── README.md           # Extension documentation
├── n8n-workflows/           # n8n workflow definitions
│   ├── 1-start-workflow.json
│   ├── 2-heartbeat-workflow.json
│   ├── 3-end-workflow.json
│   ├── 4-status-monitor-workflow.json
│   ├── 5-speaking-submit-workflow.json
│   └── *-README.md          # Workflow documentation
├── docs/                    # Project documentation
└── README.md               # This file
```

## Security Features
- File type and size validation
- Session-based authentication for marking
- HTTPS encryption for all communications
- Input sanitization and validation

## Support
- Check workflow execution logs in n8n
- Verify Google API credentials
- Test with small files first
- Check network connectivity

## License
Internal use for Dũng English Speaking

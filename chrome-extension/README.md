# Marking Tracker Chrome Extension

A Chrome extension for tracking marking sessions for English speaking and writing assignments at Dũng English Speaking.

## Features

- **Automatic Session Tracking**: Tracks time spent on marking each document
- **Heartbeat System**: Sends periodic updates to backend server
- **Activity Detection**: Detects user activity and marks sessions as active/inactive
- **Floating Action Button**: Quick access to complete session, move to next document, or report errors
- **Error Reporting**: Built-in error reporting system
- **Session Management**: Manages multiple concurrent sessions across tabs
- **Statistics**: Tracks daily and total marking sessions

## Installation

### From Source

1. Clone this repository or download the extension folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `chrome-extension` folder
6. The extension should now be installed and active

### From Chrome Web Store

_Coming soon_

## Usage

### Initial Setup

1. Click the extension icon in your Chrome toolbar
2. Click "Settings" to configure:
   - Your teacher name
   - Backend URL (default: `https://n8n.dungenglishspeaking.com/webhook/marking-log`)
   - Session preferences
   - Notification settings

### Marking Sessions

1. Navigate to a Google Doc with the marking tracker URL parameters:
   - `?name=TeacherName&doc=GOOGLE_DOC_URL` for writing
   - `?name=TeacherName&speaking=URL` for speaking

2. The extension will automatically:
   - Start a tracking session
   - Add a floating action button to the page
   - Send heartbeat signals every 5 seconds
   - Track your activity

3. Use the floating action button (⚙️) to:
   - **Complete**: Mark the current session as finished
   - **Next**: Move to the next document to mark
   - **Report Error**: Report any issues you encounter

### Session Management

- Sessions are automatically saved in browser storage
- You can reload the page and the session will continue
- Sessions expire after 4 hours of inactivity
- Closing a tab will end the session

### Error Reporting

If you encounter any issues:

1. Click the "Report Error" button
2. Select the error type
3. Provide additional details (optional)
4. Submit the report

Error types include:
- System Error - Session Lost
- Network Error - Cannot Send Heartbeat
- UI Lag/Freeze
- Google Doc Won't Load
- Complete Button Not Working
- Extension Not Working
- Other

## Development

### Project Structure

```
chrome-extension/
├── manifest.json           # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for Google Docs
├── popup.html            # Extension popup HTML
├── popup.js              # Extension popup logic
├── options.html          # Settings page HTML
├── options.js            # Settings page logic
├── report.html           # Error report page HTML
├── report.js             # Error report logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### API Endpoints

The extension communicates with the following backend endpoints:

- `POST /webhook/marking-log/start` - Start a new session
- `POST /webhook/marking-log/heartbeat` - Send heartbeat signal
- `POST /webhook/marking-log/end` - End a session
- `POST /webhook/marking-log/errors` - Report an error
- `GET /webhook/marking-log/next-result` - Get next document to mark

### Building Icons

You'll need to create icons for the extension:

- `icons/icon16.png` - 16x16px
- `icons/icon48.png` - 48x48px
- `icons/icon128.png` - 128x128px

Use the Dũng English Speaking logo or a marking/grading themed icon.

## Permissions

The extension requires the following permissions:

- **storage**: To save session data and settings
- **tabs**: To manage sessions across tabs
- **activeTab**: To interact with the current tab
- **host_permissions**: To communicate with Google Docs and the backend server

## Privacy

- All data is stored locally in your browser
- Session data is only sent to the configured backend server
- No personal information is collected beyond teacher name
- Session tracking only occurs on marking tracker URLs

## Support

For issues, questions, or feature requests, please contact the development team or create an issue in the project repository.

## License

Copyright © 2025 Dũng English Speaking. All rights reserved.

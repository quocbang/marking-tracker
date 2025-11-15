# Speaking Submission Workflow

This workflow handles student submissions for speaking exercises, including file uploads, metadata storage, and email confirmations.

## Overview

**Endpoint**: `POST /webhook/speaking/submit`

**Purpose**: Process speaking exercise submissions from students, store files and metadata, and send confirmation emails.

## Prerequisites

1. **Google Sheets** with a "SpeakingSubmissions" sheet containing columns:
   - `sessionId` (string): Unique batch identifier for grouping multiple files
   - `submissionId` (string): Individual file submission ID
   - `email` (string)
   - `fullName` (string)
   - `phone` (string)
   - `topic` (string)
   - `fileName` (string)
   - `fileSize` (number)
   - `timestamp` (string)
   - `status` (string)
   - `fileUrl` (string)
   - `markingLink` (string)
   - `feedbackDoc` (string)

2. **Google Drive** folder for storing uploaded audio files

3. **SMTP credentials** for sending confirmation emails

## Installation Steps

### 1. Import Workflow

1. Open n8n and click **"Workflows"** → **"Add workflow"** → **"Import from file"**
2. Import `5-speaking-submit-workflow.json`

### 2. Configure Google Sheets

1. Click on **"Store Submission"** node
2. Update `documentId`: Replace `YOUR_GOOGLE_SHEET_ID` with your actual Google Sheet ID
3. Configure OAuth2 credentials for Google Sheets

### 3. Configure Google Drive

1. Click on **"Upload File"** node
2. Update `parentId`: Replace `YOUR_GOOGLE_DRIVE_FOLDER_ID` with your Google Drive folder ID
3. Configure OAuth2 credentials for Google Drive

### 4. Configure Email

1. Click on **"Send Confirmation Email"** node
2. Configure SMTP credentials for your email service

### 5. Update Frontend URL

1. In the **"Update Links"** node, update the marking link URL:
   ```
   'https://tracking.example.com/?name=Marker&doc=' + $node["Upload File"].json["id"]
   ```
   Replace `tracking.example.com` with your actual domain

### 6. Activate Workflow

1. Click the **"Webhook"** node to get the endpoint URL
2. Activate the workflow

## Workflow Flow

```
Frontend Upload Process:
├── File 1: XMLHttpRequest upload → Progress 0-100% → Complete
├── File 2: XMLHttpRequest upload → Progress 0-100% → Complete
└── File N: XMLHttpRequest upload → Progress 0-100% → Complete

Backend Workflow (per file):
Webhook (POST /speaking/submit)
    ↓
Set Metadata (generate submissionId, timestamp)
    ↓
Extract Files (process single file from array)
    ↓
Store File Record (save to Google Sheets)
    ↓
Upload File (save audio to Google Drive)
    ↓
Update Links (generate file URL and marking link)
    ↓
Update Sheet Links (add URLs to Google Sheets)
    ↓
Send Confirmation Email (notify student)
    ↓
Respond Success (return confirmation to frontend)
```

## Progress Tracking Architecture

### Frontend Progress Tracking
- **XMLHttpRequest Upload Progress**: Uses `xhr.upload.addEventListener('progress')` to track bytes uploaded
- **Individual File Progress**: Each file shows real-time percentage (0-100%) with visual progress bar
- **Sequential Upload**: Files uploaded one at a time to prevent server overload and provide clear progress
- **Status Updates**: Visual states change from "Chờ tải lên" → "Đang tải lên..." → "Hoàn thành ✓"
- **Overall Progress**: Combined progress bar showing `(completed_files / total_files) * 100`

### Backend Processing
- **Per-File Processing**: Each file creates separate Google Sheets row and Drive upload
- **Unique IDs**: Each file gets unique submission ID within the batch
- **Error Isolation**: Failed file uploads don't affect other files in the batch
- **Email Notifications**: Single email sent after all files complete with total count

### Technical Implementation Details
```javascript
// Frontend progress tracking
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    updateFileProgress(fileIndex, percentComplete);
  }
});
```

```javascript
// Sequential file processing
for (let i = 0; i < selectedFiles.length; i++) {
  await uploadSingleFile(singleFileFormData, i);
  updateOverallProgress((i + 1) / totalFiles * 100);
}
```

## API Request Format

**Content-Type**: `multipart/form-data`

**Fields**:
- `sessionId` (string, auto-generated): Unique identifier for this submission batch
- `email` (string, required): Student's email address
- `fullName` (string, required): Student's full name
- `phone` (string, required): Student's phone number
- `topic` (string, required): Speaking topic/subject
- `audioFiles` (file array, required): Multiple audio files (MP3, WAV, M4A, max 50MB each)
- `is_end` (string, auto-generated): "true" for the last file in batch, "false" for others

## API Response

**Success Response** (200):
```json
{
  "success": true,
  "submissionId": "speak_20241212_143052_abc123def",
  "message": "Submission received successfully"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "error": "Error description"
}
```

## Email Template

Students receive a confirmation email with:
- Personalized greeting
- Submission details (ID, timestamp, filename)
- Expected response time (24-48 hours)
- Contact information

## Integration with Existing System

### Marking Links
- Generated links follow the format: `https://tracking.example.com/?name=Marker&doc={fileId}`
- These integrate with your existing marking interface (`index.html`)

### Status Tracking
- Submissions are marked with status "received"
- Can be updated to "marked", "completed" as they move through the workflow

## Monitoring & Troubleshooting

### Check Workflow Executions
1. Go to **"Executions"** in n8n
2. View execution history for the speaking submission workflow
3. Check for errors in file uploads, email sending, or Google API calls

### Common Issues

1. **File upload fails**
   - Check Google Drive permissions
   - Verify folder ID exists and is accessible
   - Check file size limits

2. **Email not sending**
   - Verify SMTP credentials
   - Check spam folder
   - Validate email addresses

3. **Google Sheets not updating**
   - Verify sheet permissions
   - Check column names match exactly
   - Ensure OAuth2 credentials are valid

## Security Considerations

- File type validation on frontend and backend
- File size limits (50MB max)
- Input sanitization for metadata fields
- HTTPS required for file uploads

## Next Steps

1. **Feedback Workflow**: Create workflow to send completed feedback emails
2. **Progress Tracking**: Add workflow to update master documents with feedback
3. **Dashboard**: Create admin dashboard for submission monitoring
4. **Notifications**: Add marker notifications when submissions are ready

## Support

For issues with this workflow:
- Check n8n execution logs
- Verify Google API credentials
- Test with small files first
- Check network connectivity for file uploads

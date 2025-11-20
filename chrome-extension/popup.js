// Popup script for Marking Tracker extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load active sessions
  loadActiveSessions();
  
  // Load statistics
  loadStatistics();
  
  // Setup button listeners
  document.getElementById('report-btn').addEventListener('click', openReportDialog);
  document.getElementById('options-btn').addEventListener('click', openOptions);
});

// Load and display active sessions
async function loadActiveSessions() {
  const response = await chrome.runtime.sendMessage({ action: 'getActiveSessions' });
  const container = document.getElementById('sessions-container');
  
  if (!response.sessions || Object.keys(response.sessions).length === 0) {
    container.innerHTML = '<div class="no-sessions">No active sessions</div>';
    return;
  }
  
  container.innerHTML = '';
  
  Object.entries(response.sessions).forEach(([sessionId, session]) => {
    const item = document.createElement('div');
    item.className = 'session-item';
    
    const duration = Math.floor((Date.now() - session.startedAt) / 60000); // minutes
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    
    item.innerHTML = `
      <div class="session-info">
        <strong>${session.name}</strong> - ${session.type}
      </div>
      <div class="session-time">
        Active for ${timeStr}
      </div>
    `;
    
    container.appendChild(item);
  });
}

// Load statistics from storage
async function loadStatistics() {
  chrome.storage.local.get(['sessionStats'], (result) => {
    const stats = result.sessionStats || { today: 0, total: 0 };
    
    document.getElementById('today-count').textContent = stats.today || 0;
    document.getElementById('total-count').textContent = stats.total || 0;
  });
}

// Open report error dialog
function openReportDialog() {
  // Create a new window/tab for error reporting
  chrome.tabs.create({
    url: 'report.html'
  });
}

// Open options page
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Options page script

const defaultSettings = {
  teacherName: '',
  backendUrl: 'https://n8n.dungenglishspeaking.com/webhook/marking-log',
  heartbeatInterval: 5,
  activityTimeout: 45,
  autoStart: false,
  enableNotifications: true,
  sessionReminders: true
};

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Save button
document.getElementById('save-btn').addEventListener('click', saveSettings);

// Reset button
document.getElementById('reset-btn').addEventListener('click', resetSettings);

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || defaultSettings;
    
    document.getElementById('teacher-name').value = settings.teacherName || '';
    document.getElementById('backend-url').value = settings.backendUrl || defaultSettings.backendUrl;
    document.getElementById('heartbeat-interval').value = settings.heartbeatInterval || defaultSettings.heartbeatInterval;
    document.getElementById('activity-timeout').value = settings.activityTimeout || defaultSettings.activityTimeout;
    document.getElementById('auto-start').checked = settings.autoStart || false;
    document.getElementById('enable-notifications').checked = settings.enableNotifications !== false;
    document.getElementById('session-reminders').checked = settings.sessionReminders !== false;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    teacherName: document.getElementById('teacher-name').value.trim(),
    backendUrl: document.getElementById('backend-url').value.trim(),
    heartbeatInterval: parseInt(document.getElementById('heartbeat-interval').value),
    activityTimeout: parseInt(document.getElementById('activity-timeout').value),
    autoStart: document.getElementById('auto-start').checked,
    enableNotifications: document.getElementById('enable-notifications').checked,
    sessionReminders: document.getElementById('session-reminders').checked
  };
  
  // Validate
  if (!settings.backendUrl) {
    showStatus('Please enter a backend URL', 'error');
    return;
  }
  
  if (settings.heartbeatInterval < 1 || settings.heartbeatInterval > 60) {
    showStatus('Heartbeat interval must be between 1 and 60 seconds', 'error');
    return;
  }
  
  if (settings.activityTimeout < 10 || settings.activityTimeout > 300) {
    showStatus('Activity timeout must be between 10 and 300 seconds', 'error');
    return;
  }
  
  // Save to chrome storage
  chrome.storage.sync.set({ settings }, () => {
    showStatus('Settings saved successfully!', 'success');
  });
}

// Reset to default settings
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    chrome.storage.sync.set({ settings: defaultSettings }, () => {
      loadSettings();
      showStatus('Settings reset to default', 'success');
    });
  }
}

// Show save status message
function showStatus(message, type) {
  const status = document.getElementById('save-status');
  status.textContent = message;
  status.className = `save-status show ${type}`;
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 3000);
}

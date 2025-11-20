// Background service worker for Marking Tracker Chrome Extension

const BACKEND = 'https://n8n.dungenglishspeaking.com/webhook/marking-log';
const START_URL = BACKEND + '/start';
const HB_URL = BACKEND + '/heartbeat';
const END_URL = BACKEND + '/end';
const ERRORS_URL = BACKEND + '/errors';

// Store active sessions
let activeSessions = {};
let heartbeatTimers = {};

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSession') {
    handleStartSession(request.data, sender.tab.id).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'endSession') {
    handleEndSession(request.sessionId, request.reason).then(sendResponse);
    return true;
  }
  
  if (request.action === 'sendHeartbeat') {
    handleHeartbeat(request.sessionId, request.active).then(sendResponse);
    return true;
  }
  
  if (request.action === 'reportError') {
    handleErrorReport(request.data).then(sendResponse);
    return true;
  }
  
  if (request.action === 'getActiveSessions') {
    sendResponse({ sessions: activeSessions });
    return true;
  }
});

// Handle session start
async function handleStartSession(data, tabId) {
  try {
    const response = await fetch(START_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.sessionId) {
      // Store session info
      activeSessions[result.sessionId] = {
        tabId: tabId,
        name: data.name,
        docUrl: data.docUrl,
        type: data.type,
        startedAt: Date.now(),
        expiresAt: Date.now() + (result.ttlMs || 4*60*60*1000)
      };
      
      // Start heartbeat timer (every 5 seconds)
      startHeartbeat(result.sessionId);
      
      return { success: true, sessionId: result.sessionId };
    }
    
    return { success: false, error: 'No session ID returned' };
  } catch (error) {
    console.error('Failed to start session:', error);
    return { success: false, error: error.message };
  }
}

// Handle session end
async function handleEndSession(sessionId, reason = 'closed') {
  try {
    const session = activeSessions[sessionId];
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    
    // Stop heartbeat
    stopHeartbeat(sessionId);
    
    // Send end request
    const response = await fetch(END_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        reason: reason,
        ts: new Date().toISOString(),
        name: session.name,
        type: session.type
      })
    });
    
    // Remove from active sessions
    delete activeSessions[sessionId];
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, nextLink: result.nextLink };
  } catch (error) {
    console.error('Failed to end session:', error);
    return { success: false, error: error.message };
  }
}

// Handle heartbeat
async function handleHeartbeat(sessionId, active = true) {
  try {
    const response = await fetch(HB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        ts: new Date().toISOString(),
        active: active
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      if (data.error_code === 'SESSION_NOT_FOUND') {
        // Session expired on server, clean up
        stopHeartbeat(sessionId);
        delete activeSessions[sessionId];
        return { success: false, error: 'SESSION_NOT_FOUND' };
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Heartbeat failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle error report
async function handleErrorReport(data) {
  try {
    const response = await fetch(ERRORS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, nextLink: result.nextLink };
  } catch (error) {
    console.error('Failed to report error:', error);
    return { success: false, error: error.message };
  }
}

// Start heartbeat timer for a session
function startHeartbeat(sessionId) {
  if (heartbeatTimers[sessionId]) {
    clearInterval(heartbeatTimers[sessionId]);
  }
  
  heartbeatTimers[sessionId] = setInterval(() => {
    // Get tab activity status
    const session = activeSessions[sessionId];
    if (session) {
      chrome.tabs.get(session.tabId, (tab) => {
        const active = tab && tab.active;
        handleHeartbeat(sessionId, active);
      });
    }
  }, 5000);
}

// Stop heartbeat timer for a session
function stopHeartbeat(sessionId) {
  if (heartbeatTimers[sessionId]) {
    clearInterval(heartbeatTimers[sessionId]);
    delete heartbeatTimers[sessionId];
  }
}

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Find sessions for this tab and end them
  Object.keys(activeSessions).forEach(sessionId => {
    if (activeSessions[sessionId].tabId === tabId) {
      handleEndSession(sessionId, 'tab_closed');
    }
  });
});

// Handle extension unload
chrome.runtime.onSuspend.addListener(() => {
  // End all active sessions
  Object.keys(activeSessions).forEach(sessionId => {
    handleEndSession(sessionId, 'extension_unload');
  });
});

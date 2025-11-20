// Content script for Google Docs integration
// This script runs on Google Docs pages and integrates marking tracker

(function() {
  'use strict';
  
  console.log('Marking Tracker content script loaded');
  
  let sessionId = null;
  let lastActivityTs = Date.now();
  let teacherName = null;
  
  // Track user activity
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
      lastActivityTs = Date.now();
    }, { passive: true });
  });
  
  // Check if this is a marking tracker URL
  function isMarkingTrackerUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.has('name') && (params.has('doc') || params.has('speaking'));
  }
  
  // Extract marking info from URL
  function getMarkingInfo() {
    const params = new URLSearchParams(window.location.search);
    return {
      name: params.get('name') || 'unknown',
      docUrl: params.get('doc') || null,
      speaking: params.get('speaking') || null,
      type: params.get('doc') ? 'writing' : params.get('speaking') ? 'speaking' : null
    };
  }
  
  // Initialize session if this is a marking tracker URL
  async function initializeSession() {
    if (!isMarkingTrackerUrl()) {
      console.log('Not a marking tracker URL, skipping session initialization');
      return;
    }
    
    const info = getMarkingInfo();
    if (!info.type) {
      console.error('Invalid marking tracker URL: missing doc or speaking parameter');
      return;
    }
    
    teacherName = info.name;
    
    // Check if we already have a session in storage
    const docId = extractDocId(info.docUrl || info.speaking);
    const storageKey = `session_${docId}`;
    
    chrome.storage.local.get([storageKey], async (result) => {
      const storedSession = result[storageKey];
      
      if (storedSession && storedSession.expiresAt > Date.now()) {
        // Reuse existing session
        sessionId = storedSession.sessionId;
        console.log('Reusing session:', sessionId);
        sendHeartbeat(true);
      } else {
        // Create new session
        const response = await chrome.runtime.sendMessage({
          action: 'startSession',
          data: {
            name: info.name,
            docUrl: info.docUrl,
            type: info.type
          }
        });
        
        if (response.success) {
          sessionId = response.sessionId;
          console.log('New session created:', sessionId);
          
          // Store session info
          chrome.storage.local.set({
            [storageKey]: {
              sessionId: sessionId,
              createdAt: Date.now(),
              expiresAt: Date.now() + (4*60*60*1000) // 4 hours
            }
          });
          
          sendHeartbeat(true);
        } else {
          console.error('Failed to create session:', response.error);
        }
      }
    });
  }
  
  // Extract document ID from URL
  function extractDocId(url) {
    if (!url) return 'unknown';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const dIndex = pathParts.indexOf('d');
      return dIndex >= 0 && pathParts[dIndex + 1] ? pathParts[dIndex + 1] : 'unknown';
    } catch(e) {
      return btoa(url).slice(0, 16).replace(/[^a-zA-Z0-9]/g, '');
    }
  }
  
  // Send heartbeat
  function sendHeartbeat(active) {
    if (!sessionId) return;
    
    chrome.runtime.sendMessage({
      action: 'sendHeartbeat',
      sessionId: sessionId,
      active: active
    }, (response) => {
      if (response && !response.success && response.error === 'SESSION_NOT_FOUND') {
        console.log('Session not found, reinitializing...');
        sessionId = null;
        initializeSession();
      }
    });
  }
  
  // Add floating action button to Google Docs
  function addFloatingButton() {
    if (document.getElementById('marking-tracker-fab')) {
      return; // Already added
    }
    
    const fabContainer = document.createElement('div');
    fabContainer.id = 'marking-tracker-fab';
    fabContainer.innerHTML = `
      <style>
        #marking-tracker-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 10000;
        }
        
        #marking-tracker-fab .fab-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 24px;
          color: white;
        }
        
        #marking-tracker-fab .fab-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }
        
        #marking-tracker-fab .fab-menu {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 16px 12px;
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.3s ease;
          pointer-events: none;
        }
        
        #marking-tracker-fab:hover .fab-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
          pointer-events: auto;
        }
        
        #marking-tracker-fab .fab-menu-button {
          width: 100%;
          padding: 12px 16px;
          margin: 4px 0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
        }
        
        #marking-tracker-fab .btn-complete {
          background: #4CAF50;
        }
        
        #marking-tracker-fab .btn-complete:hover {
          background: #45a049;
        }
        
        #marking-tracker-fab .btn-next {
          background: #2196F3;
        }
        
        #marking-tracker-fab .btn-next:hover {
          background: #1976D2;
        }
        
        #marking-tracker-fab .btn-report {
          background: #ff5252;
        }
        
        #marking-tracker-fab .btn-report:hover {
          background: #e04848;
        }
      </style>
      <button class="fab-button" title="Marking Tracker Menu">⚙️</button>
      <div class="fab-menu">
        <button class="fab-menu-button btn-complete" id="mt-complete-btn">✓ Hoàn Thành</button>
        <button class="fab-menu-button btn-next" id="mt-next-btn">→ Tiếp theo</button>
        <button class="fab-menu-button btn-report" id="mt-report-btn">⚠ Báo lỗi</button>
      </div>
    `;
    
    document.body.appendChild(fabContainer);
    
    // Add event listeners
    document.getElementById('mt-complete-btn').addEventListener('click', handleComplete);
    document.getElementById('mt-next-btn').addEventListener('click', handleNext);
    document.getElementById('mt-report-btn').addEventListener('click', handleReport);
  }
  
  // Handle complete button click
  async function handleComplete() {
    if (!sessionId) {
      alert('Không tìm thấy session. Vui lòng refresh trang.');
      return;
    }
    
    if (confirm('Bạn có chắc chắn muốn hoàn thành phiên chấm điểm này không?')) {
      const response = await chrome.runtime.sendMessage({
        action: 'endSession',
        sessionId: sessionId,
        reason: 'finished'
      });
      
      if (response.success) {
        alert('Đã hoàn thành phiên chấm điểm!');
        if (response.nextLink) {
          window.location.href = response.nextLink;
        }
      } else {
        alert('Có lỗi khi kết thúc phiên. Vui lòng thử lại.');
      }
    }
  }
  
  // Handle next button click
  async function handleNext() {
    if (!teacherName) {
      alert('Không tìm thấy thông tin giáo viên.');
      return;
    }
    
    try {
      const response = await fetch(`https://n8n.dungenglishspeaking.com/webhook/marking-log/next-result?name=${encodeURIComponent(teacherName)}`);
      const data = await response.json();
      
      if (data.url) {
        if (sessionId) {
          await chrome.runtime.sendMessage({
            action: 'endSession',
            sessionId: sessionId,
            reason: 'next_result'
          });
        }
        window.location.href = data.url;
      } else {
        alert('Không có bài tiếp theo.');
      }
    } catch (e) {
      console.error('Failed to get next result:', e);
      alert('Không thể tải bài tiếp theo. Vui lòng thử lại.');
    }
  }
  
  // Handle report button click
  function handleReport() {
    // Open extension popup or show report dialog
    chrome.runtime.sendMessage({ action: 'openReportDialog' });
  }
  
  // Initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeSession();
      if (isMarkingTrackerUrl()) {
        addFloatingButton();
      }
    });
  } else {
    initializeSession();
    if (isMarkingTrackerUrl()) {
      addFloatingButton();
    }
  }
  
  // Send heartbeat periodically
  setInterval(() => {
    const active = (Date.now() - lastActivityTs) < 45000;
    sendHeartbeat(active);
  }, 5000);
  
})();

// Report error page script

const errorType = document.getElementById('error-type');
const errorDescription = document.getElementById('error-description');
const descriptionRequired = document.getElementById('description-required');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const closeBtn = document.getElementById('close-btn');

// Make description required if "other" is selected
errorType.addEventListener('change', () => {
  if (errorType.value === 'other') {
    descriptionRequired.style.display = 'inline';
    errorDescription.setAttribute('required', 'required');
  } else {
    descriptionRequired.style.display = 'none';
    errorDescription.removeAttribute('required');
  }
});

// Submit button
submitBtn.addEventListener('click', async () => {
  const selectedType = errorType.value;
  const description = errorDescription.value.trim();
  
  // Validation
  if (!selectedType) {
    alert('Please select an error type!');
    return;
  }
  
  if (selectedType === 'other' && !description) {
    alert('Please provide a description for "Other" error type!');
    return;
  }
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get stored settings
    const settings = await chrome.storage.sync.get(['settings']);
    const teacherName = settings.settings?.teacherName || 'unknown';
    
    // Create error report
    const errorReport = {
      sessionId: null, // Will be filled if available
      name: teacherName,
      docUrl: tab?.url || null,
      type: null,
      errorType: selectedType,
      errorTypeLabel: errorType.options[errorType.selectedIndex].text,
      errorDescription: description || null,
      timestamp: new Date().toISOString(),
      fullUrl: tab?.url || null,
      userAgent: navigator.userAgent,
      extensionVersion: chrome.runtime.getManifest().version
    };
    
    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'reportError',
      data: errorReport
    });
    
    if (response.success) {
      // Show success message
      document.getElementById('form-container').style.display = 'none';
      document.getElementById('success-message').classList.add('show');
    } else {
      alert('Failed to submit report. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Report';
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    alert('An error occurred. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Report';
  }
});

// Cancel button
cancelBtn.addEventListener('click', () => {
  window.close();
});

// Close button
closeBtn.addEventListener('click', () => {
  window.close();
});

// Allow Ctrl/Cmd+Enter to submit
errorDescription.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    submitBtn.click();
  }
});

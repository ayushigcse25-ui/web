/**
 * Zila Parishad Primary School, Ghorad
 * Contact Form & Map Interactive Logic
 * Connected to Real Node.js / Express / MongoDB Backend
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initMapActions();
});

// ============================================================
// FRONTEND API CONFIGURATION
// For local development: Automatically connects to http://localhost:5000
// For production (e.g., Netlify/Vercel): Configure window.API_BASE_URL:
// e.g. <script>window.API_BASE_URL = 'https://your-backend.onrender.com';</script>
// ============================================================
function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  // If already served directly by Express backend on port 5000
  if (port === '5000') {
    return '';
  }

  // Local development fallback (e.g. VS Code Live Server on port 5500, Vite, file://)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:' || !hostname) {
    return 'http://localhost:5000';
  }

  // Production fallback: relative path if same domain
  return '';
}

function initContactForm() {
  const form = document.getElementById('schoolContactForm');
  const alertBox = document.getElementById('contactFeedbackAlert');

  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : '✉️ Submit Inquiry to School Office';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Elements
    const nameInput = form.querySelector('#senderName');
    const phoneInput = form.querySelector('#senderPhone');
    const subjectSelect = form.querySelector('#senderSubject');
    const messageInput = form.querySelector('#senderMessage');
    const honeypotInput = form.querySelector('#hpSchoolCheck');

    const name = nameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    // Use the visible text of the selected category for clarity in notifications
    const category = subjectSelect?.options[subjectSelect.selectedIndex]?.text || subjectSelect?.value || 'General Inquiry';
    const message = messageInput?.value.trim() || '';
    const honeypot = honeypotInput?.value || '';

    // Basic frontend check
    if (!name || !phone || !message) {
      displayAlert(alertBox, 'error', '<strong>⚠️ Missing Fields</strong><br>Please fill in all required fields (Name, Mobile Number, and Message).');
      return;
    }

    // Phone format pre-check (10 digits Indian mobile)
    const phoneDigits = phone.replace(/\D/g, '');
    const cleanPhone = (phoneDigits.length === 12 && phoneDigits.startsWith('91'))
      ? phoneDigits.slice(2)
      : (phoneDigits.length === 11 && phoneDigits.startsWith('0'))
        ? phoneDigits.slice(1)
        : phoneDigits;

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      displayAlert(alertBox, 'error', '<strong>⚠️ Invalid Mobile Number</strong><br>Please enter a valid 10-digit Indian mobile number (e.g. 9850326135).');
      phoneInput?.focus();
      return;
    }

    // Set Loading State
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '⏳ Submitting...';
      submitBtn.style.cursor = 'not-allowed';
      submitBtn.style.opacity = '0.75';
    }

    // Clear existing alert
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.className = 'form-feedback-alert';
    }

    const payload = {
      name,
      phone: cleanPhone,
      category,
      message,
      _hp_school_check: honeypot
    };

    const baseUrl = getApiBaseUrl();
    const apiUrl = `${baseUrl}/api/inquiries`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        // Successful submission (HTTP 200/201)
        displayAlert(
          alertBox,
          'success',
          `<strong>✓ Inquiry Submitted Successfully!</strong><br>` +
          `Thank you, <strong>${escapeHTML(name)}</strong>. Your message has been saved in the school database and the administration has been notified. We will contact you at <strong>+91 ${escapeHTML(cleanPhone)}</strong> during working hours.`
        );

        // Reset form on success
        form.reset();
      } else if (response.status === 400) {
        // HTTP 400: Validation error
        let validationMsg = data.message || 'Validation error. Please check your entered details.';
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const formattedErrors = data.errors
            .map(err => typeof err === 'string' ? err : err.message || err.msg)
            .filter(Boolean)
            .join('<br>• ');
          if (formattedErrors) {
            validationMsg = `• ${formattedErrors}`;
          }
        }
        displayAlert(alertBox, 'error', `<strong>⚠️ Validation Error</strong><br>${validationMsg}`);
      } else if (response.status === 503) {
        // HTTP 503: Database / service unavailable
        const errorMsg = data.message || 'Database service is currently unavailable. Please try again later.';
        displayAlert(alertBox, 'error', `<strong>⚠️ Service Unavailable</strong><br>${escapeHTML(errorMsg)}`);
      } else if (response.status === 500) {
        // HTTP 500: Server error
        const errorMsg = data.message || 'Server error. Please try again later.';
        displayAlert(alertBox, 'error', `<strong>⚠️ Server Error</strong><br>${escapeHTML(errorMsg)}`);
      } else if (response.status === 429) {
        // HTTP 429: Rate limited
        const errorMsg = data.message || 'Too many submissions. Please wait a few minutes before trying again.';
        displayAlert(alertBox, 'error', `<strong>⚠️ Rate Limited</strong><br>${escapeHTML(errorMsg)}`);
      } else {
        // Other HTTP error
        const errorMsg = data.message || `Request failed with status code ${response.status}. Please try again later.`;
        displayAlert(alertBox, 'error', `<strong>⚠️ Submission Failed</strong><br>${escapeHTML(errorMsg)}`);
      }
    } catch (networkError) {
      console.error('[Inquiry Submission Network Error]', networkError);
      displayAlert(
        alertBox,
        'error',
        `<strong>⚠️ Connection Error</strong><br>Could not connect to the school inquiry server at <code>${escapeHTML(apiUrl)}</code>. Please ensure the backend server is running and try again.`
      );
    } finally {
      // Restore submit button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.style.cursor = '';
        submitBtn.style.opacity = '';
      }
    }
  });
}

/**
 * Display alert banner and smoothly scroll it into view
 */
function displayAlert(alertBox, type, htmlContent) {
  if (!alertBox) return;
  alertBox.className = `form-feedback-alert ${type}`;
  alertBox.innerHTML = htmlContent;
  alertBox.style.display = 'block';
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Simple HTML escaper to prevent XSS in dynamic alert interpolation
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initMapActions() {
  const mapBtn = document.getElementById('openGoogleMapsBtn');
  if (!mapBtn) return;

  mapBtn.addEventListener('click', () => {
    const query = encodeURIComponent('Ghorad, Kalmeshwar, Nagpur, Maharashtra, India');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  });
}

const axios = require('axios');

/**
 * Format timestamp into standard Indian English format:
 * e.g., "23 September 2026, 3:10 PM"
 */
function formatSubmissionTime(date = new Date()) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };

  try {
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  } catch (e) {
    return date.toLocaleString('en-IN');
  }
}

/**
 * Clean & format phone numbers to international format (digits only, e.g., 919850326135)
 */
function sanitizeRecipientNumber(number) {
  if (!number) return '919850326135';
  let cleaned = String(number).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Build the human-readable WhatsApp message body text
 */
function buildMessageText({ name, phone, category, message, createdAt }) {
  const submittedAt = formatSubmissionTime(createdAt || new Date());
  return `New School Website Inquiry\n\n` +
         `Name: ${name}\n` +
         `Phone: ${phone}\n` +
         `Category: ${category}\n` +
         `Message:\n${message}\n\n` +
         `Submitted At:\n${submittedAt}`;
}

/**
 * Send WhatsApp notification using official Meta WhatsApp Cloud API
 *
 * @param {Object} inquiryData - { name, phone, category, message, createdAt }
 * @returns {Promise<{ success: boolean, skipped?: boolean, messageId?: string, error?: string }>}
 */
async function sendWhatsAppNotification(inquiryData) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const recipientNumber = sanitizeRecipientNumber(process.env.WHATSAPP_RECIPIENT_NUMBER || '919850326135');
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en';

  // 1. Verify if credentials are configured
  if (!accessToken || !phoneNumberId) {
    const warningMsg = '[WhatsApp Service] Meta WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) are not configured. Skipping WhatsApp notification.';
    console.warn(warningMsg);
    return {
      success: false,
      skipped: true,
      error: 'WhatsApp credentials not configured in .env'
    };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const submittedAt = formatSubmissionTime(inquiryData.createdAt || new Date());

  let payload;

  // 2. Build payload based on whether a template is specified or text mode is used
  if (templateName) {
    // Standard Meta WhatsApp Business Template payload
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: inquiryData.name || 'Anonymous' },
              { type: 'text', text: inquiryData.phone || 'N/A' },
              { type: 'text', text: inquiryData.category || 'General' },
              { type: 'text', text: (inquiryData.message || '').substring(0, 1000) },
              { type: 'text', text: submittedAt }
            ]
          }
        ]
      }
    };
  } else {
    // Free-form text message payload (works within 24-hour customer care window or test numbers)
    const textBody = buildMessageText(inquiryData);
    payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: textBody
      }
    };
  }

  try {
    console.log(`[WhatsApp Service] Sending inquiry notification to recipient: ${recipientNumber}...`);

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10s timeout
    });

    const messageId = response.data?.messages?.[0]?.id;
    console.log(`[WhatsApp Service] Successfully dispatched WhatsApp notification. Meta Message ID: ${messageId}`);

    return {
      success: true,
      messageId: messageId,
      recipient: recipientNumber
    };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    console.error(`[WhatsApp Service Error] Failed to send WhatsApp notification: ${errorDetails}`);
    if (error.response?.data) {
      console.error(`[WhatsApp Service Error Response]`, JSON.stringify(error.response.data));
    }

    return {
      success: false,
      error: errorDetails
    };
  }
}

module.exports = {
  sendWhatsAppNotification,
  formatSubmissionTime,
  buildMessageText,
  sanitizeRecipientNumber
};

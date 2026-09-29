const nodemailer = require('nodemailer');
const { formatSubmissionTime } = require('./whatsappService');

let transporterInstance = null;

/**
 * Initialize and get Nodemailer transporter singleton
 */
function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporterInstance;
}

/**
 * Send email notification to school administration
 *
 * @param {Object} inquiryData - { name, phone, category, message, createdAt }
 * @returns {Promise<{ success: boolean, skipped?: boolean, messageId?: string, error?: string }>}
 */
async function sendEmailNotification(inquiryData) {
  const recipientEmail = process.env.SCHOOL_EMAIL?.trim() || 'schooloffice@example.com';
  const fromEmail = process.env.EMAIL_FROM?.trim() || `"ZP Primary School, Ghorad" <no-reply@zpghorad.edu.in>`;
  const transporter = getTransporter();

  if (!transporter) {
    const warningMsg = '[Email Service] SMTP credentials (SMTP_HOST / SMTP_USER / SMTP_PASSWORD) are not configured. Skipping email notification.';
    console.warn(warningMsg);
    return {
      success: false,
      skipped: true,
      error: 'SMTP credentials not configured in .env'
    };
  }

  const submittedAt = formatSubmissionTime(inquiryData.createdAt || new Date());
  const subject = `New School Website Inquiry - ${inquiryData.category || 'General Inquiry'}`;

  // Plain text email version
  const textContent = `
========================================
NEW SCHOOL WEBSITE INQUIRY RECEIVED
Zila Parishad Primary School, Ghorad
========================================

Inquiry Details:
----------------------------------------
Name:         ${inquiryData.name}
Phone:        ${inquiryData.phone}
Category:     ${inquiryData.category}
Submitted At: ${submittedAt}

Message / Query:
----------------------------------------
${inquiryData.message}

----------------------------------------
This is an automated notification from the ZP Primary School, Ghorad website backend.
`;

  // Rich HTML email version with school branding
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .email-header { background-color: #0f3a68; color: #ffffff; padding: 24px; text-align: center; border-top: 4px solid #d97706; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .email-header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; color: #e2e8f0; }
    .email-body { padding: 28px; }
    .badge { display: inline-block; padding: 4px 12px; background: #edf7f0; color: #16a34a; font-weight: 600; font-size: 12px; border-radius: 20px; border: 1px solid #bbf7d0; margin-bottom: 16px; }
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-table td.label { font-weight: 600; color: #475569; width: 35%; background-color: #f8fafc; }
    .message-box { background: #f8fafc; border-left: 4px solid #0f3a68; padding: 16px; border-radius: 0 6px 6px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
    .email-footer { background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>जि. प. प्राथमिक शाळा, घोरड</h1>
      <p>Zila Parishad Primary School, Ghorad — Official Web Portal</p>
    </div>
    <div class="email-body">
      <span class="badge">✉️ New Website Inquiry</span>
      <h2 style="font-size: 18px; margin-top: 0; color: #0a2544;">New Inquiry Received</h2>
      <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
        A parent, guardian, or visitor has submitted a new inquiry through the official school website contact form.
      </p>

      <table class="detail-table">
        <tr>
          <td class="label">Sender Name:</td>
          <td><strong>${inquiryData.name}</strong></td>
        </tr>
        <tr>
          <td class="label">Mobile Number:</td>
          <td><a href="tel:${inquiryData.phone}" style="color: #0f3a68; text-decoration: none; font-weight: 600;">+91 ${inquiryData.phone}</a></td>
        </tr>
        <tr>
          <td class="label">Inquiry Category:</td>
          <td><span style="font-weight: 600; color: #0f3a68;">${inquiryData.category}</span></td>
        </tr>
        <tr>
          <td class="label">Submitted At:</td>
          <td>${submittedAt}</td>
        </tr>
      </table>

      <h3 style="font-size: 14px; color: #0a2544; margin-bottom: 8px;">Message / Query:</h3>
      <div class="message-box">${inquiryData.message}</div>
    </div>
    <div class="email-footer">
      Zila Parishad Primary School, Village Ghorad, Taluka Kalmeshwar, District Nagpur, Maharashtra - 441501
    </div>
  </div>
</body>
</html>
`;

  try {
    console.log(`[Email Service] Sending notification email to: ${recipientEmail}...`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email Service] Email sent successfully. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEmailNotification,
  getTransporter
};

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeIndianPhone } = require('../middleware/validator');
const {
  sanitizeRecipientNumber,
  buildMessageText,
  sendWhatsAppNotification
} = require('../services/whatsappService');
const { sendEmailNotification } = require('../services/emailService');
const { adminAuth } = require('../middleware/auth');

describe('ZP Primary School Ghorad - Fast Unit Tests', () => {

  describe('Phone Number Normalization & Validation', () => {
    it('normalizes 10-digit phone', () => {
      assert.equal(normalizeIndianPhone('9850326135'), '9850326135');
    });

    it('normalizes phone with +91 prefix', () => {
      assert.equal(normalizeIndianPhone('+91 9850326135'), '9850326135');
      assert.equal(normalizeIndianPhone('+919850326135'), '9850326135');
      assert.equal(normalizeIndianPhone('919850326135'), '9850326135');
    });

    it('normalizes phone with leading 0', () => {
      assert.equal(normalizeIndianPhone('09850326135'), '9850326135');
    });

    it('normalizes phone with dashes and spaces', () => {
      assert.equal(normalizeIndianPhone('98503-26135'), '9850326135');
      assert.equal(normalizeIndianPhone('+91 98503 26135'), '9850326135');
    });

    it('formats target recipient number to international 919850326135', () => {
      assert.equal(sanitizeRecipientNumber('9850326135'), '919850326135');
      assert.equal(sanitizeRecipientNumber('+91 9850326135'), '919850326135');
      assert.equal(sanitizeRecipientNumber('919850326135'), '919850326135');
      assert.equal(sanitizeRecipientNumber(''), '919850326135');
    });
  });

  describe('WhatsApp Service Formatting & Logic', () => {
    it('builds WhatsApp message text with correct school format', () => {
      const payload = {
        name: 'Ramesh Patil',
        phone: '9850326135',
        category: 'New Student Admission',
        message: 'I want information about Class 1 admission.',
        createdAt: new Date('2026-09-23T15:10:00Z')
      };

      const text = buildMessageText(payload);

      assert.ok(text.includes('New School Website Inquiry'));
      assert.ok(text.includes('Name: Ramesh Patil'));
      assert.ok(text.includes('Phone: 9850326135'));
      assert.ok(text.includes('Category: New Student Admission'));
      assert.ok(text.includes('I want information about Class 1 admission.'));
      assert.ok(text.includes('Submitted At:'));
    });

    it('sendWhatsAppNotification handles unconfigured environment gracefully', async () => {
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const result = await sendWhatsAppNotification({
        name: 'Ramesh Patil',
        phone: '9850326135',
        category: 'Admission',
        message: 'Test message'
      });

      assert.equal(result.success, false);
      assert.equal(result.skipped, true);
      assert.ok(result.error.includes('WhatsApp credentials'));
    });
  });

  describe('Email Service Error Resilience', () => {
    it('sendEmailNotification handles unconfigured SMTP credentials gracefully', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      const result = await sendEmailNotification({
        name: 'Ramesh Patil',
        phone: '9850326135',
        category: 'Admission',
        message: 'Test message'
      });

      assert.equal(result.success, false);
      assert.equal(result.skipped, true);
      assert.ok(result.error.includes('SMTP credentials'));
    });
  });

  describe('Admin Authentication Middleware', () => {
    it('returns 403 if server has no ADMIN_API_KEY configured', () => {
      delete process.env.ADMIN_API_KEY;
      const req = { headers: {} };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => { jsonCalled = data; }
          };
        }
      };

      adminAuth(req, res, () => {});
      assert.equal(statusCalled, 403);
      assert.equal(jsonCalled.success, false);
    });

    it('returns 401 if ADMIN_API_KEY is configured on server but request has no credentials', () => {
      process.env.ADMIN_API_KEY = 'valid_test_admin_key';
      const req = { headers: {} };
      let statusCalled = null;
      let jsonCalled = null;
      const res = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => { jsonCalled = data; }
          };
        }
      };

      adminAuth(req, res, () => {});
      assert.equal(statusCalled, 401);
      assert.equal(jsonCalled.success, false);
    });

    it('permits request if valid admin key is provided in x-admin-key header', () => {
      process.env.ADMIN_API_KEY = 'valid_test_admin_key';

      const req = {
        headers: {
          'x-admin-key': 'valid_test_admin_key'
        }
      };
      let nextCalled = false;
      const res = {};

      adminAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });

    it('permits request if valid admin key is provided in Authorization Bearer header', () => {
      process.env.ADMIN_API_KEY = 'valid_test_admin_key';

      const req = {
        headers: {
          'authorization': 'Bearer valid_test_admin_key'
        }
      };
      let nextCalled = false;
      const res = {};

      adminAuth(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

});

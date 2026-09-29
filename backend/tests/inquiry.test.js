const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.ADMIN_API_KEY = 'test_admin_secret_key_12345';
process.env.WHATSAPP_RECIPIENT_NUMBER = '919850326135';

const app = require('../server');
const Inquiry = require('../models/Inquiry');
const {
  sanitizeRecipientNumber,
  buildMessageText,
  sendWhatsAppNotification
} = require('../services/whatsappService');
const { sendEmailNotification } = require('../services/emailService');

let mongoServer;

describe('ZP Primary School Ghorad - Backend API & Services Test Suite', () => {

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Inquiry.deleteMany({});
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.status, 'healthy');
      assert.equal(res.body.institution, 'Zila Parishad Primary School, Ghorad');
    });
  });

  describe('2. WhatsApp & Email Service Unit Tests', () => {
    it('sanitizeRecipientNumber should format phone number to international 919850326135 format', () => {
      assert.equal(sanitizeRecipientNumber('9850326135'), '919850326135');
      assert.equal(sanitizeRecipientNumber('+91 9850326135'), '919850326135');
      assert.equal(sanitizeRecipientNumber('919850326135'), '919850326135');
    });

    it('buildMessageText should contain all required fields with exact layout', () => {
      const testData = {
        name: 'Ramesh Patil',
        phone: '9876543210',
        category: 'New Student Admission',
        message: 'I want information about Class 1 admission.',
        createdAt: new Date('2026-09-23T15:10:00')
      };
      const text = buildMessageText(testData);
      assert.ok(text.includes('New School Website Inquiry'));
      assert.ok(text.includes('Name: Ramesh Patil'));
      assert.ok(text.includes('Phone: 9876543210'));
      assert.ok(text.includes('Category: New Student Admission'));
      assert.ok(text.includes('I want information about Class 1 admission.'));
      assert.ok(text.includes('Submitted At:'));
    });

    it('sendWhatsAppNotification should handle missing credentials gracefully without throwing', async () => {
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;

      const result = await sendWhatsAppNotification({
        name: 'Test Parent',
        phone: '9850326135',
        category: 'Admissions',
        message: 'Test message query'
      });

      assert.equal(result.success, false);
      assert.equal(result.skipped, true);
      assert.ok(result.error.includes('WhatsApp credentials'));
    });

    it('sendEmailNotification should handle unconfigured SMTP gracefully without throwing', async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      const result = await sendEmailNotification({
        name: 'Test Parent',
        phone: '9850326135',
        category: 'Admissions',
        message: 'Test message query'
      });

      assert.equal(result.success, false);
      assert.equal(result.skipped, true);
      assert.ok(result.error.includes('SMTP credentials'));
    });
  });

  describe('3. Public Inquiry Submission Endpoint (POST /api/inquiries)', () => {
    it('should successfully submit a valid inquiry and save it to MongoDB', async () => {
      const payload = {
        name: 'Ramesh Patil',
        phone: '9876543210',
        category: 'New Student Admission',
        message: 'I want information about Class 1 admission.'
      };

      const res = await request(app)
        .post('/api/inquiries')
        .send(payload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.message, 'Your inquiry has been submitted successfully.');

      // Verify record in MongoDB
      const saved = await Inquiry.findOne({ phone: '9876543210' });
      assert.ok(saved);
      assert.equal(saved.name, 'Ramesh Patil');
      assert.equal(saved.category, 'New Student Admission');
      assert.equal(saved.message, 'I want information about Class 1 admission.');
      assert.equal(saved.status, 'new');
      assert.ok(saved.createdAt);
    });

    it('should normalize Indian phone numbers with +91 or leading 0 prefix', async () => {
      const payload = {
        name: 'Suresh Deshmukh',
        phone: '+91 9850326135',
        category: 'Mid-Day Meal (PM POSHAN) Inquiry',
        message: 'Query regarding mid day meal menu.'
      };

      const res = await request(app)
        .post('/api/inquiries')
        .send(payload);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);

      const saved = await Inquiry.findOne({ name: 'Suresh Deshmukh' });
      assert.ok(saved);
      assert.equal(saved.phone, '9850326135');
    });

    it('should reject invalid Indian phone numbers (e.g. invalid digits or starting digit)', async () => {
      const invalidPhones = ['1234567890', '5555555555', '98765', 'abcdefghij', ''];

      for (const phone of invalidPhones) {
        const res = await request(app)
          .post('/api/inquiries')
          .send({
            name: 'Test User',
            phone,
            category: 'Admissions',
            message: 'Inquiry message text here'
          });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      }
    });

    it('should reject missing or empty name', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: '',
          phone: '9850326135',
          category: 'Admissions',
          message: 'Valid message body'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('should reject message that is too short (< 5 characters)', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Pooja Sharma',
          phone: '9850326135',
          category: 'General',
          message: 'Hi'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('should silently trap honeypot spam bots without saving to MongoDB', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Spam Bot',
          phone: '9850326135',
          category: 'General',
          message: 'Buy cheap watches online now!',
          _hp_school_check: 'http://spam-link.com'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify no record saved to MongoDB
      const count = await Inquiry.countDocuments({ name: 'Spam Bot' });
      assert.equal(count, 0);
    });
  });

  describe('4. Protected Administrative Endpoints', () => {
    beforeEach(async () => {
      await Inquiry.create([
        {
          name: 'Parent One',
          phone: '9850326135',
          category: 'Admission',
          message: 'Class 1 admission requirement question'
        },
        {
          name: 'Parent Two',
          phone: '9822113344',
          category: 'Academics',
          message: 'Syllabus and books inquiry'
        }
      ]);
    });

    it('GET /api/inquiries should block unauthorized access without API key', async () => {
      const res = await request(app).get('/api/inquiries');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('GET /api/inquiries should allow access with valid x-admin-key header', async () => {
      const res = await request(app)
        .get('/api/inquiries')
        .set('x-admin-key', 'test_admin_secret_key_12345');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.total, 2);
      assert.equal(res.body.data.inquiries.length, 2);
    });

    it('PATCH /api/inquiries/:id/status should update inquiry status when authorized', async () => {
      const inquiry = await Inquiry.findOne({ name: 'Parent One' });

      const res = await request(app)
        .patch(`/api/inquiries/${inquiry._id}/status`)
        .set('x-admin-key', 'test_admin_secret_key_12345')
        .send({ status: 'resolved' });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'resolved');

      const updated = await Inquiry.findById(inquiry._id);
      assert.equal(updated.status, 'resolved');
    });
  });

});

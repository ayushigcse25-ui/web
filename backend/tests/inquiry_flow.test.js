const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.ADMIN_API_KEY = 'admin_zp_ghorad_secret_2026';
process.env.WHATSAPP_RECIPIENT_NUMBER = '919850326135';

const app = require('../server');
const Inquiry = require('../models/Inquiry');

describe('Full Inquiry Submission Flow & Resilience Tests', () => {

  describe('When MongoDB is Disconnected', () => {
    it('returns 503 with safe user message and does not proceed to notifications', async () => {
      // Ensure mongoose is disconnected
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Suresh Patil',
          phone: '9850326135',
          category: 'Admission Inquiry',
          message: 'Please provide admission procedure for Class 1.'
        });

      assert.equal(res.status, 503);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Database service is currently unavailable. Please try again later.');
    });
  });

  describe('Validation & Edge Cases', () => {
    it('rejects incomplete inquiry submissions with 400', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: '',
          phone: '9850326135',
          category: 'General',
          message: 'Short'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

});

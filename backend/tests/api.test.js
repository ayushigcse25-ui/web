const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.ADMIN_API_KEY = 'admin_zp_ghorad_secret_2026';

const app = require('../server');

describe('ZP Primary School Ghorad - API Route & Security Tests', () => {

  it('GET /api/health returns 200 and institution details', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'School inquiry server is running');
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.institution, 'Zila Parishad Primary School, Ghorad');
  });

  it('POST /api/inquiries returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        name: '',
        phone: '9850326135',
        category: 'Admission',
        message: 'Valid message inquiry'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Name is required'));
  });

  it('POST /api/inquiries returns 400 when Indian phone number is invalid', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        name: 'Ramesh Patil',
        phone: '1234567890', // Invalid: doesn't start with 6-9
        category: 'Admission',
        message: 'Valid message inquiry'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('valid 10-digit Indian mobile number'));
  });

  it('POST /api/inquiries returns 400 when message is too short', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        name: 'Ramesh Patil',
        phone: '9850326135',
        category: 'Admission',
        message: 'Hi' // Less than 5 chars
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('5 and 2000 characters'));
  });

  it('POST /api/inquiries silences honeypot spam bot with 200 response', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        name: 'Bot Spammer',
        phone: '9850326135',
        category: 'General',
        message: 'Spam text message body',
        _hp_school_check: 'http://spam.example.com'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('GET /api/inquiries blocks unauthorized visitors with 401', async () => {
    const res = await request(app).get('/api/inquiries');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('Unauthorized'));
  });

  it('GET /api/inquiries permits admin with valid x-admin-key header', async () => {
    const res = await request(app)
      .get('/api/inquiries')
      .set('x-admin-key', 'admin_zp_ghorad_secret_2026');

    // If MongoDB is not connected, controller gracefully returns 503 rather than crashing
    // If connected, it returns 200
    assert.ok(res.status === 200 || res.status === 503);
  });

  it('GET /api/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/nonexistent_route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

});

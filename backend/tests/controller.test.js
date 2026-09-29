const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createInquiry } = require('../controllers/inquiryController');
const mongoose = require('mongoose');

describe('Inquiry Controller Unit Tests', () => {

  it('returns 503 if MongoDB is disconnected (readyState !== 1)', async () => {
    // When mongoose is not connected (readyState === 0)
    const req = {
      body: {
        name: 'Test Parent',
        phone: '9850326135',
        category: 'Admissions',
        message: 'Hello'
      },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    };

    let statusCode = null;
    let jsonBody = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (body) => { jsonBody = body; }
        };
      }
    };

    await createInquiry(req, res, () => {});

    assert.equal(statusCode, 503);
    assert.equal(jsonBody.success, false);
    assert.ok(jsonBody.message.includes('Database service is currently unavailable'));
  });

});

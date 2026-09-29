const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const connectDB = require('../config/db');

describe('Database Connection Module (db.js) Tests', () => {

  it('throws an error and logs when MONGODB_URI is undefined and no override provided', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    try {
      await assert.rejects(
        async () => {
          await connectDB();
        },
        {
          message: 'MONGODB_URI environment variable is not defined in backend/.env'
        }
      );
    } finally {
      process.env.MONGODB_URI = originalUri;
    }
  });

  it('throws and logs when connecting with an invalid MongoDB URI', async () => {
    await assert.rejects(
      async () => {
        // Invalid protocol / host with immediate failure
        await connectDB('mongodb://invalid-host-that-does-not-exist:27017/test?serverSelectionTimeoutMS=500');
      }
    );
  });

});

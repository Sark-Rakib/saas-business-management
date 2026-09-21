const mongoose = require('mongoose');
const app = require('../server/src/app');

let cached = global.mongoose || (global.mongoose = {});

async function ensureConnection() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

module.exports = async function handler(req, res) {
  await ensureConnection();
  return app(req, res);
};
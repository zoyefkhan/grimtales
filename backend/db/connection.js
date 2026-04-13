/* ============================================
   db/connection.js — MongoDB Connection
============================================ */

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // ─── Catch common mistakes ────────────────
  if (!uri) {
    throw new Error(
      '❌ MONGODB_URI is missing from your .env file.\n' +
      '   Copy .env.example to .env and fill in your MongoDB connection string.'
    );
  }

  if (uri.includes('<password>')) {
    throw new Error(
      '❌ You forgot to replace <password> in your MONGODB_URI.\n' +
      '   Open your .env file and replace <password> with your actual MongoDB password.\n' +
      '   Example: mongodb+srv://admin:MyActualPassword123@cluster0.xxxxx.mongodb.net/grimtales'
    );
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (err.message.includes('bad auth') || err.message.includes('authentication failed')) {
      console.error('\n❌ MongoDB Authentication Failed — Wrong username or password');
      console.error('─────────────────────────────────────────────────────────────');
      console.error('Fix options:\n');
      console.error('  1. Open your .env file and check MONGODB_URI');
      console.error('  2. Make sure you replaced <password> with your real password');
      console.error('  3. If your password has special characters like @ / : #');
      console.error('     you must encode them:');
      console.error('       @  →  %40');
      console.error('       /  →  %2F');
      console.error('       :  →  %3A');
      console.error('       #  →  %23');
      console.error('     Example: password "p@ss/word" becomes "p%40ss%2Fword"');
      console.error('  4. In MongoDB Atlas → Database Access → check your user exists');
      console.error('  5. Try resetting the password in Atlas and updating .env\n');

      try {
        const url = new URL(uri);
        console.error(`  Your URI username: ${url.username}`);
        console.error(`  Your URI host:     ${url.host}\n`);
      } catch { /* ignore parse errors */ }

    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
      console.error('\n❌ MongoDB Not Found / Connection Refused');
      console.error('  1. Check your internet connection');
      console.error('  2. Atlas → Network Access → add 0.0.0.0/0');
      console.error('  3. Atlas → check your cluster is not paused (Resume if needed)\n');

    } else if (err.message.includes('timed out') || err.message.includes('ETIMEDOUT')) {
      console.error('\n❌ MongoDB Connection Timed Out');
      console.error('  1. Atlas → Network Access → add 0.0.0.0/0 to IP whitelist');
      console.error('  2. Check your internet connection\n');

    } else {
      console.error('\n❌ MongoDB connection error:', err.message, '\n');
    }

    throw err;
  }
};

// ─── Reconnect on disconnect ───────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Reconnecting in 5 seconds...');
  setTimeout(() => connectDB().catch(() => {}), 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

module.exports = connectDB;
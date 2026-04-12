/* ============================================
   utils/email.js — Email Sending Utility
   Uses Nodemailer (works with Resend SMTP)
============================================ */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BASE_STYLE = `
  font-family: Georgia, serif;
  background: #0a0a0b;
  color: #d4d0c8;
  padding: 40px 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const CARD_STYLE = `
  background: #1a1a1e;
  border: 1px solid #3a3a44;
  border-left: 4px solid #8b1a1a;
  border-radius: 8px;
  padding: 32px;
  margin-top: 24px;
`;

const BTN_STYLE = `
  display: inline-block;
  background: #8b1a1a;
  color: #ffffff;
  padding: 12px 28px;
  border-radius: 4px;
  text-decoration: none;
  font-family: serif;
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 24px;
`;

// ─── Send Generic Email ───────────────────────
async function sendEmail({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: `GrimTales <${process.env.EMAIL_FROM || 'noreply@grimtales.com'}>`,
    to,
    subject,
    html,
  });
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
}

// ─── Welcome Email ────────────────────────────
async function sendWelcomeEmail(user) {
  const html = `
    <div style="${BASE_STYLE}">
      <h1 style="font-family:serif;color:#c0392b;font-size:28px;margin:0 0 8px">GrimTales</h1>
      <p style="color:#9a9aaa;font-size:13px;letter-spacing:0.15em;text-transform:uppercase">Where Darkness Tells Its Story</p>
      <div style="${CARD_STYLE}">
        <h2 style="color:#f0eee8;font-size:22px;margin:0 0 16px">Welcome, ${user.username}</h2>
        <p style="line-height:1.7;color:#c4c4d4">Your account has been created. You now have access to over 12,000 dark fantasy, gothic, and horror novels — completely free.</p>
        <p style="line-height:1.7;color:#c4c4d4;margin-top:12px">Explore the archives, follow your favourite authors, and track your reading progress across any device.</p>
        <a href="${process.env.CLIENT_URL}/browse.html" style="${BTN_STYLE}">Explore Novels →</a>
      </div>
      <p style="font-size:12px;color:#6a6a7a;margin-top:32px;text-align:center">© 2026 GrimTales · <a href="${process.env.CLIENT_URL}/settings.html" style="color:#8b1a1a">Unsubscribe</a></p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to GrimTales — The Darkness Awaits', html });
}

// ─── Password Reset Email ─────────────────────
async function sendPasswordResetEmail(user, resetToken) {
  const resetURL = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`;
  const html = `
    <div style="${BASE_STYLE}">
      <h1 style="font-family:serif;color:#c0392b;font-size:28px;margin:0 0 8px">GrimTales</h1>
      <div style="${CARD_STYLE}">
        <h2 style="color:#f0eee8;font-size:20px;margin:0 0 16px">Password Reset Request</h2>
        <p style="line-height:1.7;color:#c4c4d4">Someone requested a password reset for your GrimTales account (<strong>${user.email}</strong>).</p>
        <p style="line-height:1.7;color:#c4c4d4;margin-top:12px">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetURL}" style="${BTN_STYLE}">Reset Password →</a>
        <p style="font-size:12px;color:#6a6a7a;margin-top:20px">If you didn't request this, ignore this email. Your password will remain unchanged.</p>
      </div>
      <p style="font-size:12px;color:#6a6a7a;margin-top:32px;text-align:center">© 2026 GrimTales</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'GrimTales — Password Reset', html });
}

// ─── Email Verification ───────────────────────
async function sendEmailVerification(user, verifyToken) {
  const verifyURL = `${process.env.CLIENT_URL}/verify-email.html?token=${verifyToken}`;
  const html = `
    <div style="${BASE_STYLE}">
      <h1 style="font-family:serif;color:#c0392b;font-size:28px;margin:0 0 8px">GrimTales</h1>
      <div style="${CARD_STYLE}">
        <h2 style="color:#f0eee8;font-size:20px;margin:0 0 16px">Verify Your Email</h2>
        <p style="line-height:1.7;color:#c4c4d4">Please verify your email address to unlock all features of your GrimTales account.</p>
        <a href="${verifyURL}" style="${BTN_STYLE}">Verify Email →</a>
      </div>
      <p style="font-size:12px;color:#6a6a7a;margin-top:32px;text-align:center">© 2026 GrimTales</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'GrimTales — Verify Your Email', html });
}

// ─── New Chapter Alert ────────────────────────
async function sendChapterAlert(follower, novel, chapter) {
  const chapterURL = `${process.env.CLIENT_URL}/chapter-read.html?id=${chapter._id}`;
  const html = `
    <div style="${BASE_STYLE}">
      <h1 style="font-family:serif;color:#c0392b;font-size:28px;margin:0 0 8px">GrimTales</h1>
      <div style="${CARD_STYLE}">
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8b1a1a;margin:0 0 12px">New Chapter Alert</p>
        <h2 style="color:#f0eee8;font-size:20px;margin:0 0 8px">${novel.title}</h2>
        <p style="color:#9a9aaa;font-size:14px;margin:0 0 16px">by ${novel.author?.username}</p>
        <p style="color:#c4c4d4;font-size:16px;font-style:italic">Chapter ${chapter.number}: ${chapter.title}</p>
        <a href="${chapterURL}" style="${BTN_STYLE}">Read Now →</a>
      </div>
      <p style="font-size:12px;color:#6a6a7a;margin-top:32px;text-align:center">© 2026 GrimTales · <a href="${process.env.CLIENT_URL}/settings.html" style="color:#8b1a1a">Manage Alerts</a></p>
    </div>
  `;
  return sendEmail({ to: follower.email, subject: `New Chapter: ${novel.title} — Chapter ${chapter.number}`, html });
}

module.exports = { sendEmail, sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerification, sendChapterAlert };

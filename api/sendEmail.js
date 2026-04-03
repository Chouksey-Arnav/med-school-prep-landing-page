// api/sendEmail.js
// Vercel Serverless Function — NodeMailer Gmail OTP
// Env vars required in Vercel dashboard:
//   GMAIL_USER         → your Gmail address (e.g. medschoolprep@gmail.com)
//   GMAIL_APP_PASSWORD → 16-char App Password from Google Account → Security → App passwords

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, text or html' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email address' });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const mailOptions = {
    from: `"MedSchoolPrep" <${gmailUser}>`,
    to,
    subject,
    text: text || '',
    html: html || `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: -apple-system, 'Inter', sans-serif; background: #030014; color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 0 auto; padding: 40px 24px; }
          .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white; margin-bottom: 32px; line-height: 48px; text-align: center; }
          .card { background: #0b0f1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px; }
          h2 { font-size: 22px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.03em; }
          p { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
          .otp { font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #3b82f6; text-align: center; padding: 20px 0; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; margin-bottom: 24px; }
          .note { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 20px; }
          .footer { text-align: center; margin-top: 32px; font-size: 12px; color: rgba(255,255,255,0.2); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo" style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;text-align:center;line-height:48px;font-weight:900;font-size:22px;color:white;margin-bottom:32px;">M</div>
          <div class="card">
            <h2>Reset your password</h2>
            <p>Enter the code below in MedSchoolPrep to reset your password. This code expires in 15 minutes.</p>
            <div class="otp">${text.match(/\d{6}/) ? text.match(/\d{6}/)[0] : text}</div>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <div class="note">For security, never share this code with anyone. MedSchoolPrep staff will never ask for it.</div>
          </div>
          <div class="footer">© 2025 MedSchoolPrep. All rights reserved.</div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${to}`);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
};

const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.emailService,
      auth: {
        user: config.emailUsername,
        pass: config.emailPassword,
      },
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(to, resetUrl) {
    const message = {
      from: config.emailFrom,
      to,
      subject: 'Password Reset Request',
      html: `
        <h1>Reset Your Password</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(message);
  }
}

module.exports = new EmailService();

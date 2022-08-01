const nodemailer = require('nodemailer');

const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_SERVER_USER,
    pass: process.env.MAIL_SERVER_PASS
  }
});

module.exports = mailTransporter;
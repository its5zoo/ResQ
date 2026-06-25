import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mdfaizaanrazakhan7@gmail.com',
    pass: '5zoozuu07'
  }
});

/**
 * Sends a notification email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
export const sendEmailReminder = async (to, subject, text, html = '') => {
  try {
    const mailOptions = {
      from: '"ResQ AI Assistant" <mdfaizaanrazakhan7@gmail.com>',
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error);
    return false;
  }
};

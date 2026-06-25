import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Resend using environment variable - never hardcode API keys!
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a notification email using Resend
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
export const sendEmailReminder = async (to, subject, text, html = '') => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ResQ AI Assistant <onboarding@resend.dev>',
      to: ['mdfaizaanrazakhan7@gmail.com'], // Hardcoded for Resend testing phase
      subject: subject,
      text: text,
      html: html || `<p>${text}</p>`
    });

    if (error) {
      console.error(`[EmailService] Resend API error sending to ${to}:`, error);
      return false;
    }

    console.log(`[EmailService] Email successfully sent to ${to}: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Exception while sending email to ${to}:`, error);
    return false;
  }
};

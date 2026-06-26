import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { getAuthUrl, getTokensFromCode, syncGoogleCalendar, getOAuth2Client } from '../services/googleCalendarService.js';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_super_secret_key_12345', {
    expiresIn: '7d',
  });
};

const router = express.Router();

// Generate auth URL - passing user ID as the state parameter
router.get('/auth-url', protect, async (req, res) => {
  try {
    const state = req.user._id.toString();
    const url = getAuthUrl(state);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate auth URL for login - passing 'login' as the state parameter
router.get('/login-url', async (req, res) => {
  try {
    const state = 'login';
    const url = getAuthUrl(state);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// OAuth Callback handler from Google
router.get('/callback', async (req, res) => {
  const { code, state } = req.query; // state is the user ID or 'login'

  if (!code || !state) {
    if (state === 'login') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=Authentication+failed`);
    }
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=error`);
  }

  try {
    const tokens = await getTokensFromCode(code);
    
    // Get user info to retrieve the email address
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email;
    const googleName = userInfo.data.name;

    if (!googleEmail) {
      if (state === 'login') {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=No+email+returned+from+Google`);
      }
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=error`);
    }

    // Enforce Gmail-only restriction
    if (!googleEmail.toLowerCase().endsWith('@gmail.com')) {
      if (state === 'login') {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=Only+valid+@gmail.com+accounts+are+allowed`);
      }
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=invalid_gmail`);
    }

    if (state === 'login') {
      // 1. Google Login Flow
      let user = await User.findOne({ email: googleEmail.toLowerCase() });
      if (!user) {
        // Create user if they don't exist yet
        const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user = await User.create({
          name: googleName || 'Google User',
          email: googleEmail.toLowerCase(),
          passwordHash: tempPassword,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token || null,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          googleEmail: googleEmail
        });
      } else {
        // Update user tokens
        user.googleAccessToken = tokens.access_token;
        if (tokens.refresh_token) {
          user.googleRefreshToken = tokens.refresh_token;
        }
        if (tokens.expiry_date) {
          user.googleTokenExpiry = new Date(tokens.expiry_date);
        }
        user.googleEmail = googleEmail;
        await user.save();
      }

      // Generate JWT for ResQ
      const jwtToken = generateToken(user._id);

      // Redirect to AuthPage with token
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?token=${jwtToken}&theme=${user.theme}&plan=${user.plan}`);
    }

    // 2. Calendar Sync Link Flow (state is user ID)
    const user = await User.findById(state);
    if (!user) {
      return res.status(404).send('User not found');
    }

    if (googleEmail.toLowerCase() !== user.email.toLowerCase()) {
      console.warn(`[Google Callback] Email mismatch: ResQ user is ${user.email}, but attempted to link ${googleEmail}`);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=email_mismatch`);
    }

    // Save tokens and email to User
    user.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token; // Refresh token only returned on first consent
    }
    if (tokens.expiry_date) {
      user.googleTokenExpiry = new Date(tokens.expiry_date);
    }
    user.googleEmail = googleEmail;
    
    await user.save();

    // Trigger initial sync
    try {
      await syncGoogleCalendar(user);
    } catch (syncErr) {
      console.error('[Google Callback] Failed to run initial sync:', syncErr.message);
    }

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=success`);
  } catch (err) {
    console.error('[Google Callback] OAuth Callback error:', err.message);
    if (state === 'login') {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=Google+login+failed`);
    }
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?tab=settings&sync=error`);
  }
});

// Sync events
router.post('/sync', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ message: 'Google Account is not connected.' });
    }

    const result = await syncGoogleCalendar(user);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Disconnect/revoke Google link
router.post('/disconnect', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.googleAccessToken = null;
      user.googleRefreshToken = null;
      user.googleTokenExpiry = null;
      user.googleEmail = null;
      await user.save();
      res.json({ message: 'Disconnected Google Calendar account successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

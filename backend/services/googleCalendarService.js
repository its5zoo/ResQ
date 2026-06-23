import { google } from 'googleapis';
import User from '../models/User.js';
import CalendarEvent from '../models/CalendarEvent.js';

export const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_placeholder',
    process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret_placeholder',
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback'
  );
};

export const getAuthUrl = (state) => {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ]
  });
};

export const getTokensFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const getCalendarClient = async (user) => {
  const oauth2Client = getOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : null
  });

  // Check if token is expired or expiring in 5 mins
  const isExpired = user.googleTokenExpiry && (new Date(user.googleTokenExpiry).getTime() - Date.now() < 5 * 60 * 1000);
  
  if (isExpired && user.googleRefreshToken) {
    try {
      console.log(`[Google SDK] Token expired/expiring for user ${user._id}. Refreshing...`);
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      user.googleAccessToken = credentials.access_token;
      if (credentials.expiry_date) {
        user.googleTokenExpiry = new Date(credentials.expiry_date);
      }
      await user.save();
      
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error('[Google SDK] Failed to refresh token:', err.message);
      throw new Error('Google Calendar re-authorization required');
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Synchronize local database with Google Calendar events (bidirectional)
 */
export const syncGoogleCalendar = async (user) => {
  if (!user.googleAccessToken) {
    throw new Error('User not linked to Google Calendar');
  }

  const calendar = await getCalendarClient(user);
  
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days future

  console.log(`[Google Sync] Fetching events for user ${user._id} between ${timeMin} and ${timeMax}`);

  // 1. Pull events from Google Calendar primary calendar
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime'
  });

  const googleEvents = response.data.items || [];
  console.log(`[Google Sync] Found ${googleEvents.length} events on Google Calendar`);

  for (const gEvent of googleEvents) {
    const start = gEvent.start?.dateTime || gEvent.start?.date;
    const end = gEvent.end?.dateTime || gEvent.end?.date;
    if (!start || !end) continue;

    const startTime = new Date(start);
    const endTime = new Date(end);

    // Look for existing local event with this googleEventId
    let localEvent = await CalendarEvent.findOne({ userId: user._id, googleEventId: gEvent.id });

    if (localEvent) {
      // Update local event to match Google Calendar
      localEvent.title = gEvent.summary || 'Google Sync Event';
      localEvent.startTime = startTime;
      localEvent.endTime = endTime;
      localEvent.notes = gEvent.description || '';
      await localEvent.save();
    } else {
      // Try to find a local event with matching details to avoid duplication
      localEvent = await CalendarEvent.findOne({
        userId: user._id,
        title: gEvent.summary,
        startTime,
        endTime
      });

      if (localEvent) {
        // Link existing local event
        localEvent.googleEventId = gEvent.id;
        await localEvent.save();
      } else {
        // Create new local event
        const newLocalEvent = new CalendarEvent({
          userId: user._id,
          title: gEvent.summary || 'Google Sync Event',
          startTime,
          endTime,
          type: 'user_block',
          notes: gEvent.description || 'Synced from Google Calendar',
          googleEventId: gEvent.id
        });
        await newLocalEvent.save();
      }
    }
  }

  // 2. Push local events that do not have a googleEventId to Google Calendar
  const localEventsToPush = await CalendarEvent.find({
    userId: user._id,
    googleEventId: null
  });

  console.log(`[Google Sync] Pushing ${localEventsToPush.length} local events to Google Calendar`);

  for (const localEvent of localEventsToPush) {
    try {
      const gEventBody = {
        summary: localEvent.title,
        description: localEvent.notes || 'Created in ResQ App',
        start: {
          dateTime: localEvent.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: localEvent.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      };

      const createdGEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: gEventBody
      });

      if (createdGEvent.data.id) {
        localEvent.googleEventId = createdGEvent.data.id;
        await localEvent.save();
      }
    } catch (pushErr) {
      console.error(`[Google Sync] Failed to push local event "${localEvent.title}":`, pushErr.message);
    }
  }

  return { success: true, googleEventCount: googleEvents.length, pushedEventCount: localEventsToPush.length };
};

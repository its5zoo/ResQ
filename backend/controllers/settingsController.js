import User from '../models/User.js';

export const updateTheme = async (req, res) => {
  const { theme } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.theme = theme;
    await user.save();
    res.json({ message: 'Theme updated successfully', theme: user.theme });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFontSize = async (req, res) => {
  const { fontSize } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.fontSize = fontSize;
    await user.save();
    res.json({ message: 'Font size updated successfully', fontSize: user.fontSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePlan = async (req, res) => {
  const { plan } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.plan = plan;
    await user.save();
    res.json({ message: 'Plan updated successfully', plan: user.plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWorkingHours = async (req, res) => {
  const { start, end } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (start) user.workingHours.start = start;
    if (end) user.workingHours.end = end;
    await user.save();
    res.json({ message: 'Working hours updated successfully', workingHours: user.workingHours });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGoogleCalendarDefaultIntegrated = async (req, res) => {
  const { googleCalendarDefaultIntegrated } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.googleCalendarDefaultIntegrated = !!googleCalendarDefaultIntegrated;
    await user.save();
    res.json({ 
      message: 'Google Calendar default integration preference updated successfully', 
      googleCalendarDefaultIntegrated: user.googleCalendarDefaultIntegrated 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAiVoice = async (req, res) => {
  const { aiVoiceEnabled } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.voiceAI.enabled = !!aiVoiceEnabled;
    user.voiceAI.disabledReason = !aiVoiceEnabled ? 'user_disabled' : null;
    await user.save();
    res.json({ 
      message: 'AI Voice setting updated successfully', 
      aiVoiceEnabled: user.voiceAI.enabled,
      voiceAI: user.voiceAI
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVoiceSettings = async (req, res) => {
  const { enabled, voiceSpeed, voicePitch, ambientSound, proactiveAlerts } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (enabled !== undefined) {
      if (enabled) {
        if (user.voiceAI.disabledReason === 'limit_reached') {
          user.voiceAI.enabled = false;
          await user.save();
          return res.json({
            blocked: true,
            reason: 'limit_reached',
            voiceAI: user.voiceAI
          });
        } else {
          user.voiceAI.enabled = true;
          user.voiceAI.disabledReason = null;
        }
      } else {
        user.voiceAI.enabled = false;
        user.voiceAI.disabledReason = 'user_disabled';
      }
    }

    if (voiceSpeed !== undefined) user.voiceAI.voiceSpeed = voiceSpeed;
    if (voicePitch !== undefined) user.voiceAI.voicePitch = voicePitch;
    if (ambientSound !== undefined) user.voiceAI.ambientSound = ambientSound;
    if (proactiveAlerts !== undefined) user.voiceAI.proactiveAlerts = proactiveAlerts;

    await user.save();

    if (req.io) {
      req.io.to(`user_${user._id}`).emit('settings:updated', {
        voiceAI: user.voiceAI,
        aiVoiceEnabled: user.voiceAI.enabled,
        plan: user.plan
      });
    }

    res.json(user.voiceAI);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


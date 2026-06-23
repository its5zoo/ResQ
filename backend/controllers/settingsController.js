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


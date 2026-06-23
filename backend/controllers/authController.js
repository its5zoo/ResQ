import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_super_secret_key_12345', {
    expiresIn: '7d',
  });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        plan: user.plan,
        googleCalendarDefaultIntegrated: user.googleCalendarDefaultIntegrated,
        aiVoiceEnabled: user.voiceAI?.enabled ?? true,
        voiceAI: user.voiceAI,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        plan: user.plan,
        googleCalendarDefaultIntegrated: user.googleCalendarDefaultIntegrated,
        aiVoiceEnabled: user.voiceAI?.enabled ?? true,
        voiceAI: user.voiceAI,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        theme: user.theme,
        plan: user.plan,
        fontSize: user.fontSize,
        workingHours: user.workingHours,
        googleEmail: user.googleEmail,
        googleAccessToken: user.googleAccessToken,
        googleCalendarDefaultIntegrated: user.googleCalendarDefaultIntegrated,
        aiVoiceEnabled: user.voiceAI?.enabled ?? true,
        voiceInteractionsCount: user.voiceAI?.monthlyCommandsUsed ?? 0,
        voiceInteractionsResetDate: user.voiceAI?.lastResetDate ?? new Date(),
        voiceAI: user.voiceAI,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.theme = req.body.theme || user.theme;
      user.plan = req.body.plan || user.plan;
      user.name = req.body.name || user.name;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        theme: updatedUser.theme,
        plan: updatedUser.plan,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshUserToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_super_secret_key_12345', {
      ignoreExpiration: true
    });
    const newToken = generateToken(decoded.id);
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

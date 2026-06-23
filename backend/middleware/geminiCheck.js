export const checkGeminiKey = (req, res, next) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
    console.warn('[Warning] GEMINI_API_KEY is missing or configured with placeholder. Service is unavailable.');
    return res.status(503).json({ message: 'AI services are currently unavailable. Please configure the GEMINI_API_KEY.' });
  }
  next();
};

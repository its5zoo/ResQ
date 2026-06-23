import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
  console.warn('WARNING: GEMINI_API_KEY is not configured in .env. AI features will run in mock mode.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'MOCK_KEY');

export default genAI;

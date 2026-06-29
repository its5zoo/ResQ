import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.5-flash — current production model (2.0-flash deprecated June 1, 2026)
const RESQ_MODEL = 'gemini-2.5-flash';

export function getResQModel() {
  return genAI.getGenerativeModel({ 
    model: RESQ_MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });
}

// Safety check on startup
export function verifyModelConfig() {
  if (RESQ_MODEL !== 'gemini-2.5-flash') {
    throw new Error('CRITICAL: ResQ model config tampered. Only gemini-2.5-flash is allowed.');
  }
  console.log(`✅ ResQ AI Engine: ${RESQ_MODEL} verified`);
}


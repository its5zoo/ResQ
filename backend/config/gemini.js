import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-3.1-flash-lite as requested
const RESQ_MODEL = 'gemini-3.1-flash-lite';

export function getResQModel() {
  return genAI.getGenerativeModel({ 
    model: RESQ_MODEL,
    generationConfig: {
      temperature: 0.7,       // balanced creativity + precision
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,  // enough for JSON + voice response
    }
  });
}

// Safety check on startup
export function verifyModelConfig() {
  if (RESQ_MODEL !== 'gemini-3.1-flash-lite') {
    throw new Error('CRITICAL: ResQ model config tampered. Only gemini-3.1-flash-lite is allowed.');
  }
  console.log(`✅ ResQ AI Engine: ${RESQ_MODEL} verified`);
}

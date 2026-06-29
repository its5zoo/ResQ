import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });


await mongoose.connect(process.env.MONGO_URI);
const { default: User } = await import('../models/User.js');

const user = await User.findOne({ googleAccessToken: { $ne: null } })
  .select('name email googleAccessToken googleRefreshToken googleTokenExpiry');

if (user) {
  console.log('✅ Google connected user found:');
  console.log('  Name:', user.name);
  console.log('  Email:', user.email);
  console.log('  Has access token:', !!user.googleAccessToken);
  console.log('  Has refresh token:', !!user.googleRefreshToken);
  console.log('  Token expiry:', user.googleTokenExpiry);
} else {
  console.log('❌ No user has Google Calendar connected yet.');
}

await mongoose.disconnect();

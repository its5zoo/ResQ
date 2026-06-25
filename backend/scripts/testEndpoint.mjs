import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Connect to DB and get a real user token
await mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

const user = await User.findOne({ email: 'iamrevenent007@gmail.com' });
if (!user) { console.error('User not found'); process.exit(1); }

const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Token generated for:', user.email);

// Now call the actual API endpoint
const response = await fetch('http://localhost:5000/api/subscription/payment/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ plan_type: 'monthly' })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));

await mongoose.disconnect();
process.exit(0);

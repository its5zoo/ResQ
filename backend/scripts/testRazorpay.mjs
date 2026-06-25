import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';

console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET ✅' : 'MISSING ❌');

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const plans = {
  monthly: 29900,
  yearly: 286900
};

for (const [type, amount] of Object.entries(plans)) {
  try {
    const order = await rzp.orders.create({ amount, currency: 'INR', receipt: `test_${type}` });
    console.log(`✅ ${type} order: ${order.id} | ₹${amount / 100}`);
  } catch(e) {
    console.error(`❌ ${type} FAILED:`, e.message);
    console.error('   Status:', e.statusCode);
    console.error('   Description:', e.error?.description);
  }
}

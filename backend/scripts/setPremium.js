import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const TARGET_EMAIL = 'iamrevenent007@gmail.com';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema);

async function setPremium() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const now = new Date();
  const tenYearsLater = new Date(now);
  tenYearsLater.setFullYear(tenYearsLater.getFullYear() + 10);

  const result = await User.findOneAndUpdate(
    { email: TARGET_EMAIL },
    {
      $set: {
        plan: 'premium',
        subscription_type: 'yearly',
        subscription_status: 'active',
        subscription_start: now,
        subscription_end: tenYearsLater,
        trial_claimed: true,
        trial_start_date: now,
        trial_end_date: tenYearsLater
      }
    },
    { new: true }
  );

  if (!result) {
    console.error(`❌ User not found: ${TARGET_EMAIL}`);
  } else {
    console.log(`\n🎉 SUCCESS! Account upgraded to PREMIUM:`);
    console.log(`   Email:    ${result.email}`);
    console.log(`   Plan:     ${result.plan}`);
    console.log(`   Status:   ${result.subscription_status}`);
    console.log(`   Expires:  ${result.subscription_end}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

setPremium().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

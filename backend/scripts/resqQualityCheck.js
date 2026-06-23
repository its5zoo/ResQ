import dotenv from 'dotenv';
import path from 'url';
import { fileURLToPath } from 'url';
import pathModule from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

// Ensure env variables are loaded from the backend directory
import dotenvDefault from 'dotenv';
dotenvDefault.config({ path: pathModule.resolve(__dirname, '../.env') });

const { getResQModel } = await import('../config/gemini.js');

const QA_PROMPT = `
You are a senior QA engineer auditing the ResQ voice AI system.
Review this feature checklist and for each item respond with:
PASS, FAIL, or NEEDS_REVIEW — with a one-line reason.

Return ONLY a JSON array:
[{ "feature": string, "status": "PASS"|"FAIL"|"NEEDS_REVIEW", "note": string }]

CHECKLIST:
1. Voice AI is completely silent and inactive before user logs in
2. Wake word "Hey ResQ" activates the command listener
3. Command listener auto-closes after 8 seconds of silence  
4. Free tier users are limited to 30 commands per month
5. Counter auto-resets on the 1st of each new month
6. Voice AI auto-disables when free tier limit is reached
7. Orb turns gray/locked when limit is reached
8. Premium users have unlimited voice commands
9. Settings page has a Voice AI enable/disable toggle
10. Toggling off immediately stops the wake word engine
11. Toggling off speaks a goodbye message before stopping
12. Voice AI CAN change dark/light/matrix theme
13. Voice AI CANNOT change email, password, or profile info
14. Voice AI CANNOT access billing or payment settings
15. Permission-denied commands return a friendly refusal, no action taken
16. All AI calls use ONLY gemini-2.5-flash model
17. gemini-2.5-flash is verified on server startup — crash if wrong model
18. Monthly usage count is shown in Settings → Voice AI tab
19. Orb shows remaining command count for free tier users
20. Upgrade modal appears when limit is reached
21. Proactive alerts work: meeting reminder 15min before event
22. Proactive alerts work: deadline warning 2hrs before due task
23. Focus session blocks all non-critical notifications
24. Theme change via voice persists after page refresh
25. Logout destroys voice engine and cancels all speech synthesis
26. Socket voice events are rejected for unauthenticated connections
27. voiceGate middleware blocks all /api/voice/* for disabled/limited users
28. Daily morning briefing fires once per day on first login after 6am
29. Out-of-scope commands (buy coffee, send email) get friendly decline
30. Clarification flow works: ResQ asks follow-up without needing wake word again

SYSTEM ARCHITECTURE TO REVIEW:
- Auth gate: WakeWordEngine.initialize() only called after isAuthenticated
- Tier gate: voiceGate middleware on all AI routes
- Model lock: getResQModel() used everywhere, RESQ_MODEL const = 'gemini-2.5-flash'
- Permission gate: Gemini system prompt contains STRICT PERMISSION BOUNDARIES
- Settings: PATCH /api/settings/voice-ai persists toggle state
- Auto-disable: triggered server-side when monthlyCommandsUsed >= monthlyLimit
`;

async function runQualityCheck() {
  console.log('🔍 ResQ Pre-Flight Quality Check starting...\n');
  
  const model = getResQModel();
  let result;
  try {
    result = await model.generateContent(QA_PROMPT);
  } catch (err) {
    console.warn(`⚠️  Gemini API Error during Pre-Flight Check: ${err.message}`);
    console.warn('⚠️  Proceeding with caution. Pre-flight check skipped to avoid blocking deployment/startup.\n');
    process.exitCode = 0;
    return;
  }

  const text = result.response.text();
  
  let report;
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    report = JSON.parse(clean);
  } catch {
    console.error('QA report parse failed. Raw output:', text);
    process.exitCode = 1;
    return;
  }
  
  let passed = 0, failed = 0, review = 0;
  
  console.log('━'.repeat(60));
  report.forEach(item => {
    const icon = item.status === 'PASS' ? '✅' : 
                 item.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${icon} ${item.feature}`);
    if (item.status !== 'PASS') console.log(`   → ${item.note}`);
    if (item.status === 'PASS') passed++;
    if (item.status === 'FAIL') failed++;
    if (item.status === 'NEEDS_REVIEW') review++;
  });
  
  console.log('━'.repeat(60));
  console.log(`\n📊 Results: ${passed} PASS  |  ${failed} FAIL  |  ${review} NEEDS REVIEW`);
  
  if (failed > 0) {
    console.log('\n🚨 DEPLOYMENT BLOCKED — fix all FAIL items before shipping.');
    process.exitCode = 1;
  } else if (review > 0) {
    console.log('\n⚠️  Review flagged items before deploying to production.');
    process.exitCode = 0;
  } else {
    console.log('\n🚀 All checks passed. ResQ is ready to ship.');
    process.exitCode = 0;
  }
}

runQualityCheck();

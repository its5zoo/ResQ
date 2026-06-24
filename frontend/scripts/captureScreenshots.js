import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Local Edge or Chrome executable path on Windows
const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  if (!fs.existsSync(executablePath)) {
    console.error(`Browser executable not found at ${executablePath}.`);
    return;
  }

  const browser = await puppeteer.launch({ 
    executablePath,
    headless: 'new',
    defaultViewport: null,
    args: ['--window-size=1440,900']
  });
  const page = await browser.newPage();
  
  // Set viewport to a nice desktop size
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  // Mock localStorage for auth if needed (assuming the app uses typical token auth)
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImR1bW15IiwiZW1haWwiOiJkZXZlbG9wZXJAcmVzcS5haSIsImlhdCI6MTc4MjI5MTE3NiwiZXhwIjoxNzgyMjk0Nzc2fQ.KjTlBJgblVIls0hfMgrb9l1GTqJBovyAVkcSW8GtZpw');
    localStorage.setItem('user', JSON.stringify({ name: 'MD Faizaan Raza Khan', email: 'developer@resq.ai' }));
    // Force dark theme
    localStorage.setItem('resq-theme', 'dark');
  });

  try {
    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });

    // Hide any unwanted elements like toast notifications if needed
    
    // Screenshot 1: Full Dashboard Hero
    console.log('Capturing Dashboard...');
    await page.screenshot({ path: path.join(screenshotsDir, 'hero_dashboard_preview.png') });

    // Switch to Tasks Tab
    console.log('Switching to Tasks...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tasksTab = tabs.find(t => t.textContent.includes('TASKS') || t.textContent.includes('Tasks'));
      if (tasksTab) tasksTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, 'tasks_board.png') });

    // Switch to Goals Tab
    console.log('Switching to Goals...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const goalsTab = tabs.find(t => t.textContent.includes('GOALS') || t.textContent.includes('Goals'));
      if (goalsTab) goalsTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, 'goals_milestones.png') });

    // Switch to Calendar Tab
    console.log('Switching to Calendar...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const calTab = tabs.find(t => t.textContent.includes('CALENDAR') || t.textContent.includes('Calendar'));
      if (calTab) calTab.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, 'calendar_agenda.png') });

    console.log('Screenshots captured successfully!');
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
}

run();

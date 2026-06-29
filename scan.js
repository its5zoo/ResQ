const fs = require('fs');
const path = require('path');

function walkDir(dir, filterExt) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walkDir(file, filterExt));
      }
    } else {
      if (filterExt.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const frontendFiles = walkDir('frontend/src', ['.jsx', '.js', '.css']);
const frontendExclude = ['main.jsx', 'App.jsx', 'index.js'];

// Command A
console.log("--- COMMAND A (Frontend Unused Files) ---");
let frontendCounts = [];
for (const file of frontendFiles) {
  const filename = path.basename(file);
  if (frontendExclude.includes(filename)) continue;
  
  const name = filename.replace(/\.[^/.]+$/, "");
  let count = 0;
  for (const checkFile of frontendFiles) {
    if (checkFile === file) continue;
    if (checkFile.endsWith('.css')) continue; // only check .jsx/.js
    const content = fs.readFileSync(checkFile, 'utf8');
    if (content.includes(name)) count++;
  }
  frontendCounts.push({ file, count });
}
frontendCounts.sort((a,b) => a.count - b.count).slice(0, 40).forEach(f => console.log(`${f.count} ${f.file}`));

// Command B
console.log("--- COMMAND B (Backend Unused Files) ---");
const backendFiles = walkDir('backend', ['.js']);
const backendExclude = ['server.js', 'app.js', 'index.js', 'gemini.js']; // excluding a few standard ones
let backendCounts = [];
for (const file of backendFiles) {
  const filename = path.basename(file);
  if (backendExclude.includes(filename)) continue;
  
  const name = filename.replace(/\.[^/.]+$/, "");
  let count = 0;
  for (const checkFile of backendFiles) {
    if (checkFile === file) continue;
    const content = fs.readFileSync(checkFile, 'utf8');
    if (content.includes(name)) count++;
  }
  backendCounts.push({ file, count });
}
backendCounts.sort((a,b) => a.count - b.count).slice(0, 40).forEach(f => console.log(`${f.count} ${f.file}`));

// Command C
console.log("--- COMMAND C (Unused CSS in Frontend) ---");
let cssCounts = [];
for (const file of frontendFiles) {
  if (!file.endsWith('.css')) continue;
  const filename = path.basename(file);
  let count = 0;
  for (const checkFile of frontendFiles) {
    if (checkFile.endsWith('.css')) continue;
    const content = fs.readFileSync(checkFile, 'utf8');
    if (content.includes(filename)) count++;
  }
  cssCounts.push({ file, count });
}
cssCounts.sort((a,b) => a.count - b.count).forEach(f => console.log(`${f.count} ${f.file}`));

// Command E
console.log("--- COMMAND E (Large Files) ---");
const allFiles = [...frontendFiles, ...backendFiles];
let largeFiles = [];
for (const file of allFiles) {
  const stats = fs.statSync(file);
  if (stats.size > 50 * 1024) {
    largeFiles.push({ file, size: stats.size });
  }
}
largeFiles.sort((a,b) => b.size - a.size).slice(0, 20).forEach(f => console.log(`${Math.round(f.size/1024)}KB ${f.file}`));

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.astro'];
const TARGET_DIR = process.cwd();

function getFilesUpdatedToday(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  const now = new Date();
  
  // Set "today" to start at 00:00:00 local time
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip ignored directories
    if (IGNORE_DIRS.some(ignored => filePath.includes(ignored))) return;

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      getFilesUpdatedToday(filePath, fileList);
    } else {
      // Check if the last modified time is after the start of today
      if (stats.mtimeMs >= startOfToday) {
        fileList.push({
          path: path.relative(TARGET_DIR, filePath),
          time: stats.mtime.toLocaleTimeString()
        });
      }
    }
  });

  return fileList;
}

const updatedFiles = getFilesUpdatedToday(TARGET_DIR);

console.log(`\n--- Files Updated Today (${new Date().toLocaleDateString()}) ---`);
if (updatedFiles.length === 0) {
  console.log('No files updated today.');
} else {
  updatedFiles.sort((a, b) => b.time.localeCompare(a.time)).forEach(f => {
    console.log(`[${f.time}] ${f.path}`);
  });
}
console.log('--------------------------------------------------\n');
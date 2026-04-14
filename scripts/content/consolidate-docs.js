const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const docsDir = path.join(projectRoot, 'docs');
const outputFile = path.join(docsDir, 'consolidated-docs.txt');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(docsDir)
  .filter(file => path.resolve(file) !== path.resolve(outputFile))
  .sort();

let output = '';

for (const file of files) {
  const relativePath = path.relative(docsDir, file);
  const content = fs.readFileSync(file, 'utf8');
  output += `\n\n===== ${relativePath} =====\n\n${content}`;
}

fs.writeFileSync(outputFile, output.trimStart(), 'utf8');

console.log(`Wrote ${files.length} files to ${outputFile}`);
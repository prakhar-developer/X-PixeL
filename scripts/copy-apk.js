const fs = require('fs');
const path = require('path');
const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error('Usage: node scripts/copy-apk.js <src> <dest>');
  process.exit(2);
}
if (!fs.existsSync(src)) {
  console.error('Source not found:', src);
  process.exit(3);
}
const destDir = path.dirname(dest);
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied', src, '->', dest);

const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'www');

// List of directories and file extensions to copy
const allowedDirs = ['css', 'js', 'assets'];
const allowedExts = ['.html', '.json', '.xml', '.txt'];
const ignoreFiles = ['package.json', 'package-lock.json', 'railway.toml', 'vercel.json'];

// Helper to check if a file should be copied
function shouldCopy(fileOrFolder) {
  if (ignoreFiles.includes(fileOrFolder)) return false;
  if (allowedDirs.includes(fileOrFolder)) return true;
  if (allowedExts.includes(path.extname(fileOrFolder))) return true;
  return false;
}

// Recursive copy
function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Clean and create www directory
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir);

// Copy allowed files and directories from root
fs.readdirSync(__dirname).forEach(file => {
  if (shouldCopy(file)) {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(targetDir, file);
    console.log(`Copying ${file}...`);
    copyRecursiveSync(srcPath, destPath);
  }
});

console.log('Frontend built to www/ successfully!');

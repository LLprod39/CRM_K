#!/usr/bin/env node
/*
  Safe project cleanup: removes common build artifacts and caches.
  Keeps all source files and configuration intact.
*/
const fs = require('fs');
const path = require('path');

const targets = [
  '.next',
  '.vercel',
  'coverage',
  'build',
  'out',
  '.cache',
  '.nyc_output',
  '.wwebjs_auth',
  '.wwebjs_cache',
  'dist',
  // node_modules is large; include behind an env toggle
  process.env.CLEAN_NODE_MODULES === '1' ? 'node_modules' : null,
].filter(Boolean);

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.lstatSync(p);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    for (const entry of fs.readdirSync(p)) {
      rmrf(path.join(p, entry));
    }
    try { fs.rmdirSync(p); } catch (e) { console.warn('Could not remove dir:', p, e.message); }
  } else {
    try { fs.unlinkSync(p); } catch (e) { console.warn('Could not remove file:', p, e.message); }
  }
}

let removed = [];
for (const t of targets) {
  const full = path.resolve(process.cwd(), t);
  if (fs.existsSync(full)) {
    console.log('Removing', t);
    rmrf(full);
    removed.push(t);
  }
}

if (removed.length === 0) {
  console.log('Nothing to clean.');
} else {
  console.log('Cleaned:', removed.join(', '));
}


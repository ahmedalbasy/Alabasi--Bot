const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const errors = [];

if (!pkg.scripts || !pkg.scripts.start) errors.push('package.json is missing scripts.start');
if (!fs.existsSync(path.join(root, 'index.js'))) errors.push('index.js is missing');
if (!fs.existsSync(path.join(root, 'settings.js'))) errors.push('settings.js is missing');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'session'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
      if (result.status !== 0) errors.push(`${path.relative(root, full)}: ${(result.stderr || result.stdout).trim()}`);
    }
  }
}
walk(root);

if (errors.length) {
  console.error('Project checks failed:\n' + errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log('Syntax and basic project checks passed.');

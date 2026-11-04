import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
function scripts(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? scripts(path) : /\.(m?js)$/.test(path) ? [path] : [];
  });
}
const files = ['src', 'experiences', 'scripts', 'tests'].flatMap(folder => scripts(join(root, folder)));
files.push(join(root, 'vite.config.js'));
for (const path of files) execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' });
await import('./check-content.mjs');
console.log(`JavaScript 语法检查通过：${files.length} 个文件。`);

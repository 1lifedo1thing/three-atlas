import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateWorks } from './content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const works = JSON.parse(readFileSync(new URL('../content/works.json', import.meta.url), 'utf8'));
const errors = validateWorks(works, root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`作品目录检查通过：${works.length} 个独立作品。`);

import { mkdir, copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';
async function copy(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name), target = path.join(to, entry.name);
    if (entry.isDirectory()) await copy(source, target);
    else await copyFile(source, target);
  }
}
await copy('public', 'dist');
console.log('静态游戏已构建至 dist/');

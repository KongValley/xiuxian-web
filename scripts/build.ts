import { cp, mkdir, readdir, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function build(): Promise<void> {
  const root=fileURLToPath(new URL('../',import.meta.url));
  const dist=path.join(root,'dist');
  await mkdir(dist,{recursive:true});
  // Only stale compiler files are removed; hosting metadata stays intact.
  for(const entry of await readdir(dist,{withFileTypes:true})){
    if(entry.isFile()&&(/\.(?:js|js\.map)$/.test(entry.name)))await unlink(path.join(dist,entry.name));
  }
  await cp(path.join(root,'public'),dist,{recursive:true});
  execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p',path.join(root,'tsconfig.build.json')],{cwd:root,stdio:'inherit',windowsHide:true});
  console.log('TypeScript 游戏已构建至 dist/');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();

import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';

await build();
const server=spawn(process.execPath,['--import','tsx',fileURLToPath(new URL('./server.ts',import.meta.url))],{stdio:'inherit',windowsHide:true});
let timer: ReturnType<typeof setTimeout>;
let building=false;
let dirty=false;
async function rebuild(): Promise<void> {
  if(building){dirty=true;return;}
  building=true;
  try{await build();}catch{console.error('编译失败，请修复 TypeScript 错误后保存。');}
  finally{building=false;if(dirty){dirty=false;void rebuild();}}
}
for(const directory of ['src','public'])watch(new URL('../'+directory+'/',import.meta.url),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(()=>void rebuild(),150);});
function stop(): void {server.kill();process.exit();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);

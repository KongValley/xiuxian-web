import { ARTIFACTS, EQUIPMENT } from './content.js';
import { ARTIFACT_STAGE_FACTORS, artifactStage } from './artifacts.js';
import type { ActionResult, Affix, AffixStat, Bonus, GameState, RandomSource, RealmPosition, ReforgeState, SpiritItem } from './types.js';

export const AFFIX_STATS:AffixStat[]=['attack','defense','hp','energy','cultivation','chance'];
export const AFFIX_NAMES:Record<AffixStat,string>={attack:'锋锐',defense:'坚韧',hp:'生机',energy:'纳灵',cultivation:'悟道',chance:'破障'};
export const AFFIX_LABELS:Record<AffixStat,string>={attack:'攻击',defense:'防御',hp:'气血上限',energy:'灵力上限',cultivation:'修炼收益',chance:'破境成功率'};
export const AFFIX_GRADES=['凡','灵','玄','道','仙'];
export const AFFIX_WEIGHTS=[50,28,14,6,2];
export const AFFIX_ACTIONS:string[]=['reforgeRoll','reforgeLock','reforgeAccept','reforgeDiscard','buyReforgeStone'];
const catalog=new Map<string,SpiritItem>([...EQUIPMENT,...ARTIFACTS].map(i=>[i.id,i]));
export function findSpiritItem(id:string):SpiritItem|undefined{return catalog.get(id);}
export function createReforge():ReforgeState{return {shards:8,records:{},locks:{},pending:null};}
export function ownsSpiritItem(s:GameState,item:SpiritItem):boolean{return Object.hasOwn(item.slot?s.gear:s.artifacts,item.id);}
export function reforgeCost(item:SpiritItem,locks:number){return {shards:(4+item.realm*2)*(locks+1),stones:40*(item.realm+1)*(locks+1),energy:8};}
export function affixRange(item:SpiritItem,stat:AffixStat,grade:number):[number,number]{
  const r=item.realm+1,base=({attack:2*r,defense:r,hp:12*r,energy:5*r,cultivation:1+Math.floor(item.realm/3),chance:1})[stat],quality=[1,1.3,1.7,2.2,3][grade-1];
  return [Math.max(1,Math.round(base*quality*.8)),Math.max(1,Math.round(base*quality*1.2))];
}
export function scaledAffixValue(line:Affix,item:SpiritItem,position:RealmPosition):number {
  const percent='effect' in item?Math.round(ARTIFACT_STAGE_FACTORS[artifactStage(item,position)]*100):100;
  return Math.round(line.value*percent/100);
}
export function affixLineText(line:Affix,item:SpiritItem,position:RealmPosition):string {
  const value=scaledAffixValue(line,item,position);return `${AFFIX_LABELS[line.stat]} +${value}${line.stat==='cultivation'?'%':line.stat==='chance'?' 个百分点':''}`;
}
export function affixBonus(s:GameState,item:SpiritItem,position:RealmPosition=s):Bonus {
  const bonus:Bonus={attack:0,defense:0,hp:0,energy:0};if(s.version<8)return bonus;
  for(const line of s.reforge.records[item.id]||[])if(line.stat in bonus)bonus[line.stat as keyof Bonus]+=scaledAffixValue(line,item,position);
  return bonus;
}
export function affixSpecials(s:GameState):{cultivation:number;chance:number}{
  let cultivation=0,chance=0;if(s.version<8)return {cultivation,chance};
  for(const id of Object.values(s.equipped)){const item=id?findSpiritItem(id):undefined;if(!item)continue;for(const line of s.reforge.records[item.id]||[]){const value=scaledAffixValue(line,item,s);if(line.stat==='cultivation')cultivation+=value;if(line.stat==='chance')chance+=value;}}
  return {cultivation:Math.min(60,cultivation)/100,chance:Math.min(10,chance)};
}
export function gainReforgeShards(s:GameState,n:number):number{const gained=Math.min(n,10000000-s.reforge.shards);s.reforge.shards+=gained;return gained;}
function rollGrade(rng:RandomSource):number{const roll=rng()*100;let sum=0;for(let i=0;i<AFFIX_WEIGHTS.length;i++){sum+=AFFIX_WEIGHTS[i];if(roll<sum)return i+1;}return 5;}
export function actAffix(s:GameState,action:string,payload:string,rng:RandomSource):ActionResult{
  const f=s.reforge,fail=(message:string):ActionResult=>({ok:false,message}),ok=(message:string):ActionResult=>({ok:true,message});
  if(s.pending)return fail('历练中不能洗练或更换词条。');
  if(action==='buyReforgeStone'){
    const n=payload==='1'?1:payload==='10'?10:0;if(!n)return fail('请选择购入一枚或十枚洗练石。');
    if(f.shards+n>10000000||s.stones<15*n)return fail('灵石不足或洗练石已满。');
    s.stones-=15*n;f.shards+=n;return ok(`购入洗练石 ×${n}，花费 ${15*n} 灵石。`);
  }
  if(action==='reforgeAccept'||action==='reforgeDiscard'){
    const pending=f.pending;if(!pending)return fail('当前没有待选的洗练结果。');
    const item=findSpiritItem(pending.itemId);if(!item||!ownsSpiritItem(s,item))return fail('洗练物品已不在灵库。');
    if(action==='reforgeAccept'){f.records[item.id]=structuredClone(pending.lines);f.pending=null;return ok(`已采用${item.name}的新词条，原淬炼等级保留。`);}
    f.pending=null;return ok(`保留${item.name}原词条，本次洗练材料不返还。`);
  }
  if(f.pending)return fail('请先采用或保留上一件物品的洗练结果。');
  const parts=payload.split('|'),item=findSpiritItem(parts[0]);
  if(!item||!ownsSpiritItem(s,item)||s.realm<item.realm)return fail('需拥有此灵物且达到对应境界，才能洗练。');
  const old=f.records[item.id]||[],locks=f.locks[item.id]||[];
  if(action==='reforgeLock'){
    const slot=Number(parts[1]);if(parts.length!==2||!Number.isInteger(slot)||slot<0||slot>2||old.length!==3)return fail('此词条暂不可锁定。');
    if(locks.includes(slot)){f.locks[item.id]=locks.filter(n=>n!==slot);return ok('已解锁词条，之后洗练可替换此条。');}
    if(locks.length>=2)return fail('最多锁定两条，至少保留一条可洗练。');
    f.locks[item.id]=[...locks,slot];return ok('已锁定词条；下次洗练保留此条，费用增加。');
  }
  if(action!=='reforgeRoll'||parts.length!==1)return fail('未知的洗练操作。');
  const c=reforgeCost(item,locks.length);if(f.shards<c.shards||s.stones<c.stones||s.energy<c.energy)return fail(`洗练需 ${c.shards} 洗练石、${c.stones} 灵石、8 灵力与一日。`);
  const used=locks.map(index=>old[index].stat),pool=AFFIX_STATS.filter(stat=>!used.includes(stat)),lines:Affix[]=[];
  for(let index=0;index<3;index++){
    if(locks.includes(index)){lines.push(structuredClone(old[index]));continue;}
    const stat=pool.splice(Math.min(pool.length-1,Math.floor(rng()*pool.length)),1)[0],grade=rollGrade(rng),[min,max]=affixRange(item,stat,grade);
    lines.push({stat,grade,value:min+Math.min(max-min,Math.floor(rng()*(max-min+1)))});
  }
  f.shards-=c.shards;s.stones-=c.stones;s.energy-=c.energy;s.day++;f.pending={itemId:item.id,lines};
  return ok(`${item.name}洗练完成，候选词条尚未生效。请选择采用新词条或保留原词条。`);
}

export function validateReforge(value:unknown,s:GameState):ReforgeState{
  const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
  if(!object(value)||Object.keys(value).length!==4||!['shards','records','locks','pending'].every(k=>Object.hasOwn(value,k)))throw new Error('洗练数据无效');
  const f=value as unknown as ReforgeState;
  if(!Number.isInteger(f.shards)||f.shards<0||f.shards>10000000||!object(f.records)||!object(f.locks))throw new Error('洗练材料或词条库无效');
  const validItem=(id:string)=>{const i=findSpiritItem(id);if(!i||!ownsSpiritItem(s,i)||i.realm>s.realm)throw new Error('洗练物品条件无效');return i;};
  const validLines=(lines:unknown,item:SpiritItem):lines is Affix[]=>Array.isArray(lines)&&lines.length===3&&new Set(lines.map(line=>object(line)?line.stat:null)).size===3&&lines.every(line=>{
    if(!object(line)||Object.keys(line).length!==3||!['stat','grade','value'].every(k=>Object.hasOwn(line,k))||!AFFIX_STATS.includes(line.stat as AffixStat)||!Number.isInteger(line.grade)||Number(line.grade)<1||Number(line.grade)>5||!Number.isInteger(line.value))return false;
    const [min,max]=affixRange(item,line.stat as AffixStat,Number(line.grade));return Number(line.value)>=min&&Number(line.value)<=max;
  });
  for(const [id,lines]of Object.entries(f.records))if(!validLines(lines,validItem(id)))throw new Error('词条数据无效');
  for(const [id,locks]of Object.entries(f.locks)){validItem(id);if(!f.records[id]||!Array.isArray(locks)||locks.length>2||new Set(locks).size!==locks.length||locks.some(n=>!Number.isInteger(n)||n<0||n>2))throw new Error('锁定词条无效');}
  if(f.pending!==null){
    if(!object(f.pending)||Object.keys(f.pending).length!==2||typeof f.pending.itemId!=='string')throw new Error('待选洗练结果无效');
    const item=validItem(f.pending.itemId);if(!validLines(f.pending.lines,item))throw new Error('候选词条无效');
    for(const index of f.locks[item.id]||[]){const a=f.records[item.id][index],b=f.pending.lines[index];if(a.stat!==b.stat||a.grade!==b.grade||a.value!==b.value)throw new Error('候选结果改变了锁定词条');}
  }
  return f;
}

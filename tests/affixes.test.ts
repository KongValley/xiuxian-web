import test from 'node:test';
import assert from 'node:assert/strict';
import { act, attributes, createGame, cultivationRate, validateSave } from '../src/engine.js';
import { ARTIFACTS, EQUIPMENT } from '../src/content.js';
import { artifactBonus } from '../src/artifacts.js';
import { affixBonus, affixRange, affixSpecials, createReforge, reforgeCost } from '../src/affixes.js';
import type { Affix, AffixStat, GameState, RandomSource, SpiritItem } from '../src/types.js';
const sword=EQUIPMENT[0];
function rich(item:SpiritItem=sword){const s=createGame();s.realm=item.realm;s.ended=item.realm===8;s.stones=1000000;s.dust=10000;s.reforge.shards=100000;const owned=item.slot?s.gear:s.artifacts;owned[item.id]=0;return s;}
function run(s:GameState,action:string,payload?:string,rng:RandomSource=()=>0){const r=act(s,action,payload,rng);assert.equal(r.ok,true,r.message);validateSave(s);return r;}
function unchanged(s:GameState,action:string,payload?:string){const before=structuredClone(s);assert.equal(act(s,action,payload,()=>0).ok,false);assert.deepEqual(s,before);}
function maximum(item:SpiritItem,stat:AffixStat):Affix{return {stat,grade:5,value:affixRange(item,stat,5)[1]};}

test('洗练先扣一次费用，候选不生效；采纳后增加属性且不治疗',()=>{
  const s=rich();run(s,'equip',sword.id);const before=structuredClone(s),stats=attributes(s);
  run(s,'reforgeRoll',sword.id);assert.equal(before.reforge.shards-s.reforge.shards,4);assert.equal(before.stones-s.stones,40);assert.equal(before.energy-s.energy,8);assert.equal(s.day,before.day+1);
  assert.deepEqual(attributes(s),stats);assert.equal(s.reforge.records[sword.id],undefined);assert.equal(s.reforge.pending!.lines.length,3);
  unchanged(s,'reforgeRoll',sword.id);const paid={shards:s.reforge.shards,stones:s.stones,energy:s.energy,day:s.day};
  run(s,'reforgeAccept');assert.equal(s.reforge.pending,null);assert.equal(attributes(s).attack,stats.attack+2);assert.equal(attributes(s).defense,stats.defense+1);assert.equal(attributes(s).maxHp,stats.maxHp+10);assert.equal(s.hp,before.hp);
  assert.deepEqual({shards:s.reforge.shards,stones:s.stones,energy:s.energy,day:s.day},paid);unchanged(s,'reforgeAccept');
});

test('保留原词条不会退款或重抽，候选可跨刷新完整恢复',()=>{
  const s=rich();run(s,'reforgeRoll',sword.id);run(s,'reforgeAccept');const old=structuredClone(s.reforge.records[sword.id]);
  run(s,'reforgeRoll',sword.id,()=>.999);const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);
  const paid=[s.reforge.shards,s.stones,s.energy,s.day];run(loaded,'reforgeDiscard');assert.deepEqual(loaded.reforge.records[sword.id],old);assert.deepEqual([loaded.reforge.shards,loaded.stones,loaded.energy,loaded.day],paid);assert.equal(loaded.reforge.pending,null);
});

test('最多锁两条，锁定项原样保留，费用倍增且可免费解锁',()=>{
  const s=rich();run(s,'equip',sword.id);run(s,'reforgeRoll',sword.id);run(s,'reforgeAccept');
  run(s,'reforgeLock',sword.id+'|0');run(s,'reforgeLock',sword.id+'|1');unchanged(s,'reforgeLock',sword.id+'|2');
  const old=structuredClone(s.reforge.records[sword.id]),before=structuredClone(s);s.hp=attributes(s).maxHp;
  run(s,'reforgeRoll',sword.id,()=>.999);assert.equal(before.reforge.shards-s.reforge.shards,12);assert.equal(before.stones-s.stones,120);assert.deepEqual(s.reforge.pending!.lines.slice(0,2),old.slice(0,2));
  unchanged(s,'reforgeLock',sword.id+'|0');assert.equal(s.reforge.pending!.lines[2].stat,'chance');run(s,'reforgeAccept');assert.equal(s.hp,attributes(s).maxHp);assert.equal(attributes(s).maxHp,100);
  const days=s.day,stones=s.stones;run(s,'reforgeLock',sword.id+'|0');assert.deepEqual(s.reforge.locks[sword.id],[1]);assert.equal(s.day,days);assert.equal(s.stones,stones);
});

test('全部297件装备法宝可洗练，每件三条类型不同且数值在合法范围',()=>{
  for(const item of [...EQUIPMENT,...ARTIFACTS]){
    const s=rich(item);run(s,'reforgeRoll',item.id,()=>.999);run(s,'reforgeAccept');const lines=s.reforge.records[item.id];assert.equal(new Set(lines.map(l=>l.stat)).size,3);
    for(const line of lines){const [min,max]=affixRange(item,line.stat,line.grade);assert.ok(line.value>=min&&line.value<=max);}
    run(s,'reforgeLock',item.id+'|0');s.energy=attributes(s).maxEnergy;run(s,'reforgeRoll',item.id);assert.deepEqual(s.reforge.pending!.lines[0],lines[0]);assert.deepEqual(validateSave(s),s);
  }
});

test('五档品质按固定概率区间抽取，物品境界决定词条范围',()=>{
  for(const [roll,grade]of [[0,1],[.5,2],[.78,3],[.92,4],[.98,5]]){
    const s=rich();let draws=0;run(s,'reforgeRoll',sword.id,()=>draws++%3===1?roll:0);assert.ok(s.reforge.pending!.lines.every(l=>l.grade===grade));assert.equal(draws,9);
  }
  assert.ok(affixRange(EQUIPMENT.find(i=>i.realm===8)!, 'hp',5)[1]>affixRange(sword,'hp',5)[1]);
});

test('仅穿戴词条生效；悟道乘入修炼，破障累加且有上限',()=>{
  const s=rich();s.reforge.records[sword.id]=[maximum(sword,'cultivation'),maximum(sword,'chance'),maximum(sword,'attack')];
  assert.deepEqual(affixSpecials(s),{cultivation:0,chance:0});const original=cultivationRate(s);run(s,'equip',sword.id);
  assert.equal(cultivationRate(s),original*1.04);assert.equal(attributes(s).chance,84);const affix=affixBonus(s,sword);run(s,'upgradeGear',sword.id);assert.deepEqual(affixBonus(s,sword),affix);
  run(s,'unequip','weapon');assert.equal(cultivationRate(s),original);assert.equal(attributes(s).chance,80);
  const high=rich(EQUIPMENT.find(i=>i.realm===8)!);for(const item of EQUIPMENT.filter(i=>i.realm===8)){high.gear[item.id]=0;high.equipped[item.slot]=item.id;high.reforge.records[item.id]=[maximum(item,'chance'),maximum(item,'cultivation'),maximum(item,'hp')];}
  const art=ARTIFACTS.find(i=>i.realm===7)!;high.artifacts[art.id]=0;high.equipped.artifact=art.id;high.reforge.records[art.id]=[maximum(art,'chance'),maximum(art,'cultivation'),maximum(art,'hp')];validateSave(high);
  assert.equal(affixSpecials(high).chance,10);assert.ok(affixSpecials(high).cultivation<=.6);
});

test('法宝词条按阶段成长，跨境保留圆满，淬炼与改道不改变词条本值',()=>{
  const item=ARTIFACTS[0],s=rich(item);s.reforge.records[item.id]=[maximum(item,'hp'),maximum(item,'energy'),maximum(item,'defense')];run(s,'equipArtifact',item.id);
  const original=structuredClone(s.reforge.records[item.id]),initial=affixBonus(s,item);s.stage=1;assert.ok(affixBonus(s,item).hp>initial.hp);const mid=affixBonus(s,item);run(s,'upgradeArtifact',item.id);assert.deepEqual(affixBonus(s,item),mid);
  s.stage=3;const full=affixBonus(s,item);s.xp=attributes(s).xpNeed;s.energy=attributes(s).maxEnergy;run(s,'breakthrough');assert.equal(s.realm,1);assert.deepEqual(affixBonus(s,item),full);
  run(s,'choosePath','demon');run(s,'choosePath','yao');assert.deepEqual(s.reforge.records[item.id],original);assert.deepEqual(affixBonus(s,item),full);
});

test('缺材料、未拥有、越境与历练中不扣费，候选可等历练结束后再选',()=>{
  const s=rich();unchanged(s,'reforgeLock',sword.id+'|0');unchanged(s,'reforgeRoll','missing');unchanged(s,'reforgeRoll','cloudSword');
  s.gear.cloudSword=0;unchanged(s,'reforgeRoll','cloudSword');delete s.gear.cloudSword;
  const before=structuredClone(s);s.reforge.shards=0;let calls=0;assert.equal(act(s,'reforgeRoll',sword.id,()=>{calls++;return 0;}).ok,false);assert.equal(calls,0);s.reforge.shards=before.reforge.shards;
  run(s,'reforgeRoll',sword.id);const candidate=structuredClone(s.reforge.pending);run(s,'explore','bamboo');
  for(const action of ['reforgeAccept','reforgeDiscard','reforgeRoll','reforgeLock','buyReforgeStone'])unchanged(s,action,sword.id);assert.deepEqual(s.reforge.pending,candidate);run(s,'flee');run(s,'reforgeAccept');
});

test('洗练石有稳定获取途径，材料购买不额外推进时间',()=>{
  const s=createGame(),day=s.day;run(s,'buyReforgeStone','1');assert.equal(s.reforge.shards,9);assert.equal(s.stones,73);assert.equal(s.day,day);unchanged(s,'buyReforgeStone','10');unchanged(s,'buyReforgeStone','5');
  run(s,'gather');assert.equal(s.reforge.shards,10);run(s,'explore','bamboo');while(s.pending)run(s,'attack');assert.equal(s.reforge.shards,12);
  s.energy=attributes(s).maxEnergy;assert.equal(act(s,'explore','bamboo',()=>.5).ok,true);run(s,'choice','safe');assert.equal(s.reforge.shards,13);
});

test('v7灵根进度无损迁移，旧装备无词条，待选词条与锁定严格校验',()=>{
  const old=rich();old.version=7;old.roots={primary:'wood',levels:{metal:0,wood:3,water:0,fire:0,earth:0},tier:0,purity:20,essence:17,dew:2};const snapshot=structuredClone(old),loaded=validateSave(old);
  assert.deepEqual(loaded.roots,old.roots);assert.deepEqual(loaded.reforge,createReforge());assert.deepEqual(old,snapshot);assert.equal(loaded.version,8);
  const s=rich();run(s,'reforgeRoll',sword.id);run(s,'reforgeAccept');run(s,'reforgeLock',sword.id+'|0');run(s,'reforgeRoll',sword.id,()=>.999);
  const base=structuredClone(s),lines=s.reforge.records[sword.id];
  const invalid=[undefined,{...s.reforge,shards:-1},{...s.reforge,records:{missing:lines}},{...s.reforge,records:{...s.reforge.records,[sword.id]:[lines[0],lines[0],lines[2]]}},{...s.reforge,records:{[sword.id]:[{...lines[0],grade:6},lines[1],lines[2]]}},{...s.reforge,records:{[sword.id]:[{...lines[0],value:999999},lines[1],lines[2]]}},{...s.reforge,locks:{[sword.id]:[0,1,2]}},{...s.reforge,pending:{itemId:'missing',lines}},{...s.reforge,pending:{itemId:sword.id,lines:[{...lines[0],value:lines[0].value+1},lines[1],lines[2]]}}];
  for(const reforge of invalid)assert.throws(()=>validateSave({...s,reforge}));assert.deepEqual(s,base);assert.deepEqual(validateSave(s),s);
});

test('满养成叠加高气血词条后仍可保存，不被旧数值上限拒绝',()=>{
  const s=rich();s.realm=8;s.ended=true;s.path='yao';s.activeBooks=['body'];s.books.body=5;
  for(let realm=0;realm<9;realm++){const id=`yao-${realm}-0`;s.books[id]=5;s.activeBooks.push(id);}
  s.roots={primary:'wood',levels:{metal:20,wood:20,water:20,fire:20,earth:20},tier:3,purity:100,essence:0,dew:0};
  for(const item of EQUIPMENT.filter(i=>i.realm===8)){s.gear[item.id]=3;s.equipped[item.slot]=item.id;s.reforge.records[item.id]=[maximum(item,'hp'),maximum(item,'energy'),maximum(item,'defense')];}
  const item=[...ARTIFACTS].sort((a,b)=>artifactBonus(b,3,s).hp-artifactBonus(a,3,s).hp)[0];s.artifacts[item.id]=3;s.equipped.artifact=item.id;s.reforge.records[item.id]=[maximum(item,'hp'),maximum(item,'energy'),maximum(item,'defense')];
  s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;assert.ok(s.hp>10000);assert.deepEqual(validateSave(s),s);
});

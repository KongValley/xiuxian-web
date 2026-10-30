import test from 'node:test';
import assert from 'node:assert/strict';
import { act, attributes, createGame, validateSave, cultivationRate } from '../src/engine.js';
import { ARTIFACTS, EQUIPMENT } from '../src/content.js';
import { BOOKS } from '../src/manuals.js';
import { DUNGEONS, MECHANICS, createExpedition, dungeonAutoAction, dungeonBonus, dungeonEnemy } from '../src/dungeons.js';
import { armorDamage, cultivationBase, potionRecovery, recovery } from '../src/balance.js';
import { WORLD_BALANCE } from '../src/balance.js';
import { battle } from './helpers.js';
import type { GameState, PathId } from '../src/types.js';

const low=()=>0,high=()=>.99;
const run=(s:GameState,action:string,payload?:string,rng=low)=>{const r=act(s,action,payload,rng);assert.ok(r.ok,r.message);assert.deepEqual(validateSave(s),s);return r;};
const unchanged=(s:GameState,action:string,payload?:string)=>{const before=structuredClone(s);assert.equal(act(s,action,payload).ok,false);assert.deepEqual(s,before);};
function ready(realm=0,path:PathId='immortal',stage=3){
  const s=createGame();s.realm=realm;s.stage=realm===8?0:stage;s.ended=realm===8;s.path=path;s.stones=100000;s.items.qi=20;s.items.heal=20;
  for(const item of EQUIPMENT.filter(i=>i.realm===realm)){s.gear[item.id]=2;s.equipped[item.slot]=item.id;}
  const artifact=ARTIFACTS.find(a=>a.realm===realm&&a.effect==='blast')!;s.artifacts[artifact.id]=1;s.equipped.artifact=artifact.id;
  for(const b of BOOKS.filter(b=>b.realm===realm&&b.path===path&&((b.effects.attack||0)>0||(b.effects.hp||0)>0)).slice(0,4)){s.books[b.id]=3;s.activeBooks.push(b.id);}
  s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;return s;
}
function autoFinish(s:GameState,max=1500,rng=low){
  for(let n=0;n<max;n++){const next=dungeonAutoAction(s,attributes);if(!next)return n;run(s,next.action,next.payload,rng);}throw new Error('自动战斗未在边界内结束');
}
function winFirst(s:GameState,id='dungeon-0-0'){run(s,'dungeonEnter',id);run(s,'dungeonAutoBattle');autoFinish(s);assert.equal(s.expedition.last?.won,true);}

test('九境各五本共45本，首领、印记唯一，难度和经济曲线递增',()=>{
  assert.equal(DUNGEONS.length,45);for(const key of ['id','name','boss','seal'] as const)assert.equal(new Set(DUNGEONS.map(d=>d[key])).size,45);
  for(let r=0;r<9;r++){const row=DUNGEONS.filter(d=>d.realm===r);assert.equal(row.length,5);assert.equal(new Set(row.map(d=>d.mechanic)).size,5);for(let i=0;i<5;i++){const d=row[i];assert.equal(ARTIFACTS.find(a=>a.id===d.artifact)?.realm,r);assert.ok(dungeonEnemy(d,4).hp>dungeonEnemy(d,2).hp);if(i)assert.ok(dungeonEnemy(d,4).hp>dungeonEnemy(row[i-1],4).hp);}if(r)assert.ok(WORLD_BALANCE[r].stones>WORLD_BALANCE[r-1].stones);}
});
test('新角色装备赠送灵物后，三途和未择道均能用初始补给打通入门副本',()=>{
  for(const path of [null,'immortal','demon','yao'] as const)for(const rng of [low,()=>.5,high]){
    const s=createGame();s.path=path;s.equipped.weapon='bambooSword';s.equipped.armor='linenRobe';s.equipped.artifact='spiritBell';s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;
    run(s,'dungeonAutoStart','dungeon-0-0|1');autoFinish(s,500,rng);assert.equal(s.expedition.last?.won,true,String(path));assert.ok(s.items.heal>=0);assert.ok(s.items.qi>=0);
  }
});
test('副本按境界开放、入场仅扣一次；战斗和整备期间禁止洞府养成',()=>{
  const s=ready();unchanged(s,'dungeonEnter','dungeon-1-0');s.energy=0;unchanged(s,'dungeonEnter','dungeon-0-0');s.energy=attributes(s).maxEnergy;
  const before=s.energy;run(s,'dungeonEnter','dungeon-0-0');assert.equal(before-s.energy,18);const day=s.day;
  for(const action of ['cultivate','rest','gather','buy','equip','rootTrain','reforgeRoll','dungeonNext','dungeonExchange'])unchanged(s,action,'bambooSword');
  while(s.pending)run(s,'attack');assert.equal(s.day,day);assert.equal(s.expedition.run?.node,1);unchanged(s,'rest');unchanged(s,'use','heal');
  run(s,'dungeonNext');assert.equal(s.expedition.run?.phase,'choice');run(s,'dungeonChoice','ward');assert.equal(s.expedition.run?.ward,.22);unchanged(s,'dungeonChoice','might');
  run(s,'dungeonNext');assert.ok(battle(s).shield>=Math.round(attributes(s).maxHp*.22));
});
test('五关推进完整，首通法宝和真印一次发放，重复通关有保底材料与20%法宝',()=>{
  const s=ready(),d=DUNGEONS[1];winFirst(s,d.id);const first=s.expedition.last!;assert.equal(first.first,true);assert.equal(s.expedition.clears[d.id],1);assert.ok(Object.hasOwn(s.artifacts,d.artifact));assert.equal(s.expedition.tokens,4);assert.match(first.summary,/洗灵露 ×1/);assert.match(first.summary,/真印/);
  const dew=s.roots.dew;s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;run(s,'dungeonAutoStart',d.id+'|1');autoFinish(s,1500,high);assert.equal(s.expedition.last?.first,false);assert.equal(s.expedition.clears[d.id],2);assert.equal(s.expedition.tokens,5);assert.equal(s.roots.dew,dew+1);assert.ok(s.reforge.shards>8);assert.ok(s.dust>0);assert.equal(s.expedition.auto.repeat,false);unchanged(s,'dungeonNext');
});
test('同境五印成套才激活永久奖励；首通重复法宝转灵砂且不覆盖淬炼',()=>{
  const s=ready();s.artifacts[DUNGEONS[0].artifact]=3;
  for(const d of DUNGEONS.filter(d=>d.realm===0)){s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;winFirst(s,d.id);if(d.index<4)assert.equal(dungeonBonus(s).attack,0);}
  assert.equal(s.artifacts[DUNGEONS[0].artifact],3);assert.deepEqual(dungeonBonus(s),{attack:2,defense:1,hp:12,energy:0});assert.match(s.expedition.last!.summary,/五印齐集/);
});
test('岔路三种增益仅选一份、营地仅整备一次、撤离不发首领奖励',()=>{
  for(const choice of ['might','ward','spoils']){const s=ready();run(s,'dungeonEnter','dungeon-0-0');while(s.pending)run(s,'attack');run(s,'dungeonNext');run(s,'dungeonChoice',choice);assert.equal([s.expedition.run!.might,s.expedition.run!.ward,s.expedition.run!.spoils].filter(Boolean).length,1);run(s,'dungeonNext');while(s.pending)run(s,'attack');run(s,'dungeonNext');s.hp=1;s.energy=0;run(s,'dungeonCamp','balanced');assert.equal(s.hp,1+Math.round(attributes(s).maxHp*.3));unchanged(s,'dungeonCamp','heal');const stones=s.stones;run(s,'dungeonLeave');assert.equal(s.stones,stones);assert.equal(s.expedition.tokens,0);assert.equal(s.expedition.last?.won,false);}
});
test('首领蓄力预警真实生效，守心减伤；五种首领机制都有实际效果',()=>{
  for(const d of DUNGEONS.slice(0,5)){
    assert.ok(MECHANICS[d.mechanic].desc);const s=ready();run(s,'dungeonEnter',d.id);s.pending=null;s.expedition.run!.node=4;s.expedition.run!.phase='ready';run(s,'dungeonNext');run(s,'guard');run(s,'guard');assert.equal(battle(s).round,2);assert.ok(battle(s).turns.some(t=>t.includes('蓄力预警')));
    const unguarded=structuredClone(s),guarded=structuredClone(s);act(unguarded,'attack',null,low);act(guarded,'guard',null,low);assert.ok(guarded.hp>=unguarded.hp);assert.equal(battle(guarded).round,3);
    if(d.mechanic==='vampire'){const t=structuredClone(s);battle(t).hp-=50;const hp=battle(t).hp;run(t,'guard');assert.ok(battle(t).hp>hp);}
    if(d.mechanic==='rage'){const t=structuredClone(s);battle(t).round=10;const c=structuredClone(s);battle(c).round=1;t.hp=attributes(t).maxHp;c.hp=t.hp;act(t,'guard',null,high);act(c,'guard',null,high);assert.ok(t.hp<c.hp);}
  }
  assert.ok(armorDamage(100,10000,8)>=30);assert.ok(armorDamage(100,0,0,true)<armorDamage(100,0,0));
});
test('自动刷5轮只计成功通关，局间静养有真实日耗，轮数耗尽停止',()=>{
  const s=ready(),before=s.day;run(s,'dungeonAutoStart','dungeon-0-0|5');while(!s.expedition.clears['dungeon-0-0']){const next=dungeonAutoAction(s,attributes)!;run(s,next.action,next.payload);}s.energy=0;assert.equal(dungeonAutoAction(s,attributes)?.action,'rest');autoFinish(s);assert.equal(s.expedition.clears['dungeon-0-0'],5);assert.equal(s.expedition.auto.remaining,0);assert.equal(s.expedition.auto.repeat,false);assert.equal(s.expedition.auto.battle,false);assert.ok(s.day>before+5);assert.equal(s.expedition.run,null);
});
test('战败、撤离、禁用局间静养、停止自动，都不会暗中继续刷本',()=>{
  const s=createGame();run(s,'dungeonAutoStart','dungeon-0-0|5');s.hp=1;run(s,'guard');assert.equal(s.expedition.run,null);assert.equal(s.expedition.auto.repeat,false);assert.equal(s.expedition.last?.won,false);assert.equal(dungeonAutoAction(s,attributes),null);
  const t=ready();run(t,'dungeonAutoStart','dungeon-0-0|5');run(t,'dungeonAutoStop');assert.ok(t.expedition.run);assert.equal(dungeonAutoAction(t,attributes),null);run(t,'dungeonLeave');assert.equal(t.expedition.tokens,0);
  const u=ready();u.expedition.auto.rest=false;run(u,'dungeonAutoStart','dungeon-0-0|5');while(!u.expedition.clears['dungeon-0-0']){const next=dungeonAutoAction(u,attributes)!;run(u,next.action,next.payload);}u.energy=0;autoFinish(u);assert.equal(u.expedition.clears['dungeon-0-0'],1);assert.equal(u.expedition.auto.repeat,false);
});
test('自动药品选项关闭不消耗丹药，超长战斗撤离；不能自动突破或购药',()=>{
  const s=ready();run(s,'dungeonAutoStart','dungeon-0-0|1');s.hp=20;s.energy=0;battle(s).pathUsed=true;battle(s).artifactCooldown=3;s.expedition.auto.potions=false;assert.equal(dungeonAutoAction(s,attributes)?.action,'attack');s.expedition.auto.potions=true;assert.deepEqual(dungeonAutoAction(s,attributes),{action:'use',payload:'heal'});battle(s).round=80;assert.equal(dungeonAutoAction(s,attributes)?.action,'dungeonLeave');
});
test('山河令指定兑换任意本境法宝，越境、重复和缺令不扣费',()=>{
  const s=ready();s.expedition.tokens=10;const item=ARTIFACTS.filter(a=>a.realm===0).at(-1)!;unchanged(s,'dungeonExchange',ARTIFACTS.find(a=>a.realm===1)!.id);run(s,'dungeonExchange',item.id);assert.equal(s.expedition.tokens,0);assert.equal(s.artifacts[item.id],0);unchanged(s,'dungeonExchange',item.id);unchanged(s,'dungeonExchange',DUNGEONS[0].artifact);
});
test('进行中的副本、预警、候选洗练与自动配置可完整保存；v8旧战局无损迁移',()=>{
  const s=ready();run(s,'dungeonAutoStart','dungeon-0-0|5');run(s,'guard');assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
  const old=createGame();old.version=8;act(old,'explore','bamboo',low);const pending=structuredClone(old.pending),original=structuredClone(old);const migrated=validateSave(old);assert.equal(migrated.version,9);assert.deepEqual(migrated.pending,pending);assert.deepEqual(migrated.expedition,createExpedition());assert.deepEqual(old,original);assert.equal(migrated.hp,100);
});
test('拒绝伪造首领、奖励记录、自动轮数、关卡、护盾和叠加机缘',()=>{
  const s=ready();run(s,'dungeonEnter','dungeon-0-0');
  for(const mutate of [(t:GameState)=>{battle(t).attack++;},(t:GameState)=>{t.expedition.run!.node=4;},(t:GameState)=>{t.expedition.run!.might=.18;t.expedition.run!.ward=.22;},(t:GameState)=>{t.expedition.auto.remaining=21;},(t:GameState)=>{t.expedition.clears['dungeon-8-0']=1;},(t:GameState)=>{t.expedition.run=null;},(t:GameState)=>{battle(t).round=-1;},(t:GameState)=>{battle(t).shield=999999;}]){const t=structuredClone(s);mutate(t);assert.throws(()=>validateSave(t));}
});
test('修炼随阶段同比增长，恢复与丹药按上限成长，满修为不再增长',()=>{
  for(let realm=0;realm<9;realm++){const s=ready(realm);if(!s.ended){run(s,'cultivate');assert.equal(s.xp,Math.round(17*cultivationBase(s)*cultivationRate(s)));}const a=attributes(s),r=recovery(a.maxHp,a.maxEnergy);s.hp=1;s.energy=0;run(s,'rest');assert.equal(s.hp,1+r.hp);assert.equal(s.energy,r.energy);s.hp=1;run(s,'use','heal');assert.equal(s.hp,1+potionRecovery('heal',a.maxHp,a.maxEnergy));}
});
test('九境三途按同境养成可自动通关全部副本，资源与存档保持有效',()=>{
  for(let realm=0;realm<9;realm++)for(const path of ['immortal','demon','yao'] as const)for(let index=0;index<5;index++){
    const s=ready(realm,path);run(s,'dungeonAutoStart',`dungeon-${realm}-${index}|1`);autoFinish(s);assert.equal(s.expedition.last?.won,true,`${realm} ${path} ${index} ${s.expedition.last?.summary}`);assert.ok(s.hp>0);assert.ok(s.energy>=0);
  }
});

import type { GameState, PathId, RandomSource, Bonus } from '../src/types.js';
import { battle, activeSet } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,attributes,validateSave,endingLabel,cultivationRate} from '../src/engine.js';
import {PATHS,EQUIPMENT,ARTIFACTS,gearBonus} from '../src/content.js';
import { TOTAL_BREAKTHROUGHS } from '../src/realms.js';
const low=()=>0,high=()=>.99;
function run(s: GameState,a: string,p?: string|null,r: RandomSource=low){const out=act(s,a,p,r);assert.equal(out.ok,true,out.message);validateSave(s);return out;}
function unchanged(s: GameState,a: string,p?: string|null){const before=structuredClone(s);assert.equal(act(s,a,p).ok,false);assert.deepEqual(s,before);}
function rich(){const s=createGame();s.realm=1;s.stones=10000;s.dust=1000;return s;}
function legacy(s: GameState){const old=structuredClone(s) as unknown as Record<string,unknown>;old.version=1;for(const k of ['path','gear','artifacts','equipped','dust'])delete old[k];const pending=old.pending as Record<string,unknown>|null;if(pending?.kind==='combat')for(const k of ['shield','pathUsed','artifactCooldown'])delete pending[k];return old;}

test('旧版存档无损迁移，基础装备不自动改变原属性',()=>{
  const old=legacy(createGame());old.day=53;old.xp=84;old.hp=65;old.stones=148;
  const s=validateSave(old);assert.equal(s.version,4);assert.equal(s.day,53);assert.equal(s.xp,84);assert.equal(s.hp,65);assert.equal(s.stones,148);assert.equal(s.path,null);assert.equal(s.gear.bambooSword,0);assert.equal(s.artifacts.spiritBell,0);assert.equal(attributes(s).attack,14);assert.equal(old.version,1);
  assert.deepEqual(validateSave(s),s);
});
test('旧版进行中的战斗迁移后仍可结算',()=>{
  const s=createGame();run(s,'explore','bamboo');const loaded=validateSave(legacy(s));
  assert.equal(battle(loaded).shield,0);assert.equal(battle(loaded).artifactCooldown,0);assert.equal(battle(loaded).pathUsed,false);run(loaded,'skill');run(loaded,'skill');run(loaded,'attack');assert.equal(loaded.stats.wins,1);
});
test('首次择道免费，改修付费，不会恢复气血或灵力',()=>{
  const s=createGame();run(s,'choosePath','yao');assert.equal(s.stones,88);assert.equal(s.day,1);assert.equal(attributes(s).maxHp,125);assert.equal(s.hp,100);
  unchanged(s,'choosePath','demon');s.stones=110;run(s,'choosePath','immortal');assert.equal(s.stones,10);assert.equal(s.day,2);assert.equal(s.hp,100);assert.equal(s.energy,100);assert.equal(attributes(s).maxEnergy,120);assert.equal(attributes(s).chance,85);
  unchanged(s,'choosePath','immortal');unchanged(s,'choosePath','invalid');
});
test('仙魔妖三途有不同被动与修炼倍率',()=>{
  const s=createGame();run(s,'choosePath','immortal');run(s,'cultivate');assert.equal(s.xp,23);assert.equal(cultivationRate(s),1.38);
  const d=createGame();run(d,'choosePath','demon');assert.equal(attributes(d).attack,17);assert.equal(attributes(d).defense,1);
  const y=createGame();run(y,'choosePath','yao');assert.equal(attributes(y).maxHp,125);assert.equal(attributes(y).defense,6);
});
test('装备栏限制、购买防重复、穿脱不回血且上限裁剪',()=>{
  const s=createGame();unchanged(s,'equip','cloudSword');run(s,'equip','bambooSword');assert.equal(attributes(s).attack,18);unchanged(s,'buyGear','bambooSword');unchanged(s,'equip','bambooSword');
  run(s,'equip','linenRobe');assert.equal(attributes(s).maxHp,115);assert.equal(s.hp,100);s.hp=115;run(s,'unequip','armor');assert.equal(s.hp,100);run(s,'equip','linenRobe');assert.equal(s.hp,100);
  run(s,'buyGear','dewPendant');run(s,'equip','dewPendant');assert.equal(attributes(s).maxEnergy,110);s.energy=110;run(s,'unequip','charm');assert.equal(s.energy,100);
  unchanged(s,'buyGear','cloudSword');unchanged(s,'equipArtifact','soulBanner');
});
test('专属法宝限制路径，改修自动卸下且保留物品与强化等级',()=>{
  const s=rich();run(s,'choosePath','demon');unchanged(s,'buyArtifact','pureWhisk');run(s,'buyArtifact','soulBanner');run(s,'upgradeArtifact','soulBanner');run(s,'equipArtifact','soulBanner');assert.equal(s.equipped.artifact,'soulBanner');
  run(s,'choosePath','yao');assert.equal(s.equipped.artifact,null);assert.equal(s.artifacts.soulBanner,1);unchanged(s,'equipArtifact','soulBanner');
});
test('强化消耗资源、达到三重停止、属性实时更新',()=>{
  const s=rich();run(s,'equip','bambooSword');const before=attributes(s).attack;
  for(let i=0;i<3;i++)run(s,'upgradeGear','bambooSword');assert.equal(s.gear.bambooSword,3);assert.equal(s.stones,9880);assert.equal(s.dust,988);assert.equal(s.day,4);assert.equal(s.energy,76);assert.ok(attributes(s).attack>before);
  unchanged(s,'upgradeGear','bambooSword');const poor=createGame();unchanged(poor,'upgradeGear','bambooSword');
});
test('仙修本命神通回元并消耗回合，每场只能使用一次',()=>{
  const s=createGame();run(s,'choosePath','immortal');run(s,'explore','bamboo');s.hp=40;s.energy=30;run(s,'pathSkill');assert.equal(s.hp,64);assert.equal(s.energy,48);assert.equal(battle(s).pathUsed,true);unchanged(s,'pathSkill');
  run(s,'flee');s.energy=100;run(s,'explore','bamboo');assert.equal(battle(s).pathUsed,false);
});
test('魔修普通攻击汲血、血焰斩消耗气血且不能自杀',()=>{
  const s=createGame();run(s,'choosePath','demon');run(s,'explore','bamboo');s.hp=50;run(s,'attack');assert.equal(s.hp,44);
  const before=s.hp;run(s,'pathSkill');assert.equal(s.pending,null);assert.equal(s.stats.wins,1);assert.ok(s.hp<before);
  s.energy=100;run(s,'explore','bamboo');s.hp=12;unchanged(s,'pathSkill');s.hp=40;s.energy=9;unchanged(s,'pathSkill');
});
test('妖修护盾吸收伤害并可保存与恢复',()=>{
  const s=rich();run(s,'choosePath','yao');run(s,'explore','valley');const hp=s.hp;run(s,'pathSkill');assert.equal(s.hp,hp);assert.ok(battle(s).shield>0);assert.equal(battle(s).pathUsed,true);const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(battle(loaded).shield,battle(s).shield);run(loaded,'guard');
});
test('法宝冷却严格等待三次行动，未满足条件不扣资源',()=>{
  const s=rich();run(s,'equipArtifact','spiritBell');run(s,'explore','valley');run(s,'artifactSkill');assert.equal(battle(s).artifactCooldown,3);unchanged(s,'artifactSkill');
  run(s,'guard');assert.equal(battle(s).artifactCooldown,2);run(s,'guard');run(s,'guard');assert.equal(battle(s).artifactCooldown,0);run(s,'artifactSkill');
  const n=createGame();run(n,'explore','bamboo');unchanged(n,'artifactSkill');unchanged(n,'equip','bambooSword');unchanged(n,'choosePath','demon');unchanged(n,'upgradeGear','bambooSword');
});
test('所有法宝主动效果可正确结算，强化提高效果',()=>{
  for(const item of ARTIFACTS){
    const s=rich();s.realm=3;if(item.path)run(s,'choosePath',item.path);if(!Object.hasOwn(s.artifacts,item.id))run(s,'buyArtifact',item.id);run(s,'equipArtifact',item.id);s.hp=Math.round(attributes(s).maxHp*.5);s.energy=attributes(s).maxEnergy;
    run(s,'explore','sea');const hp=battle(s).hp;run(s,'artifactSkill');assert.equal(battle(s).artifactCooldown,3);if(item.effect!=='heal')assert.ok(battle(s).hp<hp);else assert.ok(s.hp>attributes(s).maxHp*.5);
  }
  const base=gearBonus(EQUIPMENT[0],0),enhanced=gearBonus(EQUIPMENT[0],3);assert.ok(enhanced.attack>base.attack);
});
test('战胜妖兽得灵砂与装备、遗藏得法宝，重复物转灵砂',()=>{
  const s=createGame();run(s,'explore','bamboo');for(let i=0;i<4&&s.pending;i++)run(s,'skill');assert.equal(s.dust,4);
  const n=createGame();run(n,'explore','bamboo',()=>.9);run(n,'choice','accept');assert.equal(n.dust,3);
  const g=createGame();run(g,'explore','bamboo');const rolls=[.5,0,.99];while(g.pending){run(g,'skill',null,battle(g).hp<=20?()=>rolls.shift()??0:low);}assert.ok(Object.hasOwn(g.gear,'dewPendant'));
});
test('存档拒绝非法装备、路径、强化和战斗技能状态',()=>{
  const s=createGame();
  for(const bad of [{...s,path:'god'},{...s,dust:-1},{...s,gear:{fake:0}},{...s,gear:{bambooSword:4}},{...s,equipped:{...s.equipped,armor:'bambooSword'}},{...s,equipped:{...s.equipped,artifact:'soulBanner'}},{...s,equipped:[]}])assert.throws(()=>validateSave(bad));
  run(s,'explore','bamboo');for(const fields of [{shield:-1},{shield:99999},{artifactCooldown:4},{pathUsed:2}])assert.throws(()=>validateSave({...s,pending:{...s.pending,...fields}}));
});
test('三途都能完成三十二次突破，并得到对应真仙结局',()=>{
  for(const p of PATHS){const s=createGame();run(s,'choosePath',p.id);for(let n=0;n<TOTAL_BREAKTHROUGHS;n++){s.xp=attributes(s).xpNeed;s.energy=attributes(s).maxEnergy;run(s,'breakthrough');}assert.equal(s.ended,true);assert.equal(endingLabel(s),p.ending);}
});
test('三途随机战斗长局中的护盾、法宝与存档始终有效',()=>{
  for(const p of PATHS){const s=rich();run(s,'choosePath',p.id);run(s,'equipArtifact','spiritBell');run(s,'equip','bambooSword');run(s,'equip','linenRobe');let seed=17;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let n=0;n<1000;n++){let action,payload;
      if(s.pending?.kind==='event'){action='choice';payload='safe';}
      else if(s.pending?.kind==='combat'){action=s.hp<35?'flee':!battle(s).pathUsed?'pathSkill':battle(s).artifactCooldown===0&&s.energy>=14?'artifactSkill':s.energy>=12?'skill':'guard';if(p.id==='demon'&&s.energy<10&&action==='pathSkill')action='attack';if(p.id==='yao'&&s.energy<14&&action==='pathSkill')action='attack';}
      else if(s.hp<attributes(s).maxHp*.8||s.energy<40)action='rest';else if(s.xp===attributes(s).xpNeed)action='breakthrough';else{action='explore';payload='bamboo';}
      act(s,action,payload,rng);validateSave(s);
    }assert.ok(s.stats.wins>0);
  }
});

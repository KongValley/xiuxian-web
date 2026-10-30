import type { GameState, PathId, RandomSource, Bonus } from '../src/types.js';
import { battle, activeSet } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,attributes,realmLabel,validateSave} from '../src/engine.js';
import {REALMS,STAGES,stageCount,stageLabel,worldLabel,nextStep,isAscension,FINAL_REALM,TOTAL_BREAKTHROUGHS} from '../src/realms.js';
const low=()=>0,high=()=>.999;
function advance(s: GameState,rng: RandomSource=low){s.xp=attributes(s).xpNeed;s.energy=attributes(s).maxEnergy;const result=act(s,'breakthrough',null,rng);assert.equal(result.ok,true,result.message);validateSave(s);}
function oldSave(realm: number,stage: number,ended=false){const s=createGame();s.version=2;s.realm=realm;s.stage=stage;s.ended=ended;s.xp=Math.round((100+(realm*3+stage)*60)*.5);s.hp=80;s.energy=40;s.stones=321;s.dust=17;s.books.sword=2;s.gear.bambooSword=3;return s;}

test('八个修炼境界统一四阶段，真仙保留为飞升终点',()=>{
  assert.deepEqual(REALMS,['炼气','筑基','结丹','元婴','化神','炼虚','合体','大乘','真仙']);
  assert.equal(REALMS.includes('金丹'),false);assert.equal(REALMS.includes('渡劫'),false);
  for(let r=0;r<FINAL_REALM;r++)assert.equal(stageCount(r),4);assert.equal(stageCount(FINAL_REALM),1);assert.equal(TOTAL_BREAKTHROUGHS,32);
  assert.deepEqual(STAGES,['初期','中期','后期','圆满']);
});
test('炼气按初、中、后、圆满依次推进，圆满后才筑基',()=>{
  const s=createGame();assert.equal(realmLabel(s),'炼气 · 初期');
  for(let n=1;n<4;n++){advance(s);assert.equal(s.realm,0);assert.equal(s.stage,n);assert.equal(stageLabel(s),STAGES[n]);}
  assert.equal(stageLabel(s),'圆满');assert.equal(nextStep(s),'筑基 · 初期');advance(s);assert.equal(realmLabel(s),'筑基 · 初期');
});
test('筑基起四阶段推进，无跳级或属性倒退',()=>{
  const s=createGame();let previous=attributes(s);
  for(let n=0;n<TOTAL_BREAKTHROUGHS;n++){
    advance(s);const a=attributes(s);for(const key of ['maxHp','maxEnergy','attack','defense','xpNeed'] as const)assert.ok(a[key]>=previous[key],`${key} after step ${n}`);previous=a;
  }
  assert.equal(s.realm,FINAL_REALM);assert.equal(s.ended,true);assert.ok(realmLabel(s).startsWith('真仙'));
});
test('大乘圆满才进入飞升天劫，渡劫失败保留八成修为及保底',()=>{
  const s=createGame();s.realm=7;s.stage=2;assert.equal(isAscension(s),false);assert.equal(nextStep(s),'大乘 · 圆满');advance(s);assert.equal(isAscension(s),true);assert.equal(s.ended,false);
  const cap=attributes(s).xpNeed;advance(s,high);assert.equal(s.realm,7);assert.equal(s.stage,3);assert.equal(s.xp,Math.round(cap*.8));assert.equal(s.pity,1);assert.equal(s.ended,false);
  advance(s);assert.equal(s.realm,8);assert.equal(s.stage,0);assert.equal(s.ended,true);assert.ok(s.logs[0].text.includes('飞升之劫'));assert.ok(s.logs[0].text.includes('真仙'));
});
test('世界分层正确，终点不再允许突破',()=>{
  assert.equal(worldLabel(4),'人界');assert.equal(worldLabel(5),'灵界');assert.equal(worldLabel(7),'灵界');assert.equal(worldLabel(8),'仙界');
  const s=createGame();s.realm=8;s.ended=true;assert.equal(nextStep(s),'已渡劫飞升');const before=structuredClone(s);assert.equal(act(s,'breakthrough').ok,false);assert.deepEqual(s,before);
});
test('v2 炼气初中后保持对应阶段和修为比例',()=>{
  for(let stage=0;stage<3;stage++){const old=oldSave(0,stage),snapshot=structuredClone(old),s=validateSave(old);assert.equal(s.version,5);assert.equal(s.stage,stage);assert.equal(s.realm,0);assert.equal(s.xp,Math.round(attributes(s).xpNeed*.5));assert.equal(s.hp,80);assert.equal(s.energy,40);assert.equal(s.stones,321);assert.equal(s.dust,17);assert.deepEqual(s.gear,old.gear);assert.deepEqual(old,snapshot);assert.deepEqual(validateSave(s),s);}
});
test('v3 炼气十三层转换四阶段，保留修为比例且不治疗伤势',()=>{
  for(let layer=0;layer<13;layer++){
    const old=createGame();old.version=3;old.stage=layer;old.xp=Math.round((100+layer*10)*.5);old.hp=100;old.energy=60;
    const s=validateSave(old);assert.equal(s.version,5);assert.equal(s.stage,layer<4?0:layer<7?1:layer<10?2:3);assert.equal(s.xp,Math.round(attributes(s).xpNeed*.5));assert.equal(s.hp,100);assert.equal(s.energy,60);assert.deepEqual(validateSave(s),s);
  }
  const old=createGame();old.version=3;old.stage=3;old.hp=112;
  const s=validateSave(old);assert.equal(s.hp,attributes(s).maxHp);assert.equal(s.stage,0);
});
test('v3 的炼气以外境界仅更新版本及圆满称呼，通关状态不变',()=>{
  for(const realm of [1,4,7,8]){const old=createGame();old.version=3;old.realm=realm;old.stage=realm===8?0:3;old.ended=realm===8;const s=validateSave(old);assert.equal(s.realm,old.realm);assert.equal(s.stage,old.stage);assert.equal(s.ended,old.ended);assert.equal(s.version,5);}
});
test('旧金丹改名结丹，原渡劫映射大乘，通关映射真仙且不清空物品',()=>{
  const dan=validateSave(oldSave(2,1));assert.equal(realmLabel(dan),'结丹 · 中期');
  const tribulation=validateSave(oldSave(5,2));assert.equal(realmLabel(tribulation),'大乘 · 后期');assert.equal(tribulation.ended,false);assert.equal(tribulation.gear.bambooSword,3);assert.equal(tribulation.xp,Math.round(attributes(tribulation).xpNeed*.5));
  const old=oldSave(5,2,true),ended=validateSave(old);assert.equal(ended.realm,8);assert.equal(ended.ended,true);assert.equal(ended.xp,0);assert.deepEqual(ended.items,old.items);assert.deepEqual(ended.books,old.books);
});
test('旧存档的战斗、冷却、护盾、神通使用状态保留',()=>{
  const s=oldSave(2,1);s.pending={kind:'combat',region:'ruins',name:'守境石傀',hp:90,maxHp:340,attack:47,shield:17,pathUsed:true,artifactCooldown:2,turns:['旧战局仍在继续。']};
  const migrated=validateSave(s);assert.deepEqual(migrated.pending,s.pending);assert.equal(migrated.day,s.day);assert.equal(migrated.stats.wins,s.stats.wins);
});
test('新旧存档按各自规则校验，拒绝伪造境界阶段和非法通关',()=>{
  const s=createGame();for(const bad of [{...s,realm:9},{...s,stage:13},{...s,realm:1,stage:4},{...s,realm:8,ended:false},{...s,realm:7,stage:3,ended:true},{...oldSave(0,0),stage:6},{...oldSave(0,0),realm:7},{...oldSave(0,0),ended:true}])assert.throws(()=>validateSave(bad));
});

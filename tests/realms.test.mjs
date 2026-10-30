import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,attributes,realmLabel,validateSave} from '../public/engine.js';
import {REALMS,STAGES,stageCount,stageLabel,worldLabel,nextStep,isAscension,FINAL_REALM,TOTAL_BREAKTHROUGHS} from '../public/realms.js';
const low=()=>0,high=()=>.999;
function advance(s,rng=low){s.xp=attributes(s).xpNeed;s.energy=attributes(s).maxEnergy;const result=act(s,'breakthrough',null,rng);assert.equal(result.ok,true,result.message);validateSave(s);}
function oldSave(realm,stage,ended=false){const s=createGame();s.version=2;s.realm=realm;s.stage=stage;s.ended=ended;s.xp=Math.round((100+(realm*3+stage)*60)*.5);s.hp=80;s.energy=40;s.stones=321;s.dust=17;s.books.sword=2;s.gear.bambooSword=3;return s;}

test('原著八境顺序与飞升终点正确，炼气有十三层',()=>{
  assert.deepEqual(REALMS,['炼气','筑基','结丹','元婴','化神','炼虚','合体','大乘','真仙']);
  assert.equal(REALMS.includes('金丹'),false);assert.equal(REALMS.includes('渡劫'),false);
  assert.equal(stageCount(0),13);for(let r=1;r<FINAL_REALM;r++)assert.equal(stageCount(r),4);assert.equal(stageCount(FINAL_REALM),1);assert.equal(TOTAL_BREAKTHROUGHS,41);
  assert.deepEqual(STAGES,['初期','中期','后期','大圆满']);
});
test('炼气逐层推进，十三层后才筑基，不会在第三次破境提前晋级',()=>{
  const s=createGame();assert.equal(realmLabel(s),'炼气 · 一层');
  for(let n=1;n<13;n++){advance(s);assert.equal(s.realm,0);assert.equal(s.stage,n);}
  assert.equal(stageLabel(s),'十三层');assert.equal(nextStep(s),'筑基 · 初期');advance(s);assert.equal(realmLabel(s),'筑基 · 初期');
});
test('筑基起四阶段推进，无跳级或属性倒退',()=>{
  const s=createGame();let previous=attributes(s);
  for(let n=0;n<TOTAL_BREAKTHROUGHS;n++){
    advance(s);const a=attributes(s);for(const key of ['maxHp','maxEnergy','attack','defense','xpNeed'])assert.ok(a[key]>=previous[key],`${key} after step ${n}`);previous=a;
  }
  assert.equal(s.realm,FINAL_REALM);assert.equal(s.ended,true);assert.ok(realmLabel(s).startsWith('真仙'));
});
test('大乘圆满才进入飞升天劫，渡劫失败保留八成修为及保底',()=>{
  const s=createGame();s.realm=7;s.stage=2;assert.equal(isAscension(s),false);assert.equal(nextStep(s),'大乘 · 大圆满');advance(s);assert.equal(isAscension(s),true);assert.equal(s.ended,false);
  const cap=attributes(s).xpNeed;advance(s,high);assert.equal(s.realm,7);assert.equal(s.stage,3);assert.equal(s.xp,Math.round(cap*.8));assert.equal(s.pity,1);assert.equal(s.ended,false);
  advance(s);assert.equal(s.realm,8);assert.equal(s.stage,0);assert.equal(s.ended,true);assert.ok(s.logs[0].text.includes('飞升之劫'));assert.ok(s.logs[0].text.includes('真仙'));
});
test('世界分层正确，终点不再允许突破',()=>{
  assert.equal(worldLabel(4),'人界');assert.equal(worldLabel(5),'灵界');assert.equal(worldLabel(7),'灵界');assert.equal(worldLabel(8),'仙界');
  const s=createGame();s.realm=8;s.ended=true;assert.equal(nextStep(s),'已渡劫飞升');const before=structuredClone(s);assert.equal(act(s,'breakthrough').ok,false);assert.deepEqual(s,before);
});
test('v2 炼气初中后分别转换为一、七、十三层，保持修为比例',()=>{
  for(let stage=0;stage<3;stage++){const old=oldSave(0,stage),snapshot=structuredClone(old),s=validateSave(old);assert.equal(s.version,3);assert.equal(s.stage,[0,6,12][stage]);assert.equal(s.realm,0);assert.equal(s.xp,Math.round(attributes(s).xpNeed*.5));assert.equal(s.hp,80);assert.equal(s.energy,40);assert.equal(s.stones,321);assert.equal(s.dust,17);assert.deepEqual(s.gear,old.gear);assert.deepEqual(old,snapshot);assert.deepEqual(validateSave(s),s);}
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

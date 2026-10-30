import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act, attributes, validateSave, REGIONS } from '../public/engine.js';
import { FINAL_REALM, TOTAL_BREAKTHROUGHS } from '../public/realms.js';
const low = () => 0, high = () => 0.99;
const run = (s,a,p,r=low) => { const result = act(s,a,p,r); assert.equal(result.ok,true,result.message); validateSave(s); return result; };

test('修炼消耗时间和灵力，满修为后不能重复扣除资源',()=>{
  const s=createGame(); run(s,'cultivate'); assert.equal(s.day,2); assert.equal(s.energy,90); assert.equal(s.xp,20);
  s.xp=attributes(s).xpNeed; const before=structuredClone(s);
  assert.equal(act(s,'cultivate').ok,false); assert.deepEqual(s,before);
});
test('灵力不足时操作保持原状态，静养不会超出上限',()=>{
  const s=createGame(); s.energy=5; const before=structuredClone(s);
  assert.equal(act(s,'retreat').ok,false); assert.deepEqual(s,before);
  run(s,'rest'); assert.equal(s.energy,50); assert.equal(s.hp,100);
  s.energy=99; run(s,'rest'); assert.equal(s.energy,100);
});
test('突破失败有保底加成，凝神丹在真正尝试后消耗',()=>{
  const s=createGame(); s.xp=100; run(s,'breakthrough',null,high);
  assert.equal(s.xp,80); assert.equal(s.pity,1); assert.equal(attributes(s).chance,90);
  s.items.focus=1; run(s,'use','focus'); assert.equal(s.focus,true);
  assert.equal(act(s,'breakthrough').ok,false); assert.equal(s.focus,true);
  s.xp=100; run(s,'breakthrough',null,high);
  assert.equal(s.stage,1); assert.equal(s.focus,false); assert.equal(s.pity,0); assert.equal(s.hp,104); assert.equal(s.energy,100);
});
test('可以经过全部四十一次突破达成真仙结局',()=>{
  const s=createGame();
  for(let n=0;n<TOTAL_BREAKTHROUGHS;n++){s.xp=attributes(s).xpNeed;s.energy=attributes(s).maxEnergy;run(s,'breakthrough');}
  assert.equal(s.ended,true); assert.equal(s.realm,FINAL_REALM); assert.equal(s.stage,0); assert.equal(s.stats.breaks,TOTAL_BREAKTHROUGHS);
  const before=structuredClone(s); assert.equal(act(s,'cultivate').ok,false); assert.deepEqual(s,before);
});
test('购买、服丹、炼丹和出售的资源闭环',()=>{
  const s=createGame(); run(s,'buy','qi'); assert.equal(s.stones,73); assert.equal(s.items.qi,3);
  assert.equal(act(s,'use','qi').ok,false); assert.equal(s.items.qi,3);
  s.energy=12;run(s,'use','qi');assert.equal(s.energy,52);assert.equal(s.items.qi,2);
  run(s,'alchemy'); assert.equal(s.items.herb,0); assert.equal(s.items.qi,3);
  const before=structuredClone(s);assert.equal(act(s,'alchemy').ok,false);assert.deepEqual(s,before);
  s.items.herb=1;run(s,'sell','herb');assert.equal(s.stones,78);
});
test('任务只可领奖一次，功法提升与属性联动',()=>{
  const s=createGame(); for(let n=0;n<3;n++)run(s,'cultivate');
  run(s,'claim','practice'); assert.equal(s.stones,118);
  assert.equal(act(s,'claim','practice').ok,false);
  run(s,'study','body');assert.equal(attributes(s).maxHp,120);assert.equal(s.hp,120);assert.equal(attributes(s).defense,5);
});
test('历练地点按境界解锁，未完成奇遇前不能做其他行动',()=>{
  const s=createGame();assert.equal(act(s,'explore','valley').ok,false);
  run(s,'explore','bamboo',()=>0.5); assert.equal(s.pending.kind,'event');
  const before=structuredClone(s);assert.equal(act(s,'cultivate').ok,false);assert.deepEqual(s,before);
  run(s,'choice','accept');assert.equal(s.items.focus,1);assert.equal(s.stats.explores,1);assert.equal(s.pending,null);
});
test('战斗技能、防御、服药、胜利和逃离都可正确结算',()=>{
  const s=createGame();run(s,'explore','bamboo');assert.equal(s.pending.kind,'combat');
  run(s,'skill');assert.equal(s.pending.hp,26);assert.equal(s.energy,73);
  run(s,'guard');assert.equal(s.energy,85);
  run(s,'use','heal');assert.equal(s.items.heal,1);assert.ok(s.hp<100);
  run(s,'skill');run(s,'attack');assert.equal(s.pending,null);assert.equal(s.stats.wins,1);assert.equal(s.stats.explores,1);
  s.energy=100;run(s,'explore','bamboo');run(s,'flee');assert.equal(s.pending,null);
});
test('战败保护角色、扣除灵石并结束战斗',()=>{
  const s=createGame();run(s,'explore','bamboo');s.hp=1;const stones=s.stones;
  run(s,'attack');assert.equal(s.pending,null);assert.equal(s.hp,40);assert.equal(s.stones,stones-Math.round(stones*.15));assert.equal(s.day,4);
});
test('各类奇遇有风险分支，安全分支不受伤',()=>{
  for(const chance of [0,0.99]){
    const s=createGame();run(s,'explore','bamboo',()=>0.9);run(s,'choice','accept',()=>chance);assert.equal(s.pending,null);assert.ok(s.hp>0);
  }
  const s=createGame();run(s,'explore','bamboo',()=>0.9);run(s,'choice','safe');assert.equal(s.hp,100);assert.equal(s.stones,112);
});
test('存档验证拒绝损坏或篡改数据，待定战斗可完整恢复',()=>{
  const s=createGame();run(s,'explore','bamboo');assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
  for(const bad of [{...s,realm:FINAL_REALM+1},{...s,xp:-1},{...s,hp:999},{...s,claimed:['not-a-quest']},{...s,logs:[{text:23}]},{...s,pending:{...s.pending,attack:999}}]) assert.throws(()=>validateSave(bad));
});
test('长时间战斗与服丹后存档仍有效，战斗记录有长度上限',()=>{
  const s=createGame();s.items.heal=100;run(s,'explore','bamboo');s.hp=80;
  for(let n=0;n<30;n++){run(s,'use','heal');assert.ok(s.pending.turns.length<=8);}
});
test('随机长局不会让资源为负或破坏存档',()=>{
  let seed=42;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const s=createGame();
  for(let i=0;i<2500 && !s.ended;i++){
    let action,payload;
    if(s.pending?.kind==='event'){action='choice';payload=s.stones>=12?'accept':'safe';}
    else if(s.pending?.kind==='combat'){action=s.hp<35&&s.items.heal?'use':s.energy>=12?'skill':'attack';if(action==='use')payload='heal';}
    else if(s.energy<30) action='rest';
    else if(s.xp===attributes(s).xpNeed) action='breakthrough';
    else if(rng()<0.3){action='explore';payload=REGIONS[Math.min(s.realm,3)].id;}
    else action=rng()<0.5?'cultivate':'gather';
    act(s,action,payload,rng);validateSave(s);
  }
  assert.ok(s.stats.cultivates>0);assert.ok(s.stats.explores>0);assert.ok(s.stats.breaks>0);
});

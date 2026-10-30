import type { GameState, PathId, RandomSource, Bonus } from '../src/types.js';
import { battle, activeSet } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,attributes,validateSave} from '../src/engine.js';
import {EQUIPMENT,EQUIPMENT_SETS,ARTIFACTS,PATHS,SLOTS,GRADES,gearBonus,equippedSet,setEffects,affinityBonus} from '../src/content.js';
import { REALMS } from '../src/realms.js';
const low=()=>0;
function run(s: GameState,action: string,payload?: string|null,rng: RandomSource=low){const result=act(s,action,payload,rng);assert.equal(result.ok,true,result.message);validateSave(s);return result;}
function equipped(realm: number,path: PathId,pieces=3){
  const s=createGame();s.realm=realm;s.path=path;s.ended=realm===REALMS.length-1;s.stones=100000;s.dust=10000;
  for(const item of EQUIPMENT.filter(i=>i.realm===realm).slice(0,pieces)){if(!Object.hasOwn(s.gear,item.id))run(s,'buyGear',item.id);run(s,'equip',item.id);}
  return s;
}
test('各境都有唯一的武器、法衣、佩饰，三途套装名称互异',()=>{
  assert.equal(EQUIPMENT.length,REALMS.length*3);assert.equal(EQUIPMENT_SETS.length,REALMS.length);assert.equal(new Set(EQUIPMENT.map(i=>i.id)).size,REALMS.length*3);
  for(let realm=0;realm<REALMS.length;realm++){
    const items=EQUIPMENT.filter(i=>i.realm===realm);assert.deepEqual(items.map(i=>i.slot).sort(),Object.keys(SLOTS).sort());assert.ok(GRADES[items[0].tier]);
    assert.equal(new Set(PATHS.map(p=>setEffects(realm,p.id).name)).size,3);
    for(const item of items){assert.ok(item.price>0);if(realm){const prev=EQUIPMENT.find(i=>i.realm===realm-1&&i.slot===item.slot)!,key=({weapon:'attack',armor:'hp',charm:'energy'} as const)[item.slot];assert.ok(item.price>prev.price);assert.ok((item[key]||0)>(prev[key]||0));}}
  }
});
test('同件装备按路径显化独立道纹，强化同步放大道纹，法宝不受道纹影响',()=>{
  for(const item of EQUIPMENT){const variants=PATHS.map(p=>affinityBonus(item,0,p.id));assert.equal(new Set(variants.map(b=>JSON.stringify(b))).size,3);
    for(const p of PATHS){const enhanced=affinityBonus(item,3,p.id);for(const key of (Object.keys(enhanced) as (keyof Bonus)[]))assert.ok(enhanced[key]>=affinityBonus(item,0,p.id)[key]);}
    assert.deepEqual(gearBonus(item,0),gearBonus(item,0,null));
  }
  for(const item of ARTIFACTS)for(const p of PATHS)assert.deepEqual(gearBonus(item,2,p.id),gearBonus(item,2));
});
test('两件和三件门槛准确，混搭不同境界不触发整套效果',()=>{
  for(const p of PATHS)for(let realm=0;realm<REALMS.length;realm++){
    const s=equipped(realm,p.id,1);assert.equal(equippedSet(s),null);
    const items=EQUIPMENT.filter(i=>i.realm===realm);if(!Object.hasOwn(s.gear,items[1].id))run(s,'buyGear',items[1].id);run(s,'equip',items[1].id);
    const two=activeSet(s);assert.equal(two.pieces,2);assert.deepEqual(two.bonus,setEffects(realm,p.id).bonus);assert.equal(two.heal,0);assert.equal(two.drain,0);assert.equal(two.shield,0);
    if(!Object.hasOwn(s.gear,items[2].id))run(s,'buyGear',items[2].id);run(s,'equip',items[2].id);assert.equal(activeSet(s).pieces,3);
    run(s,'unequip','charm');assert.equal(activeSet(s).pieces,2);
  }
  const mixed=equipped(2,'immortal',2);const charm=EQUIPMENT.find(i=>i.realm===1&&i.slot==='charm')!;run(mixed,'buyGear',charm.id);run(mixed,'equip',charm.id);assert.equal(activeSet(mixed).pieces,2);
  mixed.path=null;assert.equal(equippedSet(mixed),null);
});
test('三途两件套加成真实进入属性而非只显示说明',()=>{
  const i=equipped(0,'immortal',2);assert.equal(attributes(i).maxEnergy,133); // 100 + 20 路径 + 5 道纹 + 8 套装
  const d=equipped(0,'demon',2);assert.equal(attributes(d).attack,29); // round((14 + 4 + 2 + 1 + 3) * 1.2)
  const y=equipped(0,'yao',2);assert.equal(attributes(y).maxHp,188); // round((100 + 15 + 8 + 12 + 15) * 1.25)
});
test('仙修三件套在存活的敌方回合后回复，不在致命伤害后复活',()=>{
  const s=equipped(3,'immortal');const a=attributes(s);s.hp=a.maxHp-100;s.energy=60;run(s,'explore','sea');const hp=s.hp,energy=s.energy;
  run(s,'guard');const incoming=Math.max(1,68-a.defense-16);assert.equal(s.hp,hp-incoming+8);assert.equal(s.energy,energy+12+4);assert.ok(battle(s).turns.some(t=>t.includes('清气回流')));
  s.hp=1;run(s,'attack');assert.equal(s.pending,null);assert.equal(s.hp,Math.ceil(a.maxHp*.4));
});
test('魔修三件套叠加汲血，按实际造成伤害结算',()=>{
  const s=equipped(3,'demon'),a=attributes(s);s.hp=Math.round(a.maxHp*.6);s.energy=a.maxEnergy;run(s,'explore','sea');const before=s.hp,damage=a.attack-2;
  run(s,'attack');assert.equal(s.hp,before+Math.round(damage*.19)-Math.max(1,68-a.defense));
  assert.equal(Math.round(activeSet(s).drain*100),7);
});
test('妖修三件套开场护盾仅发放一次，存档恢复不会重复生成',()=>{
  const s=equipped(3,'yao'),a=attributes(s);s.hp=a.maxHp;s.energy=a.maxEnergy;run(s,'explore','sea');const initial=Math.round(a.maxHp*.14);assert.equal(battle(s).shield,initial);
  run(s,'guard');assert.ok(battle(s).shield<initial);const savedShield=battle(s).shield;
  const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(battle(loaded).shield,savedShield);run(loaded,'guard');assert.ok(battle(loaded).shield<savedShield);
  run(loaded,'flee');loaded.energy=a.maxEnergy;run(loaded,'explore','sea');assert.equal(battle(loaded).shield,initial);
});
test('高境装备受境界限制并能在掉落中获得，三重强化与存档校验兼容',()=>{
  const s=createGame();s.stones=100000;assert.equal(act(s,'buyGear','chaosRing').ok,false);s.realm=5;s.dust=10000;s.energy=attributes(s).maxEnergy;s.hp=attributes(s).maxHp;
  run(s,'explore','bamboo');const rolls=[.99,0,.999];run(s,'skill',null,()=>rolls.shift()??0);assert.equal(s.gear.chaosRing,0);run(s,'equip','chaosRing');
  for(let n=0;n<3;n++)run(s,'upgradeGear','chaosRing');assert.equal(s.gear.chaosRing,3);assert.equal(act(s,'upgradeGear','chaosRing').ok,false);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
});
test('改修自动转换已穿装备道纹与套装效果，保留物品和淬炼且不治疗',()=>{
  const s=equipped(4,'immortal');run(s,'upgradeGear','eternitySword');s.hp=45;s.energy=50;const gear=structuredClone(s.gear),slots=structuredClone(s.equipped);
  run(s,'choosePath','demon');assert.deepEqual(s.gear,gear);assert.deepEqual(s.equipped,slots);assert.equal(s.hp,45);assert.equal(s.energy,50);assert.equal(activeSet(s).name,'诛神套装');assert.ok(activeSet(s).drain>0);assert.equal(activeSet(s).heal,0);
  run(s,'choosePath','yao');assert.equal(activeSet(s).name,'万象套装');assert.ok(activeSet(s).shield>0);assert.equal(activeSet(s).drain,0);assert.equal(s.hp,45);
});
test('存档保留物品 ID、强化等级、资源或战斗状态',()=>{
  const s=equipped(2,'immortal');run(s,'upgradeGear','heavenSword');s.hp=100;s.energy=60;run(s,'explore','ruins');run(s,'guard');const old=JSON.parse(JSON.stringify(s));assert.deepEqual(validateSave(old),old);assert.equal(old.version,10);
});

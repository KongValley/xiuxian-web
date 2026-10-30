import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTIFACTS, ARTIFACT_STAGE_FACTORS, artifactBonus, artifactPower, artifactStage, LEGACY_ARTIFACT_IDS } from '../src/artifacts.js';
import { createGame, act, attributes, REGIONS, validateSave } from '../src/engine.js';
import { gearBonus } from '../src/content.js';
import type { ArtifactItem, GameState, PathId } from '../src/types.js';
const paths:Array<PathId|null>=[null,'immortal','demon','yao'];
function ready(item:ArtifactItem,stage=0,level=0):GameState {
  const s=createGame();s.realm=item.realm;s.stage=stage;s.ended=s.realm===8;s.stones=1000000;s.dust=10000;s.artifacts[item.id]=level;s.equipped.artifact=item.id;s.energy=attributes(s).maxEnergy;return s;
}
function run(s:GameState,action:string,payload?:string){const r=act(s,action,payload,()=>0);assert.equal(r.ok,true,r.message);validateSave(s);return r;}
function unchanged(s:GameState,action:string,payload?:string){const before=structuredClone(s);assert.equal(act(s,action,payload,()=>0).ok,false);assert.deepEqual(s,before);}

test('九境各三十种法宝，共270种，标识名称唯一且全部通用',()=>{
  assert.equal(ARTIFACTS.length,270);assert.equal(new Set(ARTIFACTS.map(i=>i.id)).size,270);assert.equal(new Set(ARTIFACTS.map(i=>i.name)).size,270);
  for(let realm=0;realm<9;realm++)assert.equal(ARTIFACTS.filter(i=>i.realm===realm).length,30);
  assert.equal(new Set(ARTIFACTS.map(i=>i.effect)).size,10);
  for(const id of LEGACY_ARTIFACT_IDS)assert.ok(ARTIFACTS.some(i=>i.id===id));
  for(const item of ARTIFACTS){assert.equal(item.path,undefined);assert.ok(item.cost>0&&item.price>0);for(const value of Object.values(item.power))assert.ok(Number.isFinite(value)&&value>=0);}
});

test('同境四阶段成长，淬炼与成长相乘；跨境保留圆满而非回退',()=>{
  assert.deepEqual(ARTIFACT_STAGE_FACTORS,[1,1.15,1.3,1.5]);
  for(const item of ARTIFACTS){
    for(const level of [0,1,2,3]){
      let previous=artifactBonus(item,level),oldPower=artifactPower(item,undefined,level);
      for(let stage=0;stage<(item.realm===8?1:4);stage++){
        const position={realm:item.realm,stage},bonus=artifactBonus(item,level,position),power=artifactPower(item,position,level);
        for(const k of ['hp','energy','attack','defense'] as const){assert.equal(bonus[k],Math.round((item[k]||0)*(100+level*30)*Math.round(ARTIFACT_STAGE_FACTORS[stage]*100)/10000));assert.ok(bonus[k]>=previous[k]);}
        for(const k of ['damage','heal','shield','shieldFlat','restore','drain'] as const)assert.ok(power[k]>=oldPower[k]);
        assert.ok(power.heal<=.9&&power.shield<=1&&power.drain<=.6);previous=bonus;oldPower=power;
      }
      if(item.realm<8){assert.deepEqual(artifactBonus(item,level,{realm:item.realm+1,stage:0}),previous);assert.deepEqual(artifactPower(item,{realm:item.realm+1,stage:0},level),oldPower);}
    }
    if(item.realm>0)assert.equal(artifactStage(item,{realm:item.realm-1,stage:3}),0);
  }
});

test('每件法宝在仙魔妖与未择道角色下均可购买炼化，法宝本身数值相同',()=>{
  for(const item of ARTIFACTS)for(const path of paths){
    const s=ready(item);s.path=path;s.equipped.artifact=null;delete s.artifacts[item.id];
    s.energy=attributes(s).maxEnergy;
    run(s,'buyArtifact',item.id);run(s,'equipArtifact',item.id);
    assert.deepEqual(gearBonus(item,2,path,s),gearBonus(item,2,null,s));
    assert.equal(s.equipped.artifact,item.id);assert.equal(s.artifacts[item.id],0);
  }
});

test('全部可战斗法宝在四阶段与淬炼前后按显示参数真实结算',()=>{
  for(const item of ARTIFACTS.filter(i=>i.realm<8))for(let stage=0;stage<4;stage++)for(const level of [0,3]){
    const s=ready(item,stage,level),a=attributes(s),region=REGIONS[Math.min(item.realm,3)],power=artifactPower(item,s,level);
    s.hp=Math.floor(a.maxHp*.3);s.energy=Math.max(item.cost,Math.floor(a.maxEnergy*.7));
    const hp=s.hp,energy=s.energy;
    s.pending={kind:'combat',region:region.id,name:region.enemy,hp:region.hp,maxHp:region.hp,attack:region.atk,shield:0,pathUsed:false,artifactCooldown:0,turns:[]};
    const damage=Math.round(a.attack*power.damage),actual=Math.min(region.hp,damage),shield=Math.min(a.maxHp,Math.round(a.maxHp*power.shield+power.shieldFlat));
    let expectedHp=Math.min(a.maxHp,hp+Math.round(a.maxHp*power.heal));expectedHp=Math.min(a.maxHp,expectedHp+Math.round(actual*power.drain));
    const expectedEnergy=Math.min(a.maxEnergy,energy-item.cost+power.restore);
    if(damage<region.hp)expectedHp-=Math.max(0,Math.max(1,region.atk-2-a.defense)-shield);
    run(s,'artifactSkill');assert.equal(s.hp,expectedHp,item.id);assert.equal(s.energy,expectedEnergy,item.id);
    if(s.pending?.kind==='combat'){assert.equal(s.pending.hp,region.hp-damage);assert.equal(s.pending.artifactCooldown,3);}else assert.ok(damage>=region.hp);
  }
});

test('大境突破后已装备旧宝不掉数值，成长不靠换装恢复资源',()=>{
  const item=ARTIFACTS.find(i=>i.id==='originCauldron')!,s=ready(item,3,2),before=artifactBonus(item,2,s),power=artifactPower(item,s,2);
  s.xp=attributes(s).xpNeed;run(s,'breakthrough');assert.equal(s.realm,2);assert.deepEqual(artifactBonus(item,2,s),before);assert.deepEqual(artifactPower(item,s,2),power);
  s.hp=55;s.energy=25;run(s,'unequip','artifact');const hp=s.hp,energy=s.energy;run(s,'equipArtifact',item.id);assert.equal(s.hp,hp);assert.equal(s.energy,energy);
});

test('改道保留法宝，未达境界、缺资源和战斗期间操作不改变状态',()=>{
  const item=ARTIFACTS.find(i=>i.id==='pureWhisk')!,s=ready(item);run(s,'choosePath','demon');run(s,'choosePath','yao');assert.equal(s.equipped.artifact,item.id);
  const low=createGame();unchanged(low,'buyArtifact',item.id);unchanged(low,'equipArtifact',item.id);low.stones=0;unchanged(low,'buyArtifact',ARTIFACTS[1].id);
  run(s,'explore','valley');unchanged(s,'buyArtifact',ARTIFACTS[31].id);unchanged(s,'unequip','artifact');unchanged(s,'upgradeArtifact',item.id);
  s.energy=item.cost-1;unchanged(s,'artifactSkill');s.energy=attributes(s).maxEnergy;run(s,'artifactSkill');if(s.pending)unchanged(s,'artifactSkill');
});

test('遗藏掉落不分路径，能命中每个已达境界的最后一件法宝',()=>{
  for(let realm=0;realm<8;realm++)for(const path of paths){
    const s=createGame();s.realm=realm;s.path=path;s.energy=attributes(s).maxEnergy;s.hp=attributes(s).maxHp;
    assert.equal(act(s,'explore','bamboo',()=>.9).ok,true);const rolls=[0,0,.999999];
    assert.equal(act(s,'choice','accept',()=>rolls.shift()??0).ok,true);validateSave(s);
    assert.ok(Object.hasOwn(s.artifacts,`treasure-${realm}-29`));
  }
});

test('v5六件旧宝无损迁移，保留强化、装备、功法、资源和战局',()=>{
  for(const id of LEGACY_ARTIFACT_IDS){
    const item=ARTIFACTS.find(i=>i.id===id)!,old=ready(item,2,3);old.version=5;old.hp=73;old.energy=45;
    const region=REGIONS[Math.min(item.realm,3)];old.pending={kind:'combat',region:region.id,name:region.enemy,hp:region.hp,maxHp:region.hp,attack:region.atk,shield:12,pathUsed:true,artifactCooldown:2,turns:['旧宝仍在护持。']};
    const snapshot=structuredClone(old),loaded=validateSave(old);assert.deepEqual(old,snapshot);assert.equal(loaded.version,8);assert.equal(loaded.equipped.artifact,id);assert.deepEqual(loaded.artifacts,old.artifacts);assert.deepEqual(loaded.books,old.books);assert.deepEqual(loaded.pending,old.pending);assert.equal(loaded.hp,73);assert.equal(loaded.energy,45);assert.deepEqual(validateSave(loaded),loaded);
  }
});

test('坏存档拒绝不存在法宝、非法淬炼与伪造旧版新法宝',()=>{
  const s=createGame();for(const bad of [{...s,artifacts:{missing:0}},{...s,artifacts:{spiritBell:4}},{...s,artifacts:{spiritBell:-1}},{...s,equipped:{...s.equipped,artifact:ARTIFACTS[1].id}},{...s,version:5,artifacts:{[ARTIFACTS[1].id]:0}}])assert.throws(()=>validateSave(bad));
});

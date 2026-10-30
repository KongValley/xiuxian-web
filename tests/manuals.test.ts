import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act, attributes, cultivationRate, validateSave } from '../src/engine.js';
import { BOOKS, MANUALS, manualEffects, MAX_ACTIVE_BOOKS } from '../src/manuals.js';
import type { GameState, PathId } from '../src/types.js';
import { battle } from './helpers.js';
const paths:PathId[]=['immortal','demon','yao'];
function ready(path:PathId='immortal',realm=0){const s=createGame();s.path=path;s.realm=realm;s.ended=realm===8;s.stones=1000000;return s;}
function run(s:GameState,action:string,payload?:string){const r=act(s,action,payload,()=>0);assert.equal(r.ok,true,r.message);validateSave(s);return r;}
function unchanged(s:GameState,action:string,payload?:string){const before=structuredClone(s);assert.equal(act(s,action,payload,()=>0).ok,false);assert.deepEqual(s,before);}
function learn(s:GameState,id:string){s.energy=attributes(s).maxEnergy;run(s,'study',id);}

test('九境三途各有十本原创功法，ID、标题唯一且五重可达',()=>{
  assert.equal(MANUALS.length,270);assert.equal(BOOKS.length,273);
  assert.equal(new Set(BOOKS.map(b=>b.id)).size,273);assert.equal(new Set(BOOKS.map(b=>b.name)).size,273);
  for(const path of paths)for(let realm=0;realm<9;realm++){
    const books=MANUALS.filter(b=>b.path===path&&b.realm===realm),s=ready(path,realm);run(s,'deactivateBook','breath');
    assert.equal(books.length,10);
    for(const b of books){assert.equal(b.max,5);assert.ok(b.desc&&Object.keys(b.effects).length);for(let level=1;level<=5;level++){learn(s,b.id);assert.equal(s.books[b.id],level);}unchanged(s,'study',b.id);}
    assert.equal(s.activeBooks.length,MAX_ACTIVE_BOOKS);assert.equal(Object.values(s.books).filter(n=>n>0).length,11);
  }
});

test('基础功法占兼修位，十本封顶；转修事务保留旧重数且不重复收费',()=>{
  const s=ready();for(let i=0;i<9;i++)learn(s,`immortal-0-${i}`);
  assert.equal(s.activeBooks.length,10);unchanged(s,'study','immortal-0-9');
  const hp=s.hp,stones=s.stones,day=s.day,energy=s.energy;
  run(s,'switchBook','breath|immortal-0-9');
  assert.equal(s.activeBooks.length,10);assert.equal(s.books.breath,1);assert.equal(s.books['immortal-0-9'],1);
  assert.equal(s.stones,stones-MANUALS.find(b=>b.id==='immortal-0-9')!.cost);assert.equal(s.day,day+1);assert.equal(s.energy,energy-12);assert.equal(s.hp,hp);
  unchanged(s,'switchBook','breath|immortal-0-9');unchanged(s,'activateBook','breath');
  run(s,'deactivateBook','immortal-0-9');const xp=s.xp,restoreStones=s.stones;
  run(s,'activateBook','breath');assert.equal(s.stones,restoreStones-10);assert.equal(s.xp,xp);assert.equal(s.activeBooks.length,10);
});

test('不符合境界、路径、资源、来源或状态的学习和转修无副作用',()=>{
  const s=ready();unchanged(s,'study','immortal-1-0');unchanged(s,'study','demon-0-0');unchanged(s,'study','missing');
  unchanged(s,'activateBook','immortal-0-0');unchanged(s,'switchBook','missing|immortal-0-0');unchanged(s,'switchBook','breath|demon-0-0');
  s.energy=0;unchanged(s,'switchBook','breath|immortal-0-0');unchanged(s,'study','immortal-0-0');
  s.energy=100;s.stones=0;unchanged(s,'switchBook','breath|immortal-0-0');unchanged(s,'study','immortal-0-0');
  s.path=null;unchanged(s,'study','immortal-0-0');
});

test('封存后属性消失、重数保留，重新兼修不治疗；旧低境功法仍可练',()=>{
  const s=ready('yao');learn(s,'yao-0-0');const max=attributes(s).maxHp;
  s.hp=max;run(s,'deactivateBook','yao-0-0');assert.equal(s.hp,attributes(s).maxHp);assert.ok(s.hp<max);assert.equal(s.books['yao-0-0'],1);
  const hp=s.hp;run(s,'activateBook','yao-0-0');assert.equal(attributes(s).maxHp,max);assert.equal(s.hp,hp);
  s.realm=7;learn(s,'yao-0-0');assert.equal(s.books['yao-0-0'],2);
  run(s,'choosePath','immortal');assert.ok(!s.activeBooks.includes('yao-0-0'));assert.equal(s.books['yao-0-0'],2);unchanged(s,'activateBook','yao-0-0');
  run(s,'choosePath','yao');run(s,'activateBook','yao-0-0');assert.equal(s.books['yao-0-0'],2);
});

test('修炼、冲关和御剑效果按生效功法计算，并对特殊叠加设限',()=>{
  const s=ready('immortal',8);s.books.breath=5;
  for(let r=0;r<9;r++){const id=`immortal-${r}-0`;s.books[id]=5;s.activeBooks.push(id);}
  assert.equal(manualEffects(s).cultivation,1.2);assert.equal(cultivationRate(s),2.2*1.15);
  for(const [path,index,key,limit]of [['immortal',4,'chance',15],['demon',1,'drain',.2],['yao',6,'shield',.3],['demon',2,'skill',.75],['yao',9,'energyRegen',10]] as const){
    const state=ready(path,8);state.activeBooks=[];
    for(let r=0;r<9;r++){const id=`${path}-${r}-${index}`;state.books[id]=5;state.activeBooks.push(id);}
    validateSave(state);assert.equal(manualEffects(state)[key],limit);
    if(key==='chance')assert.equal(attributes(state).chance,60);
  }
});

test('功法战斗效果真实结算：护盾、回合回元与汲血',()=>{
  const s=ready('yao');learn(s,'yao-0-6');learn(s,'yao-0-7');learn(s,'yao-0-9');
  run(s,'explore','bamboo');assert.equal(battle(s).shield,Math.round(attributes(s).maxHp*.015));
  const control=structuredClone(s);control.activeBooks=['breath'];battle(s).shield=0;battle(control).shield=0;s.hp=50;control.hp=50;
  run(s,'guard');run(control,'guard');assert.equal(s.hp-control.hp,2);assert.equal(s.energy-control.energy,1);
  const demon=ready('demon');learn(demon,'demon-0-1');demon.books['demon-0-1']=5;run(demon,'explore','bamboo');
  const plain=structuredClone(demon);plain.activeBooks=['breath'];demon.hp=40;plain.hp=40;
  run(demon,'skill');run(plain,'skill');assert.ok(demon.hp>plain.hp);
});

test('战斗与奇遇中禁止学习、封存、恢复和转修，避免回元刷新',()=>{
  for(const roll of [0,.5]){
    const s=ready();learn(s,'immortal-0-0');assert.equal(act(s,'explore','bamboo',()=>roll).ok,true);
    for(const [action,payload]of [['study','sword'],['deactivateBook','breath'],['activateBook','body'],['switchBook','breath|sword'],['choosePath','demon']])unchanged(s,action,payload);
  }
});

test('v4 存档迁移不损失三卷重数、属性、战局，迁移不改原对象',()=>{
  const old=ready();old.version=4;old.books={breath:4,sword:3,body:2};old.hp=77;old.energy=62;old.activeBooks=[];
  old.pending={kind:'combat',region:'bamboo',name:'山间灵狼',hp:35,maxHp:48,attack:11,shield:0,pathUsed:false,artifactCooldown:2,turns:['旧战局。']};
  const original=structuredClone(old),before=attributes(old),migrated=validateSave(old);
  assert.deepEqual(old,original);assert.equal(migrated.version,6);assert.deepEqual(migrated.books,old.books);assert.deepEqual(migrated.activeBooks,['breath','sword','body']);
  assert.deepEqual(attributes(migrated),before);assert.equal(migrated.hp,77);assert.equal(migrated.energy,62);assert.deepEqual(validateSave(migrated),migrated);
  assert.deepEqual(migrated.pending,old.pending);
});

test('导入拒绝伪造功法、非法重数、十一兼修、重复兼修及异途生效',()=>{
  const s=ready();
  for(const bad of [{...s,activeBooks:undefined},{...s,activeBooks:['breath','breath']},{...s,activeBooks:['missing']},{...s,books:{...s.books,missing:1}},{...s,books:{...s.books,breath:6}},{...s,books:{...s.books,'immortal-1-0':1}},{...s,books:{...s.books,'demon-0-0':1},activeBooks:['demon-0-0']},{...s,books:{...s.books,sword:0},activeBooks:['sword']}])assert.throws(()=>validateSave(bad));
  const eleven=ready('immortal',1);eleven.activeBooks=['breath'];for(let i=0;i<10;i++){const id=`immortal-0-${i}`;eleven.books[id]=1;eleven.activeBooks.push(id);}assert.throws(()=>validateSave(eleven));
});

test('真仙也可参悟本境十卷，并可静养采药支撑收藏',()=>{
  const s=ready('yao',8);learn(s,'yao-8-0');s.energy=0;run(s,'rest');run(s,'gather');run(s,'choosePath','immortal');learn(s,'immortal-8-0');
  assert.equal(s.ended,true);assert.equal(s.realm,8);unchanged(s,'breakthrough');unchanged(s,'cultivate');
});

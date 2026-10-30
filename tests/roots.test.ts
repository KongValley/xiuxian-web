import test from 'node:test';
import assert from 'node:assert/strict';
import { act, attributes, createGame, cultivationRate, validateSave } from '../src/engine.js';
import { createRoots, ELEMENTS, ROOT_ACTIONS, ROOT_LEVEL_CAPS, ROOT_PROMOTIONS, rootEffects, rootTotal } from '../src/roots.js';
import { battle } from './helpers.js';
import type { ElementId, GameState, PathId } from '../src/types.js';
const noRandom=()=>{throw new Error('养根不应抽取随机数');};
function run(s:GameState,action:string,payload?:string){const result=act(s,action,payload,()=>0);assert.equal(result.ok,true,result.message);validateSave(s);return result;}
function unchanged(s:GameState,action:string,payload?:string){const before=structuredClone(s);assert.equal(act(s,action,payload,()=>0).ok,false);assert.deepEqual(s,before);}
function rich(primary:ElementId='metal',realm=0){const s=createGame();s.realm=realm;s.ended=realm===8;s.stones=1000000;s.roots.essence=1000000;s.roots.dew=1000;s.items.herb=1000;run(s,'rootAwaken',primary);return s;}
function replenish(s:GameState){s.energy=attributes(s).maxEnergy;}

test('初始灵根不改原属性；五行首次测灵免费自选且只可一次',()=>{
  for(const element of ELEMENTS){
    const s=createGame(),before=structuredClone(s),base=attributes(s);assert.equal(s.roots.primary,null);assert.equal(rootEffects(s).cultivation,0);
    assert.equal(act(s,'rootAwaken',element.id,noRandom).ok,true);validateSave(s);
    assert.equal(s.roots.primary,element.id);assert.equal(s.roots.levels[element.id],1);assert.equal(s.roots.purity,10);assert.equal(s.roots.tier,0);
    for(const key of ['day','stones','energy','hp','items','books','artifacts'] as const)assert.deepEqual(s[key],before[key]);
    assert.equal(s.roots.essence,12);assert.equal(s.roots.dew,2);assert.ok(cultivationRate(s)>cultivationRate(before));
    const a=attributes(s);if(element.id==='metal')assert.equal(a.attack-base.attack,3);if(element.id==='wood')assert.equal(a.maxHp-base.maxHp,15);if(element.id==='water')assert.equal(a.maxEnergy-base.maxEnergy,5);if(element.id==='fire')assert.equal(rootEffects(s).skill,.015);if(element.id==='earth')assert.equal(a.defense-base.defense,2);
    unchanged(s,'rootAwaken',element.id);unchanged(s,'rootAwaken','water');
  }
});

test('培养、洗炼、引灵与炼露按显示成本扣费，只推进游戏日',()=>{
  const s=rich();const before=structuredClone(s);run(s,'rootTrain','metal');
  assert.equal(s.roots.levels.metal,2);assert.equal(before.roots.essence-s.roots.essence,3);assert.equal(before.stones-s.stones,24);assert.equal(before.energy-s.energy,10);assert.equal(s.day,before.day+1);
  const b=structuredClone(s);run(s,'rootPurify');assert.equal(s.roots.purity,15);assert.equal(b.roots.essence-s.roots.essence,4);assert.equal(b.roots.dew-s.roots.dew,1);assert.equal(b.stones-s.stones,35);assert.equal(b.energy-s.energy,8);
  const c=structuredClone(s);run(s,'rootRefine');assert.equal(s.roots.dew,c.roots.dew+1);assert.equal(c.items.herb-s.items.herb,5);assert.equal(c.stones-s.stones,30);assert.equal(c.energy-s.energy,10);
  const d=structuredClone(s);run(s,'rootGather');assert.equal(s.roots.essence,d.roots.essence+3);assert.equal(d.energy-s.energy,10);assert.equal(s.hp,before.hp);
});

test('凡根至仙根条件、品阶上限和完整五行满级均可达',()=>{
  const s=rich('water',8);
  for(let tier=0;tier<3;tier++){
    const p=ROOT_PROMOTIONS[tier];while(s.roots.purity<p.purity){replenish(s);run(s,'rootPurify');}
    while(rootTotal(s)<p.total){const e=ELEMENTS.find(e=>s.roots.levels[e.id]<ROOT_LEVEL_CAPS[tier])!;replenish(s);run(s,'rootTrain',e.id);}
    replenish(s);const before=structuredClone(s);run(s,'rootPromote');assert.equal(s.roots.tier,tier+1);assert.equal(before.roots.essence-s.roots.essence,p.essence);assert.equal(before.roots.dew-s.roots.dew,p.dew);assert.equal(before.stones-s.stones,p.stones);assert.deepEqual(s.roots.levels,before.roots.levels);assert.equal(s.roots.purity,before.roots.purity);
  }
  for(const e of ELEMENTS)while(s.roots.levels[e.id]<20){replenish(s);run(s,'rootTrain',e.id);}
  while(s.roots.purity<100){replenish(s);run(s,'rootPurify');}
  assert.equal(rootTotal(s),100);assert.equal(rootEffects(s).cultivation,.7);assert.equal(rootEffects(s).chance,13);assert.equal(rootEffects(s).energy,90);
  unchanged(s,'rootPurify');unchanged(s,'rootPromote');for(const e of ELEMENTS)unchanged(s,'rootTrain',e.id);
  assert.equal(s.ended,true);assert.equal(s.realm,8);assert.deepEqual(validateSave(s),s);
});

test('晋品需同时满足境界、纯度、五行总级，失败不扣资源',()=>{
  const s=rich();unchanged(s,'rootPromote');s.realm=1;unchanged(s,'rootPromote');s.roots.purity=25;unchanged(s,'rootPromote');
  s.roots.levels={metal:5,wood:5,water:0,fire:0,earth:0};unchanged(s,'rootTrain','metal');
  s.realm=0;unchanged(s,'rootPromote');s.realm=1;run(s,'rootPromote');assert.equal(s.roots.tier,1);run(s,'rootTrain','metal');assert.equal(s.roots.levels.metal,6);
});

test('重塑保留培养、纯度与品阶，降低上限只裁剪而不治疗',()=>{
  const s=rich('wood',1);s.roots.levels.wood=4;s.roots.levels.water=1;s.hp=attributes(s).maxHp;s.energy=60;
  const levels=structuredClone(s.roots.levels),purity=s.roots.purity,oldMax=attributes(s).maxHp;run(s,'rootReshape','water');
  assert.deepEqual(s.roots.levels,levels);assert.equal(s.roots.purity,purity);assert.equal(s.roots.tier,0);assert.equal(s.roots.primary,'water');assert.equal(s.hp,attributes(s).maxHp);assert.ok(s.hp<oldMax);assert.equal(s.energy,40);
  const hp=s.hp;run(s,'rootReshape','wood');assert.equal(s.hp,hp);assert.equal(s.energy,20);unchanged(s,'rootReshape','wood');unchanged(s,'rootReshape','fire');
});

test('灵根加成进入修炼与突破，并与三途及十卷兼修独立',()=>{
  for(const path of [null,'immortal','demon','yao'] as Array<PathId|null>){
    const s=rich('metal',1);s.path=path;s.roots.purity=25;s.roots.levels={metal:5,wood:5,water:0,fire:0,earth:0};run(s,'rootPromote');
    const snapshot=structuredClone(s.roots),rate=cultivationRate(s),chance=attributes(s).chance;assert.equal(rootEffects(s).chance,3);assert.ok(rate>1.2);
    const plain=structuredClone(s);plain.roots=createRoots();assert.equal(attributes(s).chance-attributes(plain).chance,3);
    s.focus=true;s.pity=100;assert.equal(attributes(s).chance,100);s.focus=false;s.pity=0;
    replenish(s);run(s,'cultivate');assert.equal(s.xp,Math.round(17*(1+(s.realm*3+[0,1,2,2.5][s.stage])*.6)*rate));assert.deepEqual(s.roots,snapshot);assert.equal(s.activeBooks.length,1);assert.ok(chance>0);
    if(path){run(s,'choosePath',path==='yao'?'immortal':'yao');assert.deepEqual(s.roots,snapshot);}
  }
});

test('木水回元、土系护盾、火系御剑真实参与战斗，致命伤害不原地复活',()=>{
  for(const element of ['wood','water'] as const){
    const s=rich(element);s.roots.levels[element]=element==='wood'?3:4;run(s,'explore','bamboo');
    const plain=structuredClone(s);plain.roots=createRoots();s.hp=50;plain.hp=50;s.energy=20;plain.energy=20;run(s,'guard');run(plain,'guard');
    if(element==='wood')assert.equal(s.hp-plain.hp,1);else assert.equal(s.energy-plain.energy,1);
  }
  const earth=rich('earth');earth.roots.levels.earth=5;run(earth,'explore','bamboo');assert.equal(battle(earth).shield,Math.round(attributes(earth).maxHp*rootEffects(earth).shield));run(earth,'guard');assert.deepEqual(validateSave(earth).pending,earth.pending);
  const fire=rich('fire');fire.roots.levels.fire=5;run(fire,'explore','bamboo');const damage=Math.round((attributes(fire).attack-2)*(1.8+rootEffects(fire).skill));run(fire,'skill');assert.equal(battle(fire).hp,48-damage);
  const wood=rich('wood');wood.roots.levels.wood=5;run(wood,'explore','bamboo');wood.hp=1;run(wood,'guard');assert.equal(wood.pending,null);assert.equal(wood.hp,Math.ceil(attributes(wood).maxHp*.4));
});

test('未测灵、非法五行、缺资源及历练期间的养根动作不改状态',()=>{
  const s=createGame();unchanged(s,'rootAwaken','thunder');for(const a of ROOT_ACTIONS.filter(a=>a!=='rootAwaken'))unchanged(s,a,'metal');
  run(s,'rootAwaken','metal');s.roots.essence=0;s.roots.dew=0;s.stones=0;s.energy=0;s.items.herb=0;
  for(const a of ROOT_ACTIONS)unchanged(s,a,'water');unchanged(s,'rootTrain','__proto__');
  const t=rich();run(t,'explore','bamboo');for(const a of ROOT_ACTIONS)unchanged(t,a,'water');
});

test('材料可从零恢复，引灵和所有养根不额外抽取随机数',()=>{
  const s=rich();s.stones=0;s.roots.essence=0;s.roots.dew=0;s.items.herb=0;s.energy=0;run(s,'rest');
  assert.equal(act(s,'rootGather','',noRandom).ok,true);assert.equal(s.roots.essence,3);
  let calls=0;assert.equal(act(s,'gather','',()=>{calls++;return 0;}).ok,true);assert.equal(calls,2);assert.equal(s.roots.essence,4);
  for(let n=0;n<9;n++){if(s.energy<8)run(s,'rest');run(s,'gather');}if(s.energy<10)run(s,'rest');run(s,'rootRefine');assert.equal(s.roots.dew,1);
  const before=s.roots.essence;replenish(s);assert.equal(act(s,'explore','bamboo',()=>.5).ok,true);run(s,'choice','safe');assert.equal(s.roots.essence,before+1);
  replenish(s);run(s,'explore','bamboo');while(s.pending)run(s,'attack');assert.ok(s.roots.essence>before+1);
});

test('v6旧档补充未觉醒灵根，不更改原属性、战斗、材料、功法或装备',()=>{
  const s=createGame();s.version=6;s.realm=3;s.stage=2;s.path='demon';s.artifacts['treasure-3-9']=2;s.equipped.artifact='treasure-3-9';s.hp=99;s.energy=78;
  s.pending={kind:'combat',region:'sea',name:'沧海蛟影',hp:400,maxHp:590,attack:70,shield:12,pathUsed:true,artifactCooldown:2,turns:['旧局仍在。']};
  const before=attributes(s),raw=structuredClone(s);delete (raw as Partial<GameState>).roots;const original=structuredClone(raw),loaded=validateSave(raw);
  assert.equal(loaded.version,9);assert.deepEqual(loaded.roots,createRoots());assert.deepEqual(attributes(loaded),before);assert.equal(loaded.hp,99);assert.equal(loaded.energy,78);assert.deepEqual(loaded.pending,raw.pending);assert.deepEqual(loaded.artifacts,raw.artifacts);assert.deepEqual(loaded.books,raw.books);assert.deepEqual(raw,original);assert.deepEqual(validateSave(loaded),loaded);
});

test('拒绝伪造品阶、越级培养、非法纯度、主灵根与材料',()=>{
  const s=rich('metal'),base=structuredClone(s.roots);
  const invalid=[undefined,{...base,primary:'ice'},{...base,primary:null},{...base,tier:4},{...base,tier:1},{...base,purity:11},{...base,purity:105},{...base,essence:-1},{...base,dew:1.5},{...base,levels:{...base.levels,metal:6}},{...base,levels:{...base.levels,metal:0}},{...base,levels:[]},{...base,levels:{...base.levels,ice:1}},{...base,extra:1}];
  for(const roots of invalid)assert.throws(()=>validateSave({...s,roots}));
});

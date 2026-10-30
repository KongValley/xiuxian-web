import test from 'node:test';
import assert from 'node:assert/strict';
import { act, attributes, createGame, cultivationRate, validateSave } from '../src/engine.js';
import { ARTIFACTS, EQUIPMENT } from '../src/content.js';
import { BOOKS } from '../src/manuals.js';
import { ART_SKILLS, MATERIALS, PETS, RECIPES, TALENTS } from '../src/growth-content.js';
import { actGrowth, activeFates, createGrowth, fateCounts, growthBossReward, growthEffects, natalCap, petCap, professionLevel, talentBudget, trainingBudget } from '../src/growth.js';
import { chooseGrowthSkill } from '../src/growth-combat.js';
import { dungeonAutoAction, dungeonEnemy, findDungeon } from '../src/dungeons.js';
import type { GameState, GrowthMaterial, PathId, Profession } from '../src/types.js';
import { battle } from './helpers.js';

const half=()=>.5;
function rich(realm=7,path:PathId='immortal'){
  const s=createGame();s.realm=realm;s.stage=realm===8?0:3;s.ended=realm===8;s.path=path;s.stones=1000000;s.dust=10000;s.reforge.shards=10000;s.items.herb=10000;s.items.heal=30;s.items.qi=30;
  for(const key of Object.keys(MATERIALS) as GrowthMaterial[])s.growth.inventory[key]=10000;
  for(const item of EQUIPMENT.filter(i=>i.realm===realm)){s.gear[item.id]=2;s.equipped[item.slot]=item.id;}
  const artifact=ARTIFACTS.find(a=>a.realm===realm&&a.effect==='blast')!;s.artifacts[artifact.id]=1;s.equipped.artifact=artifact.id;
  for(const b of BOOKS.filter(b=>b.path===path&&b.realm===realm&&((b.effects.hp||0)>0||(b.effects.attack||0)>0)).slice(0,4)){s.books[b.id]=3;s.activeBooks.push(b.id);}
  refill(s);return s;
}
function refill(s:GameState){s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;}
function run(s:GameState,action:string,payload?:string){const r=act(s,action,payload,half);assert.ok(r.ok,r.message);assert.deepEqual(validateSave(s),s);return r;}
function unchanged(s:GameState,action:string,payload?:string){const before=structuredClone(s);assert.equal(act(s,action,payload,half).ok,false);assert.deepEqual(s,before);}
function autoFinish(s:GameState){for(let n=0;n<1000;n++){const next=dungeonAutoAction(s,attributes);if(!next)return;run(s,next.action,next.payload);}throw new Error('自动行动越界');}
function win(s:GameState,id=`dungeon-${s.realm}-0`){refill(s);run(s,'dungeonAutoStart',id+'|1');autoFinish(s);assert.ok(s.expedition.last?.won,s.expedition.last?.summary);}

test('v9旧角色、进行中的首领和待选洗练无损迁移，初始八业没有被动属性变化',()=>{
  const old=rich(3);run(old,'reforgeRoll',swordId(old));run(old,'dungeonEnter','dungeon-3-0');old.version=9;
  const snapshot=structuredClone(old),loaded=validateSave(old);assert.deepEqual(old,snapshot);assert.equal(loaded.version,10);assert.deepEqual(loaded.growth,createGrowth());assert.deepEqual(loaded.pending,old.pending);assert.deepEqual(loaded.expedition,old.expedition);assert.deepEqual(loaded.reforge,old.reforge);assert.equal(loaded.hp,old.hp);assert.equal(loaded.energy,old.energy);assert.deepEqual(attributes(loaded),attributes(old));
});
function swordId(s:GameState){return s.equipped.weapon!;}
test('材料不足与境界锁定不扣费，可从零采集恢复；购买按份计费',()=>{
  const s=createGame();for(const action of ['natalBind','petHatch','trainingRaise','sectJoin'])unchanged(s,action,action==='petHatch'?'tiger':action==='sectJoin'?'cloud':action==='natalBind'?'spiritBell':'body');
  for(const k of Object.keys(MATERIALS) as GrowthMaterial[])s.growth.inventory[k]=0;run(s,'growthGather','jade');assert.equal(s.growth.inventory.jade,2);assert.equal(s.energy,90);assert.equal(s.day,2);unchanged(s,'growthGather','fake');
  const stones=s.stones;run(s,'growthBuy','seed|1');assert.equal(s.stones,stones-15);assert.equal(s.growth.inventory.seed,1);unchanged(s,'growthBuy','seed|0');unchanged(s,'growthBuy','firefruit|1');
});
test('本命认主、契合、器灵、分支与转移有实际成本，80%转移不重复治疗',()=>{
  const s=rich(),artifact=s.equipped.artifact!;run(s,'natalBind',artifact);for(let n=0;n<5;n++){refill(s);run(s,'natalBond');}run(s,'natalSpirit');run(s,'natalBranch','echo');assert.equal(s.growth.natal.bond,5);assert.equal(s.growth.natal.spirit,1);unchanged(s,'natalSpirit');
  const other=ARTIFACTS.find(a=>a.realm===s.realm&&a.id!==artifact)!;s.artifacts[other.id]=3;s.hp=100;const stones=s.stones,jade=s.growth.inventory.jade;run(s,'natalBind',other.id);assert.equal(s.growth.natal.bond,4);assert.equal(s.growth.natal.spirit,0);assert.equal(s.growth.natal.branch,null);assert.equal(s.hp,100);assert.equal(s.artifacts[other.id],3);assert.equal(stones-s.stones,800);assert.equal(jade-s.growth.inventory.jade,12);
});
test('本命试炼只在装备本命且击败目标境界首领时推进，完成后器灵可继续升华',()=>{
  const s=rich(2);run(s,'natalBind',s.equipped.artifact!);for(let n=0;n<5;n++){refill(s);run(s,'natalBond');}run(s,'natalTrial');growthBossReward(s,1);assert.equal(s.growth.natal.trial!.bosses,0);growthBossReward(s,2);assert.equal(s.growth.natal.trial!.bosses,1);const equipped=s.equipped.artifact;s.equipped.artifact=null;growthBossReward(s,2);assert.equal(s.growth.natal.trial!.bosses,1);s.equipped.artifact=equipped;win(s);assert.equal(s.growth.natal.trials,1);assert.equal(s.growth.natal.trial,null);run(s,'natalSpirit');run(s,'natalSpirit');assert.equal(s.growth.natal.spirit,2);unchanged(s,'natalSpirit');
});
test('天赋共用有限点数、前置三点生效；洗点与改道保留已学神通和异途进度',()=>{
  const s=rich(1);unchanged(s,'talentLearn','demon-0-0');unchanged(s,'talentLearn','immortal-0-1');for(let i=0;i<3;i++){refill(s);run(s,'talentLearn','immortal-0-0');}run(s,'talentLearn','immortal-0-1');assert.ok(growthEffects(s).damage>=.04);assert.equal(talentBudget(s),5);
  run(s,'artLearn','cloud-blade');run(s,'artEquip','cloud-blade');run(s,'choosePath','demon');assert.ok(s.growth.arts.learned.includes('cloud-blade'));assert.deepEqual(s.growth.arts.equipped,[]);assert.equal(s.growth.arts.talents['immortal-0-0'],3);assert.equal(growthEffects(s).damage,0);run(s,'choosePath','immortal');run(s,'talentReset');assert.deepEqual(s.growth.arts.talents,{});
});
test('三个神通位封顶，自动条件与冷却保存，破甲神通实际削弱敌方护甲',()=>{
  const s=rich(2);for(const id of ['cloud-blade','clear-rain','gather-spirit','armor-cut']){refill(s);run(s,'artLearn',id);}for(const id of ['cloud-blade','clear-rain','gather-spirit'])run(s,'artEquip',id);unchanged(s,'artEquip','armor-cut');run(s,'artCondition','cloud-blade|boss');unchanged(s,'artCondition','cloud-blade|wrong');
  refill(s);run(s,'dungeonEnter','dungeon-2-4');assert.equal(chooseGrowthSkill(s,attributes(s)),null);s.pending=null;s.expedition.run!.node=4;s.expedition.run!.phase='ready';run(s,'dungeonNext');const hp=battle(s).hp;run(s,'growthSkill','cloud-blade');assert.ok(battle(s).hp<hp);assert.equal(battle(s).arts?.cooldowns['cloud-blade'],3);assert.equal(battle(s).arts?.breakArmor,2);unchanged(s,'growthSkill','cloud-blade');assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);run(s,'guard');run(s,'guard');run(s,'guard');assert.equal(battle(s).arts?.cooldowns['cloud-blade'],0);
});
test('自动战斗按条件选择防御神通，燃血不能自杀，回灵不在满状态消耗回合',()=>{
  const s=rich(2,'demon');run(s,'artLearn','ember-guard');run(s,'artEquip','ember-guard');refill(s);run(s,'dungeonEnter','dungeon-2-4');s.pending=null;s.expedition.run!.node=4;s.expedition.run!.phase='ready';run(s,'dungeonNext');battle(s).round=2;s.expedition.auto.battle=true;assert.deepEqual(dungeonAutoAction(s,attributes),{action:'growthSkill',payload:'ember-guard'});run(s,'growthSkill','ember-guard');assert.ok(battle(s).shield>0);
  run(s,'dungeonLeave');refill(s);run(s,'artLearn','blood-edge');run(s,'artEquip','blood-edge');run(s,'dungeonEnter','dungeon-2-4');s.hp=1;unchanged(s,'growthSkill','blood-edge');
});
test('药园按游戏日生长，三种培育产物不同，收获不可重复、不可越级种植',()=>{
  for(const mode of ['yield','quality','rare']){const s=rich(2);run(s,'estateUpgrade','garden');refill(s);run(s,'estateUpgrade','garden');const day=s.day;run(s,'gardenPlant','0|moon|'+mode);const p=s.growth.estate.plots[0]!;assert.equal(p.ready,day+5+(mode==='quality'?2:mode==='rare'?3:0));unchanged(s,'gardenPlant','0|dew|yield');unchanged(s,'gardenHarvest','0');while(s.day<p.ready){refill(s);run(s,'growthGather','timber');}const leaf=s.growth.inventory.moonleaf,jade=s.growth.inventory.jade;run(s,'gardenHarvest','0');assert.ok(s.growth.inventory.moonleaf>leaf);if(mode==='quality')assert.ok(s.growth.inventory.jade>jade);unchanged(s,'gardenHarvest','0');}
  const fresh=createGame();unchanged(fresh,'gardenPlant','0|fire|yield');unchanged(fresh,'gardenPlant','1|dew|yield');unchanged(fresh,'gardenPlant','0|dew|rare');
});
test('灵脉提升修炼收益，建筑按境界封顶，不靠升级或切换恢复气血灵力',()=>{
  const s=createGame();s.stones=10000;s.growth.inventory.timber=100;s.hp=40;const rate=cultivationRate(s);run(s,'estateUpgrade','vein');assert.equal(cultivationRate(s),rate*1.02);assert.equal(s.hp,40);unchanged(s,'estateUpgrade','vein');
});
test('四艺用实际制作升级，最多精修两门，转换保留熟练度与配方',()=>{
  const s=rich(2);for(let i=0;i<3;i++){refill(s);run(s,'craftMake','pill-qi');}assert.equal(s.growth.crafts.xp.alchemy,30);assert.equal(professionLevel(s,'alchemy'),1);run(s,'professionChoose','alchemy');run(s,'professionChoose','smith');unchanged(s,'professionChoose','array');s.growth.crafts.xp.alchemy=300;run(s,'recipeLearn','pill-tonic');const recipes=[...s.growth.crafts.recipes];run(s,'professionReset');assert.equal(s.growth.crafts.xp.alchemy,300);assert.equal(professionLevel(s,'alchemy'),3);assert.deepEqual(s.growth.crafts.recipes,recipes);run(s,'professionChoose','alchemy');assert.equal(professionLevel(s,'alchemy'),10);
});
test('十二配方均产真实物品，炼器能指定锻造未拥有装备，重复和缺料不扣费',()=>{
  for(const r of RECIPES){const s=rich(2);run(s,'professionChoose',r.profession);s.growth.crafts.xp[r.profession]=300;s.growth.estate.alchemy=1;s.growth.estate.forge=1;if(r.level)run(s,'recipeLearn',r.id);const before=structuredClone(s);refill(s);run(s,'craftMake',r.id);if(r.output==='dust')assert.equal(s.dust,before.dust+r.amount-r.dust);else if(r.output==='shards')assert.equal(s.reforge.shards,before.reforge.shards+r.amount);else if(['qi','heal','focus'].includes(r.output))assert.equal(s.items[r.output],before.items[r.output]+r.amount);else assert.ok(s.growth.inventory[r.output as GrowthMaterial]>=before.growth.inventory[r.output as GrowthMaterial]+r.amount-(r.materials[r.output as GrowthMaterial]||0));}
  const s=rich(2);run(s,'professionChoose','smith');s.growth.crafts.xp.smith=150;s.growth.estate.forge=1;const target=EQUIPMENT.find(i=>i.realm===1)!;run(s,'craftGear',target.id);assert.equal(s.gear[target.id],0);unchanged(s,'craftGear',target.id);unchanged(s,'craftGear',EQUIPMENT.find(i=>i.realm===3)!.id);
});
test('符箓消耗真实库存、占用回合且每场两张；净瘴和护盾真实生效',()=>{
  const s=rich(4);run(s,'dungeonEnter','dungeon-4-1');const initial=s.growth.inventory.wardCharm;run(s,'growthCharm','wardCharm');assert.equal(s.growth.inventory.wardCharm,initial-1);assert.equal(battle(s).arts?.talismans,1);assert.ok(battle(s).shield>0);run(s,'growthCharm','cleanseCharm');assert.equal(battle(s).arts?.cleanse,2);unchanged(s,'growthCharm','boltCharm');
});
test('战前准备只消耗一次，整轮生效、结束或撤离清除，不能叠加准备',()=>{
  const s=rich(1);const inventory=s.growth.inventory.swordArray;run(s,'growthPrepare','swordArray');assert.equal(s.growth.inventory.swordArray,inventory-1);unchanged(s,'growthPrepare','wardArray');run(s,'dungeonEnter','dungeon-1-0');assert.equal(s.growth.prepared,null);assert.equal(s.growth.activePreparation,'swordArray');unchanged(s,'growthPrepare','tonic');run(s,'dungeonLeave');assert.equal(s.growth.activePreparation,null);run(s,'growthPrepare','wardArray');win(s);assert.equal(s.growth.activePreparation,null);assert.equal(s.growth.inventory.wardArray,9999);
});
test('五种灵兽可孵化培养、两次进化，单只出战且切换不治疗',()=>{
  const s=rich(8);for(const p of PETS){refill(s);run(s,'petHatch',p.id);}assert.equal(Object.keys(s.growth.pets.owned).length,5);const pet=s.growth.pets.owned.tiger;while(pet.level<8){refill(s);run(s,'petTrain','tiger');}for(let n=0;n<4;n++){refill(s);run(s,'petFeed','tiger');}refill(s);run(s,'petEvolve','tiger');assert.equal(pet.evolution,1);while(pet.level<16){refill(s);run(s,'petTrain','tiger');}for(let n=0;n<4;n++){refill(s);run(s,'petFeed','tiger');}refill(s);run(s,'petEvolve','tiger');assert.equal(pet.evolution,2);unchanged(s,'petEvolve','tiger');s.hp=50;run(s,'petEquip','tiger');run(s,'petEquip','crane');assert.equal(s.hp,50);assert.equal(s.growth.pets.active,'crane');run(s,'petSkill','crane|guard');assert.equal(s.growth.pets.owned.crane.skill,'guard');
});
test('灵兽协同每三轮真实触发，五种天赋与护主模式均可保存恢复',()=>{
  for(const p of PETS){const s=rich(4);run(s,'petHatch',p.id);run(s,'petEquip',p.id);refill(s);run(s,'dungeonEnter','dungeon-4-4');s.hp=Math.floor(attributes(s).maxHp*.6);for(let n=0;n<3;n++)run(s,'guard');assert.equal(battle(s).arts?.round,3);assert.ok(battle(s).turns.some(t=>t.includes(p.forms[0])));assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);}
});
test('炼体神识共用点数，重置仅返还点数，属性降低会裁剪但不会治疗',()=>{
  const s=rich(1),base=attributes(s);for(let i=0;i<trainingBudget(s);i++){refill(s);run(s,'trainingRaise','body');}assert.equal(attributes(s).maxHp,base.maxHp+trainingBudget(s)*8);assert.equal(attributes(s).defense,base.defense+Math.floor(trainingBudget(s)/2));unchanged(s,'trainingRaise','spirit');s.hp=100;run(s,'trainingReset');assert.equal(s.hp,100);assert.equal(s.growth.training.body,0);refill(s);run(s,'trainingRaise','spirit');assert.equal(attributes(s).maxEnergy,base.maxEnergy+3);assert.ok(growthEffects(s).damage>0);
});
test('宗门声望、身份、设施与师承保留，讨伐按境界累计，传承神通需内门贡献',()=>{
  const s=rich(2);run(s,'sectJoin','cloud');run(s,'sectMentor','cloud-craft');for(let i=0;i<4;i++){refill(s);run(s,'mentorVisit');}assert.equal(s.growth.sect.favor['cloud-craft'],20);run(s,'sectTask');growthBossReward(s,1);assert.equal(s.growth.sect.task?.progress,0);for(let n=0;n<3;n++)growthBossReward(s,2);run(s,'sectClaim');assert.equal(s.growth.sect.reputation,60);for(let n=0;n<10;n++){refill(s);run(s,'sectDonate','herb');}run(s,'sectPromote');assert.equal(s.growth.sect.rank,1);run(s,'artLearn','sect-cloud');run(s,'sectFacility','archive');assert.ok(growthEffects(s).cultivation>0);run(s,'sectJoin','pill');assert.equal(s.growth.sect.rank,0);assert.equal(s.growth.sect.mentor,null);assert.equal(s.growth.sect.favor['cloud-craft'],20);assert.ok(s.growth.arts.learned.includes('sect-cloud'));run(s,'sectJoin','cloud');run(s,'sectMentor','cloud-craft');assert.equal(s.growth.sect.favor['cloud-craft'],20);
});
test('27段道心经历只能选择一次，六种命格有真实条件，最多三枚且条件不足休眠',()=>{
  const s=rich(8);for(let realm=0;realm<9;realm++)for(let index=0;index<3;index++){refill(s);run(s,'fateChoose',`story-${realm}-${index}|${['vow','seek','valor'][index]}`);}assert.deepEqual(fateCounts(s),{vow:9,seek:9,valor:9});unchanged(s,'fateChoose','story-0-0|valor');for(const id of ['promise','seeker','victor'])run(s,'fateEquip',id);assert.ok(growthEffects(s).shield>=.06);assert.ok(growthEffects(s).cultivation>=.05);s.expedition.clears['dungeon-8-0']=10;unchanged(s,'fateEquip','traveler');run(s,'fateEquip','victor');run(s,'fateEquip','traveler');assert.equal(growthEffects(s).loot,.08);
  run(s,'petHatch','tiger');s.growth.pets.owned.tiger.bond=60;run(s,'petEquip','tiger');run(s,'sectJoin','cloud');run(s,'sectMentor','cloud-beast');s.growth.sect.favor['cloud-beast']=60;run(s,'fateEquip','traveler');run(s,'fateEquip','companion');run(s,'petEquip','none');assert.ok(s.growth.fate.equipped.includes('companion'));assert.ok(!activeFates(s).includes('companion'));
});
test('精英与噩梦逐级解锁，固定怪物与奖励增强，普通真印不会重复计入',()=>{
  const s=rich(2),base=findDungeon('dungeon-2-0')!,elite=findDungeon(base.id+'@1')!,nightmare=findDungeon(base.id+'@2')!;unchanged(s,'dungeonEnter',elite.id);win(s,base.id);unchanged(s,'dungeonEnter',nightmare.id);const before=s.growth.inventory.jade;win(s,elite.id);assert.ok(s.growth.inventory.jade>=before+8);assert.equal(dungeonEnemy(elite,4).hp,Math.round(dungeonEnemy(base,4).hp*2.4));assert.ok(dungeonEnemy(nightmare,4).hp>dungeonEnemy(elite,4).hp);run(s,'dungeonEnter',nightmare.id);assert.equal(battle(s).maxHp,dungeonEnemy(nightmare,0).hp);run(s,'dungeonLeave');assert.equal(Object.keys(s.expedition.clears).length,2);
});
test('所有养成在历练与自动刷本中禁止更改，避免换装和上限治疗漏洞',()=>{
  const s=rich();run(s,'dungeonAutoStart','dungeon-7-0|5');for(const action of ['growthGather','growthBuy','natalBind','artEquip','estateUpgrade','gardenPlant','craftMake','petEquip','trainingRaise','sectJoin','fateEquip'])unchanged(s,action,'invalid');run(s,'dungeonLeave');assert.equal(s.growth.activePreparation,null);
});
test('存档拒绝超额天赋、伪造材料、神通、时间、进化、关系与命格配置',()=>{
  const s=rich(2);for(const mutation of [(t:GameState)=>{t.growth.inventory.jade=-1;},(t:GameState)=>{t.growth.natal.id='missing';},(t:GameState)=>{t.growth.arts.talents['immortal-0-1']=1;},(t:GameState)=>{t.growth.arts.equipped=['not-art'];},(t:GameState)=>{t.growth.estate.plots[0]={plant:'moon',mode:'yield',planted:1,ready:99};},(t:GameState)=>{t.growth.crafts.primary=['smith','array','alchemy'];},(t:GameState)=>{t.growth.pets.owned.tiger={level:1,bond:0,evolution:2,skill:'instinct'};},(t:GameState)=>{t.growth.training.body=99;},(t:GameState)=>{t.growth.sect.favor.ghost=100;},(t:GameState)=>{t.growth.fate.equipped=['promise','promise'];},(t:GameState)=>{t.growth.fate.choices['story-8-0']='vow';},(t:GameState)=>{t.growth.activePreparation='tonic';}]){const t=structuredClone(s);mutation(t);assert.throws(()=>validateSave(t));}
});
test('宗门三部传承功法受内门身份限制，占十卷兼修，离宗与改道保留重数效果',()=>{
  for(const id of ['cloud','pill','beast']){const s=rich(2),book=`sect-${id}-book`;unchanged(s,'study',book);run(s,'sectJoin',id);s.growth.sect.merit=200;s.growth.sect.reputation=200;run(s,'sectPromote');run(s,'study',book);assert.equal(s.books[book],1);assert.ok(s.activeBooks.includes(book));run(s,'sectLeave');refill(s);run(s,'study',book);run(s,'choosePath','demon');assert.equal(s.books[book],2);assert.ok(s.activeBooks.includes(book));}
});
test('炼体六点守心真实反震，神识十二点降低法宝耗灵并缩短冷却',()=>{
  const s=rich(7);s.growth.training.body=6;refill(s);run(s,'dungeonEnter','dungeon-7-4');const hp=battle(s).hp;run(s,'guard');assert.ok(battle(s).hp<hp);assert.ok(battle(s).turns.some(t=>t.includes('体魄反震')));run(s,'dungeonLeave');s.growth.training.body=0;s.growth.training.spirit=12;s.equipped.armor=null;s.equipped.charm=null;refill(s);run(s,'dungeonEnter','dungeon-7-4');s.pending=null;s.expedition.run!.node=4;s.expedition.run!.phase='ready';run(s,'dungeonNext');const energy=s.energy,artifact=ARTIFACTS.find(a=>a.id===s.equipped.artifact)!;run(s,'artifactSkill');assert.equal(s.energy,energy-artifact.cost+3);assert.equal(battle(s).artifactCooldown,2);
});
test('养元灵液真实增强营地治疗，一次准备不会变成永久属性',()=>{
  const s=rich(2);run(s,'growthPrepare','tonic');run(s,'dungeonEnter','dungeon-2-0');s.pending=null;s.expedition.run!.node=3;s.expedition.run!.phase='camp';s.hp=1;const max=attributes(s).maxHp;run(s,'dungeonCamp','heal');assert.equal(s.hp,1+Math.round(max*1.2*.55));run(s,'dungeonLeave');assert.equal(growthEffects(s).healing,0);
});

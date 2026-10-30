import { ARTIFACTS, EQUIPMENT } from './content.js';
import { ART_SKILLS, AUTO_CONDITIONS, BUILDINGS, FATES, MATERIALS, MENTORS, PETS, PLANTS, PROFESSIONS, RECIPES, SECTS, TALENTS } from './growth-content.js';
import { REALMS } from './realms.js';
import type { ActionResult, AutoCondition, Bonus, GameState, GrowthMaterial, GrowthState, PathId, Profession } from './types.js';

const materials=Object.keys(MATERIALS) as GrowthMaterial[],professions=Object.keys(PROFESSIONS) as Profession[];
export const GROWTH_ACTIONS=['growthGather','growthBuy','natalBind','natalBond','natalSpirit','natalBranch','natalTrial','talentLearn','talentReset','artLearn','artEquip','artCondition','estateUpgrade','gardenPlant','gardenHarvest','professionChoose','professionReset','recipeLearn','craftMake','craftGear','growthPrepare','petHatch','petFeed','petTrain','petEvolve','petEquip','petSkill','trainingRaise','trainingReset','sectJoin','sectLeave','sectPromote','sectMentor','mentorVisit','sectTask','sectClaim','sectDonate','sectFacility','fateChoose','fateEquip'];
export function createGrowth():GrowthState{return {
  inventory:Object.fromEntries(materials.map(k=>[k,({jade:6,timber:8,ore:8,seed:3} as Partial<Record<GrowthMaterial,number>>)[k]||0])) as GrowthState['inventory'],
  natal:{id:null,bond:0,spirit:0,branch:null,trials:0,trial:null},arts:{talents:{},learned:[],equipped:[],conditions:{}},
  estate:{vein:0,garden:0,alchemy:0,forge:0,plots:[null,null,null,null]},crafts:{xp:{alchemy:0,smith:0,talisman:0,array:0},primary:[],recipes:RECIPES.filter(r=>!r.level).map(r=>r.id)},
  pets:{owned:{},active:null},training:{body:0,spirit:0},sect:{id:null,rank:0,merit:0,reputation:0,mentor:null,favor:{},task:null,facilities:{}},fate:{choices:{},equipped:[]},prepared:null,activePreparation:null
};}
export interface GrowthCost {stones?:number;energy?:number;days?:number;herbs?:number;dust?:number;materials?:Partial<Record<GrowthMaterial,number>>}
export function growthCostText(c:GrowthCost){return [...[[c.stones,'灵石'],[c.energy,'灵力'],[c.herbs,'凝露草'],[c.dust,'灵砂']],...Object.entries(c.materials||{}).map(([k,n])=>[n,MATERIALS[k as GrowthMaterial]])].filter(([n])=>Number(n)>0).map(([n,k])=>`${n} ${k}`).join(' · ')+(c.days?` · ${c.days} 日`:'');}
export function canPayGrowth(s:GameState,c:GrowthCost){return s.stones>=(c.stones||0)&&s.energy>=(c.energy||0)&&s.items.herb>=(c.herbs||0)&&s.dust>=(c.dust||0)&&Object.entries(c.materials||{}).every(([k,n])=>s.growth.inventory[k as GrowthMaterial]>=(n||0));}
function pay(s:GameState,c:GrowthCost){s.stones-=c.stones||0;s.energy-=c.energy||0;s.items.herb-=c.herbs||0;s.dust-=c.dust||0;s.day+=c.days||0;for(const [k,n]of Object.entries(c.materials||{}))s.growth.inventory[k as GrowthMaterial]-=n||0;}
export function gainGrowth(s:GameState,id:GrowthMaterial,n:number){const amount=Math.max(0,Math.min(n,1000000-s.growth.inventory[id]));s.growth.inventory[id]+=amount;return amount;}
export function talentBudget(s:GameState){return Math.min(20,2+s.realm*2+(s.stage>=2?1:0));}
export function spentTalents(s:GameState,path:PathId|null=s.path){return TALENTS.filter(t=>t.path===path).reduce((n,t)=>n+(s.growth.arts.talents[t.id]||0),0);}
export function trainingBudget(s:GameState){return s.realm<1?0:Math.min(18,4+s.realm*2);}
export function professionLevel(s:GameState,p:Profession){return Math.min(s.growth.crafts.primary.includes(p)?10:3,Math.floor(s.growth.crafts.xp[p]/30));}
export function natalCap(s:GameState){return Math.min(20,6+s.realm*2);}
export function petCap(s:GameState){return Math.min(20,4+s.realm*2);}
export function buildingCost(s:GameState,id:string):GrowthCost {const b=BUILDINGS.find(b=>b.id===id);const level=b?s.growth.estate[b.id]:0;return {stones:60*(level+1)**2,energy:10,days:1,materials:{timber:6+level*4,ore:level*2}};}
export function growthPrices(s:GameState){return [{id:'seed',price:15,realm:0},{id:'timber',price:12,realm:0},{id:'ore',price:15,realm:0},{id:'moonleaf',price:35,realm:1},{id:'firefruit',price:60,realm:2},{id:'egg',price:50,realm:1}] as const;}
export function fateCounts(s:GameState){const result={vow:0,seek:0,valor:0};for(const v of Object.values(s.growth.fate.choices))result[v]++;return result;}
export function fateUnlocked(s:GameState,id:string){const g=s.growth,c=fateCounts(s);switch(id){case'promise':return c.vow>=3;case'seeker':return c.seek>=3;case'victor':return c.valor>=3;case'traveler':return Object.values(s.expedition.clears).reduce((n,v)=>n+v,0)>=10;case'artisan':return professions.reduce((n,p)=>n+professionLevel(s,p),0)>=12;case'companion':return !!g.pets.active&&g.pets.owned[g.pets.active].bond>=60&&!!g.sect.mentor&&(g.sect.favor[g.sect.mentor]||0)>=60;default:return false;}}
export function activeFates(s:GameState){return s.growth.fate.equipped.filter(id=>fateUnlocked(s,id));}
export function growthEffects(s:GameState){
  const g=s.growth,flat:Bonus={attack:0,defense:0,hp:0,energy:0};let damage=0,cultivation=g.estate.vein*.02,shield=0,healing=0,drain=0,petPower=0,skill=0;
  flat.hp+=g.training.body*8;flat.defense+=Math.floor(g.training.body/2);flat.energy+=g.training.spirit*3;damage+=g.training.spirit*.008;
  for(const t of TALENTS.filter(t=>t.path===s.path)){const n=g.arts.talents[t.id]||0;if(t.effect==='sword'){damage+=n*.01;if(t.tier)skill+=n*.02;}else if(t.effect==='ward')shield+=n*.01;else{healing+=n*.02;if(s.path==='demon')drain+=n*.003;}}
  const f=activeFates(s);if(f.includes('promise'))shield+=.06;if(f.includes('seeker'))cultivation+=.05;if(f.includes('companion'))petPower+=.15;
  const mentor=MENTORS.find(m=>m.id===g.sect.mentor),favor=mentor?(g.sect.favor[mentor.id]||0):0;
  if(favor>=20){if(mentor?.style==='sword')shield+=.05;if(mentor?.style==='beast')petPower+=.15;}
  if(g.sect.id){cultivation+=(g.sect.facilities[g.sect.id+'-archive']||0)*.02;petPower+=(g.sect.facilities[g.sect.id+'-beastHall']||0)*.05;}
  const natal=g.natal.id&&g.natal.id===s.equipped.artifact?g.natal:null;
  if(natal){damage+=natal.bond*.002+natal.spirit*.01;if(natal.branch==='ward')shield+=.08;}
  if(g.activePreparation==='swordArray')damage+=.08;if(g.activePreparation==='tonic')healing+=.2;
  for(const k of ['attack','defense','hp','energy'] as const)flat[k]=Math.min(flat[k],({attack:12,defense:6,hp:60,energy:20}[k])*(s.realm+1));
  return {flat,damage:Math.min(.3,damage),cultivation:Math.min(.2,cultivation),shield:Math.min(.2,shield),healing:Math.min(.35,healing),drain:Math.min(.04,drain),petPower:Math.min(.35,petPower),skill:Math.min(.12,skill),bossDamage:f.includes('victor')?.05:0,loot:f.includes('traveler')?.08:0};
}
export function growthArtifactCost(s:GameState,cost:number){return Math.max(1,cost-(s.growth.training.spirit>=6?Math.min(5,2+Math.floor((s.growth.training.spirit-6)/4)):0));}
export function craftExperience(s:GameState,p:Profession){const g=s.growth,m=MENTORS.find(m=>m.id===g.sect.mentor),favor=m?(g.sect.favor[m.id]||0):0;const factor=1+(m?.style==='craft'&&favor>=20?.2:0)+(activeFates(s).includes('artisan')?.15:0);return Math.round((10+(p==='alchemy'?g.estate.alchemy:p==='smith'?g.estate.forge:0)+(g.sect.facilities[(g.sect.id||'')+'-workshop']||0))*factor);}
const ok=(message:string):ActionResult=>({ok:true,message}),fail=(message:string):ActionResult=>({ok:false,message});
export function actGrowth(s:GameState,action:string,payload:string):ActionResult{
  const g=s.growth,n=g.natal,sect=g.sect;
  if(s.pending||s.expedition.run||s.expedition.auto.repeat)return fail('请先结束或停止当前历练，再进行养成。');
  const purchase=(c:GrowthCost,apply:()=>void,message:string)=>{if(!canPayGrowth(s,c))return fail('需要 '+growthCostText(c));pay(s,c);apply();return ok(message);};
  switch(action){
    case'growthGather':{
      if(!['timber','ore','jade'].includes(payload))return fail('请选择有效采集目标。');
      const id=payload as GrowthMaterial;if(g.inventory[id]>=1000000)return fail('此材料已满。');const amount=payload==='timber'?2+s.realm:2+Math.floor(s.realm/2);
      return purchase({energy:10,days:1},()=>gainGrowth(s,id,amount),`${MATERIALS[id]} +${amount}`);
    }
    case'growthBuy':{const [id,count]=payload.split('|'),item=growthPrices(s).find(i=>i.id===id),amount=Number(count);if(!item||![1,10].includes(amount)||s.realm<item.realm)return fail('物品或境界不符。');if(g.inventory[item.id]+amount>1000000)return fail('材料已满。');return purchase({stones:item.price*amount},()=>gainGrowth(s,item.id,amount),`${MATERIALS[item.id]} +${amount}`);}
    case'natalBind':{
      const item=ARTIFACTS.find(a=>a.id===payload);if(s.realm<1)return fail('筑基后可以认主本命法宝。');if(!item||!Object.hasOwn(s.artifacts,item.id)||item.realm>s.realm)return fail('请先拥有可驾驭的法宝。');if(n.id===payload)return fail('此宝已认主。');
      const transfer=!!n.id;return purchase({stones:transfer?100*(s.realm+1):80,energy:12,days:1,materials:{jade:transfer?12:4}},()=>{n.id=item.id;if(transfer){n.bond=Math.floor(n.bond*.8);n.spirit=Math.floor(n.spirit*.8);}n.trial=null;if(!n.spirit)n.branch=null;},`${item.name}已认主${transfer?'，保留80%契合与器灵等级，试炼完成记录保留':'，可培养契合、唤醒器灵'}`);
    }
    case'natalBond':if(!n.id)return fail('请先认主本命法宝。');if(n.bond>=natalCap(s))return fail('当前境界契合已满。');return purchase({stones:20*(n.bond+1),energy:10,days:1,materials:{jade:2+Math.floor(n.bond/4)}},()=>n.bond++,'本命契合 +1');
    case'natalSpirit':if(!n.id||n.bond<5)return fail('认主且契合达到5后可唤醒器灵。');if(n.spirit>=5||n.spirit>n.trials)return fail('先完成下一重器灵试炼，器灵最多五级。');return purchase({stones:120*(n.spirit+1),energy:15,days:1,materials:{jade:8+n.spirit*4,firefruit:n.spirit>=2?2:0}},()=>n.spirit++,'器灵升华一级，觉醒分支可选');
    case'natalBranch':if(!n.id||!n.spirit||!['pierce','echo','ward'].includes(payload)||n.branch===payload)return fail('器灵唤醒后可选择不同的觉醒分支。');return purchase({stones:50,materials:{jade:3}},()=>{n.branch=payload as typeof n.branch;},'已转换器灵觉醒：'+({pierce:'破甲，法宝攻击忽略更多护甲',echo:'追击，法宝伤害提高12%',ward:'护主，开战护盾8%'}[payload]));
    case'natalTrial':{
      if(!n.id||n.trial||n.trials>=4||n.bond<5+4*n.trials||s.realm<Math.min(7,1+n.trials*2))return fail('试炼需足够契合与境界，每重条件见器灵试炼。');
      n.trial={realm:s.realm,bosses:0};return ok(`器灵试炼已开启：装备本命法宝，击败${2+n.trials}名${REALMS[s.realm]}及以上首领。`);
    }
    case'talentLearn':{
      const t=TALENTS.find(t=>t.id===payload);if(!t||t.path!==s.path||s.realm<t.realm)return fail('天赋路径或境界不符。');const level=g.arts.talents[t.id]||0;
      if(level>=3||spentTalents(s)>=talentBudget(s))return fail('天赋已满或可用点数不足。');if(t.tier&&(g.arts.talents[t.id.slice(0,-1)+(t.tier-1)]||0)<3)return fail('同分支前一节点须达到三点。');
      return purchase({stones:30*(s.realm+1),energy:8,days:1,materials:{jade:2+level}},()=>g.arts.talents[t.id]=level+1,`${t.name} · 第${level+1}点`);
    }
    case'talentReset':if(!s.path||!spentTalents(s))return fail('当前路径没有已分配天赋。');return purchase({stones:100,materials:{jade:5}},()=>{for(const t of TALENTS.filter(t=>t.path===s.path))delete g.arts.talents[t.id];},'当前路径天赋已重置，点数返还；神通与其他路径保留');
    case'artLearn':{
      const skill=ART_SKILLS.find(a=>a.id===payload);if(!skill||skill.realm>s.realm||skill.path&&skill.path!==s.path||g.arts.learned.includes(payload))return fail('神通已学或境界、路径不符。');
      if(skill.sect&&(sect.id!==skill.sect||sect.rank<1||sect.merit<120))return fail('宗门传承需要对应宗门内门身份与120贡献。');
      return purchase({stones:60*(skill.realm+1),energy:12,days:1,materials:{jade:4+skill.realm*2}},()=>{g.arts.learned.push(payload);g.arts.conditions[payload]=skill.auto;if(skill.sect)sect.merit-=120;},`已领悟${skill.name}，可装入三个神通位`);
    }
    case'artEquip':{
      const skill=ART_SKILLS.find(a=>a.id===payload);if(!skill||!g.arts.learned.includes(payload)||skill.path&&skill.path!==s.path)return fail('未学此神通或路径不符。');
      if(g.arts.equipped.includes(payload)){g.arts.equipped=g.arts.equipped.filter(id=>id!==payload);return ok('神通已卸下，领悟保留');}if(g.arts.equipped.length>=3)return fail('最多配置三个神通，请先卸下一个。');g.arts.equipped.push(payload);return ok('神通已纳入战斗配置');
    }
    case'artCondition':{const [id,condition]=payload.split('|');if(!g.arts.learned.includes(id)||!Object.hasOwn(AUTO_CONDITIONS,condition))return fail('请选择已学神通与有效条件。');g.arts.conditions[id]=condition as AutoCondition;return ok('已更新自动施展条件');}
    case'estateUpgrade':{const b=BUILDINGS.find(b=>b.id===payload);if(!b||g.estate[b.id]>=Math.min(b.max,s.realm+1))return fail('建筑已达当前境界上限。');return purchase(buildingCost(s,payload),()=>g.estate[b.id]++,`${b.name}升至${g.estate[b.id]+1}级`);}
    case'gardenPlant':{
      const [slot,id,mode]=payload.split('|'),index=Number(slot),plant=PLANTS.find(p=>p.id===id);if(!Number.isInteger(index)||index<0||index>g.estate.garden||index>3||g.estate.plots[index]||!plant||plant.realm>s.realm||!['yield','quality','rare'].includes(mode))return fail('药田、灵种或培养方式不符。');if(mode==='rare'&&g.estate.garden<2)return fail('药园二级后可探索变种。');const days=plant.days+(mode==='quality'?2:mode==='rare'?3:0);
      return purchase({stones:10,materials:{seed:1}},()=>{g.estate.plots[index]={plant:id,mode:mode as 'yield'|'quality'|'rare',planted:s.day,ready:s.day+days};},`${plant.name}已种下，${days}个游戏日后成熟`);
    }
    case'gardenHarvest':{
      const index=Number(payload),plot=g.estate.plots[index];if(!Number.isInteger(index)||index<0||index>3||!plot||s.day<plot.ready)return fail('药田为空或尚未成熟。');const plant=PLANTS.find(p=>p.id===plot.plant)!,amount=plant.amount+(plot.mode==='yield'?g.estate.garden+2:0);
      if(plant.material==='herb')s.items.herb=Math.min(1000000,s.items.herb+amount);else gainGrowth(s,plant.material,amount);
      let extra='';if(plot.mode==='quality'){const n=1+Math.floor(g.estate.garden/2);gainGrowth(s,'jade',n);extra+=`，灵玉 +${n}`;}if(plot.mode==='rare'){gainGrowth(s,'moonleaf',2);if(s.realm>=2)gainGrowth(s,'firefruit',1);extra+='，额外月华叶 ×2'+(s.realm>=2?'、赤焰果 ×1':'');}g.estate.plots[index]=null;return ok(`收获${plant.name} ×${amount}${extra}`);
    }
    case'professionChoose':if(!professions.includes(payload as Profession)||g.crafts.primary.includes(payload as Profession)||g.crafts.primary.length>=2)return fail('最多精修两艺，其他门类保留基础能力。');g.crafts.primary.push(payload as Profession);return ok('已精修'+PROFESSIONS[payload as Profession]+'，等级上限提升至10');
    case'professionReset':if(!g.crafts.primary.length)return fail('当前尚未选择精修。');return purchase({stones:100,materials:{jade:10}},()=>g.crafts.primary=[],'精修选择已重置，熟练度与配方全部保留');
    case'recipeLearn':{const r=RECIPES.find(r=>r.id===payload);if(!r||g.crafts.recipes.includes(payload)||professionLevel(s,r.profession)<r.level)return fail('配方已学或百艺等级不足。');return purchase({stones:30*(r.level+1),materials:{blueprint:1,jade:3}},()=>g.crafts.recipes.push(payload),`已参悟${r.name}`);}
    case'craftMake':{
      const r=RECIPES.find(r=>r.id===payload);if(!r||!g.crafts.recipes.includes(payload)||professionLevel(s,r.profession)<r.level||r.building&&g.estate[r.building]<1)return fail('配方、熟练度或建筑条件不足。');
      return purchase({stones:10*(r.level+1),energy:10,days:1,herbs:r.herbs,dust:r.dust,materials:r.materials},()=>{if(['qi','heal','focus'].includes(r.output))s.items[r.output]=Math.min(1000000,s.items[r.output]+r.amount);else if(r.output==='dust')s.dust=Math.min(10000000,s.dust+r.amount);else if(r.output==='shards')s.reforge.shards=Math.min(10000000,s.reforge.shards+r.amount);else gainGrowth(s,r.output as GrowthMaterial,r.amount);g.crafts.xp[r.profession]=Math.min(300,g.crafts.xp[r.profession]+craftExperience(s,r.profession));},`${r.name}制作成功，获得产物 ×${r.amount}与百艺熟练度`);
    }
    case'craftGear':{
      const item=EQUIPMENT.find(i=>i.id===payload);if(!item||item.realm>s.realm||Object.hasOwn(s.gear,item.id)||professionLevel(s,'smith')<5||g.estate.forge<1)return fail('需炼器五级、炼器室一级，且目标装备未拥有、境界已达。');return purchase({stones:Math.round(item.price*.6),energy:15,days:2,materials:{ore:12+item.realm*3,jade:5}},()=>{s.gear[item.id]=0;g.crafts.xp.smith=Math.min(300,g.crafts.xp.smith+15);},`已锻造${item.name}`);
    }
    case'growthPrepare':{
      if(!['tonic','swordArray','wardArray','springArray'].includes(payload)||g.prepared||g.inventory[payload as GrowthMaterial]<1)return fail('请选择已有消耗品，且下一轮准备位必须为空。');g.inventory[payload as GrowthMaterial]--;g.prepared=payload as GrowthMaterial;return ok('已布置'+MATERIALS[payload as GrowthMaterial]+'，下一轮入场生效，本轮内不叠加');
    }
    case'petHatch':{const p=PETS.find(p=>p.id===payload);if(s.realm<1||!p||g.pets.owned[p.id])return fail('筑基后可选择未拥有的灵兽孵化。');return purchase({stones:80,energy:12,days:2,materials:{egg:6,jade:4}},()=>g.pets.owned[p.id]={level:1,bond:0,evolution:0,skill:'instinct'},`${p.forms[0]}已破壳，选择出战后参与战斗`);}
    case'petFeed':{const p=g.pets.owned[payload];if(!p||p.bond>=100)return fail('灵兽不存在或亲密已满。');return purchase({herbs:3,energy:5,days:1,materials:{jade:1}},()=>p.bond=Math.min(100,p.bond+10),'灵兽亲密 +10');}
    case'petTrain':{const p=g.pets.owned[payload];if(!p||p.level>=petCap(s))return fail('灵兽不存在或达到当前境界等级上限。');return purchase({stones:25*p.level,energy:10,days:1,materials:{jade:2+Math.floor(p.level/4)}},()=>p.level++,'灵兽等级 +1');}
    case'petEvolve':{const p=g.pets.owned[payload];if(!p||p.evolution>=2||p.level<(p.evolution?16:8)||p.bond<(p.evolution?80:40))return fail('进化需等级8/16、亲密40/80。');return purchase({stones:200*(p.evolution+1),energy:15,days:2,materials:{jade:15*(p.evolution+1),firefruit:3*(p.evolution+1)}},()=>p.evolution++,'灵兽血脉进化，外形与协同能力提升');}
    case'petEquip':if(payload==='none'){g.pets.active=null;return ok('灵兽已回洞府休养');}if(!g.pets.owned[payload])return fail('尚未孵化此灵兽。');g.pets.active=payload;return ok('已选择出战灵兽，同一时间仅一只');
    case'petSkill':{const [id,skill]=payload.split('|'),p=g.pets.owned[id];if(!p||!['instinct','guard'].includes(skill))return fail('请选择已拥有灵兽的有效技能。');p.skill=skill as typeof p.skill;return ok('已切换灵兽协同方式');}
    case'trainingRaise':{
      if(!['body','spirit'].includes(payload)||s.realm<1||g.training.body+g.training.spirit>=trainingBudget(s))return fail('筑基后共用有限修炼点，当前点数不足。');const key=payload as 'body'|'spirit',level=g.training[key];return purchase({stones:40*(level+1),energy:12,days:1,materials:{jade:2+Math.floor(level/3),moonleaf:key==='spirit'&&level>=3?1:0}},()=>g.training[key]++,key==='body'?'体魄 +1：气血与防御成长':'神识 +1：灵力与施法伤害成长');
    }
    case'trainingReset':if(!g.training.body&&!g.training.spirit)return fail('尚未投入修炼点。');return purchase({stones:100,materials:{jade:5}},()=>{g.training.body=0;g.training.spirit=0;},'炼体与神识点数返还，已消耗材料不返还');
    case'sectJoin':{const target=SECTS.find(x=>x.id===payload);if(s.realm<1||!target||sect.id===payload)return fail('筑基后可选择不同宗门。');return purchase({stones:100,energy:10,days:1},()=>{sect.id=target.id;sect.rank=0;sect.mentor=null;sect.task=null;},`已加入${target.name}，贡献、声望与历代师徒关系保留`);}
    case'sectLeave':if(!sect.id)return fail('尚未入宗。');sect.id=null;sect.rank=0;sect.mentor=null;sect.task=null;return ok('已离开宗门，贡献、传承神通和历史关系保留');
    case'sectPromote':{
      const next=sect.rank+1,cost=[0,50,100,200][next];if(!sect.id||next>3||s.realm<[1,2,4,6][next]||sect.reputation<[0,100,300,700][next]||sect.merit<cost)return fail('晋升需对应境界、声望与贡献，条件见宗门面板。');sect.merit-=cost;sect.rank=next;return ok('宗门身份晋升，解锁更高设施与传承');
    }
    case'sectMentor':{const m=MENTORS.find(m=>m.id===payload);if(!m||m.sect!==sect.id||sect.mentor===m.id)return fail('请选择当前宗门的其他师父。');sect.mentor=m.id;sect.favor[m.id]??=0;return ok(`拜入${m.name}门下，已有关系保留`);}
    case'mentorVisit':if(!sect.mentor||(sect.favor[sect.mentor]||0)>=100)return fail('请先拜师，或关系已圆满。');return purchase({stones:20,energy:8,days:1},()=>sect.favor[sect.mentor!]=Math.min(100,(sect.favor[sect.mentor!]||0)+5),'与师父论道，关系 +5');
    case'sectTask':if(!sect.id||sect.task)return fail('需入宗且没有未交付的讨伐委托。');sect.task={realm:s.realm,progress:0};return ok('已接讨伐委托：击败三名接取境界及以上的副本首领');
    case'sectClaim':if(!sect.id||!sect.task||sect.task.progress<3)return fail('讨伐委托尚未完成。');sect.task=null;sect.merit=Math.min(1000000,sect.merit+60);sect.reputation=Math.min(1000000,sect.reputation+60);gainGrowth(s,'jade',6);gainGrowth(s,'blueprint',1);return ok('委托完成：贡献 +60、声望 +60、灵玉 +6、残卷 ×1');
    case'sectDonate':{
      if(!sect.id||!['herb','craft'].includes(payload))return fail('请先入宗并选择委托材料。');const crafting=payload==='craft';return purchase({energy:8,days:1,herbs:crafting?0:8,materials:crafting?{boltCharm:2}:{}},()=>{const n=crafting?30:20;sect.merit=Math.min(1000000,sect.merit+n);sect.reputation=Math.min(1000000,sect.reputation+n);},`交付${crafting?'雷击符':'灵草'}，贡献与声望 +${crafting?30:20}`);
    }
    case'sectFacility':{if(!sect.id||!['archive','workshop','beastHall'].includes(payload))return fail('请选择有效宗门设施。');const key=sect.id+'-'+payload,level=sect.facilities[key]||0,cost=40*(level+1);if(level>=Math.min(3,sect.rank+1)||sect.merit<cost)return fail('身份或贡献不足，设施最多三级。');sect.merit-=cost;sect.facilities[key]=level+1;return ok('宗门设施提升一级');}
    case'fateChoose':{const [id,choice]=payload.split('|'),m=/^story-([0-8])-([0-2])$/.exec(id);if(!m||Number(m[1])>s.realm||g.fate.choices[id]||!['vow','seek','valor'].includes(choice))return fail('此经历已完成、境界不足或选择无效。');return purchase({stones:10,energy:8,days:1},()=>{g.fate.choices[id]=choice as 'vow'|'seek'|'valor';if(choice==='vow')s.items.herb=Math.min(1000000,s.items.herb+3);if(choice==='seek')gainGrowth(s,'jade',2);if(choice==='valor')gainGrowth(s,'ore',3);},'道心经历已铭记，命格条件随之积累');}
    case'fateEquip':if(!FATES.some(f=>f.id===payload))return fail('命格不存在。');if(g.fate.equipped.includes(payload)){g.fate.equipped=g.fate.equipped.filter(id=>id!==payload);return ok('命格已卸下，经历保留');}if(!fateUnlocked(s,payload)||g.fate.equipped.length>=(s.realm>=4?3:2))return fail('命格条件未达成或生效位置已满。');g.fate.equipped.push(payload);return ok('命格已生效，条件暂不满足时自动休眠');
    default:return fail('未知养成方式。');
  }
}
export function growthBossReward(s:GameState,realm:number,difficulty=0){
  const g=s.growth,jade=gainGrowth(s,'jade',3+realm+difficulty*3),ore=gainGrowth(s,'ore',2+realm),wood=gainGrowth(s,'timber',2+Math.floor(realm/2));gainGrowth(s,'seed',1);gainGrowth(s,'blueprint',1);if(realm>=1)gainGrowth(s,'egg',1+difficulty);
  const n=g.natal;if(n.id&&s.equipped.artifact===n.id){n.bond=Math.min(natalCap(s),n.bond+1);if(n.trial&&realm>=n.trial.realm){n.trial.bosses++;if(n.trial.bosses>=2+n.trials){n.trials++;n.trial=null;}}}
  if(g.sect.task&&realm>=g.sect.task.realm)g.sect.task.progress=Math.min(3,g.sect.task.progress+1);
  if(difficulty>0)gainGrowth(s,'firefruit',difficulty);return `养成灵材：灵玉 +${jade}，玄铁 +${ore}，灵木 +${wood}，灵种 ×1，残卷 ×1${realm>=1?'，灵兽蛋壳 ×'+(1+difficulty):''}。`;
}

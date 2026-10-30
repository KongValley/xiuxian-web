import { ARTIFACTS } from './content.js';
import { ART_SKILLS, AUTO_CONDITIONS, BUILDINGS, FATES, MATERIALS, MENTORS, PETS, PLANTS, PROFESSIONS, RECIPES, SECTS, TALENTS } from './growth-content.js';
import { natalCap, petCap, talentBudget, trainingBudget } from './growth.js';
import type { GameState, GrowthMaterial, PathId } from './types.js';

const integer=(v:unknown,min=0,max=1000000)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function keys(v:unknown,expected:string[]){return object(v)&&Object.keys(v).length===expected.length&&expected.every(k=>Object.hasOwn(v,k));}
function array(v:unknown,allowed:string[],max=allowed.length):v is string[]{return Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length&&v.every(x=>typeof x==='string'&&allowed.includes(x));}
function valid(ok:unknown,message:string):asserts ok {if(!ok)throw new Error(message);}
export function validateGrowth(s:GameState){
  const g=s.growth;
  valid(keys(g,['inventory','natal','arts','estate','crafts','pets','training','sect','fate','prepared','activePreparation']),'养成卷数据无效');
  valid(keys(g.inventory,Object.keys(MATERIALS))&&Object.values(g.inventory).every(v=>integer(v)),'养成材料无效');
  const n=g.natal;valid(keys(n,['id','bond','spirit','branch','trials','trial'])&&integer(n.bond,0,natalCap(s))&&integer(n.spirit,0,5)&&integer(n.trials,0,4)&&n.spirit<=n.trials+1&&[null,'pierce','echo','ward'].includes(n.branch),'本命法宝进度无效');
  valid(n.id===null?n.bond===0&&n.spirit===0&&n.branch===null&&n.trials===0&&n.trial===null:s.realm>=1&&ARTIFACTS.some(a=>a.id===n.id&&a.realm<=s.realm)&&Object.hasOwn(s.artifacts,n.id),'本命法宝拥有记录无效');
  valid(!n.branch||n.spirit>0,'器灵未觉醒');
  if(n.trial)valid(keys(n.trial,['realm','bosses'])&&integer(n.trial.realm,1,s.realm)&&integer(n.trial.bosses,0,1+n.trials)&&n.trials<4&&!!n.id,'器灵试炼记录无效');
  const arts=g.arts;valid(keys(arts,['talents','learned','equipped','conditions'])&&object(arts.talents)&&Object.entries(arts.talents).every(([id,v])=>TALENTS.some(t=>t.id===id&&t.realm<=s.realm)&&integer(v,1,3)),'天赋记录无效');
  for(const path of ['immortal','demon','yao'] as PathId[])valid(TALENTS.filter(t=>t.path===path).reduce((n,t)=>n+(arts.talents[t.id]||0),0)<=talentBudget(s),'天赋点超出上限');
  for(const t of TALENTS)if(arts.talents[t.id]&&t.tier)valid((arts.talents[t.id.slice(0,-1)+(t.tier-1)]||0)===3,'天赋前置不足');
  valid(array(arts.learned,ART_SKILLS.filter(a=>a.realm<=s.realm).map(a=>a.id))&&array(arts.equipped,arts.learned,3)&&arts.equipped.every(id=>{const a=ART_SKILLS.find(a=>a.id===id)!;return !a.path||a.path===s.path;})&&object(arts.conditions)&&Object.keys(arts.conditions).length===arts.learned.length&&Object.entries(arts.conditions).every(([id,c])=>arts.learned.includes(id)&&typeof c==='string'&&Object.hasOwn(AUTO_CONDITIONS,c)),'神通配置无效');
  const estate=g.estate;valid(keys(estate,['vein','garden','alchemy','forge','plots'])&&BUILDINGS.every(b=>integer(estate[b.id],0,Math.min(b.max,s.realm+1)))&&Array.isArray(estate.plots)&&estate.plots.length===4,'洞府建筑无效');
  estate.plots.forEach((p,i)=>{if(!p)return;const plant=PLANTS.find(x=>x.id===p.plant);valid(i<=estate.garden&&keys(p,['plant','mode','planted','ready'])&&plant&&plant.realm<=s.realm&&['yield','quality','rare'].includes(p.mode)&&integer(p.planted,1,s.day)&&integer(p.ready,p.planted,10000010)&&p.ready===p.planted+plant.days+(p.mode==='quality'?2:p.mode==='rare'?3:0)&&(p.mode!=='rare'||estate.garden>=2),'药田记录无效');});
  const c=g.crafts;valid(keys(c,['xp','primary','recipes'])&&keys(c.xp,Object.keys(PROFESSIONS))&&Object.values(c.xp).every(v=>integer(v,0,300))&&array(c.primary,Object.keys(PROFESSIONS),2)&&array(c.recipes,RECIPES.map(r=>r.id))&&RECIPES.filter(r=>!r.level).every(r=>c.recipes.includes(r.id)),'百艺记录无效');
  valid(keys(g.pets,['owned','active'])&&object(g.pets.owned),'灵兽记录无效');
  for(const [id,p]of Object.entries(g.pets.owned))valid(s.realm>=1&&PETS.some(p=>p.id===id)&&keys(p,['level','bond','evolution','skill'])&&integer(p.level,1,petCap(s))&&integer(p.bond,0,100)&&integer(p.evolution,0,2)&&['instinct','guard'].includes(p.skill)&&(p.evolution===0||p.level>=(p.evolution===1?8:16)&&p.bond>=(p.evolution===1?40:80)),'灵兽培养无效');
  valid(g.pets.active===null||Object.hasOwn(g.pets.owned,g.pets.active),'出战灵兽无效');
  valid(keys(g.training,['body','spirit'])&&integer(g.training.body,0,18)&&integer(g.training.spirit,0,18)&&g.training.body+g.training.spirit<=trainingBudget(s),'炼体神识点数无效');
  const sect=g.sect;valid(keys(sect,['id','rank','merit','reputation','mentor','favor','task','facilities'])&&(sect.id===null||s.realm>=1&&SECTS.some(x=>x.id===sect.id))&&integer(sect.rank,0,3)&&integer(sect.merit)&&integer(sect.reputation)&&sect.reputation>=sect.merit&&object(sect.favor)&&Object.entries(sect.favor).every(([id,v])=>MENTORS.some(m=>m.id===id)&&integer(v,0,100)),'宗门进度无效');
  valid(sect.id?sect.rank===0||s.realm>=[1,2,4,6][sect.rank]&&sect.reputation>=[0,100,300,700][sect.rank]:sect.rank===0&&sect.mentor===null&&sect.task===null,'宗门身份无效');
  valid(sect.mentor===null||MENTORS.some(m=>m.id===sect.mentor&&m.sect===sect.id)&&Object.hasOwn(sect.favor,sect.mentor),'师承关系无效');
  if(sect.task)valid(!!sect.id&&keys(sect.task,['realm','progress'])&&integer(sect.task.realm,1,s.realm)&&integer(sect.task.progress,0,3),'宗门讨伐委托无效');
  valid(object(sect.facilities)&&Object.entries(sect.facilities).every(([id,v])=>SECTS.some(x=>['archive','workshop','beastHall'].some(f=>x.id+'-'+f===id))&&integer(v,1,3)),'宗门设施无效');
  valid(keys(g.fate,['choices','equipped'])&&object(g.fate.choices)&&Object.entries(g.fate.choices).every(([id,c])=>{const m=/^story-([0-8])-([0-2])$/.exec(id);return m&&Number(m[1])<=s.realm&&['vow','seek','valor'].includes(c);})&&array(g.fate.equipped,FATES.map(f=>f.id),s.realm>=4?3:2),'道心命格无效');
  const preparations:GrowthMaterial[]=['tonic','swordArray','wardArray','springArray'];valid((g.prepared===null||preparations.includes(g.prepared))&&(g.activePreparation===null||preparations.includes(g.activePreparation)&&!!s.expedition.run),'战前准备无效');
  if(s.pending?.kind==='combat'&&s.pending.arts){const a=s.pending.arts;valid(keys(a,['cooldowns','round','breakArmor','weaken','talismans','cleanse'])&&object(a.cooldowns)&&Object.entries(a.cooldowns).every(([id,v])=>arts.equipped.includes(id)&&integer(v,0,5))&&integer(a.round,0,1000000)&&integer(a.breakArmor,0,3)&&integer(a.weaken,0,2)&&integer(a.talismans,0,2)&&integer(a.cleanse,0,3),'神通战斗状态无效');}
  return g;
}

import { writeFile } from 'node:fs/promises';
import { act, attributes, createGame, validateSave } from '../src/engine.js';
import { ARTIFACTS, EQUIPMENT } from '../src/content.js';
import { BOOKS } from '../src/manuals.js';
import { ART_SKILLS, MATERIALS, TALENTS } from '../src/growth-content.js';
import { natalCap, petCap, talentBudget, trainingBudget } from '../src/growth.js';
import { dungeonAutoAction } from '../src/dungeons.js';
import { REALMS } from '../src/realms.js';
import type { GrowthMaterial, PathId } from '../src/types.js';

export function auditCharacter(realm:number,path:PathId,developed:boolean){
  const s=createGame('百业试道');s.realm=realm;s.stage=realm===8?0:3;s.ended=realm===8;s.path=path;s.stones=100000;s.items.heal=5;s.items.qi=5;
  for(const item of EQUIPMENT.filter(i=>i.realm===realm)){s.gear[item.id]=2;s.equipped[item.slot]=item.id;}
  const artifact=ARTIFACTS.find(a=>a.realm===realm&&a.effect==='blast')!;s.artifacts[artifact.id]=1;s.equipped.artifact=artifact.id;
  for(const b of BOOKS.filter(b=>b.path===path&&b.realm===realm&&((b.effects.attack||0)>0||(b.effects.hp||0)>0)).slice(0,4)){s.books[b.id]=3;s.activeBooks.push(b.id);}
  if(developed){
    const g=s.growth;for(const k of Object.keys(MATERIALS) as GrowthMaterial[])g.inventory[k]=100;
    let points=talentBudget(s);for(const t of TALENTS.filter(t=>t.path===path&&t.realm<=realm)){const n=Math.min(3,points);if(n){g.arts.talents[t.id]=n;points-=n;}}
    const skills=ART_SKILLS.filter(a=>a.path===path&&a.realm<=realm).slice(0,3);if(skills.length<3)skills.push(ART_SKILLS.find(a=>a.id==='gather-spirit')!);g.arts.learned=skills.map(a=>a.id);g.arts.equipped=[...g.arts.learned];for(const a of skills)g.arts.conditions[a.id]=a.auto;
    g.estate.vein=Math.min(5,realm+1);for(let i=0;i<3;i++)g.fate.choices[`story-0-${i}`]='vow';g.fate.equipped=['promise'];
    if(realm>=1){
      g.natal={id:artifact.id,bond:natalCap(s),spirit:Math.min(5,1+Math.floor((realm-1)/2)),branch:'pierce',trials:Math.min(4,Math.floor((realm-1)/2)),trial:null};
      const level=petCap(s),evolution=level>=16?2:level>=8?1:0,id=path==='immortal'?'turtle':path==='demon'?'crane':'tiger';g.pets.owned[id]={level,bond:100,evolution,skill:'instinct'};g.pets.active=id;
      const budget=trainingBudget(s);g.training={body:Math.ceil(budget/2),spirit:Math.floor(budget/2)};
      g.sect.id='cloud';g.sect.mentor='cloud-beast';g.sect.favor['cloud-beast']=60;g.sect.facilities['cloud-archive']=1;
      for(let i=0;i<3;i++)g.fate.choices[`story-1-${i}`]='seek';g.fate.equipped.push('seeker');
      if(realm>=4){for(let i=0;i<3;i++)g.fate.choices[`story-2-${i}`]='valor';g.fate.equipped.push('victor');}
    }
    g.prepared='wardArray';
  }
  s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;validateSave(s);return s;
}
const rows:string[]=[];let total=0;
for(let realm=0;realm<9;realm++){
  const rates:number[]=[];let invalid=0;
  for(const developed of [false,true])for(const difficulty of [1,2]){
    let wins=0,count=0;
    for(const path of ['immortal','demon','yao'] as const)for(let index=0;index<5;index++)for(let sample=0;sample<3;sample++){
      const s=auditCharacter(realm,path,developed),id=`dungeon-${realm}-${index}`;s.expedition.clears[id]=1;if(difficulty===2)s.expedition.clears[id+'@1']=1;
      let seed=23+realm*65537+sample*1023+index*511;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const start=act(s,'dungeonAutoStart',`${id}@${difficulty}|1`,rng);if(!start.ok)throw new Error(start.message);
      for(let step=0;step<700;step++){const next=dungeonAutoAction(s,attributes);if(!next)break;const result=act(s,next.action,next.payload,rng);if(!result.ok)throw new Error(result.message);if(step===699)invalid++;}
      validateSave(s);count++;total++;if(s.expedition.last?.won)wins++;
    }
    rates.push(Math.round(wins/count*100));
  }
  if(invalid)throw new Error('挑战战斗未按边界停止');rows.push(`| ${REALMS[realm]} | ${rates.map(n=>n+'%').join(' | ')} |`);
}
const text=`# 八业养成与挑战数值审核 · v3.0\n\n固定世界数值，共 ${total} 场：九境 × 三途 × 五副本 × 两种养成 × 两档难度 × 三个固定种子。所有场次完成结算与存档校验；失败是难度审核结果，不代表规则测试失败。执行：\`npx tsx scripts/growth-audit.ts\`。\n\n| 境界 | 原养成毕业·精英 | 原养成毕业·噩梦 | 百业成形·精英 | 百业成形·噩梦 |\n|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\n两种角色均为本境圆满（真仙为仙道初成）、同境三件装备+2、爆发法宝+1、四本战斗功法三重，携五枚回春丹与聚气丹；不含灵根、装备洗练和其他同境真印加成，挑战前置视为已经完成。\n\n百业成形角色额外按当前境界分配天赋与炼体神识点、选择三个可达神通及其默认自动条件、培养灵脉；筑基后培养本命法宝、出战灵兽、师承与命格。采用厚土阵图准备。具体、可复现的配置见脚本 \`auditCharacter\`，不会把所有系统无限叠满。\n\n精英怪物气血×2.4、攻击×1.7、护甲×1.4，基础灵石×1.8；噩梦气血×4.5、攻击×2.5、护甲×1.9，基础灵石×3.2。必须先通关普通，才能挑战同本精英；通关精英再解锁噩梦。普通、精英、噩梦分别记录首通与通关次数；只有普通五印参与原同境成就。\n\n新增养成普通属性共用境界上限：攻击12r、防御6r、气血60r、灵力20r（r=境界序号+1）；伤害收益最高30%、修炼20%、开战护盾20%、治疗35%、额外汲血4%、灵兽协同强化35%。护盾取较高值，疗效强化作用于神通、法宝、丹药与营地，不放大原有功法/套装/灵根被动回元。\n\n每场最多配置三项新增神通、使用两张符箓、出战一只灵兽；阵图与灵液共用一个整轮准备位。命格早期两枚，化神后三枚。百艺只可精修两门至10级，其余有效等级最多3，转精修保留熟练度。炼体神识共用最多18点，各路径天赋最多20点。\n`;
await writeFile(new URL('../GROWTH_BALANCE.md',import.meta.url),text);console.log(JSON.stringify({battles:total,rows},null,2));

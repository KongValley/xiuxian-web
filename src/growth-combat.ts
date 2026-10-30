import { ART_SKILLS, PETS } from './growth-content.js';
import { growthEffects } from './growth.js';
import type { ActionResult, Combat, GameState } from './types.js';
type Attributes={maxHp:number;maxEnergy:number;attack:number};
export function battleArts(s:GameState){const e=s.pending as Combat;return e.arts??=( {cooldowns:{},round:0,breakArmor:0,weaken:0,talismans:0,cleanse:0} );}
export function initializeGrowthCombat(s:GameState,a:Attributes){
  if(s.pending?.kind!=='combat')return;
  const g=s.growth,e=s.pending,fx=growthEffects(s);
  if(g.arts.equipped.length||g.pets.active||g.natal.id||g.training.body>=6||g.training.spirit>=6||g.activePreparation||fx.shield){battleArts(s);e.shield=Math.max(e.shield,Math.round(a.maxHp*fx.shield));}
}
export function growthSkill(s:GameState,id:string,a:Attributes):ActionResult&{damage?:number;label?:string}{
  const fail=(message:string)=>({ok:false,message});
  if(s.pending?.kind!=='combat')return fail('神通只能在战斗中施展。');
  const skill=ART_SKILLS.find(a=>a.id===id);if(!skill||!s.growth.arts.equipped.includes(id)||skill.path&&skill.path!==s.path)return fail('此神通未配置或修行路径不符。');
  if((s.pending.arts?.cooldowns[id]||0)>0)return fail('此神通仍在冷却。');
  const blood=Math.ceil(a.maxHp*skill.blood);if(s.energy<skill.cost||s.hp<=blood)return fail('灵力或气血不足，无法施展。');
  if(!skill.damage&&skill.heal&&s.hp>=a.maxHp&&!skill.restore&&!skill.shield)return fail('气血充盈，无需施展。');
  if(!skill.damage&&skill.restore&&!skill.heal&&!skill.shield&&s.energy>=a.maxEnergy)return fail('灵力充盈，无需施展。');
  const arts=battleArts(s),healing=1+growthEffects(s).healing;s.energy-=skill.cost;s.hp-=blood;arts.cooldowns[id]=skill.cooldown+1;if(skill.breakArmor)arts.breakArmor=Math.max(arts.breakArmor,skill.breakArmor+1);arts.weaken=Math.max(arts.weaken,skill.weaken);s.pending.shield=Math.max(s.pending.shield,Math.round(a.maxHp*skill.shield));
  const h=Math.min(a.maxHp-s.hp,Math.round(a.maxHp*skill.heal*healing)),n=Math.min(a.maxEnergy-s.energy,skill.restore);s.hp+=h;s.energy+=n;
  s.pending.turns.push(`${skill.name}：${blood?'燃血 '+blood+'，':''}${h?'气血 +'+h+'，':''}${n?'灵力 +'+n+'，':''}${skill.breakArmor?'敌方护甲降低35%，':''}${skill.weaken?'本轮来伤降低35%，':''}神通已施展。`);
  return {ok:true,message:skill.name+'已施展',damage:Math.round(a.attack*skill.damage),label:skill.name};
}
export function useGrowthCharm(s:GameState,id:string,a:Attributes):ActionResult&{damage?:number;label?:string}{
  if(s.pending?.kind!=='combat'||!['boltCharm','wardCharm','cleanseCharm'].includes(id))return {ok:false,message:'请选择战斗中可用的符箓。'};
  const key=id as 'boltCharm'|'wardCharm'|'cleanseCharm';if(s.growth.inventory[key]<1||(s.pending.arts?.talismans||0)>=2)return {ok:false,message:'符箓不足，或本场已用两张。'};
  const arts=battleArts(s);s.growth.inventory[key]--;arts.talismans++;
  if(key==='wardCharm')s.pending.shield=Math.max(s.pending.shield,Math.round(a.maxHp*.25));
  if(key==='cleanseCharm'){arts.cleanse=3;s.hp=Math.min(a.maxHp,s.hp+Math.round(a.maxHp*.1));}
  s.pending.turns.push(key==='boltCharm'?'雷击符引动雷光。':key==='wardCharm'?'护身符凝结25%气血护盾。':'净瘴符生效，免疫毒瘴三轮，恢复10%气血。');
  return {ok:true,message:'符箓已使用',damage:key==='boltCharm'?Math.round(a.attack*2.2):0,label:'雷击符'};
}
export function growthIncoming(s:GameState,damage:number){if(s.growth.activePreparation==='wardArray')damage*=.9;if(s.pending?.kind==='combat'&&s.pending.arts?.weaken)damage*=.65;return Math.max(0,Math.round(damage));}
export function growthAfterTurn(s:GameState,a:Attributes,guard=false):{damage:number;label:string}{
  if(s.pending?.kind!=='combat')return {damage:0,label:''};
  const e=s.pending,arts=e.arts;if(!arts)return {damage:0,label:''};arts.round++;
  for(const id of Object.keys(arts.cooldowns))arts.cooldowns[id]=Math.max(0,arts.cooldowns[id]-1);
  arts.breakArmor=Math.max(0,arts.breakArmor-1);arts.weaken=Math.max(0,arts.weaken-1);arts.cleanse=Math.max(0,arts.cleanse-1);
  if(s.growth.activePreparation==='springArray'){const n=Math.min(3,a.maxEnergy-s.energy);s.energy+=n;if(n)e.turns.push(`聚灵阵运转，灵力 +${n}。`);}
  const counter=guard&&s.growth.training.body>=6?Math.round(a.attack*Math.min(.3,.12+(s.growth.training.body-6)*.015)):0;
  if(counter)e.turns.push('体魄凝山，守心反震。');
  if(arts.round%3||!s.growth.pets.active)return {damage:counter,label:'体魄反震'};
  const id=s.growth.pets.active,pet=s.growth.pets.owned[id],definition=PETS.find(p=>p.id===id)!;
  const factor=(1+pet.bond*.002)*(1+growthEffects(s).petPower),strength=Math.min(.7,.18+pet.level*.012+pet.evolution*.08)*factor;
  if(pet.skill==='guard'||definition.effect==='shield'){const shield=Math.round(a.maxHp*Math.min(.18,(.04+pet.level*.002+pet.evolution*.02)*factor));e.shield=Math.max(e.shield,shield);e.turns.push(`${definition.forms[pet.evolution]}护主，护盾提升至${e.shield}。`);return {damage:counter,label:'体魄反震'};}
  if(definition.effect==='heal'){const h=Math.min(a.maxHp-s.hp,Math.round(a.maxHp*Math.min(.07,(.02+pet.level*.001+pet.evolution*.01)*factor)));s.hp+=h;e.turns.push(`${definition.forms[pet.evolution]}唤起生机，气血 +${h}。`);return {damage:counter,label:'体魄反震'};}
  if(definition.effect==='break'){arts.breakArmor=3;const n=Math.min(3+pet.evolution*2,a.maxEnergy-s.energy);s.energy+=n;e.turns.push(`${definition.forms[pet.evolution]}惑敌，护甲降低35%，灵力 +${n}。`);return {damage:counter,label:'体魄反震'};}
  return {damage:counter+Math.round(a.attack*strength+(definition.effect==='poison'?pet.level*2:0)),label:definition.forms[pet.evolution]+'协同攻击'+(counter?'与体魄反震':'')};
}
export function chooseGrowthSkill(s:GameState,a:Attributes,defensiveOnly=false){
  if(s.pending?.kind!=='combat')return null;const e=s.pending;
  for(const id of s.growth.arts.equipped){const skill=ART_SKILLS.find(a=>a.id===id)!;if(defensiveOnly&&!skill.shield&&!skill.weaken)continue;if((e.arts?.cooldowns[id]||0)>0||s.energy<skill.cost||s.hp<=Math.ceil(a.maxHp*skill.blood))continue;
    if(skill.heal&&!skill.damage&&s.hp>=a.maxHp*.8&&!skill.shield)continue;if(skill.restore&&!skill.damage&&!skill.heal&&s.energy>a.maxEnergy*.7)continue;
    const condition=s.growth.arts.conditions[id],boss=!!s.expedition.run&&s.expedition.run.node===4,heavy=boss&&(e.round||0)%3===2;
    if(condition==='hp50'&&s.hp>=a.maxHp*.5||condition==='energy30'&&s.energy>=a.maxEnergy*.3||condition==='boss'&&!boss||condition==='heavy'&&!heavy)continue;
    return {action:'growthSkill',payload:id};
  }
  return null;
}

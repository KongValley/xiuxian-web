import { ARTIFACTS, EQUIPMENT, equippedSet } from './content.js';
import { manualEffects } from './manuals.js';
import { rootEffects } from './roots.js';
import { REALMS } from './realms.js';
import { growthBossReward, growthEffects, growthArtifactCost } from './growth.js';
import { chooseGrowthSkill, initializeGrowthCombat } from './growth-combat.js';
import { WORLD_BALANCE } from './balance.js';
import type { ActionResult, Bonus, Combat, DungeonMechanic, ExpeditionState, GameState, RandomSource } from './types.js';

const lands=[
  ['青竹狼径','雾隐药谷','古井蛇窟','赤砂矿洞','青云试炼台'],
  ['落霞狐谷','沉玉水府','黑风古寨','地火熔窟','镇岳遗府'],
  ['金霞丹冢','碧落虫巢','玄天残境','雷泽石林','太虚剑冢'],
  ['无妄海眼','幽月鬼城','枯荣灵园','赤霄龙宫','归墟禁地'],
  ['照神古塔','万毒瘴泽','血镜迷宫','焚天荒原','天衍星台'],
  ['碎空浮岛','幽冥虚渊','噬灵长廊','九霄雷狱','洞玄天门'],
  ['两仪界隙','青冥妖庭','血河古界','万象战场','乾坤道宫'],
  ['凌天古路','万劫毒海','噬星魔巢','葬日天墟','升灵劫台'],
  ['太初仙墟','长生药界','无相魔狱','祖龙仙庭','天元问道台']
];
const bosses=[
  ['啸月狼王','瘴羽蜂后','碧鳞蛇君','赤砂炎傀','青云剑灵'],
  ['九尾赤狐','沉玉蛟灵','黑风寨主','地火炎魔','镇岳石尊'],
  ['丹火古灵','碧落虫母','玄天守卫','雷泽兽王','太虚残剑'],
  ['沧海蛟王','幽月鬼侯','枯荣树君','赤霄龙将','归墟梦魇'],
  ['照神塔灵','万毒灵尊','血镜真魔','焚天炎君','天衍星使'],
  ['碎空翼王','冥渊毒龙','噬灵虚兽','九霄雷将','洞玄守门人'],
  ['两仪玄灵','青冥妖圣','血河魔尊','万象战魂','乾坤道灵'],
  ['凌天剑尊','万劫毒圣','噬星魔祖','葬日古神','升灵劫使'],
  ['太初仙灵','长生毒仙','无相魔仙','祖龙战意','天元执道者']
];
export const MECHANICS:Record<DungeonMechanic,{name:string;desc:string}>={
  storm:{name:'雷霆',desc:'每三回合蓄力重击；出现预警后，守心可大幅减伤。'},
  venom:{name:'毒瘴',desc:'首领攻击附带气血上限 2% 的毒伤；守心减半，仍可被护盾吸收。'},
  vampire:{name:'汲血',desc:'首领按实际气血伤害的 25% 回复生机，护盾可阻断汲血。'},
  rage:{name:'狂暴',desc:'每轮攻击逐渐增强，最高 +35%，宜速战速决。'},
  ward:{name:'灵甲',desc:'首领护甲提升 50%；御剑与法宝攻击可忽略一半护甲。'}
};
const themes=['雷霆','毒瘴','汲血','狂暴','灵甲'];
const mechanics:DungeonMechanic[]=['storm','venom','vampire','rage','ward'];
export const NODE_NAMES=['山径伏兵','岔路机缘','镇关精英','灵泉营地','最终首领'];
export const DUNGEONS=lands.flatMap((names,realm)=>names.map((name,index)=>({
  id:`dungeon-${realm}-${index}`,name,realm,index,difficulty:0,mark:['山','泽','渊','焰','台'][index],
  boss:bosses[realm][index],mechanic:mechanics[index],
  desc:[`林泉藏径，循着灵迹寻觅${REALMS[realm]}秘藏。`,`烟瘴遮天，药香与危险在雾中交织。`,`残垣深处，失落的宝藏仍有强者守护。`,`烈焰与雷声相逐，此间只问战意。`,`此境最后的守关者，静候后来者问道。`][index],
  focus:['凝露草','灵魄与洗灵露','灵砂','洗练石','均衡珍藏'][index],
  energy:18+realm*2+index*2,
  stones:Math.round(WORLD_BALANCE[realm].stones*(1+index*.2)),
  artifact:ARTIFACTS.filter(a=>a.realm===realm)[index*6].id,
  seal:name+'真印',theme:themes[index]
})));
export type Dungeon=typeof DUNGEONS[number];
export function findDungeon(id:string):Dungeon|undefined {
  const match=/^(dungeon-[0-8]-[0-4])(?:@([12]))?$/.exec(id);if(!match)return undefined;const d=DUNGEONS.find(d=>d.id===match[1]);if(!d)return undefined;const difficulty=Number(match[2]||0);if(!difficulty)return d;
  return {...d,id,difficulty,name:d.name+' · '+['普通','精英','噩梦'][difficulty],energy:d.energy+difficulty*8,stones:Math.round(d.stones*[1,1.8,3.2][difficulty]),seal:d.seal+['','·精英','·噩梦'][difficulty]};
}
export function dungeonLockReason(s:GameState,d:Dungeon){if(d.realm>s.realm)return '境界未至';const base=d.id.split('@')[0];if(d.difficulty>0&&!s.expedition.clears[base])return '先通关普通';if(d.difficulty>1&&!s.expedition.clears[base+'@1'])return '先通关精英';return '';}
export function createExpedition():ExpeditionState{return {tokens:0,clears:{},run:null,last:null,auto:{battle:false,repeat:false,remaining:0,target:null,rest:true,potions:true}};}
export function dungeonBonus(s:GameState):Bonus{
  const bonus:Bonus={attack:0,defense:0,hp:0,energy:0};
  for(let r=0;r<REALMS.length;r++)if(DUNGEONS.filter(d=>d.realm===r).every(d=>(s.expedition?.clears[d.id]||0)>0)){bonus.attack+=2*(r+1);bonus.hp+=12*(r+1);bonus.defense+=r+1;}
  return bonus;
}
export function dungeonEnemy(d:Dungeon,node:number){
  const base=WORLD_BALANCE[d.realm],difficulty=1+d.index*.16;
  const hpFactor=node===4?2.6+d.index*.35:node===2?.9:.5;
  return {name:node===4?d.boss:node===2?d.name+'镇关使':d.name+'巡守',
    hp:Math.round(base.hp*difficulty*hpFactor*[1,2.4,4.5][d.difficulty]),attack:Math.round(base.attack*difficulty*(node===4?1.25:node===2?1.05:.8)*[1,1.7,2.5][d.difficulty]),
    defense:Math.round(base.defense*(node===4&&d.mechanic==='ward'?1.5:1)*[1,1.4,1.9][d.difficulty])};
}
interface Context {attributes:(s:GameState)=>{maxHp:number;maxEnergy:number;attack:number;defense:number;xpNeed:number};gainXp:(s:GameState,n:number)=>number;log:(s:GameState,text:string,type?:string)=>void}
export const DUNGEON_ACTIONS=['dungeonEnter','dungeonRepeat','dungeonNext','dungeonChoice','dungeonCamp','dungeonLeave','dungeonAutoBattle','dungeonAutoStart','dungeonAutoStop','dungeonAutoRest','dungeonAutoPotions','dungeonExchange'];
export function stopDungeonAuto(s:GameState){s.expedition.auto.repeat=false;s.expedition.auto.battle=false;}
function result(message:string,ok=true):ActionResult{return {ok,message};}
function spawn(s:GameState,d:Dungeon,ctx:Context){
  const run=s.expedition.run!,e=dungeonEnemy(d,run.node),a=ctx.attributes(s);
  const shield=Math.round(a.maxHp*Math.max(equippedSet(s)?.shield||0,manualEffects(s).shield,rootEffects(s).shield,run.ward));
  s.pending={kind:'combat',region:d.id,name:e.name,hp:e.hp,maxHp:e.hp,attack:e.attack,shield,pathUsed:false,artifactCooldown:0,dungeon:true,round:0,turns:[`第 ${run.node+1} 关 · ${NODE_NAMES[run.node]}，${e.name}现身。`,...(run.node===4?[MECHANICS[d.mechanic].desc,'首领每三轮蓄力重击，请留意预警。']:[])]};
  initializeGrowthCombat(s,a);
  run.phase='combat';
}
export function actDungeon(s:GameState,action:string,payload:string,ctx:Context):ActionResult{
  const x=s.expedition,auto=x.auto,run=x.run;
  if(action==='dungeonAutoStop'){stopDungeonAuto(s);return result('已停止自动行动，当前战局与进度保留');}
  if(action==='dungeonAutoBattle'){if(!run)return result('先进入副本再开启自动战斗',false);auto.battle=!auto.battle;if(!auto.battle)auto.repeat=false;return result(auto.battle?'自动战斗已开启':'自动战斗已暂停');}
  if(action==='dungeonAutoRest'||action==='dungeonAutoPotions'){const key=action==='dungeonAutoRest'?'rest':'potions';auto[key]=!auto[key];return result(`${key==='rest'?'局间静养':'战中服丹'}${auto[key]?'已开启':'已关闭'}`);}
  if(action==='dungeonLeave'){
    if(!run)return result('当前不在副本中',false);
    const d=findDungeon(run.id)!;x.last={id:d.id,won:false,first:false,day:s.day,summary:'主动撤离，已获得的关卡材料保留；未获得首领奖励。'};x.run=null;s.growth.activePreparation=null;s.pending=null;stopDungeonAuto(s);ctx.log(s,`撤离${d.name}，保留途中材料。`,'explore');return result('已撤离，当前副本进度结束');
  }
  if(action==='dungeonEnter'||action==='dungeonAutoStart'||action==='dungeonRepeat'){
    if(run||s.pending)return result('请先结束当前历练',false);
    const [id,countText]=payload.split('|'),d=findDungeon(id),count=Number(countText);
    if(!d||dungeonLockReason(s,d))return result(d?dungeonLockReason(s,d):'副本无效',false);
    if(action==='dungeonAutoStart'&&![1,5,10,20].includes(count))return result('请选择有效刷本轮数',false);
    if(action==='dungeonRepeat'&&(!auto.repeat||auto.target!==id||auto.remaining!==count||count<1))return result('没有待继续的自动刷本',false);
    const a=ctx.attributes(s);
    if(s.hp<a.maxHp*.3)return result('气血不足三成，请先静养',false);
    if(s.energy<d.energy)return result(`入场需要 ${d.energy} 灵力`,false);
    s.growth.activePreparation=s.growth.prepared;s.growth.prepared=null;
    s.energy-=d.energy;s.day++;x.run={id:d.id,node:0,phase:'ready',might:0,ward:0,spoils:0,rounds:0,started:s.day};x.last=null;
    if(action==='dungeonAutoStart'){auto.target=d.id;auto.remaining=count;auto.repeat=true;auto.battle=true;}
    ctx.log(s,`踏入${d.name}，五关之路已开，首领${d.boss}正在深处等候。`,'explore');spawn(s,d,ctx);return result('副本开启 · 第一关');
  }
  if(action==='dungeonExchange'){
    if(run||s.pending)return result('请先结束当前历练',false);
    const item=ARTIFACTS.find(a=>a.id===payload);
    if(!item||item.realm>s.realm)return result('境界不足，无法兑换此宝',false);
    if(Object.hasOwn(s.artifacts,item.id))return result('已拥有此宝，请另择一件',false);
    const cost=10+item.realm*4;if(x.tokens<cost)return result(`兑换需要 ${cost} 山河令`,false);
    x.tokens-=cost;s.artifacts[item.id]=0;ctx.log(s,`以 ${cost} 山河令换得${item.name}。`,'story');return result(`获得${item.name}`);
  }
  if(!run||s.pending)return result('请先处理眼前战局',false);
  const d=findDungeon(run.id)!,a=ctx.attributes(s);
  if(action==='dungeonNext'){
    if(run.phase!=='ready')return result('此关尚需作出抉择',false);
    if(run.node===1){run.phase='choice';return result('岔路尽处，机缘三选一');}
    if(run.node===3){run.phase='camp';return result('灵泉营地，可以整备一次');}
    spawn(s,d,ctx);return result(`第 ${run.node+1} 关 · ${NODE_NAMES[run.node]}`);
  }
  if(action==='dungeonChoice'){
    if(run.phase!=='choice'||!['might','ward','spoils'].includes(payload))return result('请选择有效机缘',false);
    if(payload==='might')run.might=.18;else if(payload==='ward')run.ward=.22;else run.spoils=.35;
    run.node++;run.phase='ready';ctx.log(s,`${d.name}岔路机缘：${payload==='might'?'剑意入体，本轮伤害 +18%':payload==='ward'?'灵障护身，后续每场开战获得 22% 气血护盾':'携走藏宝图，首领灵石与材料奖励 +35%'}。`,'explore');return result('机缘已定，继续挑战精英');
  }
  if(action==='dungeonCamp'){
    if(run.phase!=='camp'||!['heal','energy','balanced'].includes(payload))return result('请选择营地整备方式',false);
    const healing=1+growthEffects(s).healing;
    const h=Math.min(a.maxHp-s.hp,Math.round(a.maxHp*healing*(payload==='heal'?.55:payload==='balanced'?.3:.1))),n=Math.min(a.maxEnergy-s.energy,Math.round(a.maxEnergy*(payload==='energy'?.6:payload==='balanced'?.3:.1)));
    s.hp+=h;s.energy+=n;run.node++;run.phase='ready';ctx.log(s,`${d.name}灵泉整备：气血 +${h}，灵力 +${n}，此营地本轮已用尽。`,'rest');return result(`营地整备 · 气血 +${h} · 灵力 +${n}`);
  }
  return result('未知副本操作',false);
}
export function dungeonVictory(s:GameState,rng:RandomSource,ctx:Context):string{
  const x=s.expedition,run=x.run!,d=findDungeon(run.id)!,e=s.pending as Combat;
  s.stats.wins++;run.rounds+=e.round||0;s.pending=null;
  if(run.node!==4){
    const stones=Math.round(d.stones*.12),dust=1+d.realm;s.stones+=stones;s.dust+=dust;run.node++;run.phase='ready';ctx.log(s,`击败${e.name}，灵石 +${stones}，灵砂 +${dust}。`,'battle');return '关卡得胜 · 前路已开';
  }
  const first=!(x.clears[d.id]>0),mult=(1+run.spoils)*(1+d.difficulty*.5);
  const stones=Math.round(d.stones*(1+run.spoils)*(1+growthEffects(s).loot)*(first?2:1)),shards=Math.round((5+d.realm*2+d.index)*mult*(d.index===3?2:1)),essence=Math.round((3+d.realm+d.index)*mult*(d.index===1?2:1)),dust=Math.round((3+d.realm*2+d.index)*mult*(d.index===2?2:1)),herbs=Math.round((3+d.realm)*mult*(d.index===0?2:1)),tokens=1+Math.floor(d.index/2)+(first?3:0)+d.difficulty;
  const xp=ctx.gainXp(s,Math.round(ctx.attributes(s).xpNeed*(.22+d.index*.025)));
  s.stones+=stones;s.dust+=dust;s.items.herb+=herbs;s.reforge.shards=Math.min(10000000,s.reforge.shards+shards);s.roots.essence=Math.min(10000000,s.roots.essence+essence);x.tokens+=tokens;
  let extra='';if(d.index===1){s.roots.dew++;extra+='洗灵露 ×1；';}
  const pool=ARTIFACTS.filter(a=>a.realm===d.realm);
  if(first||rng()<.2){const item=first?ARTIFACTS.find(a=>a.id===d.artifact)!:pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];if(Object.hasOwn(s.artifacts,item.id)){const n=8*(d.realm+1);s.dust+=n;extra+=`${item.name}重复化为灵砂 +${n}；`;}else{s.artifacts[item.id]=0;extra+=`获得法宝「${item.name}」；`;}}
  // A small equipment chance keeps the original gear acquisition loop available.
  if(rng()<.25){const pool=EQUIPMENT.filter(a=>a.realm===d.realm),item=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];if(Object.hasOwn(s.gear,item.id))s.dust+=3*(d.realm+1);else{s.gear[item.id]=0;extra+=`获得${item.name}；`;}}
  x.clears[d.id]=(x.clears[d.id]||0)+1;s.stats.explores++;
  if(first)extra+=`收藏「${d.seal}」；`;
  if(first&&!d.difficulty&&DUNGEONS.filter(a=>a.realm===d.realm).every(a=>x.clears[a.id]>0))extra+=`${REALMS[d.realm]}五印齐集，永久攻击 +${2*(d.realm+1)}、气血 +${12*(d.realm+1)}、防御 +${d.realm+1}；`;
  extra+=growthBossReward(s,d.realm,d.difficulty);
  const summary=`修为 +${xp}，灵石 +${stones}，山河令 +${tokens}，灵砂 +${dust}，洗练石 +${shards}，灵魄 +${essence}，凝露草 ×${herbs}。${extra}`;
  x.last={id:d.id,won:true,first,day:s.day,summary};x.run=null;s.growth.activePreparation=null;ctx.log(s,`${first?'首次通关':'通关'}${d.name}，击败${d.boss}！${summary}`,'battle');
  if(x.auto.repeat){x.auto.remaining=Math.max(0,x.auto.remaining-1);if(!x.auto.remaining)stopDungeonAuto(s);}
  else x.auto.battle=false;
  return `${first?'首通告捷':'副本通关'} · ${d.name}`;
}
export function dungeonDefeat(s:GameState,summary:string){const x=s.expedition;if(!x.run)return;const id=x.run.id;x.last={id,won:false,first:false,day:s.day,summary};x.run=null;s.growth.activePreparation=null;stopDungeonAuto(s);}
export function dungeonAutoAction(s:GameState,attributes:Context['attributes']):{action:string;payload?:string}|null{
  const x=s.expedition,auto=x.auto,run=x.run,a=attributes(s);
  if(!auto.battle&&!auto.repeat)return null;
  if(!run){
    if(!auto.repeat||auto.remaining<1||!auto.target)return null;
    const d=findDungeon(auto.target)!;
    if(s.pending)return {action:'dungeonAutoStop'};
    if(s.hp<a.maxHp*.9||s.energy<Math.max(d.energy+30,a.maxEnergy*.7))return auto.rest?{action:'rest'}:{action:'dungeonAutoStop'};
    return {action:'dungeonRepeat',payload:`${d.id}|${auto.remaining}`};
  }
  if(s.pending?.kind==='combat'){
    const e=s.pending;
    if((e.round||0)>=80)return {action:'dungeonLeave'};
    // Telegraph takes priority over healing; automatic guard also restores energy.
    if(run.node===4&&(e.round||0)%3===2){const skill=chooseGrowthSkill(s,a,true);return skill||{action:'guard'};}
    if(auto.potions&&s.hp<a.maxHp*.32&&s.items.heal)return {action:'use',payload:'heal'};
    if(auto.potions&&s.energy<12&&s.items.qi)return {action:'use',payload:'qi'};
    if(!e.pathUsed&&s.path&&(s.path==='immortal'?s.hp<a.maxHp*.72:s.path==='demon'?s.hp>a.maxHp*.3&&s.energy>=10:s.energy>=14))return {action:'pathSkill'};
    const art=chooseGrowthSkill(s,a);if(art)return art;
    const item=ARTIFACTS.find(a=>a.id===s.equipped.artifact);
    if(item&&!e.artifactCooldown&&s.energy>=growthArtifactCost(s,item.cost))return {action:'artifactSkill'};
    if(s.energy>=12)return {action:'skill'};
    return {action:'attack'};
  }
  if(run.phase==='choice')return {action:'dungeonChoice',payload:s.hp<a.maxHp*.7?'ward':'might'};
  if(run.phase==='camp')return {action:'dungeonCamp',payload:s.hp/a.maxHp<s.energy/a.maxEnergy?'heal':'energy'};
  return {action:'dungeonNext'};
}
export function validateExpedition(s:GameState){
  const x=s.expedition,integer=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
  if(!x||typeof x!=='object'||!integer(x.tokens,0,10000000)||!x.clears||typeof x.clears!=='object'||Array.isArray(x.clears)||Object.entries(x.clears).some(([id,n])=>!findDungeon(id)||!!dungeonLockReason(s,findDungeon(id)!)||!integer(n,1,1000000)))throw new Error('副本记录无效');
  const a=x.auto;if(!a||['battle','repeat','rest','potions'].some(k=>typeof a[k as keyof typeof a]!=='boolean')||!integer(a.remaining,0,20)||a.target!==null&&(!findDungeon(a.target)||findDungeon(a.target)!.realm>s.realm)||a.repeat&&(!a.target||!a.battle||!a.remaining))throw new Error('自动历练设置无效');
  if(x.last&&(!findDungeon(x.last.id)||findDungeon(x.last.id)!.realm>s.realm||typeof x.last.won!=='boolean'||typeof x.last.first!=='boolean'||!integer(x.last.day,1,s.day)||typeof x.last.summary!=='string'||x.last.summary.length>1500))throw new Error('副本结算无效');
  const run=x.run;
  if(run){
    const d=findDungeon(run.id);
    if(!d||d.realm>s.realm||!integer(run.node,0,4)||!['ready','combat','choice','camp'].includes(run.phase)||![0,.18].includes(run.might)||![0,.22].includes(run.ward)||![0,.35].includes(run.spoils)||[run.might,run.ward,run.spoils].filter(Boolean).length>1||!integer(run.rounds,0,1000)||!integer(run.started,1,s.day))throw new Error('副本进度无效');
    if(run.node<2&&(run.might||run.ward||run.spoils)||run.phase==='choice'&&run.node!==1||run.phase==='camp'&&run.node!==3||run.phase==='combat'&&![0,2,4].includes(run.node)||run.phase==='combat'!==!!(s.pending?.kind==='combat'&&s.pending.dungeon)||s.pending&&(!('dungeon' in s.pending)||!s.pending.dungeon))throw new Error('副本关卡不一致');
    if(run.phase==='combat'){
      const e=s.pending as Combat,enemy=dungeonEnemy(d,run.node);
      if(e.region!==d.id||e.name!==enemy.name||e.maxHp!==enemy.hp||e.attack!==enemy.attack||!integer(e.hp,1,e.maxHp)||!integer(e.round,0,1000))throw new Error('副本敌人数据无效');
    }
    if(a.repeat&&a.target!==run.id)throw new Error('刷本目标不一致');
  }else if(s.pending?.kind==='combat'&&s.pending.dungeon||a.battle&&!a.repeat)throw new Error('副本战局缺失');
  return x;
}

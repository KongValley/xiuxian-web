import { FINAL_REALM, REALMS, STAGES } from './realms.js';
import type { ArtifactEffect, ArtifactItem, ArtifactPower, Bonus, RealmPosition } from './types.js';

export const ARTIFACT_STAGE_FACTORS=[1,1.15,1.3,1.5] as const;
export const ARTIFACT_EFFECTS:Record<ArtifactEffect,string>={bell:'震慑护身',blast:'爆发攻伐',heal:'回元续气',pure:'攻守回生',drain:'汲取生机',seal:'镇岳凝盾',sword:'御剑破阵',ward:'纯粹守御',spring:'蓄灵回元',tide:'潮击续灵'};
const names:string[][]=[
  ['青纹铃','赤铜镜','青陶鼎','拂云尘','引魂幡','小山印','流萤飞剑','玄木盾','听泉玉壶','碧波灵珠','风竹小钟','烬火环','回春葫芦','落霞宝扇','赤露玉瓶','青石镇纸','灵纹飞针','龟甲灵盘','凝露莲盏','溪风宝螺','松涛铃','焰羽令','芝草香炉','白玉如意','夜露魂灯','伏虎铁尺','青锋剑丸','叠云伞','纳气玉囊','清溪水轮'],
  ['赤霄镜','归元鼎','太清拂尘','噬魂幡','山海印','玄岳宝印','霜华飞剑','流云宝盾','七泉灵壶','江潮宝珠','千响铜钟','紫火莲环','玉芝宝葫','云霞折扇','赤泉净瓶','镇风石盘','七星飞针','玄龟阵盘','碧潭莲盏','乘风海螺','凝霜金铃','烈阳宝令','回元香炉','凝露如意','幽泉魂灯','镇岳玉尺','流虹剑丸','玄雾宝伞','藏灵锦囊','浪纹水轮'],
  ['金霞宝钟','斩岳炎镜','九芝丹鼎','清光宝尘','赤魄灵幡','丹霞镇印','虹光飞剑','玄金宝盾','玉液灵壶','沧浪宝珠','雷音金铃','赤阳宝环','三花宝葫','七曜灵扇','甘霖净瓶','灵罡石盘','玄虹飞针','云罡阵盘','金莲宝盏','逐浪宝螺','紫电铜铃','天火宝令','还真香炉','紫玉如意','玄夜灵灯','镇罡金尺','斩霞剑丸','丹华宝伞','乾元灵囊','九曲水轮'],
  ['镇婴玄钟','焚霞宝镜','青华灵鼎','太素宝尘','星魂灵幡','八景灵印','千羽飞剑','玄婴宝盾','紫府灵壶','潮生宝珠','归墟玉铃','星焰宝环','灵芝玉葫','天羽灵扇','青华净瓶','星枢石盘','紫芒飞针','莲台阵盘','元灵莲盏','天河宝螺','凝魂金铃','烬海宝令','长青香炉','九华如意','紫府魂灯','定婴玉尺','天星剑丸','八景云伞','元灵宝囊','沧海水轮'],
  ['照神灵钟','天炎玄镜','生生宝鼎','七曜拂尘','玄魄宝幡','太微神印','清霄飞剑','天罡宝盾','灵枢宝壶','万川灵珠','神霄金铃','赤曜宝环','造化玉葫','星罗宝扇','神露净瓶','七曜星盘','天衍飞针','太微阵盘','青神莲盏','灵海宝螺','太清玄铃','日曜宝令','还神香炉','天青如意','照念魂灯','镇神玉尺','天河剑丸','御神宝伞','星辉灵囊','万象水轮'],
  ['空明玄钟','破虚宝镜','返照灵鼎','洞玄拂尘','虚魂宝幡','九宫虚印','流光虚剑','洞天玄盾','虚泉宝壶','空海灵珠','太虚玉铃','星烬宝环','返真玉葫','无形宝扇','虚露净瓶','空枢星盘','破界飞针','镇虚阵盘','玄空莲盏','虚潮宝螺','凝虚神铃','无光宝令','返生香炉','洞玄如意','寂虚魂灯','定空玉尺','虚河剑丸','无相宝伞','藏虚宝囊','归墟水轮'],
  ['两仪道钟','合曜宝镜','合真灵鼎','无极拂尘','六虚灵幡','乾坤道印','合璧飞剑','混元宝盾','六合宝壶','界海灵珠','乾元神铃','阴阳宝环','归一玉葫','三垣宝扇','合道净瓶','无极星盘','贯界飞针','两仪阵盘','合真莲盏','界潮宝螺','定界道铃','乾阳宝令','长明香炉','混元如意','合魂道灯','定界玉尺','天枢剑丸','乾坤宝伞','合虚灵囊','六合水轮'],
  ['万劫道钟','焚天灵镜','长生道鼎','凌霄拂尘','万象灵幡','九天道印','凌天飞剑','万劫宝盾','天府玉壶','升灵道珠','御雷神铃','劫火宝环','不息玉葫','天门宝扇','天露净瓶','九天星盘','破劫飞针','镇劫阵盘','天华莲盏','天潮宝螺','定劫道铃','九霄宝令','应劫香炉','无尘如意','照劫道灯','凌天玉尺','太初剑丸','万劫宝伞','通天灵囊','太衍水轮'],
  ['太初仙钟','日垣仙镜','青冥仙鼎','无垢仙尘','星魂仙幡','太一仙印','问仙飞剑','真元仙盾','仙泉玉壶','星海仙珠','天阙仙铃','鸿蒙仙环','不老仙葫','玄穹仙扇','仙露净瓶','天元星盘','贯仙飞针','太一仙阵','真灵莲盏','仙潮宝螺','永明仙铃','太始仙令','还仙香炉','天元如意','长明仙灯','镇仙玉尺','鸿蒙剑丸','天阙仙伞','太初仙囊','永生水轮']
];
const zero:ArtifactPower={damage:0,heal:0,restore:0,shield:0,shieldFlat:0,drain:0};
interface Profile {effect:ArtifactEffect;mark:string;power:Partial<ArtifactPower>;bonus:Partial<Bonus>;cost:number;desc:string}
const profiles:Profile[]=[
  {effect:'bell',mark:'铃',power:{damage:1.8,shieldFlat:12},bonus:{defense:2},cost:14,desc:'震动灵音，伤敌并以灵光护身。'},
  {effect:'blast',mark:'镜',power:{damage:2.8},bonus:{attack:4},cost:20,desc:'聚光成焰，专精瞬间攻伐。'},
  {effect:'heal',mark:'鼎',power:{heal:.4,restore:12},bonus:{hp:15},cost:16,desc:'温养元气，同时恢复气血与灵力。'},
  {effect:'pure',mark:'尘',power:{damage:2.2,heal:.2},bonus:{energy:10},cost:18,desc:'清光扫尘，兼顾伤敌与回生。'},
  {effect:'drain',mark:'幡',power:{damage:2.5,drain:.3},bonus:{attack:5},cost:18,desc:'引动生机，从实际造成的伤害中汲血。'},
  {effect:'seal',mark:'印',power:{damage:2,shield:.25},bonus:{hp:15,defense:1},cost:18,desc:'镇山之势压敌，护道灵盾凝身。'},
  {effect:'sword',mark:'剑',power:{damage:3.1},bonus:{attack:6,energy:3},cost:23,desc:'御锋破阵，以较高灵耗换取强攻。'},
  {effect:'ward',mark:'盾',power:{shield:.4,heal:.12},bonus:{defense:3,hp:10},cost:17,desc:'专注守御，凝聚护盾并温养伤处。'},
  {effect:'spring',mark:'壶',power:{restore:22,heal:.15},bonus:{energy:12},cost:12,desc:'灵泉归元，侧重灵力续航与疗伤。'},
  {effect:'tide',mark:'珠',power:{damage:1.9,restore:9},bonus:{attack:2,energy:7},cost:16,desc:'潮生击敌，借余势引回灵气。'}
];
const legacy:Record<string,Partial<ArtifactItem>>={
  '0-0':{id:'spiritBell',price:70,skill:'青铃镇魂'},
  '1-0':{id:'scarletMirror',mark:'镜',price:220,attack:5,defense:0,hp:0,energy:0,cost:20,skill:'赤霄焚影',effect:'blast',power:{...zero,damage:2.8},desc:profiles[1].desc},
  '1-1':{id:'originCauldron',mark:'鼎',price:230,hp:25,attack:0,defense:0,energy:0,cost:16,skill:'万气归元',effect:'heal',power:{...zero,heal:.4,restore:12},desc:profiles[2].desc},
  '1-2':{id:'pureWhisk',mark:'尘',price:260,energy:15,attack:0,defense:0,hp:0,cost:18,skill:'太清荡尘',effect:'pure',power:{...zero,damage:2.2,heal:.2},desc:profiles[3].desc},
  '1-3':{id:'soulBanner',mark:'幡',price:260,attack:8,defense:0,hp:0,energy:0,cost:18,skill:'噬魂血祭',effect:'drain',power:{...zero,damage:2.5,drain:.3},desc:profiles[4].desc},
  '1-4':{id:'seaSeal',mark:'印',price:260,hp:30,defense:2,attack:0,energy:0,cost:18,skill:'山海镇岳',effect:'seal',power:{...zero,damage:2,shield:.25},desc:profiles[5].desc}
};
export const LEGACY_ARTIFACT_IDS=['spiritBell','scarletMirror','originCauldron','pureWhisk','soulBanner','seaSeal'];
export const ARTIFACTS:ArtifactItem[]=names.flatMap((row,realm)=>row.map((name,index)=>{
  const p=profiles[index%10],variant=Math.floor(index/10),r=realm+1;
  const power={...zero,...p.power};
  power.damage*=1+realm*.04+(variant===1?.1:variant===2?-.08:0);
  power.shieldFlat*=r;power.restore+=power.restore?realm*2:0;
  if(variant===1){power.heal*=.9;power.shield*=.9;}
  if(variant===2){power.heal*=1.1;power.shield*=1.1;}
  const stats:Bonus={attack:(p.bonus.attack||0)*r,defense:(p.bonus.defense||0)*r,hp:(p.bonus.hp||0)*r,energy:(p.bonus.energy||0)+realm*2};
  if(variant===1)stats.attack+=2*r;
  if(variant===2){stats.hp+=6*r;stats.defense+=r;stats.energy+=2*r;}
  return {id:`treasure-${realm}-${index}`,name,realm,tier:realm,price:65*r*r+index*9,mark:p.mark,cost:p.cost+realm*2+(variant===1?3:variant===2?2:0),skill:name+'·'+ARTIFACT_EFFECTS[p.effect].slice(0,2),effect:p.effect,power,...stats,desc:p.desc+['灵息均衡，攻守随形。','锋芒更盛，偏重攻伐。','温养本体，偏重护持。'][variant],...legacy[`${realm}-${index}`]};
}));

/** Lower-realm treasures retain full mastery; locked treasures preview their initial stage. */
export function artifactStage(item:ArtifactItem,position:RealmPosition):number {
  if(position.realm>item.realm)return 3;
  if(position.realm<item.realm)return 0;
  return item.realm===FINAL_REALM?0:Math.max(0,Math.min(3,position.stage));
}
export function artifactBonus(item:ArtifactItem,level=0,position:RealmPosition={realm:item.realm,stage:0}):Bonus {
  const stagePercent=Math.round(ARTIFACT_STAGE_FACTORS[artifactStage(item,position)]*100);
  return Object.fromEntries((['attack','defense','hp','energy'] as const).map(k=>[k,Math.round((item[k]||0)*stagePercent*(100+level*30)/10000)])) as Bonus;
}
export function artifactPower(item:ArtifactItem,position:RealmPosition={realm:item.realm,stage:0},level=0):ArtifactPower {
  const scale=ARTIFACT_STAGE_FACTORS[artifactStage(item,position)]*(1+level*.2),p=item.power;
  return {damage:Number((p.damage*scale).toFixed(3)),heal:Math.min(.9,Number((p.heal*scale).toFixed(6))),restore:Math.round(p.restore*scale),shield:Math.min(1,Number((p.shield*scale).toFixed(6))),shieldFlat:Math.round(p.shieldFlat*scale),drain:Math.min(.6,Number((p.drain*scale).toFixed(6)))};
}
const rounded=(n:number)=>String(Math.round(n*1000)/1000);
export function artifactPowerText(item:ArtifactItem,position:RealmPosition={realm:item.realm,stage:0},level=0):string {
  const p=artifactPower(item,position,level),parts:string[]=[];
  if(p.damage)parts.push(`${rounded(p.damage)} 倍攻击伤害`);
  if(p.heal)parts.push(`回复 ${rounded(p.heal*100)}% 气血上限`);
  if(p.restore)parts.push(`回复 ${p.restore} 灵力`);
  if(p.shield||p.shieldFlat)parts.push(`护盾 ${p.shield?rounded(p.shield*100)+'% 气血上限':p.shieldFlat+' 点'}`);
  if(p.drain)parts.push(`额外汲血 ${rounded(p.drain*100)}%`);
  return parts.join(' · ');
}
export function artifactStageLabel(item:ArtifactItem,position:RealmPosition):string {
  return item.realm===FINAL_REALM?'真仙 · 仙道初成':`${REALMS[item.realm]} · ${STAGES[artifactStage(item,position)]}`;
}

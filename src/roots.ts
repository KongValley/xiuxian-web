import { REALMS } from './realms.js';
import type { ActionResult, ElementId, GameState, RootEffects, SpiritRoots } from './types.js';

export const ELEMENTS:Array<{id:ElementId;name:string;mark:string;color:string;desc:string}>=[
  {id:'metal',name:'金灵根',mark:'金',color:'#aa915b',desc:'庚金凝锋，提升攻击。'},
  {id:'wood',name:'木灵根',mark:'木',color:'#6d8d62',desc:'青木蕴生，提升气血上限与战斗回元。'},
  {id:'water',name:'水灵根',mark:'水',color:'#648e9e',desc:'玄水藏灵，提升灵力上限与战斗回灵。'},
  {id:'fire',name:'火灵根',mark:'火',color:'#b27964',desc:'离火炼锋，提升攻击与御剑一击倍率。'},
  {id:'earth',name:'土灵根',mark:'土',color:'#a08d69',desc:'厚土护道，提升防御、气血与开战护盾。'}
];
export const ROOT_GRADES=['凡灵根','真灵根','天灵根','仙灵根'];
export const ROOT_LEVEL_CAPS=[5,10,15,20];
export const ROOT_ACTIONS:string[]=['rootAwaken','rootGather','rootRefine','rootTrain','rootPurify','rootPromote','rootReshape'];
export interface RootCost {essence:number;dew:number;stones:number;energy:number;herbs:number}
export interface RootPromotion extends RootCost {realm:number;purity:number;total:number}
const cost=(values:Partial<RootCost>):RootCost=>({essence:0,dew:0,stones:0,energy:0,herbs:0,...values});
export const ROOT_REFINE_COST=cost({stones:30,energy:10,herbs:5});
export const ROOT_GATHER_COST=cost({energy:10});
export const ROOT_PROMOTIONS:RootPromotion[]=[
  {...cost({essence:20,dew:3,stones:120,energy:20}),realm:1,purity:25,total:10},
  {...cost({essence:40,dew:6,stones:360,energy:20}),realm:4,purity:60,total:30},
  {...cost({essence:70,dew:10,stones:900,energy:20}),realm:7,purity:90,total:60}
];
export function createRoots():SpiritRoots {return {primary:null,levels:{metal:0,wood:0,water:0,fire:0,earth:0},purity:0,tier:0,essence:12,dew:2};}
export function findElement(id:string){return ELEMENTS.find(e=>e.id===id);}
export function rootLabel(s:GameState):string {return s.roots.primary?`${findElement(s.roots.primary)!.name} · ${ROOT_GRADES[s.roots.tier]}`:'灵根未显';}
export function rootTotal(s:GameState):number {return Object.values(s.roots.levels).reduce((sum,n)=>sum+n,0);}
export function rootTrainCost(level:number):RootCost{return cost({essence:level+2,stones:12*(level+1),energy:10});}
export function rootPurifyCost(purity:number):RootCost{return cost({essence:4+Math.floor(purity/20),dew:1,stones:25+purity,energy:8});}
export function rootReshapeCost(tier:number):RootCost{return cost({essence:20+tier*10,dew:2+tier*2,stones:100*(tier+1),energy:20});}
export function rootCostText(c:RootCost):string {
  return [[c.essence,'灵魄'],[c.dew,'洗灵露'],[c.stones,'灵石'],[c.energy,'灵力'],[c.herbs,'凝露草']].filter(([n])=>Number(n)>0).map(([n,label])=>`${n} ${label}`).join(' · ')+' · 1 日';
}
export function canPayRootCost(s:GameState,c:RootCost):boolean {return s.roots.essence>=c.essence&&s.roots.dew>=c.dew&&s.stones>=c.stones&&s.energy>=c.energy&&s.items.herb>=c.herbs;}
export function rootPromotionReason(s:GameState):string|null {
  if(!s.roots.primary)return '请先测灵定根。';
  const p=ROOT_PROMOTIONS[s.roots.tier];if(!p)return '灵根已达仙品。';
  if(s.realm<p.realm)return `需达到${REALMS[p.realm]}境界。`;
  if(s.roots.purity<p.purity)return `灵根纯度需达到 ${p.purity}%。`;
  if(rootTotal(s)<p.total)return `五行培养总级数需达到 ${p.total}。`;
  return null;
}
export function rootEffects(s:GameState):RootEffects {
  const zero:RootEffects={attack:0,defense:0,hp:0,energy:0,cultivation:0,chance:0,skill:0,heal:0,energyRegen:0,shield:0};
  if(s.version<7||!s.roots.primary)return zero;
  const r=s.roots,weighted=(id:ElementId)=>r.levels[id]*(r.primary===id?1.5:1);
  const metal=weighted('metal'),wood=weighted('wood'),water=weighted('water'),fire=weighted('fire'),earth=weighted('earth');
  return {attack:Math.round(metal*2+fire),defense:Math.round(earth),hp:Math.round(wood*10+earth*4),energy:Math.round(water*3),
    cultivation:Math.min(.7,Number((rootTotal(s)*.002+r.purity*.002+[0,.05,.12,.2][r.tier]+Math.min(...Object.values(r.levels))*.005).toFixed(4))),
    chance:Math.floor(r.purity/20)+[0,2,5,8][r.tier],skill:Number((fire*.01).toFixed(3)),heal:Math.floor(wood/3),energyRegen:Math.floor(water/5),shield:Math.min(.15,Number((earth*.005).toFixed(4)))};
}
export function gainRootEssence(s:GameState,amount:number):number {const gained=Math.min(amount,10000000-s.roots.essence);s.roots.essence+=gained;return gained;}

/** Checks precede payment, so failed cultivation never changes resources or progress. */
export function actRoot(s:GameState,action:string,payload:string):ActionResult {
  const r=s.roots,fail=(message:string):ActionResult=>({ok:false,message}),ok=(message:string):ActionResult=>({ok:true,message});
  if(s.pending)return fail('历练未了，先安定眼前的机缘。');
  const pay=(c:RootCost)=>{r.essence-=c.essence;r.dew-=c.dew;s.stones-=c.stones;s.energy-=c.energy;s.items.herb-=c.herbs;s.day++;};
  const missing=(c:RootCost)=>fail(`养根所需不足：${rootCostText(c)}。`);
  if(action==='rootAwaken'){
    const element=findElement(payload);if(!element)return fail('请选择金木水火土之一。');
    if(r.primary)return fail('已经测灵定根；更改主灵根请使用重塑。');
    r.primary=element.id;r.levels[element.id]=1;r.purity=10;
    return ok(`测灵初醒，立${element.name}为主。初始纯度 10%，主灵根培养一级；五行皆可兼养。`);
  }
  if(!r.primary)return fail('先免费测灵，选择主灵根后再开始养成。');
  switch(action){
    case 'rootGather': {
      if(r.essence>=10000000)return fail('灵魄已满，请先用于养成。');
      if(!canPayRootCost(s,ROOT_GATHER_COST))return missing(ROOT_GATHER_COST);pay(ROOT_GATHER_COST);
      return ok(`引灵入脉，灵魄 +${gainRootEssence(s,3+Math.floor(s.realm/2))}。`);
    }
    case 'rootRefine': {
      if(r.dew>=1000000)return fail('洗灵露已满。');
      if(!canPayRootCost(s,ROOT_REFINE_COST))return missing(ROOT_REFINE_COST);pay(ROOT_REFINE_COST);r.dew++;
      return ok('凝露草炼作洗灵露，洗灵露 +1。');
    }
    case 'rootTrain': {
      const e=findElement(payload);if(!e)return fail('请选择要培养的五行灵根。');
      const level=r.levels[e.id];if(level>=ROOT_LEVEL_CAPS[r.tier])return fail('此灵根已达本品上限，晋升品质后可继续培养。');
      const c=rootTrainCost(level);if(!canPayRootCost(s,c))return missing(c);pay(c);r.levels[e.id]++;
      return ok(`${e.name}培养至 ${r.levels[e.id]} 级，根基更深一分。`);
    }
    case 'rootPurify': {
      if(r.purity>=100)return fail('灵根已纯净无瑕，无需继续洗炼。');
      const c=rootPurifyCost(r.purity);if(!canPayRootCost(s,c))return missing(c);pay(c);r.purity=Math.min(100,r.purity+5);
      return ok(`洗炼提纯成功，灵根纯度 +5%，现为 ${r.purity}%。`);
    }
    case 'rootPromote': {
      const reason=rootPromotionReason(s);if(reason)return fail(reason);
      const c=ROOT_PROMOTIONS[r.tier];if(!canPayRootCost(s,c))return missing(c);pay(c);r.tier++;
      return ok(`灵根蜕变，晋升${ROOT_GRADES[r.tier]}！五行培养上限提升至 ${ROOT_LEVEL_CAPS[r.tier]} 级。`);
    }
    case 'rootReshape': {
      const e=findElement(payload);if(!e||e.id===r.primary)return fail('请选择不同的主灵根。');
      if(r.levels[e.id]<1)return fail('目标灵根需先培养至一级，才能立为主灵根。');
      const c=rootReshapeCost(r.tier);if(!canPayRootCost(s,c))return missing(c);pay(c);r.primary=e.id;
      return ok(`重塑根基，改立${e.name}为主；五行级数、纯度与品质全部保留。`);
    }
    default:return fail('未知的养根方式。');
  }
}

export function validateRoots(value:unknown,realm:number):SpiritRoots {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('灵根数据无效');
  const r=value as SpiritRoots,keys=Object.keys(r);
  if(keys.length!==6||!['primary','levels','purity','tier','essence','dew'].every(k=>keys.includes(k)))throw new Error('灵根字段无效');
  for(const [n,min,max]of [[r.tier,0,3],[r.purity,0,100],[r.essence,0,10000000],[r.dew,0,1000000]])if(!Number.isInteger(n)||n<min||n>max)throw new Error('灵根数值无效');
  if(r.purity%5!==0||r.primary!==null&&!findElement(r.primary))throw new Error('主灵根或纯度无效');
  if(!r.levels||typeof r.levels!=='object'||Array.isArray(r.levels)||Object.keys(r.levels).length!==5||ELEMENTS.some(e=>!Object.hasOwn(r.levels,e.id)||!Number.isInteger(r.levels[e.id])||r.levels[e.id]<0||r.levels[e.id]>ROOT_LEVEL_CAPS[r.tier]))throw new Error('五行培养数据无效');
  const total=Object.values(r.levels).reduce((n,v)=>n+v,0);
  if(r.primary===null?(r.tier!==0||r.purity!==0||total!==0):(r.levels[r.primary]<1||r.purity<10))throw new Error('测灵状态无效');
  const requirement=ROOT_PROMOTIONS[r.tier-1];
  if(requirement&&(realm<requirement.realm||r.purity<requirement.purity||total<requirement.total))throw new Error('灵根品质条件不符');
  return r;
}

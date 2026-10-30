import { REALMS } from './realms.js';
import type { GameState, Manual, ManualEffects, PathId } from './types.js';

export const MAX_ACTIVE_BOOKS=10;
export const FOUNDATION_BOOKS:Manual[]=[
  {id:'breath',name:'太虚吐纳诀',type:'心法',grade:'通用',realm:0,path:null,desc:'调息凝神，引天地灵气入体。',cost:30,max:5,effects:{cultivation:.2}},
  {id:'sword',name:'青莲剑歌',type:'剑诀',grade:'通用',realm:0,path:null,desc:'一剑生青莲，剑气凝于指间。',cost:45,max:5,effects:{attack:5,skill:.1}},
  {id:'body',name:'长生锻体经',type:'炼体',grade:'通用',realm:0,path:null,desc:'以灵气温养筋骨，筑下长生根基。',cost:40,max:5,effects:{hp:20,defense:2}}
];
// Original titles arranged by realm; each row offers ten different builds.
const titles:Record<PathId,string[][]>={
  immortal:[
    ['松风引气诀','流萤剑录','青玉锻骨篇','听泉蓄灵经','澄心定意诀','叠云护身术','春露养元功','回溪续气诀','晨曦御气篇','月轮守心法'],
    ['云海筑基经','凝霜分光剑','玄玉筑身诀','碧潭藏灵录','明台照念经','六虚御甲诀','芝兰回生篇','百川归气诀','紫霞行气法','星盘镇灵术'],
    ['金霞炼丹经','虹影斩岳录','琉璃固元功','九泉聚灵诀','丹心无垢篇','罡风御障经','玉液还真法','周天复灵录','赤阳蕴剑诀','玄光护丹术'],
    ['太素养婴经','千羽化剑录','玉髓凝身功','紫府藏真篇','灵台照婴诀','八景御灵法','青华续命经','潮生归元诀','星河御剑篇','莲台镇魂录'],
    ['观天化神经','清霄斩念剑','天罡炼形录','灵枢纳海经','照神明心诀','七曜护神篇','生生返元功','万川归灵法','霞光衍剑经','太微守神阵'],
    ['太虚吐真经','破空流光剑','洞玄无漏身','虚海藏灵篇','一念澄虚录','空明护道诀','返照回生经','虚泉续元法','云汉驭锋篇','九宫镇虚录'],
    ['两仪合道经','乾坤合璧剑','混元琉璃身','无极灵府录','形神归一诀','三垣护界篇','造化还真经','六合归灵法','天河演剑录','双仪定界阵'],
    ['大衍通天经','凌霄问道剑','万劫清净身','天府涵元录','无尘应劫篇','九天护道诀','不息长生经','万象归元法','太初化剑录','升灵镇劫阵'],
    ['太初仙元经','星垣问仙剑','无垢真仙身','玄穹仙府录','万念归真篇','天阙护仙诀','青冥不老经','仙泉复元法','鸿蒙演剑录','太一镇仙阵']
  ],
  demon:[
    ['赤煞凝锋诀','饮露血息功','残月裂影刀','铁煞炼骨篇','幽潭藏气录','逆意守心诀','乌鳞护身功','余烬续命篇','夜炉炼气诀','玄阴凝障术'],
    ['血荆铸锋经','赤河汲元功','断魂破风录','玄煞锻身诀','黑莲聚气篇','孤心筑念经','煞甲护元录','焚心养血功','地火炼息诀','冥轮守基术'],
    ['赤魄凝刃经','血泉归命诀','幽焰斩岳录','黑曜炼体功','冥丹藏气篇','逆丹定意经','七煞御甲诀','残阳续血录','魔炉蕴元法','阴环镇丹术'],
    ['冥刃养婴经','噬月汲灵篇','夜叉裂空录','血玉凝身功','幽府藏息经','独念守婴诀','百煞护魂篇','烬骨回生功','九幽炼气法','暗莲镇婴术'],
    ['诛念凝锋经','血海还魂诀','灭影焚神录','魔罡炼形功','玄渊纳灵篇','逆神不动经','千煞御障诀','枯荣续命录','黑日熔元法','冥星护神阵'],
    ['劫火炼刃经','虚河噬元功','断界裂空录','幽冥不漏身','暗海藏真经','独照破虚诀','九煞护道篇','余烬归命录','无光炼虚法','黑轮镇虚阵'],
    ['天魔合锋经','万血归流功','寂灭斩界录','赤曜合真身','六欲灵府篇','一念逆天经','魔域御甲诀','不灭续魂录','地渊炼元法','冥府定界阵'],
    ['逆天铸锋经','万劫汲元诀','焚天裂道录','天魔不坏身','无底魔渊篇','问劫独心经','九狱护道诀','劫灰重生录','黑莲炼天法','灭世镇雷阵'],
    ['无相魔元经','诸天饮命诀','寂天斩仙录','真魔不灭身','暗穹魔府篇','无畏证心经','玄狱护仙诀','赤潮不死录','混沌炼元法','永夜镇仙阵']
  ],
  yao:[
    ['山猿炼骨经','虎啸裂石诀','灵鹿藏息篇','龟甲护身功','狐月引气录','灵蛇蜕鳞法','熊罴守山诀','春藤续命篇','吞霞定意经','石灵归气术'],
    ['玄犀筑身经','赤豹逐风诀','月狐藏灵篇','玄龟御甲功','林海吐纳录','青蟒换骨法','山岳守灵诀','古藤回生篇','吞月凝心经','百兽复气术'],
    ['苍虬炼髓经','金鹏破云诀','灵鲸蓄海篇','龙鳞御身功','星狐炼丹录','赤蛟蜕骨法','玄岳镇丹诀','青木养丹篇','月魄守心经','潮汐还气术'],
    ['荒猿凝身经','风鸾裂空诀','灵鲲藏息篇','古鳌护婴功','月华养婴录','玄蟒化蛟法','山海守婴诀','灵藤续元篇','万灵照念经','沧浪归灵术'],
    ['星熊炼形经','雷鹏撼神诀','天鲸纳海篇','龙甲护神功','万兽通灵录','九尾洗髓法','大岳镇神诀','神木还生篇','山魂定意经','鲸息复元术'],
    ['古猿洞虚经','风鹏破界诀','虚鲲藏海篇','玄鳌护虚功','吞星炼气录','苍蛟换骨法','山河镇虚诀','空藤续命篇','灵魄照虚经','海眼归元术'],
    ['圣犀合真经','金翅裂界诀','天鲲灵府篇','祖鳌合甲功','万灵合息录','真龙蜕骨法','山海定界诀','建木回生篇','万魂归一诀','百脉复灵术'],
    ['太古圣躯经','天鹏击雷诀','吞天藏元篇','龙皇御劫功','星河吞霞录','真灵蜕凡法','万岳镇雷诀','不枯圣木篇','妖心应劫经','沧海回元术'],
    ['太初真灵经','圣鹏裂仙诀','鲲海仙府篇','祖龙御仙功','万灵吞元录','天妖化圣法','山海镇仙诀','永生神木篇','无垢妖心经','星潮复元术']
  ]
};
const profiles:Record<PathId,Array<[string,(r:number)=>Partial<ManualEffects>,string]>>={
  immortal:[
    ['心法',r=>({cultivation:.025+r*.005}),'静坐参玄，吐纳之间灵机自生。'],
    ['剑诀',r=>({attack:2*r,skill:.025}),'以气驭剑，锋芒与御剑威力并进。'],
    ['炼体',r=>({hp:9*r,defense:r}),'温养筋骨，兼修体魄与防御。'],
    ['灵府',r=>({energy:5+r*2}),'开辟灵府，蓄存绵长法力。'],
    ['定心',()=>({chance:1}),'澄明道心，辅助冲关，不替代凝神丹。'],
    ['护体',r=>({defense:2*r}),'层叠罡气，护持周身。'],
    ['回元',r=>({heal:r}),'承受敌方回合后仍存活，生机徐徐回流。'],
    ['续气',()=>({energyRegen:1}),'承受敌方回合后仍存活，恢复少许灵力。'],
    ['御气',r=>({attack:r,cultivation:.02}),'行气蕴锋，兼顾吐纳与攻伐。'],
    ['结界',r=>({shield:.012,energy:r*2}),'入战凝结护障，护住丹田灵台。']
  ],
  demon:[
    ['杀伐',r=>({attack:3*r}),'煞气凝锋，专精攻伐。'],
    ['汲血',r=>({drain:.008,hp:3*r}),'以实际造成的伤害汲取生机。'],
    ['战诀',r=>({skill:.04,attack:r}),'凶烈气机融入御剑一击。'],
    ['炼体',r=>({hp:12*r}),'以煞淬体，筋骨如铁。'],
    ['灵府',r=>({energy:5+r*2}),'将幽息炼入丹田，拓展灵力。'],
    ['定心',()=>({chance:1}),'逆境守一，压住心魔以助冲关。'],
    ['护体',r=>({defense:r,hp:4*r}),'煞气为甲，血肉亦得温养。'],
    ['续命',r=>({heal:r,drain:.003}),'一息未灭，余烬可续。'],
    ['心法',r=>({cultivation:.03+r*.004}),'以炉炼气，精进修为。'],
    ['结界',r=>({shield:.012,attack:r}),'凝阴成障，兼养锋芒。']
  ],
  yao:[
    ['圣躯',r=>({hp:16*r}),'唤醒山海血脉，锤炼强健体魄。'],
    ['战诀',r=>({attack:2*r,skill:.025}),'百兽争雄之意融于攻伐。'],
    ['灵府',r=>({energy:6+r*2}),'吞吐山海之息，蓄气于身。'],
    ['鳞甲',r=>({defense:2*r}),'灵甲层生，守护筋骨。'],
    ['心法',r=>({cultivation:.025+r*.005}),'餐霞饮露，山川灵气入脉。'],
    ['蜕骨',r=>({hp:7*r,attack:r,defense:r}),'血脉蜕变，形体与锋芒共长。'],
    ['结界',r=>({shield:.015,hp:3*r}),'开战时凝山岳之势为护盾。'],
    ['回生',r=>({heal:2*r}),'根深叶茂，存活时恢复生机。'],
    ['定心',()=>({chance:1}),'万灵归念，安定冲关之心。'],
    ['续气',()=>({energyRegen:1}),'长息归元，存活时补回灵力。']
  ]
};
export const MANUALS:Manual[]=(Object.keys(titles) as PathId[]).flatMap(path=>titles[path].flatMap((row,realm)=>row.map((name,index)=>{
  const [type,effect,desc]=profiles[path][index];
  return {id:`${path}-${realm}-${index}`,name,type,grade:REALMS[realm],realm,path,desc,cost:(realm+1)*(realm+1)*18+index*3,max:5,effects:effect(realm+1)};
})));
export const SECT_BOOKS:Manual[]=[
  {id:'sect-cloud-book',name:'青云分光经',type:'宗门传承',grade:'真传',realm:2,path:null,sect:'cloud',desc:'青云宗内门传承。剑分流云，兼修后强化攻击与御剑。',cost:90,max:5,effects:{attack:3,skill:.025}},
  {id:'sect-pill-book',name:'丹霞养元经',type:'宗门传承',grade:'真传',realm:2,path:null,sect:'pill',desc:'丹霞谷内门传承。丹气养元，长线回生并温养灵府。',cost:90,max:5,effects:{heal:1,energy:3,cultivation:.02}},
  {id:'sect-beast-book',name:'万灵同契经',type:'宗门传承',grade:'真传',realm:2,path:null,sect:'beast',desc:'万兽山内门传承。万灵共生，增强体魄与开战护盾。',cost:90,max:5,effects:{hp:12,shield:.01}}
];
export const BOOKS:Manual[]=[...FOUNDATION_BOOKS,...MANUALS,...SECT_BOOKS];
const byId=new Map(BOOKS.map(b=>[b.id,b]));
export function findManual(id:string):Manual|undefined{return byId.get(id);}
export function manualEffects(s:GameState):ManualEffects {
  const total:ManualEffects={attack:0,defense:0,hp:0,energy:0,cultivation:0,chance:0,drain:0,heal:0,energyRegen:0,shield:0,skill:0};
  const ids=s.version<5?FOUNDATION_BOOKS.map(b=>b.id):s.activeBooks;
  for(const id of ids){const b=findManual(id);if(!b||b.path&&b.path!==s.path||b.realm>s.realm)continue;const level=s.books[id]||0;for(const [key,value]of Object.entries(b.effects))total[key as keyof ManualEffects]+=value*level;}
  total.cultivation=Math.min(1.2,total.cultivation);total.chance=Math.min(15,total.chance);total.drain=Math.min(.2,total.drain);total.shield=Math.min(.3,total.shield);total.skill=Math.min(.75,total.skill);total.energyRegen=Math.min(10,total.energyRegen);
  return total;
}
export function manualEffectText(effects:Partial<ManualEffects>,level=1):string {
  const labels:Record<keyof ManualEffects,string>={attack:'攻击',defense:'防御',hp:'气血上限',energy:'灵力上限',cultivation:'修炼收益',chance:'突破成功率',drain:'汲血',heal:'回合回血',energyRegen:'回合回灵',shield:'开战护盾',skill:'御剑倍率'};
  return Object.entries(effects).filter(([,value])=>value!==0).map(([key,value])=>{const k=key as keyof ManualEffects,n=value*level;return `${labels[k]} +${['cultivation','drain','shield'].includes(k)?`${Math.round(n*1000)/10}%`:k==='chance'?`${n} 个百分点`:k==='skill'?`${Math.round(n*1000)/1000}`:n}`;}).join(' · ');
}

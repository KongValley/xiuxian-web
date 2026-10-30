import type { AutoCondition, GrowthMaterial, PathId, Profession } from './types.js';
export const MATERIALS:Record<GrowthMaterial,string>={jade:'灵玉',timber:'灵木',ore:'玄铁',seed:'灵种',moonleaf:'月华叶',firefruit:'赤焰果',egg:'灵兽蛋壳',blueprint:'残卷',tonic:'养元灵液',boltCharm:'雷击符',wardCharm:'护身符',cleanseCharm:'净瘴符',swordArray:'锐金阵图',wardArray:'厚土阵图',springArray:'聚灵阵图'};
export const GROWTH_SECTIONS=[['overview','仙途总览','卷'],['natal','本命法宝','器'],['arts','天赋神通','术'],['estate','洞府药园','居'],['crafts','修仙百艺','艺'],['pets','灵兽养成','兽'],['training','炼体神识','身'],['sect','宗门师承','宗'],['fate','道心命格','心']] as const;
export type GrowthSection=typeof GROWTH_SECTIONS[number][0];
export const PROFESSIONS:Record<Profession,string>={alchemy:'丹道',smith:'炼器',talisman:'符箓',array:'阵法'};
export const BUILDINGS=[{id:'vein',name:'洞府灵脉',desc:'每级吐纳收益 +2%，新养成修炼加成共用 20% 上限。',max:5},{id:'garden',name:'灵田药园',desc:'每级增开一块药田，最高四块；提高品质种植的额外收益。',max:3},{id:'alchemy',name:'丹房',desc:'解锁进阶丹方，每级丹道制作经验额外 +1。',max:3},{id:'forge',name:'炼器室',desc:'解锁进阶器方，每级炼器制作经验额外 +1。',max:3}] as const;
export const PLANTS=[{id:'dew',name:'凝露灵草',realm:0,days:3,material:'herb',amount:5,desc:'三日成熟，收获炼丹与喂养通用草药。'},{id:'moon',name:'月华灵芝',realm:1,days:5,material:'moonleaf',amount:3,desc:'五日成熟，月华叶用于神识、丹道和阵法。'},{id:'fire',name:'赤焰灵藤',realm:2,days:7,material:'firefruit',amount:3,desc:'七日成熟，赤焰果用于觉醒器灵、灵兽进化。'}] as const;
export const PETS=[
  {id:'tiger',name:'踏风灵虎',forms:['踏风幼虎','啸风灵虎','逐日圣虎'],mark:'虎',desc:'每三轮协同扑击；进化提升伤害。',effect:'attack'},
  {id:'turtle',name:'玄甲灵龟',forms:['墨甲幼龟','玄甲灵龟','镇海神鳌'],mark:'龟',desc:'每三轮凝盾护主，适合抵挡首领重击。',effect:'shield'},
  {id:'crane',name:'青羽灵鹤',forms:['青羽幼鹤','流霞仙鹤','九霄玄鹤'],mark:'鹤',desc:'每三轮恢复气血，提供长线续航。',effect:'heal'},
  {id:'fox',name:'月影灵狐',forms:['月影幼狐','三尾灵狐','九尾月狐'],mark:'狐',desc:'每三轮削弱敌方护甲，并恢复少量灵力。',effect:'break'},
  {id:'snake',name:'碧鳞灵蛇',forms:['碧鳞幼蛇','青蛟灵蛇','苍虬真灵'],mark:'蛇',desc:'每三轮以灵毒蚀敌，造成稳定协同伤害。',effect:'poison'}
] as const;
export const SECTS=[{id:'cloud',name:'青云宗',desc:'剑心立宗，传承御剑与破甲之术。',skill:'sect-cloud'},{id:'pill',name:'丹霞谷',desc:'草木济世，擅长丹道与回元。',skill:'sect-pill'},{id:'beast',name:'万兽山',desc:'与灵为伴，研习御兽护道之法。',skill:'sect-beast'}] as const;
export const SECT_RANKS=['外门弟子','内门弟子','真传弟子','宗门长老'];
export const MENTORS=SECTS.flatMap((sect,i)=>['sword','craft','beast'].map((style,j)=>({id:`${sect.id}-${style}`,sect:sect.id,name:[['顾长风','柳青禾','孟守山'],['苏闻剑','沈丹心','白栖灵'],['陆听松','叶知秋','秦御川']][i][j],style,desc:['关系达20后，开战护盾 +5%。','关系达20后，百艺制作经验 +20%。','关系达20后，灵兽协同效果 +15%。'][j]})));
export const AUTO_CONDITIONS:Record<AutoCondition,string>={always:'可用即施展',hp50:'气血低于50%',boss:'仅首领战',heavy:'首领蓄力时',energy30:'灵力低于30%'};
export interface ArtSkill {id:string;name:string;path:PathId|null;realm:number;cost:number;cooldown:number;damage:number;heal:number;shield:number;restore:number;breakArmor:number;weaken:number;blood:number;auto:AutoCondition;sect?:string;desc:string}
const skill=(id:string,name:string,path:PathId|null,realm:number,cost:number,cooldown:number,e:Partial<ArtSkill>):ArtSkill=>({id,name,path,realm,cost,cooldown,damage:0,heal:0,shield:0,restore:0,breakArmor:0,weaken:0,blood:0,auto:'always',desc:'',...e});
export const ART_SKILLS:ArtSkill[]=[
  skill('cloud-blade','流云分光剑','immortal',0,16,3,{damage:2,breakArmor:2,desc:'二倍攻击伤害，令敌方护甲降低35%，持续两轮。'}),
  skill('clear-rain','清露回元','immortal',1,12,4,{heal:.22,restore:8,auto:'hp50',desc:'恢复22%气血与8灵力。'}),
  skill('heaven-seal','太清镇灵','immortal',2,18,4,{damage:1.2,weaken:1,auto:'heavy',desc:'伤敌并使本轮来伤降低35%，可应对首领蓄力。'}),
  skill('blood-edge','赤焰焚锋','demon',0,10,3,{damage:2.6,blood:.06,desc:'燃烧6%气血上限，造成2.6倍攻击伤害。'}),
  skill('soul-chain','锁魂引息','demon',1,18,4,{damage:1.5,restore:12,auto:'energy30',desc:'伤敌并引回12灵力。'}),
  skill('ember-guard','余烬魔甲','demon',2,14,4,{shield:.22,auto:'heavy',desc:'凝结22%气血护盾。'}),
  skill('tiger-claw','裂岳妖爪','yao',0,14,3,{damage:2.1,breakArmor:2,desc:'造成2.1倍攻击伤害，并削弱护甲两轮。'}),
  skill('spring-blood','长生血脉','yao',1,16,4,{heal:.24,auto:'hp50',desc:'唤醒血脉，恢复24%气血。'}),
  skill('earth-roar','山海震鸣','yao',2,18,4,{damage:1,shield:.25,auto:'heavy',desc:'伤敌并获得25%气血护盾。'}),
  skill('gather-spirit','凝元术',null,0,0,5,{restore:25,auto:'energy30',desc:'凝气一轮，恢复25点灵力。'}),
  skill('armor-cut','碎甲诀',null,1,14,4,{damage:1.4,breakArmor:2,desc:'伤敌并削弱护甲两轮，三途通用。'}),
  skill('spirit-ward','护元罩',null,1,14,4,{shield:.18,auto:'heavy',desc:'凝结18%气血护盾，三途通用。'}),
  skill('sect-cloud','青云御剑阵',null,2,20,4,{damage:2.4,breakArmor:2,sect:'cloud',desc:'青云宗内门传承，分光破甲。'}),
  skill('sect-pill','丹霞续命术',null,2,18,5,{heal:.3,restore:10,auto:'hp50',sect:'pill',desc:'丹霞谷内门传承，恢复30%气血与10灵力。'}),
  skill('sect-beast','万灵护道阵',null,2,18,4,{shield:.3,weaken:1,auto:'heavy',sect:'beast',desc:'万兽山内门传承，凝盾并降低本轮来伤。'})
];
export const TALENT_BRANCHES={immortal:[['御剑','sword'],['回元','healing'],['阵道','ward']],demon:[['燃血','sword'],['汲魂','healing'],['煞体','ward']],yao:[['兽化','sword'],['再生','healing'],['血脉','ward']]} as const;
export const TALENTS=(['immortal','demon','yao'] as const).flatMap(path=>TALENT_BRANCHES[path].flatMap(([branch,effect],b)=>[0,1,2].map(tier=>({id:`${path}-${b}-${tier}`,path,branch,effect,tier,realm:[0,1,3][tier],name:branch+['初悟','融会','通玄'][tier],desc:effect==='sword'?'每点伤害收益 +1%，进阶节点再强化御剑。':effect==='healing'?'每点治疗收益 +2%，魔修另获少量汲血。':'每点开战护盾 +1%，与其他护盾取较高值。'}))));
export interface CraftRecipe {id:string;profession:Profession;name:string;level:number;building?:'alchemy'|'forge';output:GrowthMaterial|'qi'|'heal'|'focus'|'dust'|'shards';amount:number;herbs:number;dust:number;materials:Partial<Record<GrowthMaterial,number>>;desc:string}
export const RECIPES:CraftRecipe[]=[
  {id:'pill-qi',profession:'alchemy',name:'聚气丹方',level:0,output:'qi',amount:2,herbs:4,dust:0,materials:{},desc:'凝露草炼成两枚聚气丹。'},
  {id:'pill-heal',profession:'alchemy',name:'回春丹方',level:2,building:'alchemy',output:'heal',amount:3,herbs:5,dust:0,materials:{moonleaf:1},desc:'月华入药，炼出三枚回春丹。'},
  {id:'pill-tonic',profession:'alchemy',name:'养元灵液方',level:5,building:'alchemy',output:'tonic',amount:1,herbs:6,dust:0,materials:{moonleaf:2,firefruit:1},desc:'用于下一轮副本，增强治疗与营地补给。'},
  {id:'smith-dust',profession:'smith',name:'玄铁淬砂法',level:0,output:'dust',amount:8,herbs:0,dust:0,materials:{ore:3},desc:'将玄铁炼成灵砂，供现有装备淬炼。'},
  {id:'smith-shards',profession:'smith',name:'词纹结晶法',level:2,building:'forge',output:'shards',amount:8,herbs:0,dust:2,materials:{ore:3,jade:2},desc:'炼成八枚洗练石。'},
  {id:'smith-jade',profession:'smith',name:'归元凝玉法',level:5,building:'forge',output:'jade',amount:8,herbs:0,dust:8,materials:{ore:6,firefruit:2},desc:'将矿材与火果凝为养成灵玉。'},
  {id:'charm-bolt',profession:'talisman',name:'雷击符式',level:0,output:'boltCharm',amount:2,herbs:2,dust:0,materials:{timber:2},desc:'战斗中造成2.2倍攻击伤害。'},
  {id:'charm-ward',profession:'talisman',name:'护身符式',level:2,output:'wardCharm',amount:2,herbs:0,dust:0,materials:{timber:3,jade:1},desc:'战斗中获得25%气血护盾。'},
  {id:'charm-cleanse',profession:'talisman',name:'净瘴符式',level:5,output:'cleanseCharm',amount:2,herbs:3,dust:0,materials:{timber:3,moonleaf:2},desc:'免疫毒瘴三轮，并恢复10%气血。'},
  {id:'array-sword',profession:'array',name:'锐金阵图',level:0,output:'swordArray',amount:1,herbs:0,dust:2,materials:{ore:2},desc:'下一轮副本全程伤害 +8%。'},
  {id:'array-ward',profession:'array',name:'厚土阵图',level:2,output:'wardArray',amount:1,herbs:0,dust:2,materials:{timber:2,ore:2},desc:'下一轮副本全程来伤降低10%。'},
  {id:'array-spring',profession:'array',name:'聚灵阵图',level:5,output:'springArray',amount:1,herbs:0,dust:3,materials:{moonleaf:2,jade:2},desc:'下一轮副本每次存活敌方行动后回灵3点。'}
];
export const FATES=[{id:'promise',name:'守诺之心',desc:'作出三次守诺选择；开战获得6%气血护盾。'},{id:'seeker',name:'问道求真',desc:'作出三次求索选择；修炼收益 +5%。'},{id:'victor',name:'争胜锋芒',desc:'作出三次争胜选择；首领战伤害 +5%。'},{id:'traveler',name:'山河行者',desc:'累计通关十次；副本灵石奖励 +8%。'},{id:'artisan',name:'百艺通玄',desc:'四艺等级合计达到12；制作经验 +15%。'},{id:'companion',name:'同舟共济',desc:'出战灵兽亲密60，师徒关系60；灵兽协同效果 +15%。'}] as const;
export const FATE_STORIES=[{name:'山门旧约',desc:'故人托你护送一株灵药，途中却听闻遗府开启。你如何选择？'},{name:'断碑疑局',desc:'古碑前，两位散修为残篇归属争执。石隙里还藏着一段无人留意的铭文。'},{name:'险道争渡',desc:'灵舟只余一席，岸边既有负伤同道，也有与你争夺机缘的对手。'}];

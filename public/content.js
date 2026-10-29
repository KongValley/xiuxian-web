export const PATHS = [
  { id:'immortal', name:'仙修', mark:'仙', motto:'澄心明道，御气归真', desc:'顺应天道，灵力悠长，擅长修炼与回元。', passive:'修炼收益 +15% · 灵力上限 +20 · 突破成功率 +5%', skill:'太清回元', skillDesc:'恢复 30% 气血上限与 18 灵力；每场一次，消耗一回合。', ending:'羽化登仙', color:'jade' },
  { id:'demon', name:'魔修', mark:'魔', motto:'以血问道，一念焚天', desc:'逆命而行，以较弱防御换取爆发与汲血。', passive:'攻击 +20% · 防御 −2 · 造成伤害时汲血 12%', skill:'血焰斩', skillDesc:'消耗 12% 气血上限与 10 灵力，造成 3 倍攻击伤害；每场一次。', ending:'证道魔尊', color:'crimson' },
  { id:'yao', name:'妖修', mark:'妖', motto:'山海为骨，万灵归身', desc:'唤醒山海血脉，以强健体魄持久迎战。', passive:'气血上限 +25% · 防御 +3', skill:'妖魂咆哮', skillDesc:'消耗 14 灵力，造成 2 倍攻击伤害，获得 20% 气血上限护盾；每场一次。', ending:'万妖之圣', color:'amber' }
];
export const SLOTS = { weapon:'武器', armor:'法衣', charm:'佩饰' };
export const EQUIPMENT = [
  {id:'bambooSword',name:'青竹剑',slot:'weapon',mark:'剑',tier:0,realm:0,price:35,attack:4,desc:'以百年青竹削成，轻灵不凡。'},
  {id:'linenRobe',name:'素云袍',slot:'armor',mark:'袍',tier:0,realm:0,price:40,hp:15,defense:2,desc:'云纹护身，拂去山中风寒。'},
  {id:'dewPendant',name:'凝露佩',slot:'charm',mark:'佩',tier:0,realm:0,price:45,energy:10,desc:'一滴晨露封入玉中，温养灵台。'},
  {id:'cloudSword',name:'流云剑',slot:'weapon',mark:'剑',tier:1,realm:1,price:130,attack:12,desc:'出鞘如云卷，剑意破长空。'},
  {id:'mistRobe',name:'玄雾法衣',slot:'armor',mark:'衣',tier:1,realm:1,price:145,hp:35,defense:5,desc:'玄雾织就，刀锋难入。'},
  {id:'starPendant',name:'七星佩',slot:'charm',mark:'星',tier:1,realm:1,price:150,energy:18,defense:2,desc:'星辉在玉，灵气流转不息。'},
  {id:'heavenSword',name:'斩霄剑',slot:'weapon',mark:'霄',tier:2,realm:2,price:360,attack:25,desc:'金丹淬锋，一剑斩开云霄。'},
  {id:'dragonRobe',name:'苍龙宝甲',slot:'armor',mark:'甲',tier:2,realm:2,price:380,hp:70,defense:9,desc:'鳞甲含光，承山海之重。'},
  {id:'voidPendant',name:'太虚环',slot:'charm',mark:'环',tier:2,realm:2,price:400,energy:30,attack:6,desc:'虚空一环，万象凝于方寸。'}
];
export const ARTIFACTS = [
  {id:'spiritBell',name:'青纹铃',mark:'铃',tier:0,realm:0,price:70,defense:2,cost:14,skill:'青铃镇魂',effect:'bell',desc:'造成 1.8 倍攻击伤害，并获得 12 点护盾。'},
  {id:'scarletMirror',name:'赤霄镜',mark:'镜',tier:1,realm:1,price:220,attack:5,cost:20,skill:'赤霄焚影',effect:'blast',desc:'镜中赤光焚影，造成 2.8 倍攻击伤害。'},
  {id:'originCauldron',name:'归元鼎',mark:'鼎',tier:1,realm:1,price:230,hp:25,cost:16,skill:'万气归元',effect:'heal',desc:'恢复 40% 气血上限与 12 灵力，适合持久战。'},
  {id:'pureWhisk',name:'太清拂尘',mark:'尘',tier:1,realm:1,path:'immortal',price:260,energy:15,cost:18,skill:'太清荡尘',effect:'pure',desc:'仙修专属：造成 2.2 倍攻击伤害，恢复 20% 气血上限。'},
  {id:'soulBanner',name:'噬魂幡',mark:'幡',tier:1,realm:1,path:'demon',price:260,attack:8,cost:18,skill:'噬魂血祭',effect:'drain',desc:'魔修专属：造成 2.5 倍攻击伤害，额外汲血 30%。'},
  {id:'seaSeal',name:'山海印',mark:'印',tier:1,realm:1,path:'yao',price:260,hp:30,defense:2,cost:18,skill:'山海镇岳',effect:'seal',desc:'妖修专属：造成 2 倍攻击伤害，获得 25% 气血上限护盾。'}
];
export const STARTER_GEAR = { bambooSword:0, linenRobe:0 };
export const STARTER_ARTIFACTS = { spiritBell:0 };
export const gearBonus = (item, level = 0) => Object.fromEntries(['attack','defense','hp','energy'].map(k=>[k,Math.round((item[k] || 0) * (1 + level * .3))]));
export function upgradeCost(item, level) { return { stones:20*(item.tier+1)*(level+1),dust:(2+level*2)*(item.tier+1) }; }

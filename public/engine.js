import { PATHS, SLOTS, EQUIPMENT, ARTIFACTS, STARTER_GEAR, STARTER_ARTIFACTS, gearBonus, upgradeCost, equippedSet } from './content.js';
export const REALMS = ['炼气', '筑基', '金丹', '元婴', '化神', '渡劫'];
export const STAGES = ['初期', '中期', '后期'];
export const BOOKS = [
  { id: 'breath', name: '太虚吐纳诀', type: '心法', grade: '凡品', desc: '调息凝神，引天地灵气入体。每级提升修炼收益 20%。', cost: 30, max: 5 },
  { id: 'sword', name: '青莲剑歌', type: '剑诀', grade: '灵品', desc: '一剑生青莲。每级增加 5 点攻击，强化御剑一击。', cost: 45, max: 5 },
  { id: 'body', name: '长生锻体经', type: '炼体', grade: '灵品', desc: '以灵气温养筋骨。每级增加 20 点气血上限、2 点防御。', cost: 40, max: 5 }
];
export const ITEMS = [
  { id: 'qi', name: '聚气丹', label: '聚', desc: '恢复 40 点灵力', price: 15, kind: '丹药' },
  { id: 'heal', name: '回春丹', label: '春', desc: '恢复 60 点气血', price: 20, kind: '丹药' },
  { id: 'focus', name: '凝神丹', label: '凝', desc: '下次突破成功率 +20%', price: 60, kind: '丹药' },
  { id: 'herb', name: '凝露草', label: '草', desc: '炼丹材料 · 出售得 5 灵石', price: 12, kind: '灵材' }
];
export const REGIONS = [
  { id: 'bamboo', name: '青竹林', subtitle: '竹风拂面，灵气初生', realm: 0, risk: '初入仙途', energy: 15, enemy: '山间灵狼', hp: 48, atk: 11, reward: 24, mark: '竹', color: 'green' },
  { id: 'valley', name: '落霞谷', subtitle: '霞光深处，自有机缘', realm: 1, risk: '筑基可入', energy: 20, enemy: '赤焰妖狐', hp: 150, atk: 28, reward: 65, mark: '霞', color: 'rose' },
  { id: 'ruins', name: '玄天遗境', subtitle: '千载残碑，问道无声', realm: 2, risk: '金丹可入', energy: 25, enemy: '守境石傀', hp: 340, atk: 47, reward: 140, mark: '玄', color: 'blue' },
  { id: 'sea', name: '无妄海', subtitle: '云海无涯，一念渡劫', realm: 3, risk: '元婴可入', energy: 30, enemy: '沧海蛟影', hp: 590, atk: 70, reward: 260, mark: '海', color: 'gold' }
];
export const QUESTS = [
  { id: 'practice', title: '初窥门径', desc: '完成三次吐纳或闭关', key: 'cultivates', goal: 3, reward: 30 },
  { id: 'explore', title: '山外有山', desc: '完成一次山河历练', key: 'explores', goal: 1, reward: 25 },
  { id: 'break', title: '破境而生', desc: '成功突破一次境界', key: 'breaks', goal: 1, reward: 60 },
  { id: 'fight', title: '剑心初成', desc: '战胜三只妖兽', key: 'wins', goal: 3, reward: 80 },
  { id: 'master', title: '道法自然', desc: '研习功法五次', key: 'studies', goal: 5, reward: 120 },
  { id: 'ascend', title: '长生可期', desc: '成功突破九次境界', key: 'breaks', goal: 9, reward: 300 }
];
export function createGame(name = '云归客') {
  return { version: 2, name: name.slice(0, 12), day: 1, realm: 0, stage: 0, xp: 0, hp: 100, energy: 100, stones: 88,
    path:null, gear:{...STARTER_GEAR}, artifacts:{...STARTER_ARTIFACTS}, equipped:{weapon:null,armor:null,charm:null,artifact:null}, dust:0,
    books: { breath: 1, sword: 0, body: 0 }, items: { qi: 2, heal: 2, focus: 0, herb: 3 }, focus: false, pity: 0,
    stats: { cultivates: 0, explores: 0, breaks: 0, wins: 0, studies: 0 }, claimed: [], pending: null, ended: false,
    logs: [{ day: 1, type: 'story', text: '你自山下而来，携一卷《太虚吐纳诀》，于青云山结庐。从此，红尘渐远，仙途初启。' }] };
}
export function attributes(s) {
  const rank = s.realm * 3 + s.stage;
  const bonus={attack:0,defense:0,hp:0,energy:0};
  for(const id of Object.values(s.equipped || {})) {
    const item=[...EQUIPMENT,...ARTIFACTS].find(x=>x.id===id);
    if(item){const b=gearBonus(item,(s.gear?.[id] ?? s.artifacts?.[id]) || 0,s.path);for(const k of Object.keys(bonus))bonus[k]+=b[k];}
  }
  const set=equippedSet(s);if(set)for(const [k,v]of Object.entries(set.bonus))bonus[k]+=v;
  return { maxHp: Math.round((100 + rank * 24 + s.books.body * 20 + bonus.hp)*(s.path==='yao'?1.25:1)), maxEnergy: 100 + s.realm * 10 + bonus.energy + (s.path==='immortal'?20:0), attack: Math.round((14 + rank * 6 + s.books.sword * 5 + bonus.attack)*(s.path==='demon'?1.2:1)), defense: Math.max(0,3 + rank * 2 + s.books.body * 2 + bonus.defense + (s.path==='yao'?3:s.path==='demon'?-2:0)), xpNeed: Math.round(100 * (1 + rank * 0.6)), chance: Math.min(100, 80 - s.realm * 5 + (s.focus ? 20 : 0) + s.pity * 10 + (s.path==='immortal'?5:0)) };
}
export function endingLabel(s) { return PATHS.find(p=>p.id===s.path)?.ending || '羽化登仙'; }
export function realmLabel(s) { return s.ended ? endingLabel(s) : REALMS[s.realm] + ' · ' + STAGES[s.stage]; }
export function cultivationRate(s) { return (1+s.books.breath*.2)*(s.path==='immortal'?1.15:1); }
function clampVitals(s) { const a=attributes(s);s.hp=Math.min(s.hp,a.maxHp);s.energy=Math.min(s.energy,a.maxEnergy); }
export function calendar(day) {
  return `道历${Math.floor((day - 1) / 360) + 1}年 · ${['春', '夏', '秋', '冬'][Math.floor(((day - 1) % 360) / 90)]} · 第${(day - 1) % 360 + 1}日`;
}
function log(s, text, type = 'normal') { s.logs.unshift({ day: s.day, type, text }); s.logs = s.logs.slice(0, 100); }
function gainXp(s, n) { const a = attributes(s), gain = Math.min(n, a.xpNeed - s.xp); s.xp += gain; return gain; }
function rand(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function spend(s, energy, days = 1) { if (s.energy < energy) return false; s.energy -= energy; s.day += days; return true; }
function fail(message) { return { ok: false, message }; }
function dropLoot(s, catalog, rng) {
  const pool=catalog.filter(i=>i.realm<=s.realm && (!i.path || i.path===s.path));
  if(!pool.length)return '';
  const item=pool[rand(rng,0,pool.length-1)], owned=catalog===EQUIPMENT?s.gear:s.artifacts;
  if(Object.hasOwn(owned,item.id)){s.dust+=3;return `重复灵物化为灵砂 +3。`;}
  owned[item.id]=0;return `获得${item.name}！可在灵装法宝中装备。`;
}
function combatDamage(s, damage, label, rng, extraDrain=0) {
  const e=s.pending,actual=Math.min(e.hp,damage), a=attributes(s);
  e.hp=Math.max(0,e.hp-damage);e.turns.push(`${label}，造成 ${damage} 点伤害。`);
  const drain=(s.path==='demon'?.12:0)+extraDrain+(equippedSet(s)?.drain||0);
  if(drain){const heal=Math.min(a.maxHp-s.hp,Math.round(actual*drain));s.hp+=heal;if(heal)e.turns.push(`汲取生机，气血 +${heal}。`);}
  if(e.hp>0)return null;
  const r=REGIONS.find(x=>x.id===e.region), xp=gainXp(s,35+r.realm*20),dust=1+r.realm;
  s.stones+=r.reward;s.items.herb+=2;s.stats.wins++;s.stats.explores++;s.dust+=dust;
  const loot=rng()<.35?dropLoot(s,EQUIPMENT,rng):'';
  log(s,`击败${e.name}！修为 +${xp}，灵石 +${r.reward}，凝露草 ×2，灵砂 +${dust}。${loot}`,'battle');
  s.pending=null;return `历练得胜 · 灵石 +${r.reward}${loot?' · '+loot:''}`;
}
function enemyAttack(s, rng, guard = false) {
  const e = s.pending;
  let damage = Math.max(1, rand(rng, e.attack - 2, e.attack + 3) - attributes(s).defense - (guard ? 7 + s.realm * 3 : 0));
  if(e.shield){const absorbed=Math.min(e.shield,damage);e.shield-=absorbed;damage-=absorbed;e.turns.push(`护盾吸收 ${absorbed} 点伤害。`);}
  e.artifactCooldown=Math.max(0,(e.artifactCooldown||0)-1);
  s.hp = Math.max(0, s.hp - damage);
  e.turns.push(`${e.name}发起攻击，你受到 ${damage} 点伤害。`);
  e.turns = e.turns.slice(-8);
  if (s.hp <= 0) {
    const loss = Math.min(s.stones, Math.round(s.stones * 0.15)); s.stones -= loss;
    s.hp = Math.ceil(attributes(s).maxHp * 0.4); s.energy = Math.min(s.energy, 25); s.day += 2;
    log(s, `不敌${e.name}，借遁符退回洞府。疗伤两日，遗失 ${loss} 灵石。`, 'danger'); s.pending = null;
    return '灵符护住了心脉，你已退回洞府。';
  }
  const set=equippedSet(s);
  if(set?.heal){
    const a=attributes(s),h=Math.min(a.maxHp-s.hp,set.heal),n=Math.min(a.maxEnergy-s.energy,set.energyRegen);
    s.hp+=h;s.energy+=n;
    if(h||n)e.turns.push(`${set.name}清气回流，气血 +${h}，灵力 +${n}。`);
    e.turns=e.turns.slice(-8);
  }
  return null;
}
export function act(s, action, payload, rng = Math.random) {
  if (s.ended && !['use', 'sell', 'buy', 'study', 'claim', 'buyGear', 'buyArtifact', 'equip', 'equipArtifact', 'unequip', 'upgradeGear', 'upgradeArtifact'].includes(action)) return fail('你已证道长生。可以在设置中开启新一段仙途。');
  if (s.pending && !['choice', 'attack', 'skill', 'guard', 'flee', 'use', 'pathSkill', 'artifactSkill'].includes(action)) return fail('先完成眼前的机缘，再继续仙途。');
  const a = attributes(s);
  let message = '';
  switch (action) {
    case 'cultivate': case 'retreat': {
      if (s.xp >= a.xpNeed) return fail('修为已圆满，请先尝试突破。');
      const retreat = action === 'retreat', cost = retreat ? 28 : 10;
      if (!spend(s, cost, retreat ? 3 : 1)) return fail('灵力不足，先静养或服用聚气丹。');
      const amount = gainXp(s, Math.round(rand(rng, 17, 23) * cultivationRate(s) * (retreat ? 3.2 : 1)));
      s.stats.cultivates++;
      log(s, `${retreat ? '闭关三日' : '静坐吐纳'}，周天运转，丹田渐盈。修为 +${amount}。`, 'cultivate'); message = `修为 +${amount}`; break;
    }
    case 'rest': {
      if (s.energy >= a.maxEnergy && s.hp >= a.maxHp) return fail('气血与灵力充盈，无需静养。');
      s.day++; const e = Math.min(45, a.maxEnergy - s.energy), h = Math.min(35, a.maxHp - s.hp);
      s.energy += e; s.hp += h; log(s, `听泉静养一日，心神渐宁。灵力 +${e}，气血 +${h}。`, 'rest'); message = '一夜好眠，身心渐复'; break;
    }
    case 'gather': {
      if (!spend(s, 8)) return fail('灵力不足，先静养一日。');
      const herbs = rand(rng, 1, 3), stones = rand(rng, 5, 12) + s.realm * 3;
      s.items.herb += herbs; s.stones += stones; log(s, `踏露采药，寻得凝露草 ×${herbs}，山溪灵石 +${stones}。`, 'explore'); message = `凝露草 +${herbs} · 灵石 +${stones}`; break;
    }
    case 'breakthrough': {
      if (s.xp < a.xpNeed) return fail('修为尚未圆满，继续修炼吧。');
      if (s.energy < 20) return fail('突破至少需要 20 点灵力。');
      spend(s, 20);
      const success = rng() * 100 < a.chance; s.focus = false;
      if (success) {
        s.stats.breaks++; s.pity = 0; s.xp = 0;
        if (s.stage === 2 && s.realm === 5) { s.ended = true; log(s, `九霄雷尽，一念天开。你终于越过生死，${endingLabel(s)}。万千山河，自此皆是故乡。`, 'break'); message = `恭喜道友，${endingLabel(s)}！`; }
        else {
          if (s.stage < 2) s.stage++; else { s.stage = 0; s.realm++; }
          const next = attributes(s); s.hp = next.maxHp; s.energy = next.maxEnergy;
          log(s, `灵台澄明，桎梏尽碎！突破至${realmLabel(s)}，气血与灵力尽复。`, 'break'); message = `破境成功 · ${realmLabel(s)}`;
        }
      } else { s.pity++; s.xp = Math.round(a.xpNeed * 0.8); log(s, `冲关未成，灵气渐散。保留八成修为，下次突破成功率额外 +${s.pity * 10}%。`, 'danger'); message = '破境未成，道心却更坚定了'; }
      break;
    }
    case 'explore': {
      const region = REGIONS.find(x => x.id === payload); if (!region || s.realm < region.realm) return fail('境界不足，此地暂不可入。');
      if (s.hp < a.maxHp * 0.25) return fail('伤势过重，先静养或服用回春丹。');
      if (!spend(s, region.energy)) return fail('灵力不足，先恢复灵力再出发。');
      const roll = rng();
      if (roll < 0.4) {
        const set=equippedSet(s),shield=Math.round(a.maxHp*(set?.shield||0));
        s.pending = { kind: 'combat', region: region.id, name: region.enemy, hp: region.hp, maxHp: region.hp, attack: region.atk, shield,pathUsed:false,artifactCooldown:0, turns: [`穿过山雾，${region.enemy}拦住了去路。`,...(shield?[`${set.name}山海护身，获得 ${shield} 点护盾。`]:[])] };
        log(s, `游历${region.name}，遭遇${region.enemy}。`, 'explore'); message = '妖兽现身，凝神应战';
      } else if (roll < 0.75) {
        s.pending = { kind: 'event', region: region.id, title: '山中有隐客', desc: '松荫下，一位白发散修正对着残缺的棋局出神。他抬眼看你：“道友，可愿坐下，与我共论此局？”', variant: 'sage' }; message = '机缘已至，请作抉择';
      } else {
        s.pending = { kind: 'event', region: region.id, title: '石壁后的微光', desc: '山道尽处，一线灵光自石缝溢出。苔痕下藏着前人留下的禁制，近旁却有一片成熟的灵草。', variant: 'cave' }; message = '山河之间，另有天地';
      }
      break;
    }
    case 'choice': {
      if (s.pending?.kind !== 'event') return fail('眼前没有可选机缘。');
      if (!['accept', 'safe'].includes(payload)) return fail('请选择有效选项。');
      const e = s.pending, region = REGIONS.find(x => x.id === e.region), high = payload === 'accept';
      if (high && e.variant === 'sage' && s.stones < 12) return fail('共饮灵茶需 12 灵石。也可问路辞行。');
      let outcome = '';
      if (e.variant === 'sage' && high) { s.stones -= 12; const xp = gainXp(s, 48 + s.realm * 12); s.items.focus++; outcome = `与隐客论道，修为 +${xp}，获赠凝神丹 ×1。`; }
      else if (e.variant === 'cave' && high) {
        if (rng() < 0.7) { s.stones += region.reward * 2; s.items.qi++; outcome = `破开禁制，寻得旧日遗藏。灵石 +${region.reward * 2}，聚气丹 ×1。`; if(rng()<.2)outcome+=dropLoot(s,ARTIFACTS,rng); }
        else { const hurt = Math.min(s.hp - 1, 20 + s.realm * 5); s.hp -= hurt; s.items.herb += 2; outcome = `禁制反噬，气血 -${hurt}。撤离时采得凝露草 ×2。`; }
      } else { const xp = gainXp(s, 15 + s.realm * 5); s.stones += region.reward; s.items.herb++; outcome = `从容踏过山径，修为 +${xp}，灵石 +${region.reward}，凝露草 ×1。`; }
      s.stats.explores++; log(s, `${region.name}奇遇：${outcome}`, 'explore'); s.pending = null; message = outcome; break;
    }
    case 'attack': case 'skill': case 'guard': case 'flee': {
      if (s.pending?.kind !== 'combat') return fail('当前没有战斗。');
      const e = s.pending;
      if (action === 'flee') {
        if (rng() < 0.8) { log(s, `收敛气息，从${e.name}眼前遁走，平安返回洞府。`, 'normal'); s.pending = null; message = '暂避锋芒，平安归来'; break; }
        e.turns.push('遁走未成，被妖兽追上。');
      } else if (action === 'guard') { const energy = Math.min(12, a.maxEnergy - s.energy); s.energy += energy; e.turns.push(`凝气守心，恢复 ${energy} 点灵力，抵御本轮伤害。`); }
      else {
        if (action === 'skill' && s.energy < 12) return fail('御剑一击需要 12 点灵力。');
        const isSkill = action === 'skill'; if (isSkill) s.energy -= 12;
        const damage = Math.round(rand(rng, a.attack - 2, a.attack + 4) * (isSkill ? 1.8 + s.books.sword * 0.1 : 1));
        const victory=combatDamage(s,damage,isSkill?'御剑一击，剑气如虹':'你凝气出手',rng);
        if(victory){message=victory;break;}
      }
      message = enemyAttack(s, rng, action === 'guard') || '剑意未歇，战局仍在继续';
      if (s.pending) s.pending.turns = s.pending.turns.slice(-8);
      break;
    }
    case 'pathSkill': case 'artifactSkill': {
      if(s.pending?.kind!=='combat')return fail('神通与法宝只可在战斗中施展。');
      const e=s.pending;
      let damage=0,label='',extraDrain=0;
      if(action==='pathSkill'){
        const p=PATHS.find(p=>p.id===s.path);
        if(!p)return fail('请先在三途问道中选择修行路径。');
        if(e.pathUsed)return fail('本场已施展本命神通。');
        if(s.path==='demon'&&(s.hp<=Math.ceil(a.maxHp*.12)||s.energy<10))return fail('血焰斩需要 10 灵力，且气血必须高于上限的 12%。');
        if(s.path==='yao'&&s.energy<14)return fail('妖魂咆哮需要 14 灵力。');
        e.pathUsed=true;label=p.skill;
        if(s.path==='immortal'){const h=Math.min(a.maxHp-s.hp,Math.round(a.maxHp*.3)),n=Math.min(a.maxEnergy-s.energy,18);s.hp+=h;s.energy+=n;e.turns.push(`太清回元，气血 +${h}，灵力 +${n}。`);}
        if(s.path==='demon'){const h=Math.ceil(a.maxHp*.12);s.hp-=h;s.energy-=10;damage=Math.round(a.attack*3);e.turns.push(`燃血 ${h}，唤起血焰。`);}
        if(s.path==='yao'){s.energy-=14;damage=Math.round(a.attack*2);e.shield=Math.max(e.shield,Math.round(a.maxHp*.2));e.turns.push(`山海护体，护盾提升至 ${e.shield}。`);}
      }else{
        const item=ARTIFACTS.find(i=>i.id===s.equipped.artifact);
        if(!item)return fail('请先在灵装法宝中装备法宝。');
        if(e.artifactCooldown>0)return fail(`法宝尚需冷却 ${e.artifactCooldown} 回合。`);
        if(s.energy<item.cost)return fail(`催动${item.name}需要 ${item.cost} 灵力。`);
        s.energy-=item.cost;e.artifactCooldown=4;label=item.skill;
        const scale=1+s.artifacts[item.id]*.2, effect=item.effect;
        const multiplier={bell:1.8,blast:2.8,pure:2.2,drain:2.5,seal:2}[effect]||0;
        damage=Math.round(a.attack*multiplier*scale);
        if(effect==='bell'||effect==='seal'){e.shield=Math.max(e.shield,Math.min(a.maxHp,Math.round((effect==='bell'?12:a.maxHp*.25)*scale)));e.turns.push(`法宝护持，护盾提升至 ${e.shield}。`);}
        if(effect==='pure'||effect==='heal'){const h=Math.min(a.maxHp-s.hp,Math.round(a.maxHp*(effect==='pure'?.2:.4)*scale));s.hp+=h;e.turns.push(`${item.skill}，气血 +${h}。`);}
        if(effect==='heal'){const n=Math.min(a.maxEnergy-s.energy,12);s.energy+=n;e.turns.push(`鼎中灵气回流，灵力 +${n}。`);}
        if(effect==='drain')extraDrain=.3;
      }
      if(damage){const victory=combatDamage(s,damage,label,rng,extraDrain);if(victory){message=victory;break;}}
      message=enemyAttack(s,rng)||`${label}已施展`;break;
    }
    case 'choosePath': {
      const p=PATHS.find(p=>p.id===payload);if(!p)return fail('请选择仙、魔、妖中的一条路径。');
      if(s.path===p.id)return fail('你已在此道上修行。');
      if(s.path&&s.stones<100)return fail('改修需要 100 灵石。首次入道免费。');
      if(s.path){s.stones-=100;s.day++;}
      s.path=p.id;
      const artifact=ARTIFACTS.find(i=>i.id===s.equipped.artifact);
      if(artifact?.path&&artifact.path!==s.path)s.equipped.artifact=null;
      clampVitals(s);log(s,`立下道心，踏上${p.name}之路：${p.motto}。`,'story');message=`已踏入${p.name}之道`;break;
    }
    case 'buyGear': case 'buyArtifact': {
      const isGear=action==='buyGear',catalog=isGear?EQUIPMENT:ARTIFACTS,owned=isGear?s.gear:s.artifacts,item=catalog.find(i=>i.id===payload);
      if(!item)return fail('未寻得此灵物。');
      if(Object.hasOwn(owned,item.id))return fail('此灵物已在库中，无需重复购买。');
      if(s.realm<item.realm)return fail(`此物需${REALMS[item.realm]}境界才能使用。`);
      if(item.path&&item.path!==s.path)return fail('此法宝仅供对应路径修士使用。');
      if(s.stones<item.price)return fail('灵石不足。');
      s.stones-=item.price;owned[item.id]=0;log(s,`坊市购得${item.name}，花费 ${item.price} 灵石。`);message=`${item.name}已收入灵库`;break;
    }
    case 'equip': case 'equipArtifact': {
      const isGear=action==='equip',item=(isGear?EQUIPMENT:ARTIFACTS).find(i=>i.id===payload),owned=isGear?s.gear:s.artifacts;
      if(!item||!Object.hasOwn(owned,item.id))return fail('你尚未拥有此灵物。');
      if(s.realm<item.realm)return fail('境界不足，无法驾驭此物。');
      if(item.path&&item.path!==s.path)return fail('修行路径不符，无法炼化此法宝。');
      const slot=isGear?item.slot:'artifact';if(s.equipped[slot]===item.id)return fail('此物已装备。');
      s.equipped[slot]=item.id;clampVitals(s);log(s,`${isGear?'穿戴':'炼化'}${item.name}。`);message=`已装备${item.name}`;break;
    }
    case 'unequip': {
      if(![...Object.keys(SLOTS),'artifact'].includes(payload)||!s.equipped[payload])return fail('此栏位未装备灵物。');
      s.equipped[payload]=null;clampVitals(s);message='已卸下灵物';log(s,'收起一件灵物，重新调息。');break;
    }
    case 'upgradeGear': case 'upgradeArtifact': {
      const isGear=action==='upgradeGear',item=(isGear?EQUIPMENT:ARTIFACTS).find(i=>i.id===payload),owned=isGear?s.gear:s.artifacts;
      if(!item||!Object.hasOwn(owned,item.id))return fail('你尚未拥有此灵物。');
      const level=owned[item.id];if(level>=3)return fail('此物已淬炼至三重。');
      const cost=upgradeCost(item,level);
      if(s.stones<cost.stones||s.dust<cost.dust)return fail(`淬炼需要 ${cost.stones} 灵石与 ${cost.dust} 灵砂。`);
      if(s.energy<8)return fail('淬炼需要 8 灵力。');
      s.stones-=cost.stones;s.dust-=cost.dust;spend(s,8);owned[item.id]++;clampVitals(s);
      log(s,`淬炼${item.name}至 +${owned[item.id]}，耗费 ${cost.stones} 灵石、${cost.dust} 灵砂。`,'cultivate');message=`${item.name}淬炼至 +${owned[item.id]}`;break;
    }
    case 'buy': {
      const item = ITEMS.find(x => x.id === payload); if (!item) return fail('此物不在坊市中。');
      if (s.stones < item.price) return fail('灵石不足，可采药、历练或出售灵材。');
      s.stones -= item.price; s.items[item.id]++; log(s, `坊市购得${item.name} ×1，花费 ${item.price} 灵石。`); message = `已收入行囊 · ${item.name}`; break;
    }
    case 'sell': {
      if (payload !== 'herb' || s.items.herb < 1) return fail('行囊中没有可出售的凝露草。');
      s.items.herb--; s.stones += 5; message = '售出凝露草 · 灵石 +5'; log(s, '售出凝露草 ×1，灵石 +5。'); break;
    }
    case 'use': {
      const item = ITEMS.find(x => x.id === payload); if (!item || payload === 'herb' || !s.items[payload]) return fail('行囊中没有此丹药。');
      if (payload === 'qi') { if (s.energy >= a.maxEnergy) return fail('灵力充盈，暂时无需服丹。'); const n = Math.min(40, a.maxEnergy - s.energy); s.energy += n; message = `聚气丹入腹 · 灵力 +${n}`; }
      if (payload === 'heal') { if (s.hp >= a.maxHp) return fail('气血充盈，暂时无需服丹。'); const n = Math.min(60, a.maxHp - s.hp); s.hp += n; message = `药力化开 · 气血 +${n}`; }
      if (payload === 'focus') { if (s.focus) return fail('凝神之效尚在，下次突破生效。'); if (s.pending) return fail('凝神丹需在洞府静心服用。'); s.focus = true; message = '心神澄澈 · 下次突破成功率 +20%'; }
      s.items[payload]--; log(s, message, 'rest');
      if (s.pending?.kind === 'combat') { s.pending.turns.push(message); message = enemyAttack(s, rng) || message; }
      break;
    }
    case 'alchemy': {
      if (s.items.herb < 3) return fail('炼丹需要 3 株凝露草。');
      if (!spend(s, 10)) return fail('炼丹需要 10 点灵力。');
      s.items.herb -= 3; s.items.qi++; log(s, '文火慢炼，丹香满室。凝露草 ×3 化为聚气丹 ×1。', 'rest'); message = '炼制成功 · 聚气丹 +1'; break;
    }
    case 'study': {
      const b = BOOKS.find(x => x.id === payload); if (!b) return fail('未寻得此功法。');
      const level = s.books[b.id], cost = b.cost * (level + 1);
      if (level >= b.max) return fail('此功法已臻圆满。');
      if (s.stones < cost) return fail(`研习需 ${cost} 灵石，当前灵石不足。`);
      if (s.energy < 12) return fail('研习需要 12 点灵力。');
      s.stones -= cost; spend(s, 12); s.books[b.id]++; s.stats.studies++;
      if (b.id === 'body') s.hp += Math.min(20,attributes(s).maxHp-s.hp);
      log(s, `参悟《${b.name}》，功法提升至第 ${s.books[b.id]} 重。`, 'cultivate'); message = `${b.name} · 第${s.books[b.id]}重`; break;
    }
    case 'claim': {
      const q = QUESTS.find(x => x.id === payload);
      if (!q || s.claimed.includes(q.id) || s.stats[q.key] < q.goal) return fail('机缘尚未达成，或奖励已领取。');
      s.claimed.push(q.id); s.stones += q.reward; log(s, `仙途留痕「${q.title}」，获赠 ${q.reward} 灵石。`, 'story'); message = `领取机缘 · 灵石 +${q.reward}`; break;
    }
    default: return fail('未知的修行方式。');
  }
  return { ok: true, message };
}
export function validateSave(value) {
  if (!value || ![1,2].includes(value.version)) throw new Error('存档版本不兼容');
  const s = structuredClone(value);
  if(s.version===1){
    s.version=2;s.path=null;s.gear={...STARTER_GEAR};s.artifacts={...STARTER_ARTIFACTS};s.equipped={weapon:null,armor:null,charm:null,artifact:null};s.dust=0;
    if(s.pending?.kind==='combat'){s.pending.shield=0;s.pending.pathUsed=false;s.pending.artifactCooldown=0;}
  }
  if (typeof s.name !== 'string' || !s.name.trim() || s.name.length > 12) throw new Error('道号无效');
  for (const [key, min, max] of [['day',1,10000000],['realm',0,5],['stage',0,2],['stones',0,100000000],['xp',0,100000],['hp',1,10000],['energy',0,10000],['pity',0,100]]) {
    if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max) throw new Error('存档数值无效');
  }
  for (const b of BOOKS) if (!Number.isInteger(s.books?.[b.id]) || s.books[b.id] < 0 || s.books[b.id] > b.max) throw new Error('功法数据无效');
  for (const i of ITEMS) if (!Number.isInteger(s.items?.[i.id]) || s.items[i.id] < 0 || s.items[i.id] > 1000000) throw new Error('行囊数据无效');
  if(s.path!==null&&!PATHS.some(p=>p.id===s.path))throw new Error('修行路径无效');
  if(!Number.isInteger(s.dust)||s.dust<0||s.dust>10000000)throw new Error('灵砂数据无效');
  for(const [key,catalog] of [['gear',EQUIPMENT],['artifacts',ARTIFACTS]]){
    const owned=s[key];
    if(!owned||typeof owned!=='object'||Array.isArray(owned)||Object.entries(owned).some(([id,level])=>!catalog.some(i=>i.id===id)||!Number.isInteger(level)||level<0||level>3))throw new Error('灵库数据无效');
  }
  if(!s.equipped||typeof s.equipped!=='object'||Array.isArray(s.equipped)||Object.keys(s.equipped).length!==4)throw new Error('装备栏数据无效');
  for(const slot of [...Object.keys(SLOTS),'artifact']){
    const id=s.equipped[slot];if(id===null)continue;
    const isArtifact=slot==='artifact',item=(isArtifact?ARTIFACTS:EQUIPMENT).find(i=>i.id===id);
    if(!item||(!isArtifact&&item.slot!==slot)||!Object.hasOwn(isArtifact?s.artifacts:s.gear,id)||s.realm<item.realm||(item.path&&item.path!==s.path))throw new Error('装备栏与灵库不匹配');
  }
  for (const key of ['cultivates','explores','breaks','wins','studies']) if (!Number.isInteger(s.stats?.[key]) || s.stats[key] < 0) throw new Error('仙途记录无效');
  if (typeof s.focus !== 'boolean' || typeof s.ended !== 'boolean' || (s.ended && (s.realm !== 5 || s.stage !== 2))) throw new Error('境界数据无效');
  if (!Array.isArray(s.claimed) || s.claimed.some(x => !QUESTS.some(q => q.id === x)) || new Set(s.claimed).size !== s.claimed.length) throw new Error('机缘记录无效');
  if (!Array.isArray(s.logs) || s.logs.length > 100 || s.logs.some(x => typeof x.text !== 'string' || x.text.length > 1000 || !Number.isInteger(x.day) || x.day < 1 || typeof x.type !== 'string')) throw new Error('日志数据无效');
  const a = attributes(s);
  if (s.hp > a.maxHp || s.energy > a.maxEnergy || s.xp > a.xpNeed) throw new Error('角色属性超出上限');
  if (s.pending) {
    const e = s.pending, r = REGIONS.find(x => x.id === e.region);
    if (!r || r.realm > s.realm) throw new Error('历练地点无效');
    if (e.kind === 'combat') {
      if (e.name !== r.enemy || e.maxHp !== r.hp || e.attack !== r.atk || !Number.isInteger(e.hp) || e.hp < 1 || e.hp > r.hp || !Array.isArray(e.turns) || e.turns.length > 10 || e.turns.some(t => typeof t !== 'string' || t.length > 300)) throw new Error('战斗数据无效');
      if(typeof e.pathUsed!=='boolean'||!Number.isInteger(e.shield)||e.shield<0||e.shield>a.maxHp||!Number.isInteger(e.artifactCooldown)||e.artifactCooldown<0||e.artifactCooldown>3)throw new Error('神通或法宝状态无效');
    } else if (e.kind === 'event') {
      if (!['sage','cave'].includes(e.variant) || typeof e.title !== 'string' || e.title.length > 60 || typeof e.desc !== 'string' || e.desc.length > 500) throw new Error('奇遇数据无效');
    } else throw new Error('历练状态无效');
  }
  return s;
}

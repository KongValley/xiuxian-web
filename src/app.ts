import { createGame, attributes, realmLabel, endingLabel, cultivationRate, calendar, act, validateSave, REALMS, BOOKS, ITEMS, REGIONS, QUESTS } from './engine.js';
import { PATHS, SLOTS, EQUIPMENT, ARTIFACTS, GRADES, EQUIPMENT_SETS, gearBonus, affinityBonus, equippedSet, setEffects, upgradeCost } from './content.js';
import { FINAL_REALM, TOTAL_BREAKTHROUGHS, stageCount, worldLabel, nextStep, isAscension } from './realms.js';
import type { ArtifactItem, Bonus, EquipmentItem, LogEntry, SetEffect, SpiritItem } from './types.js';
import { breakthroughScene, previewBreakthrough } from './breakthrough-scene.js';
import { animationPreference, playBreakthrough, setAnimationEnabled } from './breakthrough-effects.js';
import { renderArtifactLibrary, artifactDetails } from './artifact-library.js';
import type { ArtifactFilters } from './artifact-library.js';
import { artifactPowerText, artifactStageLabel } from './artifacts.js';
import { findManual, manualEffects, manualEffectText, MAX_ACTIVE_BOOKS } from './manuals.js';

const paths: Record<string,string> = {
  home: '<path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-7h6v7"/>',
  mountain: '<path d="m2 20 7-14 4 8 3-5 6 11H2Z"/><path d="m7 10 2 2 2-2M15 13l1 2 2-1"/>',
  book: '<path d="M4 3h14a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2V3ZM4 17h16M8 3v14M12 7h4M12 10h4"/>',
  shop: '<path d="M4 10v10h16V10M3 4h18l1 6a3 3 0 0 1-5 1 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-1l1-6ZM9 20v-6h6v6"/>',
  bag: '<path d="m9 7-3-4h12l-3 4M8 7h8c1 4 5 5 5 10 0 4-18 4-18 0 0-5 4-6 5-10ZM8 7h8M10 12h4m-2 0v5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 2-1 4 4 2 3-1 3 3 4-2v-3l3-3-2-4-3-1-1-4-6-1Z"/><circle cx="12" cy="12" r="3"/>',
  scroll: '<path d="M5 3h12a3 3 0 0 1 3 3v2h-4M6 3a3 3 0 0 0-3 3v2h3v10a3 3 0 0 0 3 3h10a3 3 0 0 1-3-3V6M9 9h4m-4 4h4m-4 4h4"/>',
  leaf: '<path d="M20 3C9 2 2 7 5 15c8 5 17-1 15-12ZM3 21 16 8M9 15v-5m0 5h6"/>',
  meditate: '<circle cx="12" cy="5" r="2"/><path d="m8 10 4-2 4 2 2 5h3M3 15h3l2-5M9 12v4l-5 3c-1 2 2 3 8 1 6 2 9 1 8-1l-5-3v-4M9 16h6"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4 9 9 0 1 0 20 15Z"/><path d="m17 3 .5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z"/>',
  lotus: '<path d="M12 20C4 19 2 15 2 11c4 0 7 2 10 9Zm0 0c8-1 10-5 10-9-4 0-7 2-10 9ZM12 19C5 13 8 7 12 3c4 4 7 10 0 16Z"/>',
  coin: '<path d="m12 2 9 6v8l-9 6-9-6V8l9-6Z"/><path d="m12 6 5 3v6l-5 3-5-3V9l5-3Z"/><path d="M10 10h4v4h-4z"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-4 4 2 10 8 15 6-5 12-11 8-15Z"/>',
  drop: '<path d="M12 2c2 5 8 9 8 13a8 8 0 0 1-16 0c0-4 6-8 8-13Z"/><path d="M8 15c0 2 1 3 3 3"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  cloud: '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11H6Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  sword: '<path d="m5 3 15 15-2 2L3 5V3h2ZM4 16l4 4m0-4-5 5m4-7 3 3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  kettle: '<path d="M6 9h12v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9ZM4 9h16M9 5h6m-3 0V3M6 12H3v4h3m12-4h3v4h-3"/>',
};
const icon = (name: string) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
const escape = (str: unknown): string => String(str).replace(/[&<>"']/g, c => (({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' } as Record<string,string>)[c]));
const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => { const element=document.querySelector<T>(selector);if(!element)throw new Error(`Missing element: ${selector}`);return element; };
const SAVE_KEY = 'wendao-changsheng-v1';
let state = createGame(), tab = 'home', filter = 'all', shopSection = 'items', gearRealm = 'current', storageAvailable = true;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let breakthroughPlaying=false;
let artifactFilters:ArtifactFilters={realm:'current',effect:'all',status:'all',query:'',page:0};
let bookPath='current',bookRealm='current',bookStatus='all',bookType='all',bookSearch='',bookPage=0;
let loadWarning = '';
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) state = validateSave(JSON.parse(raw)); }
catch { loadWarning = '旧存档无法读取，已开启新仙途。你仍可导入备份。'; }
const navs = [
  ['home','洞府修行','home','01','且将尘事付清风，于一呼一吸间，觅长生之道。'],
  ['explore','山河历练','mountain','02','行过万里山河，方知天地之阔，吾道之长。'],
  ['books','藏经阁','book','03','万卷道藏藏万法，一灯如豆照初心。'],
  ['shop','云游坊市','shop','04','人间烟火处，也有仙家物。以有易无，各得其缘。'],
  ['bag','随身行囊','bag','05','一囊灵物，半卷闲书，伴你走过漫漫仙途。'],
  ['gear','灵装法宝','sword','06','灵器护身，法宝随心，一身所系，皆是道途。'],
  ['paths','三途问道','lotus','07','仙魔妖三途，并无高下。道心所向，便是归处。'],
];
const actionButton = (action: string, text: string, payload = '', kind = 'primary', disabled = false) => `<button class="btn ${kind}" data-action="${action}" data-value="${payload}"${disabled ? ' disabled' : ''}>${text}</button>`;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('#save-status').innerHTML = `<span class="status-dot"></span>${storageAvailable ? '仙途已自动记下' : '无法自动存档，请导出备份'}`;
}
function toast(message: string) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3100);
}
function renderNavigation() {
  $('#navigation').innerHTML = navs.map(([id,label,i,num]) => `<button class="nav-item ${tab === id ? 'active' : ''}" data-tab="${id}" title="${label}" aria-label="${label}"${tab === id ? ' aria-current="page"' : ''}>${icon(i)}<span>${label}</span><span class="nav-num">${num}</span><span class="nav-arrow">›</span></button>`).join('');
}
function renderCharacter() {
  const a = attributes(state);
  const bars: [string,string,number,number,string][] = [ ['hp','气血',state.hp,a.maxHp,'heart'], ['energy','灵力',state.energy,a.maxEnergy,'drop'], ['xp','修为',state.xp,a.xpNeed,'lotus'] ];
  const path=PATHS.find(p=>p.id===state.path);
  $('#character').innerHTML = `<div class="character-header"><div class="avatar">${icon('meditate')}</div><div><div class="character-name">${escape(state.name)}<button data-ui="rename" aria-label="修改道号" title="修改道号">✎</button></div><span class="realm-tag">${realmLabel(state)}</span></div><span class="root-tag">${path?.name || '未入道'}</span></div>
  <div class="stat-bars">${bars.map(([key,name,val,max,i]) => `<div class="stat-group"><div class="stat-line"><span>${icon(i)}${name}</span><span class="stat-value">${val} <span style="color:#b6bba9">/ ${max}</span></span></div><div class="bar" role="progressbar" aria-label="${name}" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="${max}"><div class="bar-fill ${key}" style="width:${val / max * 100}%"></div></div></div>`).join('')}</div>
  <dl class="attributes"><div><dt>攻击</dt><dd>${a.attack}</dd></div><div><dt>防御</dt><dd>${a.defense}</dd></div><div><dt>道龄</dt><dd>${Math.floor((state.day - 1) / 360)} 年 ${((state.day - 1) % 360)} 日</dd></div><div><dt>功法</dt><dd>${state.activeBooks.length} / 10</dd></div></dl>
  <div class="wealth">${icon('coin')}<span>灵石</span><strong>${state.stones.toLocaleString()}</strong><small>枚</small></div>
  <div class="loadout-summary"><button data-tab="paths">${path ? path.name+' · '+path.skill : '仙 / 魔 / 妖 · 选择路径'} <span>↗</span></button><button data-tab="gear">${state.equipped.artifact ? ARTIFACTS.find(i=>i.id===state.equipped.artifact)!.name : '前往装备灵器与法宝'} <span>↗</span></button></div>
  <p class="character-note">${state.focus ? '凝神之效 · 下次突破成功率 +20%' : state.xp >= a.xpNeed ? '修为已圆满，正是破境好时机' : state.energy < 15 ? '灵力渐乏，不妨听泉静养一日' : '心若澄明，处处皆是修行'}</p>`;
}
function logMarkup(log: LogEntry) {
  const labels: Record<string,string> = { story:'仙缘', cultivate:'修行', rest:'静养', explore:'历练', battle:'战斗', break:'破境', danger:'波折', normal:'杂记' };
  const type = Object.hasOwn(labels, log.type) ? log.type : 'normal';
  return `<div class="log-entry ${type}"><div class="log-date">第 ${log.day} 日 <span class="log-type">${labels[type]}</span></div><p>${escape(log.text)}</p></div>`;
}
function renderLogs() {
  const logs = state.logs.filter(l => filter === 'all' || (filter === 'cultivate' ? ['cultivate','break','rest'].includes(l.type) : ['explore','battle'].includes(l.type)));
  $('#logs').innerHTML = logs.slice(0, 12).map(logMarkup).join('') || '<p class="log-empty">此间尚无记事，且去寻一段机缘。</p>';
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach(el => el.classList.toggle('active', el.dataset.filter === filter));
}
function sectionHeading(i: string, name: string, subtitle: string) { return `<div class="section-heading"><h2>${icon(i)}${name}</h2><span>${subtitle}</span></div>`; }
function questMarkup() {
  const visible = QUESTS.filter(q => !state.claimed.includes(q.id)).slice(0,3);
  return `<div class="panel quest-panel">${visible.map((q,i) => {
    const done = state.stats[q.key] >= q.goal;
    return `<div class="quest-row"><span class="quest-check">${done ? '✓' : ['壹','贰','叁'][i]}</span><div class="quest-text"><h3>${q.title}</h3><p>${q.desc}</p></div><span class="quest-reward">${q.reward} 灵石</span>${done ? `<button class="text-link" data-action="claim" data-value="${q.id}">领取奖励 ↗</button>` : `<span class="quest-progress">${Math.min(state.stats[q.key], q.goal)} / ${q.goal}</span>`}</div>`;
  }).join('') || '<p class="empty-note">仙途机缘皆已圆满。前路，只待你亲手书写。</p>'}</div>`;
}
function renderHome() {
  const a = attributes(state), full = state.xp >= a.xpNeed;
  const cards = [
    ['meditate','吐纳修炼','CULTIVATION','凝神静气，引天地灵气入丹田。','修为 +20～28','灵力 −10 · 1 日','cultivate','开始吐纳','primary','循序渐进，积少成多'],
    ['mountain','闭关参悟','SECLUSION','屏息入定，静参大道，潜心三日。','修为 +65～88','灵力 −28 · 3 日','retreat','闭关三日','outline','一心向道，静待花开'],
    ['moon','听泉静养','MEDITATION','枕石听泉，以山间清气温养身心。','灵力 +45 · 气血 +35','耗时 1 日','rest','静养一日','outline','休养生息，方行远路'],
    ['leaf','踏露采药','HERB GATHERING','循着草木清香，寻一缕山野灵韵。','凝露草 +1～3 · 灵石 +5～12','灵力 −8 · 1 日','gather','入山采药','outline','山间草木，亦有灵性']
  ];
  const rate = cultivationRate(state);
  return `${state.ended ? `<div class="panel ending"><div class="dialog-eyebrow">THE END · A NEW BEGINNING</div><h2>一念天开，${endingLabel(state)}</h2><p>你于第 ${state.day} 日渡尽雷劫，终于${endingLabel(state)}。<br>回首来时青山，万千山河，皆是故乡。</p><button class="btn gold" data-ui="logs">重读来时路</button></div>` : ''}
  ${pendingBanner()}
  ${!state.path&&!state.ended ? '<div class="path-invitation"><span>大道三千，你欲以何身问长生？</span><button class="text-link" data-tab="paths">仙 · 魔 · 妖，择道启程 ↗</button></div>' : ''}
  <div class="hero"><div class="hero-content"><div class="location">${icon('pin')}青云山 · 无尘洞府</div><h2>一念入道<br>万法归心</h2><p>半卷道经，一壶清茶，山中自有长生路。</p></div><span class="hero-stamp">大道至简</span><div class="hero-bottom"><span>${icon('leaf')}灵气充盈</span><span>${icon('cloud')}${PATHS.find(p=>p.id===state.path)?.motto || '洞天福地 · 道心待定'}</span></div><span class="hero-caption">青山不语，静候归人</span></div>
  ${sectionHeading('lotus','日常修行','日有所进，道有所成')}
  <div class="practice-grid">${cards.map(([i,title,en,desc,reward,cost,action,label,kind,note]) => {
    if (action === 'cultivate') reward = `修为 +${Math.round(17 * rate)}～${Math.round(23 * rate)}`;
    if (action === 'retreat') reward = `修为 +${Math.round(17 * rate * 3.2)}～${Math.round(23 * rate * 3.2)}`;
    if (action === 'gather' && state.realm) reward = `凝露草 +1～3 · 灵石 +${5+state.realm*3}～${12+state.realm*3}`;
    return `<article class="panel practice-card"><div class="card-top"><span class="action-icon">${icon(i)}</span><div><h3>${title}</h3><small>${en}</small></div></div><p>${desc}</p><div class="card-meta"><span>${reward}</span><span>${cost}</span></div><div class="card-action"><span>${note}</span>${actionButton(action, label + icon('arrow'), '', kind, state.ended&&!['rest','gather'].includes(action))}</div></article>`;
  }).join('')}</div>
  <div class="break-card"><div class="break-symbol"><span>境</span></div><div class="break-info"><h3>${state.ended ? '仙道初成，已入真仙' : isAscension(state)?'大乘圆满 · 准备渡飞升之劫':full ? '修为圆满 · 可尝试破境' : '厚积薄发，静待破境之时'}</h3><p>${state.ended?'已渡劫飞升':`当前修为 ${state.xp} / ${a.xpNeed} · 成功率 ${a.chance}%${state.focus?' · 凝神护持':''}`}</p></div><button class="btn ${full ? 'gold' : 'outline'}" data-ui="breakthrough"${state.ended ? ' disabled' : ''}>${isAscension(state)?'渡劫飞升':full ? '尝试突破' : '破境详情'} ${icon('arrow')}</button></div>
  ${sectionHeading('scroll','仙途机缘','每一步修行，都有回响')}${questMarkup()}`;
}
function intro(title: string,desc: string,eyebrow: string) { return `<div class="view-intro"><div class="dialog-eyebrow">${eyebrow}</div><h2>${title}</h2><p>${desc}</p></div>`; }
function pendingBanner() { return state.pending ? `<div class="warning-note" style="margin:0 0 18px;display:flex;align-items:center;justify-content:space-between;gap:15px">${state.pending.kind === 'combat' ? '山中战局未定，妖兽仍在眼前。' : '山中机缘未了，静候道友抉择。'}<button class="text-link" data-ui="resume">继续历练 ↗</button></div>` : ''; }
function renderExplore() {
  return `${pendingBanner()}${intro('山河有灵，万物有缘','走出洞府，踏入山河。或遇故人论道，或逢妖兽拦路，每次出行，皆是一场修行。','EXPLORE THE WORLD')}
  ${sectionHeading('mountain','四方山河','奇遇与战斗 · 随机触发')}
  <div class="region-grid">${REGIONS.map(r => {
    const unlocked = state.realm >= r.realm;
    return `<article class="panel region-card"><div class="region-art ${r.color}"><span class="region-mark">${r.mark}</span><span class="region-lock">${icon(unlocked ? 'leaf' : 'lock')}${unlocked ? '可前往' : r.risk}</span></div><div class="region-body"><h3>${r.name}</h3><p>${r.subtitle}</p><div class="region-meta"><span>灵力 −${r.energy} · 1 日</span><span>胜利得 ${r.reward} 灵石</span></div>${actionButton('explore', unlocked ? '踏入山河 ' + icon('arrow') : r.risk + ' ' + icon('lock'), r.id, unlocked ? 'primary' : 'outline', !unlocked || state.ended)}</div></article>`;
  }).join('')}</div><p class="soundless-note">历练提示：气血不足四分之一时无法出行。战败会退回洞府、失去 15% 灵石；先在行囊备好丹药。战斗中服丹也会消耗一回合。</p>`;
}
function renderBooks() {
  const chosenPath=bookPath==='current'?(state.path||'immortal'):bookPath,chosenRealm=bookRealm==='current'?state.realm:Number(bookRealm);
  const active=state.activeBooks,learned=Object.values(state.books).filter(n=>n>0).length;
  const combined=manualEffects(state);combined.heal=Math.min(combined.heal,Math.floor(attributes(state).maxHp*.08));
  const filtered=BOOKS.filter(b=>(bookPath==='all'||bookPath==='base'?!b.path||bookPath==='all':!b.path||b.path===chosenPath)&&(bookRealm==='all'||!b.path||b.realm===chosenRealm)&&(bookStatus==='all'||bookStatus==='learned'&&(state.books[b.id]||0)>0||bookStatus==='active'&&active.includes(b.id))&&(bookType==='all'||b.type===bookType)&&(!bookSearch||(b.name+b.desc+b.type).includes(bookSearch)));
  const pages=Math.max(1,Math.ceil(filtered.length/20));bookPage=Math.min(bookPage,pages-1);
  const options=(values:string[][],selected:string)=>values.map(([value,label])=>`<option value="${value}"${selected===value?' selected':''}>${label}</option>`).join('');
  const slots=Array.from({length:MAX_ACTIVE_BOOKS},(_,index)=>{
    const id=active[index],b=id?findManual(id):null;
    return b?`<article class="manual-slot"><span class="manual-slot-no">${String(index+1).padStart(2,'0')}</span><div><h3>${b.name}</h3><p>${b.path?PATHS.find(p=>p.id===b.path)!.name:'通用'} · ${REALMS[b.realm]} · 第 ${state.books[b.id]} 重</p></div><button class="text-link" data-ui="sealBook" data-value="${b.id}" aria-label="封存${b.name}">封存 ↗</button></article>`:`<div class="manual-slot empty"><span class="manual-slot-no">${String(index+1).padStart(2,'0')}</span><span>虚位以待 · 可纳入一部功法</span></div>`;
  }).join('');
  const cards=filtered.slice(bookPage*20,bookPage*20+20).map(b=>{
    const level=state.books[b.id]||0,isActive=active.includes(b.id),maxed=level>=b.max,cost=b.cost*(level+1),locked=b.realm>state.realm||!!b.path&&b.path!==state.path;
    const lockReason=b.realm>state.realm?`${REALMS[b.realm]}可修`:b.path&&b.path!==state.path?'需'+PATHS.find(p=>p.id===b.path)!.name:'';
    const controls=isActive?`${actionButton('study',maxed?'已臻圆满':'研习进阶',b.id,'outline',maxed||!!state.pending||state.stones<cost||state.energy<12)}<small>${maxed?'道法圆成':`${cost} 灵石 · 12 灵力 · 1 日`}</small>`:level?`${actionButton('activateBook','恢复兼修',b.id,'outline',locked||!!state.pending||active.length>=10||state.stones<10*(b.realm+1)||state.energy<8)}<small>${10*(b.realm+1)} 灵石 · 8 灵力 · 1 日</small>`:`${actionButton('study',lockReason||'领悟并兼修',b.id,'outline',locked||!!state.pending||active.length>=10||state.stones<cost||state.energy<12)}<small>${cost} 灵石 · 12 灵力 · 1 日</small>`;
    return `<article class="panel book-card manual-card ${b.path||'base'}${isActive?' attuned':''}"><div class="book-cover"><span>${b.name}</span></div><div class="book-info"><div class="manual-card-meta">${b.path?PATHS.find(p=>p.id===b.path)!.name:'通用根基'} / ${REALMS[b.realm]} / ${b.type}</div><h3>${b.name}</h3><p>${b.desc}</p><p class="manual-effect">每重：${manualEffectText(b.effects)}</p><div class="book-tags"><span class="tag">${isActive?'兼修生效':level?'已学 · 封存':'尚未入门'}</span><span>${level?'第 '+level+' 重 / 五重':'上限五重'}</span></div>${level?`<p class="manual-current">第 ${level} 重${isActive?'生效':'潜力'}：${manualEffectText(b.effects,level)}</p>`:''}</div><div class="book-control">${controls}${!isActive&&active.length?`<button class="text-link" data-ui="switchBook" data-value="${b.id}"${locked||state.pending?' disabled':''}>选择转修 ↗</button>`:''}</div></article>`;
  }).join('');
  return `${pendingBanner()}${intro('万卷道藏，择十而修','仙魔妖各境十卷，共 270 部三途功法。另有三部通用根基；每部五重，最多同时兼修十部。','THE LIBRARY OF TAO')}${!state.path?'<div class="path-invitation"><span>先立道心，解锁对应路径的功法。</span><button class="text-link" data-tab="paths">前往择道 ↗</button></div>':''}${sectionHeading('lotus','我的兼修',`${active.length} / 10 生效 · 已学 ${learned} 部`)}<div class="manual-slots">${slots}</div><div class="panel manual-summary"><h3>周天合效</h3><p>${manualEffectText(combined)||'尚未兼修功法'}</p><small>同类相加：修炼收益上限 +120%，破境 +15 个百分点，功法汲血 20%，护盾 30%，御剑倍率 +0.75，回合回灵 10；功法回合回血不超过气血上限 8%。护盾与套装取较高值。</small></div><details class="manual-rules"><summary>功法获取、转修与叠加规则</summary><p>藏经阁以灵石兑换并参悟，无需随机抽取；达到境界、选择对应路径后可修。初学自动纳入兼修，研习耗时一日、消耗 12 灵力，灵石随重数递增。已学功法可封存，数量不限且永久保留重数，封存后不生效；恢复兼修需 10×（功法境界序号+1）灵石、8 灵力与一日。转修时选择一本兼修功法替换，若新功法未学则支付首重研习成本，已学则支付恢复兼修成本。基础三卷也占名额；低境功法可一直保留。换法不治疗，气血灵力超过新上限时裁剪；历练中不能学习或换法。改修仙魔妖会封存不相符功法，原重数不丢失。</p></details>${sectionHeading('book','三途道藏',`筛选 ${filtered.length} 部 · 第 ${bookPage+1} / ${pages} 页`)}<div class="manual-filters"><label>路径<select data-book-filter="path" aria-label="功法路径">${options([['current','当前路径'],['immortal','仙修'],['demon','魔修'],['yao','妖修'],['base','通用三卷'],['all','全部路径']],bookPath)}</select></label><label>境界<select data-book-filter="realm" aria-label="功法境界">${options([['current','当前境界'],...REALMS.map((r,i)=>[String(i),r]),['all','全部境界']],bookRealm)}</select></label><label>状态<select data-book-filter="status" aria-label="功法状态">${options([['all','全部功法'],['learned','已学功法'],['active','正在兼修']],bookStatus)}</select></label><label>门类<select data-book-filter="type" aria-label="功法门类">${options([['all','全部门类'],...[...new Set(BOOKS.map(b=>b.type))].map(t=>[t,t])],bookType)}</select></label><form id="book-search"><label for="book-query">寻卷</label><div><input id="book-query" name="query" value="${escape(bookSearch)}" maxlength="30" placeholder="功法名、门类或意象"><button class="btn outline" type="submit">检索</button></div></form></div>${cards||'<div class="panel empty-note">未寻得符合条件的道藏，试试其他筛选。</div>'}<div class="manual-pagination"><button class="btn outline" data-ui="book-prev"${bookPage===0?' disabled':''}>上一页</button><span>${bookPage+1} / ${pages}</span><button class="btn outline" data-ui="book-next"${bookPage===pages-1?' disabled':''}>下一页</button></div>`;
}
function renderShop() {
  const tabs='<div class="shop-tabs" role="group" aria-label="坊市分类">'+[['items','丹药灵材'],['gear','武器法衣'],['artifacts','法宝奇珍']].map(([id,name])=>'<button data-shop="'+id+'" class="'+(shopSection===id?'active':'')+'" aria-pressed="'+(shopSection===id)+'">'+name+'</button>').join('')+'</div>';
  const heading=intro('云来云去，好物相逢','丹药、灵装与法宝，皆可于此寻得。九境各三十种法宝，仙魔妖皆可炼化，随修行阶段成长。','THE WANDERING MARKET');
  if(shopSection==='artifacts')return heading+tabs+renderArtifactLibrary(state,artifactFilters);
  const isGear=shopSection==='gear';
  const products=isGear?EQUIPMENT.filter(i=>gearRealm==='all'||i.realm===viewRealm()).map(i=>{
    const has=Object.hasOwn(state.gear,i.id),locked=state.realm<i.realm;
    return '<article class="panel item-card"><div class="item-icon">'+i.mark+'</div><div class="gear-label">'+REALMS[i.realm]+' · '+GRADES[i.tier]+' · '+SLOTS[i.slot]+'</div><h3>'+i.name+'</h3><p>'+i.desc+'</p><div class="bonus-line">'+bonusText(i,0)+'</div>'+attunementMarkup(i,0)+'<div class="item-details"><span>'+i.price+' 灵石</span>'+actionButton('buyGear',has?'已拥有':locked?REALMS[i.realm]+'可购':'收入灵库',i.id,'outline',has||locked||state.stones<i.price)+'</div></article>';
  }).join(''):ITEMS.map(i=>'<article class="panel item-card"><div class="item-icon '+i.id+'">'+i.label+'</div><h3>'+i.name+'</h3><p>'+i.desc+'</p><div class="item-details"><span>'+i.price+' 灵石</span>'+actionButton('buy','购入一枚',i.id,'outline',state.stones<i.price)+'</div></article>').join('');
  const filter=isGear?'<div class="realm-filter"><label>装备境界 <select data-gear-realm aria-label="装备境界"><option value="current"'+(gearRealm==='current'?' selected':'')+'>当前境界 · '+REALMS[state.realm]+'</option>'+REALMS.map((r,n)=>'<option value="'+n+'"'+(String(gearRealm)===String(n)?' selected':'')+'>'+r+' · '+setEffects(n,state.path).name+'</option>').join('')+'<option value="all"'+(gearRealm==='all'?' selected':'')+'>全部境界装备</option></select></label><span>每境三件 · 道纹随仙魔妖显化</span></div>':'';
  return heading+tabs+filter+'<div class="item-grid">'+products+'</div><p class="soundless-note">购入装备后，请在「灵装法宝」中穿戴。同境两件、三件可激活路径套装效果。</p>';
}
function bonusText(item: SpiritItem,level: number) {
  return formatBonus(gearBonus(item,level,state.path,state));
}
function formatBonus(b: Partial<Bonus>){
  const names: Record<string,string>={attack:'攻击',defense:'防御',hp:'气血上限',energy:'灵力上限'};
  return Object.entries(b).filter(([,v])=>v).map(([k,v])=>`${names[k]} +${v}`).join(' · ');
}
function viewRealm(){return gearRealm==='current'||gearRealm==='all'?state.realm:Number(gearRealm);}
function attunementMarkup(item: SpiritItem,level: number){
  if(!state.path)return '<div class="attunement unchosen">尚未择道 · 入道后显化专属道纹</div>';
  const p=PATHS.find(p=>p.id===state.path)!;
  return `<div class="attunement ${p.id}"><span>${p.mark}纹</span>属性已含：${formatBonus(affinityBonus(item,level,state.path))}<small>${setEffects(item.realm,state.path).name} · 同境两件 / 三件生效</small></div>`;
}
function setThreeText(effect: SetEffect){return effect.heal?`每次承受敌方回合后存活，气血 +${effect.heal}、灵力 +${effect.energyRegen}`:effect.drain?`造成伤害额外汲血 ${Math.round(effect.drain*100)}%`:`每场开战获得气血上限 ${Math.round(effect.shield*100)}% 的护盾`;}
function renderSetOverview(){
  const realm=viewRealm(),items=EQUIPMENT.filter(i=>i.realm===realm),pieces=items.filter(i=>state.equipped[i.slot]===i.id).length,owned=items.filter(i=>Object.hasOwn(state.gear,i.id)).length;
  return `${sectionHeading('lotus','境界套装',REALMS.length+'境图鉴 · '+EQUIPMENT.length+'件灵装')}<div class="set-realm-tabs" role="group" aria-label="套装境界">${EQUIPMENT_SETS.map(s=>`<button data-set-realm="${s.realm}" class="${realm===s.realm?'active':''}" aria-pressed="${realm===s.realm}"><span>${REALMS[s.realm]}</span><small>${s.name}</small></button>`).join('')}</div><section class="panel set-overview"><div class="set-heading"><div><span class="gear-label">${GRADES[realm]} · ${REALMS[realm]}可用</span><h3>${setEffects(realm,state.path).name}</h3></div><span class="tag">已拥有 ${owned}/3 · 穿戴 ${pieces}/3</span></div><div class="set-components">${items.map(i=>`<span class="${state.equipped[i.slot]===i.id?'worn':''}">${SLOTS[i.slot!]} · ${i.name}${state.equipped[i.slot]===i.id?' ✓':''}</span>`).join('')}</div><div class="set-path-effects">${PATHS.map(p=>{const e=setEffects(realm,p.id);return `<div class="set-effect-row ${p.id} ${state.path===p.id?'selected':''}"><span class="set-path-mark">${p.mark}</span><div><strong>${e.name}${state.path===p.id?' · 当前路径':''}</strong><p><span class="${state.path===p.id&&pieces>=2?'effect-active':''}">两件：${formatBonus(e.bonus)}</span><br><span class="${state.path===p.id&&pieces===3?'effect-active':''}">三件：${setThreeText(e)}</span></p></div></div>`;}).join('')}</div><div class="set-overview-footer"><span>${state.path?'装备道纹和套装随改修自动转换':'尚未定道，道纹与套装效果暂未激活'}</span><button class="text-link" data-ui="shopSet" data-value="${realm}">坊市寻此套装 ↗</button></div></section>`;
}
function ownedCard(item: EquipmentItem){
  const level=state.gear[item.id],equipped=state.equipped[item.slot]===item.id,cost=upgradeCost(item,level),locked=state.realm<item.realm;
  return '<article class="panel owned-card"><div class="owned-top"><span class="gear-glyph '+(state.path||'')+'">'+item.mark+'</span><div><span class="gear-label">'+REALMS[item.realm]+' · '+GRADES[item.tier]+' · '+SLOTS[item.slot]+'</span><h3>'+item.name+' <small>+'+level+'</small></h3></div>'+(equipped?'<span class="tag equipped-tag">已装备</span>':'')+'</div><div class="bonus-line">'+bonusText(item,level)+'</div>'+attunementMarkup(item,level)+'<p class="gear-description">'+item.desc+'</p><div class="owned-actions">'+(equipped?actionButton('unequip','卸下',item.slot,'outline'):actionButton('equip','穿戴',item.id,'primary',locked))+actionButton('upgradeGear',level>=3?'淬炼圆满':'淬炼进阶',item.id,'outline',level>=3||state.stones<cost.stones||state.dust<cost.dust)+'</div><small class="upgrade-note">'+(level>=3?'已达 +3 · 属性与道纹提升 90%':'淬炼：'+cost.stones+' 灵石 + '+cost.dust+' 灵砂 + 8 灵力 · 1 日')+'</small></article>';
}
function renderGear() {
  const a=attributes(state);
  const activeSet=equippedSet(state);
  return `${pendingBanner()}${intro('灵装护身，万宝随心','各境均有一套灵装，仙魔妖各有道纹。集齐同境三件，唤醒属于你这条道的套装之力。','EQUIPMENT & ARTIFACTS')}${activeSet?`<div class="active-set-note">${activeSet.name} · ${activeSet.pieces}/3 <span>两件效果已激活${activeSet.pieces===3?' · 三件效果已激活':''}</span></div>`:''}<div class="loadout-slots">${[...Object.entries(SLOTS),['artifact','法宝']].map(([slot,name])=>{
    const item=[...EQUIPMENT,...ARTIFACTS].find(i=>i.id===state.equipped[slot]);
    return `<div class="panel loadout-slot"><span>${icon(slot==='artifact'?'lotus':slot==='weapon'?'sword':slot==='armor'?'bag':'leaf')}${name}</span><strong>${item?item.name:'未装备'}</strong><small>${item?'+'+(state.gear[item.id]??state.artifacts[item.id])+('effect' in item?' · '+artifactStageLabel(item,state):''):'从下方灵库挑选'}</small>${item&&'effect' in item?'<button class="text-link" data-ui="artifact-details" data-value="'+item.id+'">查看阶段数值 ↗</button>':''}</div>`;
  }).join('')}</div><div class="gear-totals"><span>攻击 <b>${a.attack}</b></span><span>防御 <b>${a.defense}</b></span><span>气血上限 <b>${a.maxHp}</b></span><span>灵砂 <b>${state.dust}</b></span></div>${renderSetOverview()}${sectionHeading('sword','随身灵装','属性已含当前路径道纹')}<div class="owned-grid">${EQUIPMENT.filter(i=>Object.hasOwn(state.gear,i.id)).map(i=>ownedCard(i)).join('')||'<p class="empty-note">暂未拥有灵装，可前往坊市购买。</p>'}</div>${renderArtifactLibrary(state,artifactFilters)}<p class="soundless-note">已赠青竹剑、素云袍、青纹铃，请手动装备。战胜妖兽必得灵砂，35% 概率掉落装备；成功探查遗藏后有 20% 概率获得法宝，重复灵物转为 3 灵砂。穿卸装备不会恢复气血或灵力，历练途中不可换装。</p><button class="btn outline" data-tab="shop">前往坊市寻宝 ${icon('arrow')}</button>`;
}
function renderPaths() {
  return `${pendingBanner()}${intro('仙魔妖途，道由心生','同一片山河，三种问道之身。每条路都有天赋、本命神通与长生结局；九境法宝均为三途通用。','THREE PATHS · ONE ETERNAL JOURNEY')}<div class="path-policy"><span class="status-dot"></span>${state.path?'当前路径：'+PATHS.find(p=>p.id===state.path)!.name+' · 改修需 100 灵石与 1 日':'尚未定道 · 首次选择免费，保留全部现有进度'}</div><div class="path-cards">${PATHS.map(p=>`<article class="panel path-card ${p.color} ${state.path===p.id?'chosen':''}"><div class="path-card-heading"><span class="path-seal">${p.mark}</span><div><div class="dialog-eyebrow">${p.id.toUpperCase()}</div><h2>${p.motto}</h2><p>${p.desc}</p></div></div><div class="path-detail"><span>天赋</span><p>${p.passive}</p></div><div class="path-detail"><span>神通</span><p><strong>${p.skill}</strong> · ${p.skillDesc}</p></div><div class="path-detail"><span>法宝</span><p>九境各三十种 · 不限路径，自由炼化与淬炼</p></div><div class="path-bottom"><span>终途 · ${p.ending}</span><button class="btn ${state.path===p.id?'secondary':'outline'}" data-ui="choosePath" data-value="${p.id}"${state.path===p.id?' disabled':''}>${state.path===p.id?'此心已定':state.path?'改修此道':'踏入'+p.name} ${state.path===p.id?'✓':icon('arrow')}</button></div></article>`).join('')}</div><p class="soundless-note">改修保留境界、功法与全部藏品，会保留已炼化的通用法宝，并封存异途功法（重数保留）。路径或装备上限提升后，需静养或服丹恢复；改修与换装不治疗伤势。历练途中不可改修。</p>`;
}
function renderBag() {
  return `${intro('一囊山色，半卷清风','丹药温养身心，灵材汇聚山野。善用随身之物，仙途自有余裕。','YOUR BELONGINGS')}${sectionHeading('bag','随身灵物',`共 ${Object.values(state.items).reduce((a,b)=>a+b,0)} 件物品`)}<div class="item-grid">${ITEMS.map(i=>`<article class="panel item-card"><div class="item-icon ${i.id}">${i.label}</div><h3>${i.name} <small style="color:#9eaa90;font-family:var(--sans)">× ${state.items[i.id]}</small></h3><p>${i.desc}</p><div class="item-details"><span class="tag">${i.kind}</span>${actionButton(i.id === 'herb' ? 'sell' : 'use',i.id === 'herb' ? '售出一株' : '服用一枚',i.id,'outline',state.items[i.id] === 0)}</div></article>`).join('')}</div><div class="panel alchemy-panel"><span class="action-icon">${icon('kettle')}</span><div><h3>草木为引，文火成丹</h3><p>凝露草 ×3 ＋ 灵力 10 → 聚气丹 ×1 · 耗时 1 日</p></div>${actionButton('alchemy','开炉炼丹','','secondary',state.items.herb < 3)}</div>`;
}
function render() {
  const info = navs.find(n => n[0] === tab);
  if(!info)return;
  $('#page-label').textContent = info[1]; $('#page-title').textContent = info[1]; $('#page-desc').textContent = info[4];
  $('#calendar').textContent = calendar(state.day);
  $('#content').innerHTML = ({ home:renderHome, explore:renderExplore, books:renderBooks, shop:renderShop, bag:renderBag, gear:renderGear, paths:renderPaths } as Record<string,()=>string>)[tab]();
  renderNavigation(); renderCharacter(); renderLogs();
  document.querySelectorAll<HTMLElement>('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon || 'leaf'); });
}

const dialog = $<HTMLDialogElement>('#dialog');
function showDialog(title: string, body: string, actions = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="dialog-close" data-ui="close" aria-label="关闭">×</button></div><div class="dialog-body">${body}${actions ? `<div class="dialog-actions">${actions}</div>` : ''}</div>`;
  if (!dialog.open) dialog.showModal();
}
function showGuide() {
  const steps = [['壹','吐纳入道','在洞府吐纳或闭关提升修为；灵力不足时听泉静养。所有时间都由你的选择推进。'],['贰','修为圆满，尝试破境','修为满后消耗 20 灵力突破，凝神丹能提高成功率。失败保留八成修为，后续成功率逐次增加 10%。'],['叁','行万里路，求一线缘','进入山河历练，选择奇遇或迎战妖兽。战斗中可以普攻、御剑、防守回灵或遁走；服丹会消耗一回合。'],['肆','灵材炼丹，功法立身','采药与历练获得灵石灵材，在坊市购丹、藏经阁按路径与境界选择功法，每境每途十卷，最多兼修十本，支持封存与转修。行囊中三株凝露草可炼一枚聚气丹。'],['伍','八境问道，渡劫登仙','炼气、筑基、结丹、元婴、化神、炼虚、合体、大乘，每境统一分初期、中期、后期、圆满。大乘圆满后渡飞升天劫，踏入真仙，共需 '+TOTAL_BREAKTHROUGHS+' 次成功破境。']];
  steps.push(['陆','灵器护身，法宝随行','灵装法宝中可装备武器、法衣、佩饰与一件法宝。胜敌必得灵砂，可能掉装备；遗藏可能出法宝。灵砂与灵石可淬炼三次，法宝在战斗中使用，冷却三回合。'],['柒','仙魔妖途，道心自选','三途问道中首次择道免费。仙修擅回元，魔修擅爆发汲血，妖修擅体魄护盾。本命神通每场一次；改修需 100 灵石与一日，法宝保留，异途功法封存。最终结局随路径变化。']);
  steps.push(['捌','各境灵装，道纹相应','每个境界有武器、法衣、佩饰各一件，同境两件激活属性加成，三件再激活路径效果：仙修承受敌方回合后存活可回元，魔修额外汲血，妖修开战获得护盾。道纹和套装随改修转换；装备图鉴可查看三途效果，坊市可按境界选购。']);
  showDialog('修行指南', `<div class="dialog-eyebrow">A SMALL GUIDE FOR A LONG JOURNEY</div>${steps.map(([n,t,d])=>`<div class="guide-step"><span>${n}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}<div class="warning-note">每次操作后自动保存在当前浏览器。跨设备游玩请导出存档，再于另一设备导入。无强制等待，无离线惩罚。</div>`, '<button class="btn primary" data-ui="close">心中有道，启程修行</button>');
}
function showSettings() {
  const motion=animationPreference();
  showDialog('存档与设置', `<div class="dialog-eyebrow">KEEP YOUR JOURNEY SAFE</div><p>当前道友：${escape(state.name)} · ${realmLabel(state)}<br>仙途已行 ${state.day - 1} 日 · ${storageAvailable ? '每次选择后自动存档' : '自动存档不可用，请导出备份'}</p><div class="setting-row"><div><h3>导出仙途</h3><p>下载 JSON 存档，随时备份或迁移。</p></div><button class="btn outline" data-ui="export">导出存档</button></div><div class="setting-row"><div><h3>续写旧卷</h3><p>导入后会覆盖当前进度。</p></div><button class="btn outline" data-ui="import">导入存档</button></div><div class="setting-row"><div><h3>重启仙途</h3><p>舍下此段尘缘，重新从炼气初期开始。</p></div><button class="btn danger" data-ui="reset-confirm">重新开始</button></div><p class="soundless-note">此游戏为单机文字冒险。存档保存在本机当前浏览器，不上传角色与游玩数据。</p>`);
  $('.dialog-body .setting-row').insertAdjacentHTML('beforebegin',`<div class="setting-row"><div><h3>突破动画</h3><p>${motion.systemReduced?'系统已启用减少动态效果，将直接显示结果。':'小境灵气归元，大境天雷试道；可随时跳过。'}</p></div><button type="button" class="btn outline motion-switch" role="switch" aria-label="突破动画" aria-checked="${motion.enabled}" data-ui="toggle-effects">${motion.enabled?'已开启':'已关闭'}</button></div><div class="setting-row"><div><h3>观想天雷</h3><p>预览大境突破演出，不改变修为或存档。</p></div><button type="button" class="btn outline" data-ui="preview-effects">预览天雷</button></div>`);
}
function showBreakthrough() {
  const a = attributes(state), full = state.xp >= a.xpNeed;
  const ascension=isAscension(state);
  showDialog(ascension?'渡飞升天劫':'叩问仙门', `<div class="dialog-eyebrow">${worldLabel(state.realm)} · ${state.realm===FINAL_REALM?'仙道初成':`当前阶段 ${state.stage+1} / ${stageCount(state.realm)}`}</div><p>你已行至${realmLabel(state)}。${ascension?'大乘圆满，下一关是飞升天劫。渡过此劫，将踏入真仙。':full?'灵气盈满丹田，只待一念叩关。':'道基仍需温养，待修为圆满，再叩仙门。'}</p><div class="realm-steps">${REALMS.map((r,i)=>`<span class="realm-step ${i < state.realm ? 'done' : i === state.realm ? 'current' : ''}">${r}<small>${worldLabel(i)}</small></span>`).join('')}</div><div class="setting-row"><span>下一步</span><span>${nextStep(state)}</span></div><div class="setting-row"><span>修为</span><span>${state.xp} / ${a.xpNeed}</span></div><div class="setting-row"><span>${ascension?'渡劫':'突破'}成功率</span><span>${a.chance}% ${state.focus ? '· 凝神护持' : ''}</span></div><div class="setting-row"><span>所需灵力</span><span>20 / 当前 ${state.energy}</span></div><div class="warning-note">${ascension?'渡劫':'突破'}失败将保留八成修为。每次失败，下次成功率额外提高 10%；成功后重置。凝神丹仅在真正尝试时消耗效果。</div>`, `${state.items.focus && !state.focus ? actionButton('use','服用凝神丹','focus','outline') : ''}${actionButton('breakthrough',ascension?'引动天劫 · 飞升':'凝神破境','','gold',!full || state.energy < 20 || state.ended)}`);
}
function showPending() {
  const e = state.pending; if (!e) return;
  const r = REGIONS.find(r=>r.id===e.region)!;
  if (e.kind === 'event') {
    const sage = e.variant === 'sage';
    showDialog(escape(e.title), `<div class="dialog-eyebrow">${r.name} · 山河奇遇</div><p>${escape(e.desc)}</p><button class="choice-button" data-action="choice" data-value="accept"><strong>${sage ? '坐而论道，共饮灵茶' : '凝神探查，试破禁制'}</strong><small>${sage ? '花费 12 灵石 · 获得修为与凝神丹' : '七成机会寻得遗藏 · 也可能受伤'} ${sage && state.stones < 12 ? '· 灵石不足' : ''}</small></button><button class="choice-button" data-action="choice" data-value="safe"><strong>${sage ? '问路辞行，继续游山' : '采下灵草，从容归去'}</strong><small>稳妥收获 · 获得少量修为、灵石与灵草</small></button><p class="soundless-note">选择没有对错，道由心生。</p>`);
  } else {
    const a = attributes(state);
    const p=PATHS.find(p=>p.id===state.path),artifact=ARTIFACTS.find(i=>i.id===state.equipped.artifact);
    showDialog('山中遇险', `<div class="dialog-eyebrow">${r.name} · 回合制战斗</div><div class="battle-enemy"><div class="enemy-avatar">${r.realm ? '妖' : '狼'}</div><div><h3>${e.name}</h3><div class="stat-line"><span>妖兽气血</span><span>${e.hp} / ${e.maxHp}</span></div><div class="bar"><div class="bar-fill" style="width:${e.hp/e.maxHp*100}%"></div></div></div></div><div class="battle-status"><span>你的气血 ${state.hp}/${a.maxHp}</span><span>灵力 ${state.energy}/${a.maxEnergy}</span></div><div class="battle-record" aria-live="polite">${e.turns.map(t=>`<p>${escape(t)}</p>`).join('')}</div><div class="battle-controls">${actionButton('attack','凝气出手','','primary')}${actionButton('skill','御剑一击 · 12 灵力','','secondary',state.energy < 12)}${actionButton('guard','守心回灵','','outline')}${actionButton('flee','暂避锋芒 · 遁走','','outline')}</div><div class="battle-potions"><button data-action="use" data-value="heal"${state.items.heal ? '' : ' disabled'}>回春丹 ×${state.items.heal}</button><button data-action="use" data-value="qi"${state.items.qi ? '' : ' disabled'}>聚气丹 ×${state.items.qi}</button></div>`);
    $('.battle-status').insertAdjacentHTML('afterend',`<div class="battle-extra"><span>${p?.name||'散修'} · 护盾 ${e.shield}</span><span>${artifact?artifact.name:'尚未装备法宝'}</span></div>`);
    $('.battle-controls').insertAdjacentHTML('beforeend',`${actionButton('pathSkill',p?(e.pathUsed?'本命神通 · 已施展':p.skill):'尚未选择修行路径','','secondary',!p||e.pathUsed)}${actionButton('artifactSkill',artifact?(e.artifactCooldown?`法宝冷却 · ${e.artifactCooldown} 回合`:artifact.skill+` · ${artifact.cost} 灵力`):'尚未装备法宝','','gold',!artifact||e.artifactCooldown>0||(artifact&&state.energy<artifact.cost))}`);
    $('.battle-potions').insertAdjacentHTML('afterend',`<p class="soundless-note">${p?p.skill+'：'+p.skillDesc:'在洞府选择路径、装备法宝后，下一场历练即可施展。'}${artifact?' '+artifactPowerText(artifact,state,state.artifacts[artifact.id])+'；消耗 '+artifact.cost+' 灵力，冷却三回合。':''}</p>`);
    const set=equippedSet(state);
    if(set)$('.battle-extra').insertAdjacentHTML('afterend',`<div class="battle-set-note">${set.name} · ${set.pieces}/3${set.pieces===3?' · '+setThreeText(set):' · 两件效果已生效'}</div>`);
    const record = $('.battle-record'); record.scrollTop = record.scrollHeight;
  }
}
function exportSave() {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `问道长生-第${state.day}日.json`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('仙途存档已导出');
}
function setTab(value: string) {
  if (!navs.some(n=>n[0]===value)) return;
  tab = value; history.replaceState(null,'',`#${tab}`); render(); window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click', event => {
  if(breakthroughPlaying)return;
  if(!(event.target instanceof Element))return;
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.tab) { setTab(button.dataset.tab); return; }
  if (button.dataset.shop) { shopSection=button.dataset.shop; render(); return; }
  if (button.dataset.setRealm!==undefined) { gearRealm=button.dataset.setRealm; render(); return; }
  if (button.dataset.filter) { filter = button.dataset.filter; renderLogs(); return; }
  if (button.dataset.action) {
    const action = button.dataset.action;
    const before=action==='breakthrough'?structuredClone(state):null;
    const result = act(state,action,button.dataset.value);
    if (!result.ok) { toast(result.message); return; }
    save(); render();
    if(before){
      breakthroughPlaying=true;
      if(dialog.open)dialog.close();
      void playBreakthrough(breakthroughScene(before,state)).catch(()=>toast(result.message)).finally(()=>{breakthroughPlaying=false;$('#main').focus({preventScroll:true});});
      return;
    }
    toast(result.message);
    if (state.pending) showPending();
    else if (dialog.open && action === 'use' && button.dataset.value === 'focus') showBreakthrough();
    else if (dialog.open) dialog.close();
    return;
  }
  switch (button.dataset.ui) {
    case 'artifact-details': {
      const item=ARTIFACTS.find(i=>i.id===button.dataset.value);if(item)showDialog(item.name+' · 阶段成长',artifactDetails(item,state));break;
    }
    case 'artifact-reset': artifactFilters={realm:'current',effect:'all',status:'all',query:'',page:0};render();break;
    case 'artifact-prev': artifactFilters.page=Math.max(0,artifactFilters.page-1);render();$('.treasure-filters').scrollIntoView({block:'start'});break;
    case 'artifact-next': artifactFilters.page++;render();$('.treasure-filters').scrollIntoView({block:'start'});break;
    case 'book-prev': bookPage=Math.max(0,bookPage-1);render();$('.manual-filters').scrollIntoView({block:'start'});break;
    case 'book-next': bookPage++;render();$('.manual-filters').scrollIntoView({block:'start'});break;
    case 'sealBook': {
      const b=findManual(button.dataset.value||'');if(!b)break;
      showDialog('封存功法',`<p>暂时停止兼修《${b.name}》，释放一个兼修位。第 ${state.books[b.id]} 重会永久保留，封存期间不提供效果。</p><div class="warning-note">换法不恢复气血或灵力，超过新上限的部分会被裁剪；之后恢复兼修需 ${10*(b.realm+1)} 灵石、8 灵力与一日。</div>`,actionButton('deactivateBook','确认封存',b.id,'primary'));break;
    }
    case 'switchBook': {
      const b=findManual(button.dataset.value||'');if(!b)break;
      const learned=(state.books[b.id]||0)>0,cost=learned?10*(b.realm+1):b.cost,energy=learned?8:12;
      showDialog('择卷转修',`<div class="dialog-eyebrow">十卷相伴 · 道有所择</div><p>转入《${b.name}》 · ${learned?'恢复原有第 '+state.books[b.id]+' 重':'初学至第一重'}<br>消耗 ${cost} 灵石、${energy} 灵力与一日。</p><div class="warning-note">下列所选功法将封存，重数保留。只在转修成功时扣费和替换；换法不治疗，超过新上限的气血灵力会被裁剪。</div><p>请选择要转出的兼修功法：</p><div class="manual-switch-list">${state.activeBooks.map(id=>`<button class="choice-button" data-action="switchBook" data-value="${id}|${b.id}"${state.pending||state.stones<cost||state.energy<energy?' disabled':''}><strong>${findManual(id)!.name} · 第 ${state.books[id]} 重</strong><small>封存此卷，转修《${b.name}》</small></button>`).join('')}</div>`);break;
    }
    case 'guide': showGuide(); break;
    case 'settings': showSettings(); break;
    case 'toggle-effects': setAnimationEnabled(!animationPreference().enabled);showSettings();break;
    case 'preview-effects': {
      breakthroughPlaying=true;dialog.close();
      void playBreakthrough(previewBreakthrough(state.path)).catch(()=>toast('演出暂不可用，修行进度未改变')).finally(()=>{breakthroughPlaying=false;showSettings();});
      break;
    }
    case 'close': dialog.close(); break;
    case 'logs': showDialog('仙途纪事',`<div class="dialog-eyebrow">YOUR STORY · 第 ${state.day} 日</div><div class="all-logs">${state.logs.map(logMarkup).join('')}</div><p class="soundless-note">保留最近 100 条纪事。</p>`); break;
    case 'breakthrough': showBreakthrough(); break;
    case 'resume': showPending(); break;
    case 'shopSet': gearRealm=button.dataset.value ?? 'current';shopSection='gear';setTab('shop');break;
    case 'choosePath': {
      const p=PATHS.find(p=>p.id===button.dataset.value);if(!p)break;
      showDialog(state.path?'重立道心':'择道启程',`<div class="dialog-eyebrow">${p.name} · ${p.motto}</div><p>${p.passive}</p><p>本命神通「${p.skill}」：${p.skillDesc}</p><div class="warning-note">${state.path?'改修消耗 100 灵石与 1 日。保留全部进度和藏品，保留已炼化的通用法宝，并封存异途功法（重数保留）。':'首次择道免费，保留全部现有进度。'}上限提升不恢复当前气血或灵力。</div>`,actionButton('choosePath','道心已定 · '+p.name,p.id,'primary'));
      break;
    }
    case 'export': exportSave(); break;
    case 'import': $('#import-file').click(); break;
    case 'rename':
      showDialog('为自己取个道号',`<form id="name-form"><label class="field-label" for="name-input">山河路远，以何名行走世间？</label><input id="name-input" class="name-input" value="${escape(state.name)}" maxlength="12" required autocomplete="off"><div class="dialog-actions"><button type="submit" class="btn primary">落笔留名</button></div></form>`);
      $<HTMLInputElement>('#name-input').select(); break;
    case 'reset-confirm': showDialog('重新启程', '<p>此举将清空当前修为、行囊与仙途记录，从炼气初期重新开始。可先导出存档，保留这段来路。</p>', '<button class="btn outline" data-ui="export">先导出存档</button><button class="btn danger" data-ui="reset">确认重新开始</button>'); break;
    case 'reset': state = createGame(state.name); save(); dialog.close(); setTab('home'); toast('青山仍在，愿道友再启仙途'); break;
  }
});
document.addEventListener('submit', event => {
  if(!(event.target instanceof HTMLFormElement))return;
  if(event.target.id==='artifact-search'){event.preventDefault();artifactFilters.query=$<HTMLInputElement>('#artifact-query').value.trim().slice(0,30);artifactFilters.page=0;render();$('#artifact-query').focus();return;}
  if(event.target.id==='book-search'){event.preventDefault();bookSearch=$<HTMLInputElement>('#book-query').value.trim().slice(0,30);bookPage=0;render();$('#book-query').focus();return;}
  if (event.target.id !== 'name-form') return;
  event.preventDefault(); const name = $<HTMLInputElement>('#name-input').value.trim();
  if (!name) { toast('道号不可为空'); return; }
  state.name = name.slice(0,12); save(); render(); dialog.close(); toast(`此后仙途，便以「${state.name}」为名`);
});
document.addEventListener('change',event=>{
  if(!(event.target instanceof HTMLSelectElement))return;
  if(event.target.dataset.artifactFilter){const key=event.target.dataset.artifactFilter;if(['realm','effect','status'].includes(key)){artifactFilters[key as 'realm'|'effect'|'status']=event.target.value;artifactFilters.page=0;render();$(`[data-artifact-filter="${key}"]`).focus({preventScroll:true});}return;}
  if(event.target.dataset.bookFilter){const value=event.target.value;switch(event.target.dataset.bookFilter){case 'path':bookPath=value;break;case 'realm':bookRealm=value;break;case 'status':bookStatus=value;break;case 'type':bookType=value;break;}bookPage=0;const key=event.target.dataset.bookFilter;render();$(`[data-book-filter="${key}"]`).focus({preventScroll:true});return;}
  if(!event.target.matches('[data-gear-realm]'))return;
  const value=event.target.value;
  if(['current','all',...REALMS.map((_,i)=>String(i))].includes(value)){gearRealm=value;render();}
});
$<HTMLInputElement>('#import-file').addEventListener('change', async () => {
  const input=$<HTMLInputElement>('#import-file');const file = input.files?.[0]; input.value = ''; if (!file) return;
  try {
    if (file.size > 300000) throw new Error('存档文件过大');
    const imported = validateSave(JSON.parse(await file.text()));
    showDialog('续写旧卷', `<p>即将导入道友「${escape(imported.name)}」的仙途：<br>${realmLabel(imported)} · 第 ${imported.day} 日。<br>确认后将覆盖当前进度。</p>`, '<button class="btn outline" data-ui="close">暂不导入</button><button class="btn primary" id="confirm-import">确认导入</button>');
    $('#confirm-import').onclick = () => { state = imported; save(); dialog.close(); setTab('home'); toast('旧卷重开，仙途已续'); if (state.pending) showPending(); };
  } catch (error) { toast(`无法导入：${error instanceof SyntaxError ? '文件不是有效存档' : error instanceof Error ? error.message : '未知存档错误'}`); }
});
window.addEventListener('hashchange',()=>{ const hash = location.hash.slice(1); if (navs.some(n=>n[0]===hash)) { tab=hash; render(); } });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
if (navs.some(n=>n[0]===location.hash.slice(1))) tab = location.hash.slice(1);
render();
if (loadWarning) toast(loadWarning);
if (state.pending) showPending();

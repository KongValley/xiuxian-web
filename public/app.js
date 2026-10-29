import { createGame, attributes, realmLabel, calendar, act, validateSave, REALMS, BOOKS, ITEMS, REGIONS, QUESTS } from './engine.js';

const paths = {
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
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
const escape = str => String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const $ = selector => document.querySelector(selector);
const SAVE_KEY = 'wendao-changsheng-v1';
let state = createGame(), tab = 'home', filter = 'all', toastTimer, storageAvailable = true;
let loadWarning = '';
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) state = validateSave(JSON.parse(raw)); }
catch { loadWarning = '旧存档无法读取，已开启新仙途。你仍可导入备份。'; }
const navs = [
  ['home','洞府修行','home','01','且将尘事付清风，于一呼一吸间，觅长生之道。'],
  ['explore','山河历练','mountain','02','行过万里山河，方知天地之阔，吾道之长。'],
  ['books','藏经阁','book','03','万卷道藏藏万法，一灯如豆照初心。'],
  ['shop','云游坊市','shop','04','人间烟火处，也有仙家物。以有易无，各得其缘。'],
  ['bag','随身行囊','bag','05','一囊灵物，半卷闲书，伴你走过漫漫仙途。'],
];
const actionButton = (action, text, payload = '', kind = 'primary', disabled = false) => `<button class="btn ${kind}" data-action="${action}" data-value="${payload}"${disabled ? ' disabled' : ''}>${text}</button>`;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('#save-status').innerHTML = `<span class="status-dot"></span>${storageAvailable ? '仙途已自动记下' : '无法自动存档，请导出备份'}`;
}
function toast(message) {
  clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('show');
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3100);
}
function renderNavigation() {
  $('#navigation').innerHTML = navs.map(([id,label,i,num]) => `<button class="nav-item ${tab === id ? 'active' : ''}" data-tab="${id}" title="${label}" aria-label="${label}"${tab === id ? ' aria-current="page"' : ''}>${icon(i)}<span>${label}</span><span class="nav-num">${num}</span><span class="nav-arrow">›</span></button>`).join('');
}
function renderCharacter() {
  const a = attributes(state);
  const bars = [ ['hp','气血',state.hp,a.maxHp,'heart'], ['energy','灵力',state.energy,a.maxEnergy,'drop'], ['xp','修为',state.xp,a.xpNeed,'lotus'] ];
  $('#character').innerHTML = `<div class="character-header"><div class="avatar">${icon('meditate')}</div><div><div class="character-name">${escape(state.name)}<button data-ui="rename" aria-label="修改道号" title="修改道号">✎</button></div><span class="realm-tag">${realmLabel(state)}</span></div><span class="root-tag">木灵根</span></div>
  <div class="stat-bars">${bars.map(([key,name,val,max,i]) => `<div class="stat-group"><div class="stat-line"><span>${icon(i)}${name}</span><span class="stat-value">${val} <span style="color:#b6bba9">/ ${max}</span></span></div><div class="bar" role="progressbar" aria-label="${name}" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="${max}"><div class="bar-fill ${key}" style="width:${val / max * 100}%"></div></div></div>`).join('')}</div>
  <dl class="attributes"><div><dt>攻击</dt><dd>${a.attack}</dd></div><div><dt>防御</dt><dd>${a.defense}</dd></div><div><dt>道龄</dt><dd>${Math.floor((state.day - 1) / 360)} 年 ${((state.day - 1) % 360)} 日</dd></div><div><dt>功法</dt><dd>${Object.values(state.books).filter(x=>x>0).length} 部</dd></div></dl>
  <div class="wealth">${icon('coin')}<span>灵石</span><strong>${state.stones.toLocaleString()}</strong><small>枚</small></div>
  <p class="character-note">${state.focus ? '凝神之效 · 下次突破成功率 +20%' : state.xp >= a.xpNeed ? '修为已圆满，正是破境好时机' : state.energy < 15 ? '灵力渐乏，不妨听泉静养一日' : '心若澄明，处处皆是修行'}</p>`;
}
function logMarkup(log) {
  const labels = { story:'仙缘', cultivate:'修行', rest:'静养', explore:'历练', battle:'战斗', break:'破境', danger:'波折', normal:'杂记' };
  const type = Object.hasOwn(labels, log.type) ? log.type : 'normal';
  return `<div class="log-entry ${type}"><div class="log-date">第 ${log.day} 日 <span class="log-type">${labels[type]}</span></div><p>${escape(log.text)}</p></div>`;
}
function renderLogs() {
  const logs = state.logs.filter(l => filter === 'all' || (filter === 'cultivate' ? ['cultivate','break','rest'].includes(l.type) : ['explore','battle'].includes(l.type)));
  $('#logs').innerHTML = logs.slice(0, 12).map(logMarkup).join('') || '<p class="log-empty">此间尚无记事，且去寻一段机缘。</p>';
  document.querySelectorAll('[data-filter]').forEach(el => el.classList.toggle('active', el.dataset.filter === filter));
}
function sectionHeading(i, name, subtitle) { return `<div class="section-heading"><h2>${icon(i)}${name}</h2><span>${subtitle}</span></div>`; }
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
  const rate = 1 + state.books.breath * 0.2;
  return `${state.ended ? `<div class="panel ending"><div class="dialog-eyebrow">THE END · A NEW BEGINNING</div><h2>一念天开，证道长生</h2><p>你于第 ${state.day} 日渡尽雷劫，终于羽化登仙。<br>回首来时青山，万千山河，皆是故乡。</p><button class="btn gold" data-ui="logs">重读来时路</button></div>` : ''}
  ${pendingBanner()}
  <div class="hero"><div class="hero-content"><div class="location">${icon('pin')}青云山 · 无尘洞府</div><h2>一念入道<br>万法归心</h2><p>半卷道经，一壶清茶，山中自有长生路。</p></div><span class="hero-stamp">大道至简</span><div class="hero-bottom"><span>${icon('leaf')}灵气充盈</span><span>${icon('cloud')}洞天福地 · 木灵根</span></div><span class="hero-caption">青山不语，静候归人</span></div>
  ${sectionHeading('lotus','日常修行','日有所进，道有所成')}
  <div class="practice-grid">${cards.map(([i,title,en,desc,reward,cost,action,label,kind,note]) => {
    if (action === 'cultivate') reward = `修为 +${Math.round(17 * rate)}～${Math.round(23 * rate)}`;
    if (action === 'retreat') reward = `修为 +${Math.round(17 * rate * 3.2)}～${Math.round(23 * rate * 3.2)}`;
    if (action === 'gather' && state.realm) reward = `凝露草 +1～3 · 灵石 +${5+state.realm*3}～${12+state.realm*3}`;
    return `<article class="panel practice-card"><div class="card-top"><span class="action-icon">${icon(i)}</span><div><h3>${title}</h3><small>${en}</small></div></div><p>${desc}</p><div class="card-meta"><span>${reward}</span><span>${cost}</span></div><div class="card-action"><span>${note}</span>${actionButton(action, label + icon('arrow'), '', kind, state.ended)}</div></article>`;
  }).join('')}</div>
  <div class="break-card"><div class="break-symbol"><span>境</span></div><div class="break-info"><h3>${state.ended ? '道心圆满，长生已证' : full ? '修为圆满 · 可尝试破境' : '厚积薄发，静待破境之时'}</h3><p>当前修为 ${state.xp} / ${a.xpNeed} · 突破成功率 ${a.chance}%${state.focus ? ' · 凝神护持' : ''}</p></div><button class="btn ${full ? 'gold' : 'outline'}" data-ui="breakthrough"${state.ended ? ' disabled' : ''}>${full ? '尝试突破' : '破境详情'} ${icon('arrow')}</button></div>
  ${sectionHeading('scroll','仙途机缘','每一步修行，都有回响')}${questMarkup()}`;
}
function intro(title,desc,eyebrow) { return `<div class="view-intro"><div class="dialog-eyebrow">${eyebrow}</div><h2>${title}</h2><p>${desc}</p></div>`; }
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
  return `${intro('一卷道藏，万法生焉','研习功法，可以提升吐纳收益、剑术与体魄。每部五重，境界之外，亦有精进之路。','THE LIBRARY OF TAO')}${sectionHeading('book','藏经三卷','研习耗时 1 日 · 灵力 −12')}${BOOKS.map(b => {
    const level = state.books[b.id], maxed = level >= b.max, cost = b.cost * (level + 1);
    return `<article class="panel book-card"><div class="book-cover"><span>${b.name}</span></div><div class="book-info"><h3>${b.name}</h3><p>${b.desc}</p><div class="book-tags"><span class="tag">${b.grade} · ${b.type}</span><span>${level ? `第 ${level} 重 / 五重` : '尚未入门'}</span></div></div><div class="book-control">${actionButton('study', maxed ? '已臻圆满' : level ? '研习进阶' : '领悟功法', b.id, 'outline', maxed)}<small>${maxed ? '道法圆成' : `${cost} 灵石 · 12 灵力`}</small></div></article>`;
  }).join('')}`;
}
function renderShop() {
  return `${intro('云来云去，好物相逢','坊市散修云集，以灵石换取丹药灵材。此间不问来路，只论眼前机缘。','THE WANDERING MARKET')}${sectionHeading('shop','灵物小集','明码实价 · 购入即收入行囊')}<div class="item-grid">${ITEMS.map(i=>`<article class="panel item-card"><div class="item-icon ${i.id}">${i.label}</div><h3>${i.name}</h3><p>${i.desc}</p><div class="item-details"><span>${i.price} 灵石 <small style="color:#a7ae99">/ 枚</small></span>${actionButton('buy','购入一枚',i.id,'outline',state.stones < i.price)}</div></article>`).join('')}</div><p class="soundless-note">灵石可通过采药、历练和仙途机缘获得。凝露草也可在行囊中出售，每株可换 5 灵石。</p>`;
}
function renderBag() {
  return `${intro('一囊山色，半卷清风','丹药温养身心，灵材汇聚山野。善用随身之物，仙途自有余裕。','YOUR BELONGINGS')}${sectionHeading('bag','随身灵物',`共 ${Object.values(state.items).reduce((a,b)=>a+b,0)} 件物品`)}<div class="item-grid">${ITEMS.map(i=>`<article class="panel item-card"><div class="item-icon ${i.id}">${i.label}</div><h3>${i.name} <small style="color:#9eaa90;font-family:var(--sans)">× ${state.items[i.id]}</small></h3><p>${i.desc}</p><div class="item-details"><span class="tag">${i.kind}</span>${actionButton(i.id === 'herb' ? 'sell' : 'use',i.id === 'herb' ? '售出一株' : '服用一枚',i.id,'outline',state.items[i.id] === 0)}</div></article>`).join('')}</div><div class="panel alchemy-panel"><span class="action-icon">${icon('kettle')}</span><div><h3>草木为引，文火成丹</h3><p>凝露草 ×3 ＋ 灵力 10 → 聚气丹 ×1 · 耗时 1 日</p></div>${actionButton('alchemy','开炉炼丹','','secondary',state.items.herb < 3)}</div>`;
}
function render() {
  const info = navs.find(n => n[0] === tab);
  $('#page-label').textContent = info[1]; $('#page-title').textContent = info[1]; $('#page-desc').textContent = info[4];
  $('#calendar').textContent = calendar(state.day);
  $('#content').innerHTML = ({ home:renderHome, explore:renderExplore, books:renderBooks, shop:renderShop, bag:renderBag })[tab]();
  renderNavigation(); renderCharacter(); renderLogs();
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}

const dialog = $('#dialog');
function showDialog(title, body, actions = '') {
  $('#dialog-content').innerHTML = `<div class="dialog-header"><h2>${title}</h2><button class="dialog-close" data-ui="close" aria-label="关闭">×</button></div><div class="dialog-body">${body}${actions ? `<div class="dialog-actions">${actions}</div>` : ''}</div>`;
  if (!dialog.open) dialog.showModal();
}
function showGuide() {
  const steps = [['壹','吐纳入道','在洞府吐纳或闭关提升修为；灵力不足时听泉静养。所有时间都由你的选择推进。'],['贰','修为圆满，尝试破境','修为满后消耗 20 灵力突破，凝神丹能提高成功率。失败保留八成修为，后续成功率逐次增加 10%。'],['叁','行万里路，求一线缘','进入山河历练，选择奇遇或迎战妖兽。战斗中可以普攻、御剑、防守回灵或遁走；服丹会消耗一回合。'],['肆','灵材炼丹，功法立身','采药与历练获得灵石灵材，在坊市购丹、藏经阁研习功法。行囊中三株凝露草可炼一枚聚气丹。'],['伍','十八次破境，问道长生','炼气、筑基、金丹、元婴、化神、渡劫，各分初、中、后期。渡尽最后一重雷劫，即可羽化登仙。']];
  showDialog('修行指南', `<div class="dialog-eyebrow">A SMALL GUIDE FOR A LONG JOURNEY</div>${steps.map(([n,t,d])=>`<div class="guide-step"><span>${n}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}<div class="warning-note">每次操作后自动保存在当前浏览器。跨设备游玩请导出存档，再于另一设备导入。无强制等待，无离线惩罚。</div>`, '<button class="btn primary" data-ui="close">心中有道，启程修行</button>');
}
function showSettings() {
  showDialog('存档与设置', `<div class="dialog-eyebrow">KEEP YOUR JOURNEY SAFE</div><p>当前道友：${escape(state.name)} · ${realmLabel(state)}<br>仙途已行 ${state.day - 1} 日 · ${storageAvailable ? '每次选择后自动存档' : '自动存档不可用，请导出备份'}</p><div class="setting-row"><div><h3>导出仙途</h3><p>下载 JSON 存档，随时备份或迁移。</p></div><button class="btn outline" data-ui="export">导出存档</button></div><div class="setting-row"><div><h3>续写旧卷</h3><p>导入后会覆盖当前进度。</p></div><button class="btn outline" data-ui="import">导入存档</button></div><div class="setting-row"><div><h3>重启仙途</h3><p>舍下此段尘缘，重新从炼气初期开始。</p></div><button class="btn danger" data-ui="reset-confirm">重新开始</button></div><p class="soundless-note">此游戏为单机文字冒险。存档保存在本机当前浏览器，不上传角色与游玩数据。</p>`);
}
function showBreakthrough() {
  const a = attributes(state), full = state.xp >= a.xpNeed;
  showDialog('叩问仙门', `<div class="dialog-eyebrow">BREAK THROUGH YOUR LIMITS</div><p>你已行至${realmLabel(state)}。${full ? '灵气盈满丹田，只待一念叩关。' : '道基仍需温养，待修为圆满，再叩仙门。'}</p><div class="realm-steps">${REALMS.map((r,i)=>`<span class="realm-step ${i < state.realm ? 'done' : i === state.realm ? 'current' : ''}">${r}</span>`).join('')}</div><div class="setting-row"><span>修为</span><span>${state.xp} / ${a.xpNeed}</span></div><div class="setting-row"><span>突破成功率</span><span>${a.chance}% ${state.focus ? '· 凝神护持' : ''}</span></div><div class="setting-row"><span>所需灵力</span><span>20 / 当前 ${state.energy}</span></div><div class="warning-note">突破失败将保留八成修为。每次失败，下次成功率额外提高 10%；成功后重置。凝神丹仅在尝试突破时消耗效果。</div>`, `${state.items.focus && !state.focus ? actionButton('use','服用凝神丹','focus','outline') : ''}${actionButton('breakthrough','凝神破境','','gold',!full || state.energy < 20 || state.ended)}`);
}
function showPending() {
  const e = state.pending; if (!e) return;
  const r = REGIONS.find(r=>r.id===e.region);
  if (e.kind === 'event') {
    const sage = e.variant === 'sage';
    showDialog(escape(e.title), `<div class="dialog-eyebrow">${r.name} · 山河奇遇</div><p>${escape(e.desc)}</p><button class="choice-button" data-action="choice" data-value="accept"><strong>${sage ? '坐而论道，共饮灵茶' : '凝神探查，试破禁制'}</strong><small>${sage ? '花费 12 灵石 · 获得修为与凝神丹' : '七成机会寻得遗藏 · 也可能受伤'} ${sage && state.stones < 12 ? '· 灵石不足' : ''}</small></button><button class="choice-button" data-action="choice" data-value="safe"><strong>${sage ? '问路辞行，继续游山' : '采下灵草，从容归去'}</strong><small>稳妥收获 · 获得少量修为、灵石与灵草</small></button><p class="soundless-note">选择没有对错，道由心生。</p>`);
  } else {
    const a = attributes(state);
    showDialog('山中遇险', `<div class="dialog-eyebrow">${r.name} · 回合制战斗</div><div class="battle-enemy"><div class="enemy-avatar">${r.realm ? '妖' : '狼'}</div><div><h3>${e.name}</h3><div class="stat-line"><span>妖兽气血</span><span>${e.hp} / ${e.maxHp}</span></div><div class="bar"><div class="bar-fill" style="width:${e.hp/e.maxHp*100}%"></div></div></div></div><div class="battle-status"><span>你的气血 ${state.hp}/${a.maxHp}</span><span>灵力 ${state.energy}/${a.maxEnergy}</span></div><div class="battle-record" aria-live="polite">${e.turns.map(t=>`<p>${escape(t)}</p>`).join('')}</div><div class="battle-controls">${actionButton('attack','凝气出手','','primary')}${actionButton('skill','御剑一击 · 12 灵力','','secondary',state.energy < 12)}${actionButton('guard','守心回灵','','outline')}${actionButton('flee','暂避锋芒 · 遁走','','outline')}</div><div class="battle-potions"><button data-action="use" data-value="heal"${state.items.heal ? '' : ' disabled'}>回春丹 ×${state.items.heal}</button><button data-action="use" data-value="qi"${state.items.qi ? '' : ' disabled'}>聚气丹 ×${state.items.qi}</button></div>`);
    const record = $('.battle-record'); record.scrollTop = record.scrollHeight;
  }
}
function exportSave() {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `问道长生-第${state.day}日.json`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); toast('仙途存档已导出');
}
function setTab(value) {
  if (!navs.some(n=>n[0]===value)) return;
  tab = value; history.replaceState(null,'',`#${tab}`); render(); window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.tab) { setTab(button.dataset.tab); return; }
  if (button.dataset.filter) { filter = button.dataset.filter; renderLogs(); return; }
  if (button.dataset.action) {
    const action = button.dataset.action;
    const result = act(state,action,button.dataset.value);
    if (!result.ok) { toast(result.message); return; }
    save(); render(); toast(result.message);
    if (state.pending) showPending();
    else if (dialog.open && action === 'use' && button.dataset.value === 'focus') showBreakthrough();
    else if (dialog.open) dialog.close();
    return;
  }
  switch (button.dataset.ui) {
    case 'guide': showGuide(); break;
    case 'settings': showSettings(); break;
    case 'close': dialog.close(); break;
    case 'logs': showDialog('仙途纪事',`<div class="dialog-eyebrow">YOUR STORY · 第 ${state.day} 日</div><div class="all-logs">${state.logs.map(logMarkup).join('')}</div><p class="soundless-note">保留最近 100 条纪事。</p>`); break;
    case 'breakthrough': showBreakthrough(); break;
    case 'resume': showPending(); break;
    case 'export': exportSave(); break;
    case 'import': $('#import-file').click(); break;
    case 'rename':
      showDialog('为自己取个道号',`<form id="name-form"><label class="field-label" for="name-input">山河路远，以何名行走世间？</label><input id="name-input" class="name-input" value="${escape(state.name)}" maxlength="12" required autocomplete="off"><div class="dialog-actions"><button type="submit" class="btn primary">落笔留名</button></div></form>`);
      $('#name-input').select(); break;
    case 'reset-confirm': showDialog('重新启程', '<p>此举将清空当前修为、行囊与仙途记录，从炼气初期重新开始。可先导出存档，保留这段来路。</p>', '<button class="btn outline" data-ui="export">先导出存档</button><button class="btn danger" data-ui="reset">确认重新开始</button>'); break;
    case 'reset': state = createGame(state.name); save(); dialog.close(); setTab('home'); toast('青山仍在，愿道友再启仙途'); break;
  }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'name-form') return;
  event.preventDefault(); const name = $('#name-input').value.trim();
  if (!name) { toast('道号不可为空'); return; }
  state.name = name.slice(0,12); save(); render(); dialog.close(); toast(`此后仙途，便以「${state.name}」为名`);
});
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = ''; if (!file) return;
  try {
    if (file.size > 300000) throw new Error('存档文件过大');
    const imported = validateSave(JSON.parse(await file.text()));
    showDialog('续写旧卷', `<p>即将导入道友「${escape(imported.name)}」的仙途：<br>${realmLabel(imported)} · 第 ${imported.day} 日。<br>确认后将覆盖当前进度。</p>`, '<button class="btn outline" data-ui="close">暂不导入</button><button class="btn primary" id="confirm-import">确认导入</button>');
    $('#confirm-import').onclick = () => { state = imported; save(); dialog.close(); setTab('home'); toast('旧卷重开，仙途已续'); if (state.pending) showPending(); };
  } catch (error) { toast(`无法导入：${error instanceof SyntaxError ? '文件不是有效存档' : error.message}`); }
});
window.addEventListener('hashchange',()=>{ const hash = location.hash.slice(1); if (navs.some(n=>n[0]===hash)) { tab=hash; render(); } });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
if (navs.some(n=>n[0]===location.hash.slice(1))) tab = location.hash.slice(1);
render();
if (loadWarning) toast(loadWarning);
if (state.pending) showPending();

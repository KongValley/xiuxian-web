import { writeFile } from 'node:fs/promises';
import { act, attributes, createGame, validateSave } from '../src/engine.js';
import { ARTIFACTS, EQUIPMENT } from '../src/content.js';
import { BOOKS } from '../src/manuals.js';
import { DUNGEONS, dungeonAutoAction, dungeonEnemy } from '../src/dungeons.js';
import { REALMS } from '../src/realms.js';
import type { PathId } from '../src/types.js';

const profiles=['入境未整备','同境常规','同境毕业'] as const;
const rows:string[]=[];
let total=0,wins=0;
for(let realm=0;realm<9;realm++){
  const rates:number[]=[];let rounds=0,heals=0,preparedWins=0;
  for(let profile=0;profile<3;profile++){
    let count=0,success=0;
    for(const path of ['immortal','demon','yao'] as PathId[])for(let index=0;index<5;index++)for(let sample=0;sample<5;sample++){
      const s=createGame();s.realm=realm;s.ended=realm===8;s.stage=realm===8?0:profile===0?0:profile===1?[0,1,2,3,3][index]:3;s.path=path;s.stones=10000;s.items.heal=3;s.items.qi=3;
      if(profile){
        for(const item of EQUIPMENT.filter(i=>i.realm===realm)){s.gear[item.id]=profile;s.equipped[item.slot]=item.id;}
        const artifact=ARTIFACTS.find(i=>i.realm===realm&&i.effect==='blast')!;s.artifacts[artifact.id]=profile-1;s.equipped.artifact=artifact.id;
        for(const b of BOOKS.filter(b=>b.path===path&&b.realm===realm&&((b.effects.attack||0)>0||(b.effects.hp||0)>0||(b.effects.defense||0)>0)).slice(0,profile===1?3:4)){s.books[b.id]=profile+1;s.activeBooks.push(b.id);}
      }
      s.hp=attributes(s).maxHp;s.energy=attributes(s).maxEnergy;
      let seed=realm*65537+index*255+sample*1023+73;
      const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      act(s,'dungeonAutoStart',`dungeon-${realm}-${index}|1`,rng);
      let steps=0;
      for(;steps<500;steps++){const next=dungeonAutoAction(s,attributes);if(!next)break;const result=act(s,next.action,next.payload,rng);if(!result.ok)throw new Error(result.message);}
      validateSave(s);if(steps===500)throw new Error('自动战斗超过审核边界');
      const won=!!s.expedition.last?.won;count++;total++;if(won){success++;wins++;if(profile===1){preparedWins++;rounds+=steps;heals+=3-s.items.heal;}}
    }
    rates.push(Math.round(success/count*100));
  }
  const first=DUNGEONS[realm*5],last=DUNGEONS[realm*5+4];
  rows.push(`| ${REALMS[realm]} | ${dungeonEnemy(first,4).hp}–${dungeonEnemy(last,4).hp} | ${first.stones}–${last.stones} | ${rates.map(n=>n+'%').join(' | ')} | ${preparedWins?(rounds/preparedWins).toFixed(1):'—'} | ${preparedWins?(heals/preparedWins).toFixed(1):'—'} |`);
}
const markdown=`# 山河历练数值审核 · v2.0\n\n固定种子，九境 × 三途 × 五副本 × 三种养成 × 五场，共 ${total} 场，所有结算均通过存档校验。结果用于观察难度曲线，不保证任意搭配都能通关。执行：\`npx tsx scripts/balance-audit.ts\`。\n\n三种角色均满状态入场，每种各携 3 枚回春丹和聚气丹，自动服丹开启。入境未整备为本境初期、无穿戴、仅初始吐纳法；同境常规使用第 1–5 本对应初 / 中 / 后 / 圆满 / 圆满，三件本境装备 +1、爆发法宝 +0、三本战斗功法二重；同境毕业为本境圆满、装备 +2、爆发法宝 +1、四本战斗功法三重。两种养成均不带灵根、词条或真印成就加成。真仙为仙道初成。\n\n| 境界 | 首领气血范围 | 重复通关灵石（不含途中） | ${profiles.join(' | ')} | 常规胜局平均操作数 | 常规胜局耗回春丹 |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${rows.join('\n')}\n\n每个副本五关：小怪、岔路机缘、精英、免费营地、首领。普通出手受敌方护甲影响；御剑、神通和法宝伤害忽略一半护甲。角色副本护甲减伤为 \`防御/(防御+28+12×副本境界序号)\`，最高 70%；守心再减免 58%。所有首领第三、六、九……轮施放 1.9 倍重击，提前一轮预警，自动战斗优先守心。其他机制见游戏内挑战指南。\n\n修炼基础收益和当前阶段修为需求采用同一系数 \`1+growthRank×0.6\`，再乘路径、功法、灵根、词条收益。通关修为为当前阶段需求的 22 / 24.5 / 27 / 29.5 / 32%，不溢出、不自动突破。静养 30% 气血与 40% 灵力（保底 35 /45）；丹药 40% 对应上限（保底气血 60、灵力 40）。\n\n灵石、灵砂、养根和洗练材料以同境副本为主要可重复来源。首通双倍基础灵石、指定本境法宝、额外三枚山河令、一枚真印；同境五印成套提供攻击 +2r、气血 +12r、防御 +r（r=境界序号+1）。指定法宝重复转 8r 灵砂。重复通关本境法宝概率 20%、装备概率 25%，山河令保底 1 /1 /2 /2 /3；兑换任意已解锁未拥有法宝需 10+4×境界序号 山河令。失败仅保留途中材料，损失现有灵石 15%，停止自动行动。\n\n自动刷本限 1 /5 /10 /20 轮；按成功通关扣减次数，局间可选择真实静养，战中可选择真实服丹；没有自动购买、换装或突破。战败、主动撤离、战斗 80 轮上限或无法补给时停止。切走页面、刷新、导入、收到其他标签页的存档更新后暂停，需手动恢复。\n`;
await writeFile(new URL('../BALANCE.md',import.meta.url),markdown);
console.log(JSON.stringify({battles:total,wins,rows},null,2));

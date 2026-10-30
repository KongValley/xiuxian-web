// 原著人界、灵界主线；真仙为渡飞升天劫后的终点。
export const REALMS = ['炼气','筑基','结丹','元婴','化神','炼虚','合体','大乘','真仙'];
export const STAGES = ['初期','中期','后期','大圆满'];
export const QI_LAYERS = 13;
export const ASCENSION_REALM = 7;
export const FINAL_REALM = REALMS.length - 1;
export function stageCount(realm){ return realm===0 ? QI_LAYERS : realm===FINAL_REALM ? 1 : STAGES.length; }
export const TOTAL_BREAKTHROUGHS = REALMS.slice(0,FINAL_REALM).reduce((n,_,r)=>n+stageCount(r),0);
const numerals=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三'];
export function stageLabel(s){return s.realm===0?`${numerals[s.stage]}层`:s.realm===FINAL_REALM?'仙道初成':STAGES[s.stage];}
export function worldLabel(realm){return realm<=4?'人界':realm<FINAL_REALM?'灵界':'仙界';}
export function growthRank(s){return s.realm*3+(s.realm===0?s.stage/6:s.realm===FINAL_REALM?0:[0,1,2,2.5][s.stage]);}
export function isAscension(s){return s.realm===ASCENSION_REALM&&s.stage===stageCount(s.realm)-1;}
export function nextStep(s){
  if(s.realm===FINAL_REALM)return '已渡劫飞升';
  if(isAscension(s))return '渡飞升天劫 → 真仙';
  const next=s.stage+1<stageCount(s.realm)?{realm:s.realm,stage:s.stage+1}:{realm:s.realm+1,stage:0};
  return `${REALMS[next.realm]} · ${stageLabel(next)}`;
}

import { attributes, realmLabel } from './engine.js';
import { isAscension, nextStep, stageCount } from './realms.js';
import type { GameState, PathId } from './types.js';

export type BreakthroughKind = 'minor' | 'major' | 'ascension';
export interface BreakthroughScene {
  kind: BreakthroughKind;
  path: PathId | null;
  success: boolean;
  from: string;
  target: string;
  destination: string;
  headline: string;
  detail: string;
  preview: boolean;
}
export const SCENE_TIMING: Record<BreakthroughKind,{duration:number;strikes:number[]}> = {
  minor:{duration:2600,strikes:[]},
  major:{duration:4700,strikes:[1650,2750,3850]},
  ascension:{duration:6500,strikes:[1800,2950,4100,5250]}
};

// Presentation snapshots are created only after the engine has settled and saved.
export function breakthroughScene(before: GameState, after: GameState): BreakthroughScene {
  const kind: BreakthroughKind=isAscension(before)?'ascension':before.stage===stageCount(before.realm)-1?'major':'minor';
  const success=after.stats.breaks>before.stats.breaks;
  return {
    kind,path:before.path,success,from:realmLabel(before),target:isAscension(before)?'真仙':nextStep(before),
    destination:realmLabel(after),headline:success?(kind==='ascension'?'渡劫登仙':'破境成功'):'冲关未成',
    detail:success?'桎梏尽碎，气血与灵力尽复。':`保留八成修为 · 下次成功率 ${attributes(after).chance}%`,
    preview:false
  };
}

export function previewBreakthrough(path: PathId|null): BreakthroughScene {
  return {kind:'major',path,success:true,from:'炼气 · 圆满',target:'筑基 · 初期',destination:'筑基 · 初期',headline:'破境成功',detail:'此为演出预览，不改变修为、物品或存档。',preview:true};
}

export type PathId = 'immortal' | 'demon' | 'yao';
export type Slot = 'weapon' | 'armor' | 'charm';
export type Stat = 'attack' | 'defense' | 'hp' | 'energy';
export type Bonus = Record<Stat, number>;
export interface RealmPosition { realm: number; stage: number }
export interface ItemBase {
  id: string; name: string; mark: string; tier: number; realm: number; price: number;
  attack?: number; defense?: number; hp?: number; energy?: number; path?: PathId;
  desc: string;
}
export interface EquipmentItem extends ItemBase { slot: Slot }
export type ArtifactEffect = 'bell' | 'blast' | 'heal' | 'pure' | 'drain' | 'seal';
export interface ArtifactItem extends ItemBase { slot?: never; cost: number; skill: string; effect: ArtifactEffect }
export type SpiritItem = EquipmentItem | ArtifactItem;
export interface CultivationPath {
  id: PathId; name: string; mark: string; motto: string; desc: string; passive: string;
  skill: string; skillDesc: string; ending: string; color: string;
}
export interface EquipmentSet { realm: number; name: string; immortal: string; demon: string; yao: string }
export interface SetEffect {
  realm: number; name: string; bonus: Partial<Bonus>; heal: number; energyRegen: number; drain: number; shield: number;
}
export interface ActiveSet extends SetEffect { pieces: number }
export interface Combat {
  kind: 'combat'; region: string; name: string; hp: number; maxHp: number; attack: number;
  shield: number; pathUsed: boolean; artifactCooldown: number; turns: string[];
}
export interface Encounter {
  kind: 'event'; region: string; title: string; desc: string; variant: 'sage' | 'cave';
}
export interface LogEntry { day: number; type: string; text: string }
export interface GameState extends RealmPosition {
  version: number; name: string; day: number; xp: number; hp: number; energy: number; stones: number;
  path: PathId | null; gear: Record<string, number>; artifacts: Record<string, number>;
  equipped: Record<string, string | null>; dust: number; books: Record<string, number>;
  items: Record<string, number>; focus: boolean; pity: number; stats: Record<string, number>;
  claimed: string[]; pending: Combat | Encounter | null; ended: boolean; logs: LogEntry[];
}
export type RandomSource = () => number;
export interface ActionResult { ok: boolean; message: string }

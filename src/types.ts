export type PathId = 'immortal' | 'demon' | 'yao';
export type Slot = 'weapon' | 'armor' | 'charm';
export type Stat = 'attack' | 'defense' | 'hp' | 'energy';
export type Bonus = Record<Stat, number>;
export interface RealmPosition { realm: number; stage: number }
export type ElementId='metal'|'wood'|'water'|'fire'|'earth';
export interface SpiritRoots {
  primary:ElementId|null; levels:Record<ElementId,number>; purity:number; tier:number; essence:number; dew:number;
}
export interface RootEffects extends Bonus {cultivation:number;chance:number;skill:number;heal:number;energyRegen:number;shield:number}
export type AffixStat=Stat|'cultivation'|'chance';
export interface Affix {stat:AffixStat;grade:number;value:number}
export interface ReforgeState {shards:number;records:Record<string,Affix[]>;locks:Record<string,number[]>;pending:{itemId:string;lines:Affix[]}|null}
export interface ManualEffects extends Bonus {
  cultivation:number; chance:number; drain:number; heal:number; energyRegen:number; shield:number; skill:number;
}
export interface Manual {
  id:string; name:string; type:string; grade:string; desc:string; cost:number; max:number;
  realm:number; path:PathId|null; effects:Partial<ManualEffects>;
  sect?:string;
}
export interface ItemBase {
  id: string; name: string; mark: string; tier: number; realm: number; price: number;
  attack?: number; defense?: number; hp?: number; energy?: number; path?: PathId;
  desc: string;
}
export interface EquipmentItem extends ItemBase { slot: Slot }
export type ArtifactEffect = 'bell' | 'blast' | 'heal' | 'pure' | 'drain' | 'seal' | 'sword' | 'ward' | 'spring' | 'tide';
export interface ArtifactPower { damage:number; heal:number; restore:number; shield:number; shieldFlat:number; drain:number }
export interface ArtifactItem extends Omit<ItemBase,'path'> {
  path?:never; slot?: never; cost: number; skill: string; effect: ArtifactEffect; power:ArtifactPower;
}
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
  dungeon?: true; round?: number;
  arts?: {cooldowns:Record<string,number>;round:number;breakArmor:number;weaken:number;talismans:number;cleanse:number};
}
export type Profession='alchemy'|'smith'|'talisman'|'array';
export type GrowthMaterial='jade'|'timber'|'ore'|'seed'|'moonleaf'|'firefruit'|'egg'|'blueprint'|'tonic'|'boltCharm'|'wardCharm'|'cleanseCharm'|'swordArray'|'wardArray'|'springArray';
export type AutoCondition='always'|'hp50'|'boss'|'heavy'|'energy30';
export interface PetProgress {level:number;bond:number;evolution:number;skill:'instinct'|'guard'}
export interface GrowthState {
  inventory:Record<GrowthMaterial,number>;
  natal:{id:string|null;bond:number;spirit:number;branch:'pierce'|'echo'|'ward'|null;trials:number;trial:{realm:number;bosses:number}|null};
  arts:{talents:Record<string,number>;learned:string[];equipped:string[];conditions:Record<string,AutoCondition>};
  estate:{vein:number;garden:number;alchemy:number;forge:number;plots:Array<{plant:string;mode:'yield'|'quality'|'rare';planted:number;ready:number}|null>};
  crafts:{xp:Record<Profession,number>;primary:Profession[];recipes:string[]};
  pets:{owned:Record<string,PetProgress>;active:string|null};
  training:{body:number;spirit:number};
  sect:{id:string|null;rank:number;merit:number;reputation:number;mentor:string|null;favor:Record<string,number>;task:{realm:number;progress:number}|null;facilities:Record<string,number>};
  fate:{choices:Record<string,'vow'|'seek'|'valor'>;equipped:string[]};
  prepared:GrowthMaterial|null;activePreparation:GrowthMaterial|null;
}
export type DungeonMechanic='storm'|'venom'|'vampire'|'rage'|'ward';
export interface DungeonRun {id:string;node:number;phase:'ready'|'combat'|'choice'|'camp';might:number;ward:number;spoils:number;rounds:number;started:number}
export interface DungeonResult {id:string;won:boolean;first:boolean;day:number;summary:string}
export interface ExpeditionState {
  tokens:number;clears:Record<string,number>;run:DungeonRun|null;last:DungeonResult|null;
  auto:{battle:boolean;repeat:boolean;remaining:number;target:string|null;rest:boolean;potions:boolean};
}
export interface Encounter {
  kind: 'event'; region: string; title: string; desc: string; variant: 'sage' | 'cave';
}
export interface LogEntry { day: number; type: string; text: string }
export interface GameState extends RealmPosition {
  version: number; name: string; day: number; xp: number; hp: number; energy: number; stones: number;
  path: PathId | null; gear: Record<string, number>; artifacts: Record<string, number>;
  roots:SpiritRoots;
  reforge:ReforgeState;
  expedition:ExpeditionState;
  growth:GrowthState;
  equipped: Record<string, string | null>; dust: number; books: Record<string, number>; activeBooks:string[];
  items: Record<string, number>; focus: boolean; pity: number; stats: Record<string, number>;
  claimed: string[]; pending: Combat | Encounter | null; ended: boolean; logs: LogEntry[];
}
export type RandomSource = () => number;
export interface ActionResult { ok: boolean; message: string }

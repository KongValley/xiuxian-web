import type { RealmPosition } from './types.js';
import { growthRank } from './realms.js';

// Fixed world curves: enemies never grow with the player's current equipment.
export const WORLD_BALANCE=[
  {hp:115,attack:12,defense:2,stones:32},
  {hp:220,attack:24,defense:7,stones:65},
  {hp:350,attack:39,defense:14,stones:130},
  {hp:510,attack:57,defense:24,stones:240},
  {hp:700,attack:78,defense:36,stones:400},
  {hp:950,attack:103,defense:51,stones:650},
  {hp:1250,attack:133,defense:69,stones:1000},
  {hp:1600,attack:170,defense:90,stones:1500},
  {hp:2050,attack:215,defense:115,stones:2200}
] as const;
export function cultivationBase(s:RealmPosition){return 1+growthRank(s)*.6;}
export function recovery(maxHp:number,maxEnergy:number){return {hp:Math.max(35,Math.round(maxHp*.3)),energy:Math.max(45,Math.round(maxEnergy*.4))};}
export function potionRecovery(id:string,maxHp:number,maxEnergy:number){return id==='heal'?Math.max(60,Math.round(maxHp*.4)):Math.max(40,Math.round(maxEnergy*.4));}
export function armorDamage(raw:number,defense:number,realm:number,guard=false){
  const reduction=Math.min(.7,defense/(defense+28+realm*12));
  return Math.max(1,Math.round(raw*(1-reduction)*(guard?.42:1)));
}
export function enemyArmorDamage(raw:number,defense:number){return Math.max(1,Math.round(Math.max(raw*.25,raw-defense*.55)));}

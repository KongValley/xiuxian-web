import assert from 'node:assert/strict';
import type { GameState } from '../src/types.js';
import { equippedSet } from '../src/content.js';
export function battle(s: GameState) {assert.ok(s.pending?.kind==='combat','expected combat');return s.pending;}
export function activeSet(s: GameState) {const set=equippedSet(s);assert.ok(set,'expected active set');return set;}

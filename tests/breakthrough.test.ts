import test from 'node:test';
import assert from 'node:assert/strict';
import { act, attributes, createGame, realmLabel } from '../src/engine.js';
import { FINAL_REALM, stageCount } from '../src/realms.js';
import { breakthroughScene, previewBreakthrough, SCENE_TIMING } from '../src/breakthrough-scene.js';

test('全部三十二次突破按起点分级，演出快照不改变结算结果',()=>{
  const state=createGame();
  for(let realm=0;realm<FINAL_REALM;realm++)for(let stage=0;stage<stageCount(realm);stage++){
    state.xp=attributes(state).xpNeed;state.energy=attributes(state).maxEnergy;
    const before=structuredClone(state);
    assert.equal(act(state,'breakthrough',null,()=>0).ok,true);
    const settled=structuredClone(state),scene=breakthroughScene(before,state);
    const expected=realm===FINAL_REALM-1&&stage===3?'ascension':stage===3?'major':'minor';
    assert.equal(scene.kind,expected);assert.equal(scene.success,true);
    assert.equal(scene.from,realmLabel(before));assert.equal(scene.destination,realmLabel(state));
    assert.equal(scene.target,expected==='ascension'?'真仙':scene.destination);assert.equal(scene.preview,false);
    assert.deepEqual(state,settled);assert.equal(before.realm,realm);assert.equal(before.stage,stage);
  }
  assert.equal(state.ended,true);
});

test('小境、大境和飞升失败保留演出等级，并展示实际保底成功率',()=>{
  for(const [realm,stage,kind]of [[0,0,'minor'],[0,3,'major'],[7,3,'ascension']] as const){
    const state=createGame();state.realm=realm;state.stage=stage;state.path='demon';
    state.xp=attributes(state).xpNeed;state.energy=attributes(state).maxEnergy;
    const before=structuredClone(state);assert.equal(act(state,'breakthrough',null,()=>.999).ok,true);
    const scene=breakthroughScene(before,state);
    assert.equal(scene.kind,kind);assert.equal(scene.success,false);assert.equal(scene.path,'demon');
    assert.equal(scene.headline,'冲关未成');assert.equal(scene.destination,scene.from);
    assert.ok(scene.detail.includes(`${attributes(state).chance}%`));
    assert.equal(state.stats.breaks,0);assert.equal(state.pity,1);
  }
});

test('天雷只用于大境及飞升，落雷间隔充足并在结果揭晓前结束',()=>{
  assert.deepEqual(SCENE_TIMING.minor.strikes,[]);
  assert.equal(SCENE_TIMING.major.strikes.length,3);
  assert.equal(SCENE_TIMING.ascension.strikes.length,4);
  for(const timing of Object.values(SCENE_TIMING))for(const [index,at]of timing.strikes.entries()){
    assert.ok(at>0&&at+420<timing.duration);
    if(index)assert.ok(at-timing.strikes[index-1]>=1000);
  }
});

test('观想是独立的三途预览快照',()=>{
  for(const path of [null,'immortal','demon','yao'] as const){
    const scene=previewBreakthrough(path);
    assert.equal(scene.preview,true);assert.equal(scene.kind,'major');assert.equal(scene.path,path);
    assert.ok(scene.detail.includes('不改变'));assert.equal(scene.target,'筑基 · 初期');
  }
});

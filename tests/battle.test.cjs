const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createBattle, currentActor, opponents, actionAvailability, takeTurn, enemyIntent } = require('../battle.js');
const { STORY, COMBAT } = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8') + '\n({STORY, COMBAT})');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
const fresh = () => createBattle(COMBAT, STORY.choices[0]);
const unit = (state, id) => state.units.find(item => item.id === id);
function actAs(state, id, action, config = COMBAT) {
 state.turnIndex = state.units.findIndex(item => item.id === id);
 const result = takeTurn(state, action, config); assert.equal(result.ok, true, result.reason); return result;
}
test('two brothers and three enemies start at zero; Jane has more HP', () => {
 const state = fresh(); assert.equal(state.units.length, 5);
 assert.deepEqual(state.units.map(item => item.name), ['루이','루인','제인','제인의 오른팔','제인의 왼팔']);
 assert.ok(state.units.every(item => item.fragments === 0));
 assert.ok(unit(state,'jane').hp > unit(state,'right-hand').hp && unit(state,'jane').hp > unit(state,'left-hand').hp);
});
test('basic attacks damage, apply dark/radiance and recover one for each brother', () => {
 const state = fresh();
 takeTurn(state, { skillId:'gravity-ball',targetId:'jane' }, COMBAT);
 assert.equal(unit(state,'jane').hp, 75); assert.equal(unit(state,'jane').dark, 1); assert.equal(unit(state,'louis').fragments, 1);
 assert.equal(currentActor(state).id, 'ruin');
 takeTurn(state, { skillId:'faint-light',targetId:'jane' }, COMBAT);
 assert.equal(unit(state,'jane').hp, 65); assert.equal(unit(state,'jane').radiance, 1); assert.equal(unit(state,'ruin').fragments, 1);
});
test('all five units follow turn order; enemies use identical resource rules', () => {
 const state = fresh(); const sequence = [];
 for (let i=0;i<5;i++) {
  const actor = currentActor(state); sequence.push(actor.id);
  const action = actor.side === 'party' ? {skillId:actor.skills[0].id,targetId:'jane'} : enemyIntent(state,COMBAT);
  assert.equal(takeTurn(state, action, COMBAT).ok,true); assert.equal(actor.fragments,1);
 }
 assert.deepEqual(sequence,['louis','ruin','jane','right-hand','left-hand']);
 assert.equal(state.round,2); assert.equal(currentActor(state).id,'louis');
});
test('not enough cost, unmarked targets, allied targets and dead targets do not mutate state', () => {
 const state = fresh(); const before=JSON.stringify(state);
 for (const action of [{skillId:'gravity-fall'}, {skillId:'gravity-ball',targetId:'ruin'}, {skillId:'not-a-skill',targetId:'jane'}]) {
  assert.equal(takeTurn(state,action,COMBAT).ok,false); assert.equal(JSON.stringify(state),before);
 }
 unit(state,'louis').fragments=1;
 assert.equal(actionAvailability(state,{skillId:'gravity-chase',targetId:'jane'},COMBAT).ok,false);
 unit(state,'jane').hp=0;
 assert.equal(actionAvailability(state,{skillId:'gravity-ball',targetId:'jane'},COMBAT).ok,false);
});
test('Gravity Fall consumes one; hits only all marked enemies and consumes their stacks', () => {
 const state=fresh(); unit(state,'louis').fragments=2; unit(state,'jane').dark=2; unit(state,'right-hand').dark=1;
 const result=takeTurn(state,{skillId:'gravity-fall'},COMBAT); assert.equal(result.ok,true);
 assert.equal(unit(state,'jane').hp,54); assert.equal(unit(state,'right-hand').hp,27); assert.equal(unit(state,'left-hand').hp,45);
 assert.equal(unit(state,'jane').dark,0); assert.equal(unit(state,'right-hand').dark,0); assert.equal(unit(state,'louis').fragments,1);
});
test('Gravity Chase distributes source stacks, preserves total and existing stacks; deterministic remainder', () => {
 const state=fresh(); unit(state,'louis').fragments=1; unit(state,'jane').dark=5; unit(state,'right-hand').dark=4;
 takeTurn(state,{skillId:'gravity-chase',targetId:'jane'},COMBAT);
 assert.deepEqual(['jane','right-hand','left-hand'].map(id=>unit(state,id).dark),[2,6,1]);
 assert.equal(unit(state,'louis').fragments,0); assert.equal(unit(state,'jane').hp,90);
});
test('distribution excludes dead units and allows fewer stacks than receivers', () => {
 const state=fresh(); unit(state,'louis').fragments=1; unit(state,'jane').dark=1; unit(state,'left-hand').hp=0;
 takeTurn(state,{skillId:'gravity-chase',targetId:'jane'},COMBAT);
 assert.deepEqual(['jane','right-hand','left-hand'].map(id=>unit(state,id).dark),[1,0,0]);
});
test('Ruin skill consumes cost, applies damage and three radiance; no invented radiance bonus', () => {
 const state=fresh(); unit(state,'ruin').fragments=1; unit(state,'jane').radiance=1;
 actAs(state,'ruin',{skillId:'cutting-light',targetId:'jane'});
 assert.equal(unit(state,'jane').hp,70); assert.equal(unit(state,'jane').radiance,4); assert.equal(unit(state,'ruin').fragments,0);
});
test('recovery never exceeds five; defending does not recover fragments', () => {
 const state=fresh(); unit(state,'louis').fragments=5;
 takeTurn(state,{skillId:'gravity-ball',targetId:'jane'},COMBAT); assert.equal(unit(state,'louis').fragments,5);
 actAs(state,'louis',{skillId:'defend'}); assert.equal(unit(state,'louis').fragments,5);
});
test('enemy skills use cost; AI falls back if cost is missing', () => {
 const state=fresh(); state.turnIndex=2; unit(state,'jane').actionsTaken=2;
 assert.equal(enemyIntent(state,COMBAT).skillId,'dagger');
 unit(state,'jane').fragments=2;
 assert.equal(enemyIntent(state,COMBAT).skillId,'vital-strike');
 takeTurn(state,enemyIntent(state,COMBAT),COMBAT);
 assert.equal(unit(state,'jane').fragments,0); assert.equal(unit(state,'ruin').hp,61);
});
test('overdraw is disabled in actual data; no mutation even if requested', () => {
 const state=fresh(); unit(state,'jane').dark=1;
 const before=JSON.stringify(state);
 assert.equal(takeTurn(state,{skillId:'gravity-fall',overdraw:true},COMBAT).ok,false);
 assert.equal(JSON.stringify(state),before); assert.equal(COMBAT.rules.enableOverdraw,false);
});
test('future opt-in fragmentation blocks exactly next two OWN turns, not other actors', () => {
 const config=JSON.parse(JSON.stringify(COMBAT)); config.rules.enableOverdraw=true; config.party[0].skills[1].allowOverdraw=true;
 const state=createBattle(config); unit(state,'jane').dark=1;
 assert.equal(takeTurn(state,{skillId:'gravity-fall',overdraw:true},config).ok,true);
 assert.equal(unit(state,'louis').recoveryBlockedTurns,2); assert.equal(unit(state,'louis').fragments,0);
 while(currentActor(state).id!=='louis') takeTurn(state,{skillId:'defend'},config);
 assert.equal(unit(state,'louis').recoveryBlockedTurns,2);
 takeTurn(state,{skillId:'gravity-ball',targetId:'jane'},config);
 assert.equal(unit(state,'louis').fragments,0); assert.equal(unit(state,'louis').recoveryBlockedTurns,1);
 while(currentActor(state).id!=='louis') takeTurn(state,{skillId:'defend'},config);
 takeTurn(state,{skillId:'gravity-ball',targetId:'jane'},config);
 assert.equal(unit(state,'louis').fragments,0); assert.equal(unit(state,'louis').recoveryBlockedTurns,0);
 while(currentActor(state).id!=='louis') takeTurn(state,{skillId:'defend'},config);
 takeTurn(state,{skillId:'gravity-ball',targetId:'right-hand'},config);
 assert.equal(unit(state,'louis').fragments,1);
});
test('enemy opt-in fragmentation uses same rules; unflagged skill cannot overdraw', () => {
 const config=JSON.parse(JSON.stringify(COMBAT)); config.rules.enableOverdraw=true;
 const state=createBattle(config); state.turnIndex=2;
 const action={skillId:'vital-strike',targetId:'louis',overdraw:true};
 assert.equal(takeTurn(state,action,config).ok,false);
 unit(state,'jane').skills=unit(state,'jane').skills.map(skill=>({...skill,allowOverdraw:skill.id==='vital-strike'}));
 assert.equal(takeTurn(state,action,config).ok,true); assert.equal(unit(state,'jane').recoveryBlockedTurns,2);
 actAs(state,'jane',{skillId:'dagger',targetId:'louis'},config);
 assert.equal(unit(state,'jane').fragments,0); assert.equal(unit(state,'jane').recoveryBlockedTurns,1);
});
test('defense applies until next own turn and dead units are skipped', () => {
 const state=fresh(); takeTurn(state,{skillId:'defend'},COMBAT);
 actAs(state,'jane',{skillId:'dagger',targetId:'louis'}); assert.equal(unit(state,'louis').hp,83);
 unit(state,'right-hand').hp=0; unit(state,'left-hand').hp=0;
 actAs(state,'ruin',{skillId:'defend'});
 assert.equal(currentActor(state).id,'jane');
 takeTurn(state,{skillId:'defend'},COMBAT);
 assert.equal(currentActor(state).id,'louis'); assert.equal(unit(state,'louis').defending,false);
});
test('victory and defeat finish immediately, block further actions; restart resets everything', () => {
 const state=fresh(); unit(state,'jane').hp=1; unit(state,'right-hand').hp=0; unit(state,'left-hand').hp=0;
 takeTurn(state,{skillId:'gravity-ball',targetId:'jane'},COMBAT); assert.equal(state.outcome,'victory');
 const before=JSON.stringify(state); assert.equal(takeTurn(state,{skillId:'defend'},COMBAT).ok,false); assert.equal(JSON.stringify(state),before);
 const defeat=fresh(); unit(defeat,'louis').hp=0; unit(defeat,'ruin').hp=1;
 actAs(defeat,'jane',{skillId:'dagger',targetId:'ruin'}); assert.equal(defeat.outcome,'defeat'); assert.equal(unit(defeat,'ruin').hp,0);
 assert.ok(fresh().units.every(item=>item.fragments===0 && item.dark===0 && item.radiance===0));
});
test('full unmodified battles are winnable for both choices with legal actions', () => {
 for(const choice of STORY.choices) {
  const state=createBattle(COMBAT,choice);
  for(let i=0;i<250&&!state.outcome;i++) {
   const actor=currentActor(state);
   let action;
   if(actor.side==='enemy') action=enemyIntent(state,COMBAT);
   else {
    const target=[...opponents(state)].sort((a,b)=>a.hp-b.hp)[0];
    const skill=actor.skills.find(item=>item.effect==='detonate-dark' && opponents(state).reduce((sum,u)=>sum+u.dark,0)>=2 && actionAvailability(state,{skillId:item.id},COMBAT).ok)
      || actor.skills.find(item=>item.id==='cutting-light' && actionAvailability(state,{skillId:item.id,targetId:target.id},COMBAT).ok)
      || actor.skills[0];
    action={skillId:skill.id,targetId:target.id};
   }
   assert.equal(takeTurn(state,action,COMBAT).ok,true);
  }
  assert.equal(state.outcome,'victory',`choice ${choice.id} failed`);
 }
});
console.log(`${checks} checks passed`);

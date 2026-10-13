const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createBattle, enemyIntent, takeTurn } = require('../battle.js');
const { STORY, COMBAT } = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8') + '\n({STORY, COMBAT})');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
test('choice attack and HP bonuses', () => {
 const blade = createBattle(COMBAT, STORY.choices[0]);
 takeTurn(blade, 'attack', COMBAT); assert.equal(blade.enemyHp, 37); assert.equal(blade.hp, 31);
 assert.equal(createBattle(COMBAT, STORY.choices[1]).maxHp, 50);
});
test('defense reduces normal and heavy damage', () => {
 const b = createBattle(COMBAT, STORY.choices[0]);
 takeTurn(b, 'defend', COMBAT); assert.equal(b.hp, 37);
 takeTurn(b, 'defend', COMBAT); assert.equal(enemyIntent(b, COMBAT).heavy, true);
 takeTurn(b, 'defend', COMBAT); assert.equal(b.hp, 30);
});
test('skills exhaust and invalid actions consume no turn', () => {
 const b = createBattle(COMBAT, STORY.choices[0]);
 takeTurn(b, 'skill', COMBAT); takeTurn(b, 'skill', COMBAT);
 assert.equal(b.skills, 0); assert.equal(b.enemyHp, 12);
 const before = JSON.stringify(b); assert.equal(takeTurn(b, 'skill', COMBAT).length, 0); takeTurn(b, 'invalid', COMBAT); assert.equal(JSON.stringify(b), before);
});
test('both choices can win; no enemy retaliation on victory', () => {
 for (const choice of STORY.choices) {
  const b = createBattle(COMBAT, choice);
  for (const action of ['skill','skill','defend','attack','attack']) { if (!b.outcome) takeTurn(b, action, COMBAT); }
  assert.equal(b.outcome, 'victory'); assert.ok(b.hp > 0); assert.equal(b.enemyHp, 0);
  const before = JSON.stringify(b); takeTurn(b, 'attack', COMBAT); assert.equal(JSON.stringify(b), before);
 }
});
test('defeat clamps HP; restarting creates fresh state', () => {
 const b = createBattle(COMBAT, STORY.choices[0]);
 while (!b.outcome) takeTurn(b, 'defend', COMBAT);
 assert.equal(b.outcome, 'defeat'); assert.equal(b.hp, 0);
 const fresh = createBattle(COMBAT, STORY.choices[0]); assert.equal(fresh.turn, 1); assert.equal(fresh.skills, 2); assert.equal(fresh.outcome, null);
});
console.log(`${checks} checks passed`);

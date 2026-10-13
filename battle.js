// 화면과 독립된 전투 규칙. 수치는 data.js에서 관리합니다.
function createBattle(config, choice) {
  const maxHp = config.player.hp + choice.hpBonus;
  return { hp: maxHp, maxHp, enemyHp: config.enemy.hp, skills: config.player.skills, turn: 1, attackBonus: choice.attackBonus, outcome: null };
}
function enemyIntent(state, config) {
  const heavy = state.turn % config.enemy.heavyEvery === 0;
  return { heavy, damage: heavy ? config.enemy.heavyAttack : config.enemy.attack };
}
function takeTurn(state, action, config) {
  if (state.outcome || !['attack', 'defend', 'skill'].includes(action) || (action === 'skill' && state.skills === 0)) return [];
  const lines = [];
  if (action === 'defend') lines.push('방어 자세를 취했다. 이번 턴 받는 피해가 줄어든다.');
  else {
    const damage = action === 'skill' ? config.player.skillDamage : config.player.attack + state.attackBonus;
    if (action === 'skill') state.skills--;
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    lines.push(`${action === 'skill' ? config.skillName : '공격'}! ${config.enemy.name}에게 ${damage} 피해.`);
  }
  if (state.enemyHp === 0) { state.outcome = 'victory'; lines.push('적이 물러났다. 승리!'); return lines; }
  const intent = enemyIntent(state, config);
  const damage = action === 'defend' ? Math.ceil(intent.damage * config.defenseMultiplier) : intent.damage;
  state.hp = Math.max(0, state.hp - damage);
  lines.push(`${config.enemy.name}의 ${intent.heavy ? '강한 일격' : '공격'}! ${damage} 피해를 받았다.`);
  if (state.hp === 0) { state.outcome = 'defeat'; lines.push('더 싸울 수 없다. 안전한 곳으로 후퇴한다.'); }
  state.turn++;
  return lines;
}
if (typeof module !== 'undefined') module.exports = { createBattle, enemyIntent, takeTurn };

// 화면과 독립된 전투 규칙. 모든 캐릭터가 같은 코스트·상태 처리 함수를 사용합니다.
function createBattle(config, choice = {}) {
  const units = [...config.party.map(unit => ({ ...unit, side: 'party' })), ...config.enemies.map(unit => ({ ...unit, side: 'enemy' }))].map(unit => {
    const maxHp = unit.hp + (unit.side === 'party' ? choice.hpBonus || 0 : 0);
    return { ...unit, hp: maxHp, maxHp, fragments: config.rules.initialFragments,
      attackBonus: unit.id === config.party[0].id ? choice.attackBonus || 0 : 0,
      dark: 0, radiance: 0, recoveryBlockedTurns: 0, defending: false, actionsTaken: 0 };
  });
  return { units, turnIndex: 0, round: 1, turn: 1, outcome: null };
}
function currentActor(state) { return state.units[state.turnIndex]; }
function opponents(state, actor = currentActor(state)) { return state.units.filter(unit => unit.side !== actor.side && unit.hp > 0); }
function validTargets(state, skill, actor = currentActor(state)) {
  const targets = opponents(state, actor);
  return ['detonate-dark', 'spread-dark'].includes(skill.effect) ? targets.filter(unit => unit.dark > 0) : targets;
}
function actionAvailability(state, action, config) {
  if (state.outcome) return { ok: false, reason: '전투가 끝났습니다.' };
  const actor = currentActor(state);
  if (action.skillId === 'defend') return { ok: true };
  const skill = actor.skills.find(item => item.id === action.skillId);
  if (!skill) return { ok: false, reason: '사용할 수 없는 기술입니다.' };
  const cost = skill.cost || 0;
  const overdraw = actor.fragments < cost;
  if (overdraw && !(config.rules.enableOverdraw && skill.allowOverdraw && action.overdraw === true)) {
    return { ok: false, reason: `파편 부족 · ${cost} 필요` };
  }
  const targets = validTargets(state, skill, actor);
  if (!targets.length) return { ok: false, reason: ['detonate-dark', 'spread-dark'].includes(skill.effect) ? '암흑 1스택 이상인 적이 필요합니다.' : '대상이 없습니다.' };
  if (skill.effect !== 'detonate-dark' && !targets.some(unit => unit.id === action.targetId)) {
    return { ok: false, reason: skill.effect === 'spread-dark' ? '암흑이 있는 적을 선택하세요.' : '살아 있는 적을 선택하세요.' };
  }
  return { ok: true, skill, targets, overdraw };
}
function advanceBattle(state) {
  if (state.units.filter(unit => unit.side === 'enemy').every(unit => unit.hp === 0)) state.outcome = 'victory';
  else if (state.units.filter(unit => unit.side === 'party').every(unit => unit.hp === 0)) state.outcome = 'defeat';
  if (state.outcome) return;
  do {
    state.turnIndex = (state.turnIndex + 1) % state.units.length;
    if (state.turnIndex === 0) state.round++;
  } while (currentActor(state).hp === 0);
  state.turn++;
  currentActor(state).defending = false;
}
function takeTurn(state, action, config) {
  const available = actionAvailability(state, action, config);
  if (!available.ok) return { ok: false, reason: available.reason, lines: [] };
  const actor = currentActor(state), lines = [];
  const blockedAtStart = actor.recoveryBlockedTurns > 0;
  let triggeredFragmentation = false;
  function hit(target, damage) {
    const actual = target.defending ? Math.ceil(damage * config.rules.defenseMultiplier) : damage;
    target.hp = Math.max(0, target.hp - actual);
    lines.push(`${target.name}에게 ${actual} 피해${target.defending ? ' (방어)' : ''}.`);
    if (!target.hp) lines.push(`${target.name} 전투 불능.`);
  }
  if (action.skillId === 'defend') { actor.defending = true; lines.push(`${actor.name}: 방어. 다음 자신의 턴까지 받는 피해 감소.`); }
  else {
    const { skill, targets, overdraw } = available;
    lines.push(`${actor.name}: ${skill.name}${overdraw ? ' · 초과 사용' : ''}.`);
    if (skill.cost) {
      actor.fragments = Math.max(0, actor.fragments - skill.cost);
      lines.push(`파편 ${skill.cost} 소모 · 남은 파편 ${actor.fragments}/5.`);
    }
    if (overdraw) {
      actor.recoveryBlockedTurns = config.rules.fragmentationTurns;
      triggeredFragmentation = true;
      lines.push(`파편화! 다음 자신의 ${actor.recoveryBlockedTurns}턴 동안 파편 회복 불가.`);
    }
    if (skill.effect === 'hit') {
      const target = targets.find(unit => unit.id === action.targetId);
      hit(target, skill.damage + (skill.kind === 'basic' ? actor.attackBonus : 0));
      if (skill.status && target.hp > 0) {
        target[skill.status] += skill.stacks;
        lines.push(`${target.name}: ${skill.status === 'dark' ? '암흑' : '광채'} +${skill.stacks} (총 ${target[skill.status]}).`);
      }
    } else if (skill.effect === 'detonate-dark') {
      // 피해 발생 전의 대상과 스택을 고정해 모든 표식 적에게 동시에 적용합니다.
      const marked = targets.map(target => ({ target, stacks: target.dark }));
      marked.forEach(({ target, stacks }) => { target.dark = 0; hit(target, stacks * skill.damagePerStack); lines.push(`${target.name}: 암흑 ${stacks}스택 소진.`); });
    } else if (skill.effect === 'spread-dark') {
      const source = targets.find(unit => unit.id === action.targetId);
      const total = source.dark;
      source.dark = 0;
      // 선택한 적도 분배 대상에 포함. 나머지는 생존 적 배치 순서대로 1개씩 배분합니다.
      const receivers = opponents(state, actor);
      receivers.forEach((unit, index) => {
        const count = Math.floor(total / receivers.length) + (index < total % receivers.length ? 1 : 0);
        unit.dark += count;
        lines.push(`${unit.name}: 암흑 ${count}스택 분배 (총 ${unit.dark}).`);
      });
    }
    if (skill.kind === 'basic') {
      if (blockedAtStart) lines.push(`파편화: 회복 불가 · 이번 턴 포함 ${actor.recoveryBlockedTurns}턴 남음.`);
      else {
        const before = actor.fragments;
        actor.fragments = Math.min(config.rules.maxFragments, actor.fragments + config.rules.basicRecovery);
        lines.push(`파편 ${actor.fragments - before} 회복 · 현재 ${actor.fragments}/${config.rules.maxFragments}.`);
      }
    }
  }
  if (blockedAtStart && !triggeredFragmentation) actor.recoveryBlockedTurns--;
  actor.actionsTaken++;
  advanceBattle(state);
  if (state.outcome) lines.push(state.outcome === 'victory' ? '모든 적이 물러났다. 승리!' : '형제 모두 전투 불능. 후퇴한다.');
  return { ok: true, lines };
}
function enemyIntent(state, config) {
  const actor = currentActor(state);
  const living = opponents(state, actor);
  if (!living.length || state.outcome) return null;
  // 임시 AI: 패턴을 따라가며, 코스트가 부족하면 기본 공격. 약한 상대부터 노립니다.
  const target = [...living].sort((a, b) => a.hp - b.hp)[0];
  const planned = actor.aiPattern?.[actor.actionsTaken % actor.aiPattern.length];
  let skill = actor.skills.find(item => item.id === planned) || actor.skills.find(item => item.kind === 'basic');
  let action = { skillId: skill.id, targetId: target.id };
  if (!actionAvailability(state, action, config).ok) {
    skill = actor.skills.find(item => item.kind === 'basic'); action = { skillId: skill.id, targetId: target.id };
  }
  return { ...action, name: skill.name, damage: skill.damage, cost: skill.cost, targetName: target.name };
}
if (typeof module !== 'undefined') module.exports = { createBattle, currentActor, opponents, validTargets, actionAvailability, takeTurn, enemyIntent };

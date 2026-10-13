const screen = document.getElementById('screen');
let dialogueIndex = 0, selectedChoice = null, battle = null, log = [], targetId = null;
let history = [], textParts = [], partIndex = 0, characterIndex = 0;
let typing = false, advance = null, typingTimer = null, advanceTimer = null;
let autoMode = false, skipMode = false;
const reviewDialog = document.getElementById('review-dialog');
const skipButton = document.getElementById('skip');
const autoButton = document.getElementById('auto');
document.getElementById('title').textContent = STORY.title;
document.title = `${STORY.title} · 스토리 게임 초안`;
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(label, handler, secondary = false) {
  const node = element('button', label, secondary ? 'secondary' : '');
  node.type = 'button'; node.addEventListener('click', handler); return node;
}
function scene(step, label, title, focusHeading = true) {
  clearTimeout(typingTimer); clearTimeout(advanceTimer);
  typing = false; advance = null; textParts = [];
  screen.classList.remove('battle-screen');
  screen.replaceChildren(element('p', label, 'eyebrow'));
  if (step === 1 || step === 2 || step === 3) { skipMode = false; autoMode = false; }
  updateControls();
  const heading = element('h2', title); heading.id = 'scene-title'; heading.tabIndex = -1;
  screen.append(heading);
  document.querySelectorAll('#steps li').forEach((node, index) => {
    node.classList.toggle('active', index === step);
    if (index === step) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
  });
  if (focusHeading) heading.focus();
}
function updateControls() {
  skipButton.setAttribute('aria-pressed', String(skipMode));
  autoButton.setAttribute('aria-pressed', String(autoMode));
  skipButton.textContent = skipMode ? '스킵 중 · 중지' : '스킵';
  autoButton.textContent = autoMode ? '자동 진행 · 켜짐' : '자동 진행';
  skipButton.disabled = !advance;
  autoButton.disabled = !advance;
}
function scheduleAdvance() {
  clearTimeout(advanceTimer);
  if (typing || !advance || reviewDialog.open || (!autoMode && !skipMode)) return;
  advanceTimer = setTimeout(() => { if (!reviewDialog.open && advance) advance(); },
    skipMode ? PRESENTATION.skipDelayMs : PRESENTATION.autoDelayMs);
}
function tickText() {
  if (!typing || reviewDialog.open) return;
  const part = textParts[partIndex];
  part.node.textContent = part.characters.slice(0, ++characterIndex).join('');
  if (characterIndex >= part.characters.length) {
    partIndex++; characterIndex = 0;
    if (partIndex >= textParts.length) { typing = false; scheduleAdvance(); return; }
  }
  typingTimer = setTimeout(tickText, PRESENTATION.typingIntervalMs);
}
function completeText() {
  clearTimeout(typingTimer);
  textParts.forEach(part => { part.node.textContent = part.text; });
  typing = false; scheduleAdvance();
}
function narrate(lines, next) {
  partIndex = 0; characterIndex = 0;
  textParts = lines.map(line => {
    if (line.speaker) screen.append(element('p', line.speaker, 'speaker'));
    const node = element('p', '', 'narrative'); screen.append(node);
    history.push({ speaker: line.speaker || '서술', text: line.text });
    return { node, text: line.text, characters: Array.from(line.text) };
  });
  advance = next || null; typing = true;
  screen.append(element('p', '스페이스바: 즉시 전체 출력 · 다음 버튼: 출력 완료 후 진행', 'muted'));
  updateControls();
  if (skipMode) completeText(); else typingTimer = setTimeout(tickText, PRESENTATION.typingIntervalMs);
}
function nextText() {
  if (typing) completeText(); else if (advance) { clearTimeout(advanceTimer); advance(); }
}
function showDialogue() {
  scene(0, STORY.location, STORY.sceneTitle);
  narrate([STORY.dialogue[dialogueIndex]], () => {
    if (++dialogueIndex < STORY.dialogue.length) showDialogue(); else showChoices();
  });
  screen.append(element('p', `${dialogueIndex + 1} / ${STORY.dialogue.length}`, 'muted'));
  screen.append(button(dialogueIndex === STORY.dialogue.length - 1 ? '준비를 선택하기 →' : '다음 대화 →', nextText));
}
function showChoices() {
  scene(1, '임시 설정 · 여정의 갈림길', STORY.choiceTitle);
  const choices = element('div', undefined, 'choices');
  STORY.choices.forEach(choice => {
    const node = button('', () => {
      selectedChoice = choice; battle = createBattle(COMBAT, choice);
      scene(1, '임시 설정 · 선택한 준비', choice.title);
      narrate([{ text: choice.response }, { text: STORY.encounter }], () => { log = ['전투 시작. 모두 파편 0. 루이 → 루인 → 제인 → 오른팔 → 왼팔 순서로 행동합니다.']; targetId = null; showBattle(); });
      screen.append(button('다리 위로 · 전투 시작 →', nextText));
    }, true);
    node.append(element('strong', choice.title), element('span', choice.description)); choices.append(node);
  });
  screen.append(choices);
}
function fragmentGauge(value, name, compact = false) {
  const gauge = element('div', undefined, compact ? 'fragment-gauge compact' : 'fragment-gauge');
  gauge.setAttribute('role', 'meter'); gauge.setAttribute('aria-label', `${name}의 파편 코스트`);
  gauge.setAttribute('aria-valuemin', '0'); gauge.setAttribute('aria-valuemax', String(COMBAT.rules.maxFragments));
  gauge.setAttribute('aria-valuenow', String(value)); gauge.setAttribute('aria-valuetext', `파편 ${value} / ${COMBAT.rules.maxFragments}`);
  for (let i = 0; i < COMBAT.rules.maxFragments; i++) {
    const piece = element('span', undefined, `fragment-piece${i < value ? ' filled' : ''}`);
    piece.setAttribute('aria-hidden', 'true'); gauge.append(piece);
  }
  return gauge;
}
function statusText(unit) {
  const statuses = [];
  if (unit.dark) statuses.push(`암흑 ${unit.dark}`);
  if (unit.radiance) statuses.push(`광채 ${unit.radiance}`);
  if (unit.recoveryBlockedTurns) statuses.push(`파편화 · 회복 금지 ${unit.recoveryBlockedTurns}턴`);
  if (unit.defending) statuses.push('방어 중');
  if (!unit.hp) statuses.push('전투 불능');
  return statuses.join(' · ') || '상태 이상 없음';
}
function partyPanel() {
  const panel = element('div', undefined, 'party-panel');
  panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', '파티 멤버');
  const strip = element('div', undefined, 'party-strip');
  battle.units.filter(unit => unit.side === 'party').forEach(member => {
    const active = member.id === currentActor(battle).id && !battle.outcome;
    const card = element('div', undefined, `party-cut${active ? ' current' : ''}${!member.hp ? ' fallen' : ''}`);
    card.dataset.unitId = member.id;
    if (active) card.setAttribute('aria-current', 'true');
    const portrait = element('div', undefined, `portrait ${member.portraitStyle}`);
    portrait.setAttribute('role', 'img'); portrait.setAttribute('aria-label', `${member.name} 임시 실루엣 초상`);
    const silhouette = element('span', undefined, 'silhouette'); silhouette.setAttribute('aria-hidden', 'true');
    portrait.append(silhouette, element('span', '임시 초상', 'portrait-placeholder'));
    card.append(portrait, element('strong', member.name), element('span', active ? '현재 턴' : member.hp ? '대기' : '전투 불능', 'member-role'),
      element('span', `체력 ${member.hp}/${member.maxHp}`, 'member-health'),
      fragmentGauge(member.fragments, member.name, true), element('span', statusText(member), 'member-status'));
    strip.append(card);
  });
  panel.append(element('p', 'PARTY / 파티', 'eyebrow'), strip); return panel;
}
function activeCostPanel() {
  const member = currentActor(battle);
  const panel = element('div', undefined, 'active-cost-panel'); panel.tabIndex = -1;
  const label = element('div', undefined, 'cost-heading');
  label.append(element('span', `${member.name}의 턴 · 파편 코스트`), element('strong', `${member.fragments} / ${COMBAT.rules.maxFragments}`));
  panel.append(label, fragmentGauge(member.fragments, member.name), element('p',
    member.recoveryBlockedTurns ? `파편화 · 이번 자신의 턴 포함 ${member.recoveryBlockedTurns}턴 회복 불가` : `기본 공격: 파편 +1 · 스킬: 지정 코스트 소모 · ${COMBAT.rules.enableOverdraw ? '허용된 스킬만 초과 사용 가능' : '초과 사용은 현재 보류'}`, 'cost-note'));
  return panel;
}
function enemyPanel() {
  const group = element('div', undefined, 'enemy-line'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', '적과 공격 대상');
  const actor = currentActor(battle);
  battle.units.filter(unit => unit.side === 'enemy').forEach(unit => {
    const card = button('', () => { targetId = unit.id; showBattle(true); }, true);
    card.className = `enemy-card${targetId === unit.id ? ' selected' : ''}${actor.id === unit.id ? ' acting' : ''}`;
    card.dataset.unitId = unit.id; card.disabled = !unit.hp || actor.side !== 'party';
    card.setAttribute('aria-label', `${unit.name} 대상 선택`); card.setAttribute('aria-pressed', String(targetId === unit.id));
    card.append(element('strong', unit.name), element('span', unit.role, 'muted'), element('span', `체력 ${unit.hp} / ${unit.maxHp}`, 'enemy-health'));
    const hp = element('progress'); hp.max = unit.maxHp; hp.value = unit.hp; hp.setAttribute('aria-label', `${unit.name} 체력`);
    card.append(hp, fragmentGauge(unit.fragments, unit.name, true), element('span', `파편 ${unit.fragments}/5`, 'cost-note'), element('span', statusText(unit), 'status-badge'));
    group.append(card);
  }); return group;
}
function doBattleAction(action) {
  const result = takeTurn(battle, action, COMBAT);
  if (!result.ok) return;
  log.push(...result.lines);
  if (battle.outcome) showResult(); else showBattle();
}
function showBattle(preserveFocus = false) {
  const actor = currentActor(battle);
  const enemies = battle.units.filter(unit => unit.side === 'enemy' && unit.hp > 0);
  if (!enemies.some(unit => unit.id === targetId)) targetId = enemies[0]?.id || null;
  scene(2, `임시 전투 · ${battle.round}라운드`, `${actor.name}의 턴`, !preserveFocus);
  screen.classList.add('battle-screen'); screen.prepend(partyPanel());
  screen.append(element('p', '임시 순서: 루이 → 루인 → 제인 → 오른팔 → 왼팔. 전투 불능 인물은 건너뜁니다.', 'muted'));
  screen.append(button('파편 게이지 · 행동 버튼으로 이동 ↓', () => {
    const target = screen.querySelector('.active-cost-panel'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true });
  }, true));
  screen.append(element('h3', actor.side === 'party' ? '공격할 적을 선택하세요' : '적의 행동을 확인하세요'), enemyPanel());
  const actions = element('div', undefined, 'actions battle-skills');
  if (actor.side === 'party') {
    screen.append(element('p', `선택한 대상: ${enemies.find(unit => unit.id === targetId)?.name || '없음'} · 체이스 대상에는 암흑이 필요합니다.`, 'target-info'));
    actor.skills.forEach(skill => {
      const action = { skillId: skill.id, targetId };
      if (COMBAT.rules.enableOverdraw && skill.allowOverdraw && actor.fragments < skill.cost) action.overdraw = true;
      const available = actionAvailability(battle, action, COMBAT);
      const cost = action.overdraw ? `파편 ${skill.cost} 초과 사용 · 파편화 2턴` : skill.kind === 'basic' ? '기본 공격 · 파편 +1' : `파편 ${skill.cost} 소모`;
      const node = button('', () => doBattleAction(action), true);
      node.disabled = !available.ok;
      const damage = skill.damage !== undefined ? `피해 ${skill.damage + (skill.kind === 'basic' ? actor.attackBonus : 0)} · 임시 수치` : '';
      node.append(element('strong', skill.name), element('span', cost, 'skill-cost'), element('span', skill.description, 'skill-description'));
      if (damage) node.append(element('span', damage, 'skill-description'));
      if (!available.ok) node.append(element('span', available.reason, 'unavailable-reason'));
      actions.append(node);
    });
    actions.append(button('방어 · 이번 턴 파편 회복 없음', () => doBattleAction({ skillId: 'defend' }), true));
  } else {
    const intent = enemyIntent(battle, COMBAT);
    screen.append(element('p', `${actor.name}: ${intent.name} → ${intent.targetName} · 피해 ${intent.damage} · ${intent.cost ? `파편 ${intent.cost} 소모` : '기본 공격, 파편 +1'}`, 'intent'));
    actions.append(button('적 행동 보기 →', () => doBattleAction(intent)));
    screen.append(element('p', '테스트 중 각 적의 코스트 변화를 볼 수 있도록 버튼을 누르면 적이 행동합니다.', 'muted'));
  }
  appendLog();
  const commandPanel = element('div', undefined, 'battle-command-panel'); commandPanel.append(activeCostPanel(), actions); screen.append(commandPanel);
  if (preserveFocus) screen.querySelector(`.enemy-card[data-unit-id="${targetId}"]`)?.focus({ preventScroll: true });
}
function appendLog() {
  const box = element('div', undefined, 'log'); box.setAttribute('role', 'log'); box.setAttribute('aria-label', '전투 기록');
  log.slice(-12).forEach(line => box.append(element('p', line))); screen.append(box);
}
function showResult() {
  const result = STORY[battle.outcome];
  scene(3, `임시 설정 · ${battle.outcome === 'victory' ? '승리' : '패배'}`, result.title);
  narrate([{ text: result.text }]);
  screen.append(element('p', `선택: ${selectedChoice.title} · ${battle.units.filter(unit => unit.side === 'party').map(unit => `${unit.name} 체력 ${unit.hp}/${unit.maxHp}`).join(' · ')}`, 'muted'));
  appendLog();
  screen.append(button('처음부터 다시 플레이 ↻', () => { dialogueIndex = 0; selectedChoice = null; battle = null; targetId = null; log = []; history = []; showDialogue(); }));
}
skipButton.addEventListener('click', () => {
  skipMode = !skipMode; autoMode = false; updateControls();
  if (skipMode && typing) completeText(); else scheduleAdvance();
});
autoButton.addEventListener('click', () => {
  autoMode = !autoMode; skipMode = false; updateControls(); scheduleAdvance();
});
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || reviewDialog.open || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  // 출력 중에는 버튼에 포커스가 있어도 전체 출력을 우선합니다.
  if (typing) { event.preventDefault(); completeText(); }
});
document.getElementById('review').addEventListener('click', () => {
  clearTimeout(typingTimer); clearTimeout(advanceTimer);
  const content = document.getElementById('review-content'); content.replaceChildren();
  if (!history.length) content.append(element('p', '아직 돌아볼 이야기가 없습니다.'));
  history.forEach(line => {
    const entry = element('div', undefined, 'review-entry');
    entry.append(element('p', line.speaker, 'speaker'), element('p', line.text)); content.append(entry);
  });
  reviewDialog.showModal(); document.getElementById('close-review').focus();
});
document.getElementById('close-review').addEventListener('click', () => reviewDialog.close());
reviewDialog.addEventListener('close', () => {
  if (typing) typingTimer = setTimeout(tickText, PRESENTATION.typingIntervalMs); else scheduleAdvance();
});
showDialogue();

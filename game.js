const screen = document.getElementById('screen');
let dialogueIndex = 0, selectedChoice = null, battle = null, log = [];
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
function scene(step, label, title) {
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
  heading.focus();
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
      narrate([{ text: choice.response }, { text: STORY.encounter }], () => { log = ['전투 시작. 적의 다음 행동을 살펴보세요.']; showBattle(); });
      screen.append(button('다리 위로 · 전투 시작 →', nextText));
    }, true);
    node.append(element('strong', choice.title), element('span', choice.description)); choices.append(node);
  });
  screen.append(choices);
}
function health(name, value, max) {
  const card = element('div', undefined, 'fighter');
  card.append(element('h3', name), element('p', `체력 ${value} / ${max}`));
  const meter = element('progress'); meter.max = max; meter.value = value; meter.setAttribute('aria-label', `${name} 체력`); card.append(meter); return card;
}
// 같은 현재값으로 하단 큰 게이지와 각 인물의 작은 게이지를 표시합니다.
function fragmentGauge(value, name, compact = false) {
  const gauge = element('div', undefined, compact ? 'fragment-gauge compact' : 'fragment-gauge');
  gauge.setAttribute('role', 'meter');
  gauge.setAttribute('aria-label', `${name}의 파편 코스트`);
  gauge.setAttribute('aria-valuemin', '0'); gauge.setAttribute('aria-valuemax', '5');
  gauge.setAttribute('aria-valuenow', String(value));
  gauge.setAttribute('aria-valuetext', `파편 ${value} / 5`);
  for (let i = 0; i < 5; i++) {
    const piece = element('span', undefined, `fragment-piece${i < value ? ' filled' : ''}`);
    piece.setAttribute('aria-hidden', 'true'); gauge.append(piece);
  }
  return gauge;
}
function partyPanel() {
  const panel = element('div', undefined, 'party-panel');
  panel.setAttribute('role', 'group'); panel.setAttribute('aria-label', '파티 멤버');
  const strip = element('div', undefined, 'party-strip');
  COMBAT.party.forEach(member => {
    const active = member.id === battle.activeMemberId;
    const card = element('div', undefined, `party-cut${active ? ' current' : ''}`);
    if (active) card.setAttribute('aria-current', 'true');
    const portrait = element('div', undefined, `portrait ${member.portraitStyle}`);
    portrait.setAttribute('role', 'img'); portrait.setAttribute('aria-label', `${member.name} 임시 실루엣 초상`);
    const silhouette = element('span', undefined, 'silhouette'); silhouette.setAttribute('aria-hidden', 'true');
    portrait.append(silhouette, element('span', '임시 초상', 'portrait-placeholder'));
    card.append(portrait, element('strong', member.name), element('span', active ? '현재 턴' : member.role, 'member-role'),
      fragmentGauge(battle.fragments[member.id], member.name, true));
    strip.append(card);
  });
  panel.append(element('p', 'PARTY / 파티', 'eyebrow'), strip); return panel;
}
function activeCostPanel() {
  const member = COMBAT.party.find(member => member.id === battle.activeMemberId);
  const panel = element('div', undefined, 'active-cost-panel');
  panel.tabIndex = -1;
  const label = element('div', undefined, 'cost-heading');
  label.append(element('span', `${member.name}의 턴 · 파편 코스트`), element('strong', `${battle.fragments[member.id]} / 5`));
  panel.append(label, fragmentGauge(battle.fragments[member.id], member.name),
    element('p', '시작값 5는 임시입니다. 코스트 소모·회복 규칙은 아직 적용하지 않았습니다.', 'cost-note'));
  return panel;
}
function showBattle() {
  scene(2, `임시 설정 · ${battle.turn}번째 턴`, '다리를 지켜라');
  screen.classList.add('battle-screen');
  screen.prepend(partyPanel());
  screen.append(button('파편 게이지 · 행동 버튼으로 이동 ↓', () => {
    const target = screen.querySelector('.active-cost-panel'); target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true });
  }, true));
  screen.append(element('p', `준비: ${selectedChoice.title}`, 'muted'));
  const fighters = element('div', undefined, 'fighters');
  fighters.append(health(COMBAT.player.name, battle.hp, battle.maxHp), health(COMBAT.enemy.name, battle.enemyHp, COMBAT.enemy.hp)); screen.append(fighters);
  const intent = enemyIntent(battle, COMBAT);
  screen.append(element('p', `적의 다음 행동: ${intent.heavy ? '강한 일격' : '공격'} · 예상 피해 ${intent.damage}`, intent.heavy ? 'intent heavy' : 'intent'));
  const actions = element('div', undefined, 'actions');
  const action = (id, label) => button(label, () => {
    log.push(...takeTurn(battle, id, COMBAT));
    if (battle.outcome) showResult(); else showBattle();
  });
  const skill = action('skill', `${COMBAT.skillName} · ${COMBAT.player.skillDamage} 피해 (${battle.skills}회)`); skill.disabled = battle.skills === 0;
  actions.append(action('attack', `공격 · ${COMBAT.player.attack + battle.attackBonus} 피해`), action('defend', `방어 · 받는 피해 ${Math.round((1 - COMBAT.defenseMultiplier) * 100)}% 감소`), skill);
  screen.append(element('p', '한 행동마다 적도 한 번 행동합니다. 스킬 사용 횟수는 전투 전체에 적용됩니다.', 'muted'));
  appendLog();
  const commandPanel = element('div', undefined, 'battle-command-panel');
  commandPanel.append(activeCostPanel(), actions); screen.append(commandPanel);
}
function appendLog() {
  const box = element('div', undefined, 'log'); box.setAttribute('role', 'log'); box.setAttribute('aria-label', '전투 기록');
  log.slice(-8).forEach(line => box.append(element('p', line))); screen.append(box);
}
function showResult() {
  const result = STORY[battle.outcome];
  scene(3, `임시 설정 · ${battle.outcome === 'victory' ? '승리' : '패배'}`, result.title);
  narrate([{ text: result.text }]);
  screen.append(element('p', `선택: ${selectedChoice.title} · 남은 체력: ${battle.hp} / ${battle.maxHp}`, 'muted'));
  appendLog();
  screen.append(button('처음부터 다시 플레이 ↻', () => { dialogueIndex = 0; selectedChoice = null; battle = null; log = []; history = []; showDialogue(); }));
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

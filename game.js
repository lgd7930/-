const screen = document.getElementById('screen');
let dialogueIndex = 0, selectedChoice = null, battle = null, log = [];
document.getElementById('title').textContent = STORY.title;
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
  screen.replaceChildren(element('p', label, 'eyebrow'));
  const heading = element('h2', title); heading.id = 'scene-title'; heading.tabIndex = -1;
  screen.append(heading);
  document.querySelectorAll('#steps li').forEach((node, index) => {
    node.classList.toggle('active', index === step);
    if (index === step) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
  });
  heading.focus();
}
function showDialogue() {
  scene(0, STORY.location, STORY.sceneTitle);
  const line = STORY.dialogue[dialogueIndex];
  screen.append(element('p', line.speaker, 'speaker'), element('p', line.text, 'narrative'));
  screen.append(element('p', `${dialogueIndex + 1} / ${STORY.dialogue.length}`, 'muted'));
  screen.append(button(dialogueIndex === STORY.dialogue.length - 1 ? '준비를 선택하기 →' : '다음 대화 →', () => {
    if (++dialogueIndex < STORY.dialogue.length) showDialogue(); else showChoices();
  }));
}
function showChoices() {
  scene(1, '임시 설정 · 여정의 갈림길', STORY.choiceTitle);
  const choices = element('div', undefined, 'choices');
  STORY.choices.forEach(choice => {
    const node = button('', () => {
      selectedChoice = choice; battle = createBattle(COMBAT, choice);
      scene(1, '임시 설정 · 선택한 준비', choice.title);
      screen.append(element('p', choice.response, 'narrative'), element('p', STORY.encounter, 'narrative'));
      screen.append(button('다리 위로 · 전투 시작 →', () => { log = ['전투 시작. 적의 다음 행동을 살펴보세요.']; showBattle(); }));
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
function showBattle() {
  scene(2, `임시 설정 · ${battle.turn}번째 턴`, '다리를 지켜라');
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
  screen.append(actions, element('p', '한 행동마다 적도 한 번 행동합니다. 스킬 사용 횟수는 전투 전체에 적용됩니다.', 'muted'));
  appendLog();
}
function appendLog() {
  const box = element('div', undefined, 'log'); box.setAttribute('role', 'log'); box.setAttribute('aria-label', '전투 기록');
  log.slice(-8).forEach(line => box.append(element('p', line))); screen.append(box);
}
function showResult() {
  const result = STORY[battle.outcome];
  scene(3, `임시 설정 · ${battle.outcome === 'victory' ? '승리' : '패배'}`, result.title);
  screen.append(element('p', result.text, 'narrative'), element('p', `선택: ${selectedChoice.title} · 남은 체력: ${battle.hp} / ${battle.maxHp}`, 'muted'));
  appendLog();
  screen.append(button('처음부터 다시 플레이 ↻', () => { dialogueIndex = 0; selectedChoice = null; battle = null; log = []; showDialogue(); }));
}
showDialogue();

// 인물 이름·형제 관계·아군 스킬은 사용자 설정입니다.
// 장면, 피해량, 체력, 적 스킬, 턴 순서와 아직 미정인 세부 처리는 임시 설정입니다.
const STORY = {
  title: '엘리멘트리',
  sceneTitle: '골목 끝의 자객',
  location: '임시 장면 · 제국 외곽 골목',
  dialogue: [
    { speaker: '서술', text: '루이와 동생 루인이 골목으로 들어선다. 출구에는 자객 제인과 두 부하가 기다리고 있다.' },
    { speaker: '루인', text: '형, 저들은 길을 비켜 줄 생각이 없어 보여.' },
    { speaker: '루이', text: '내 곁에 있어. 함께 길을 열자.' }
  ],
  choiceTitle: '어떻게 전투를 준비할까?',
  choices: [
    { id: 'focus', title: '공격에 집중한다', description: '루이의 기본 공격 피해 +3 · 임시 수치', attackBonus: 3, hpBonus: 0, response: '루이가 손끝에 중력을 응축한다. 루인은 그 곁에서 빛을 준비한다.' },
    { id: 'guard', title: '서로를 지킬 준비를 한다', description: '형제의 최대 체력 각각 +10 · 임시 수치', attackBonus: 0, hpBonus: 10, response: '형제는 서로의 등을 맡긴다. 서두르지 않고 기회를 기다리기로 한다.' }
  ],
  encounter: '제인이 두 부하에게 신호를 보낸다. 루이와 루인은 파편 0에서 싸움을 시작한다.',
  victory: { title: '형제가 연 길', text: '제인 일행이 물러난다. 루이와 루인은 함께 골목을 빠져나간다. 이 장면은 전투 규칙을 확인하기 위한 임시 이야기다.' },
  defeat: { title: '다음 기회를 위해', text: '형제는 더 싸우지 못하고 물러난다. 파편과 스택을 활용해 다시 도전해 보자. 이 결과는 임시 이야기다.' }
};
const COMBAT = {
  rules: { maxFragments: 5, initialFragments: 0, basicRecovery: 1, fragmentationTurns: 2, enableOverdraw: false, defenseMultiplier: 0.25 },
  // 아래 피해량·체력은 모두 임시이며 자유롭게 교체할 수 있습니다.
  party: [
    { id: 'louis', name: '루이', hp: 85, portraitStyle: 'arin', skills: [
      { id: 'gravity-ball', name: '그라비티 볼', kind: 'basic', effect: 'hit', cost: 0, damage: 12, status: 'dark', stacks: 1, description: '적 하나에게 중력 구체를 날려 피해와 암흑 1스택. 파편 1 회복.' },
      { id: 'gravity-fall', name: '그라비티 폴', kind: 'skill', effect: 'detonate-dark', cost: 1, damagePerStack: 18, allowOverdraw: false, description: '암흑이 있는 모든 적에게 시전. 각 적의 암흑을 모두 제거하고 스택당 18 피해(임시).' },
      { id: 'gravity-chase', name: '그라비티 체이스', kind: 'skill', effect: 'spread-dark', cost: 1, description: '암흑이 있는 적 하나의 스택을 생존 적 전체에 균등 분배. 총량을 보존하며 나머지는 배치 순서대로(임시).' }
    ] },
    { id: 'ruin', name: '루인', hp: 75, portraitStyle: 'miru', skills: [
      { id: 'faint-light', name: '어둠을 밝히는 빛', kind: 'basic', effect: 'hit', cost: 0, damage: 10, status: 'radiance', stacks: 1, description: '적 하나에게 빛줄기를 날려 피해와 광채 1스택. 파편 1 회복.' },
      { id: 'cutting-light', name: '어둠을 가르는 빛', kind: 'skill', effect: 'hit', cost: 1, damage: 20, status: 'radiance', stacks: 3, description: '적 하나에게 강한 빛줄기를 날려 피해와 광채 3스택. 광채의 추가 효과는 아직 미정.' }
    ] }
  ],
  enemies: [
    { id: 'jane', name: '제인', hp: 90, role: '자객', aiPattern: ['dagger', 'dagger', 'vital-strike', 'shadow-strike'], skills: [
      { id: 'dagger', name: '단검 찌르기', kind: 'basic', effect: 'hit', cost: 0, damage: 5, description: '적 하나에게 5 피해, 파편 1 회복 · 임시 스킬' },
      { id: 'vital-strike', name: '급소 찌르기', kind: 'skill', effect: 'hit', cost: 2, damage: 14, description: '적 하나에게 14 피해 · 임시 자객 스킬' },
      { id: 'shadow-strike', name: '그림자 습격', kind: 'skill', effect: 'hit', cost: 1, damage: 9, description: '적 하나에게 9 피해 · 임시 자객 스킬' }
    ] },
    { id: 'right-hand', name: '제인의 오른팔', hp: 45, role: '자객의 부하', aiPattern: ['right-dagger', 'double-cut'], skills: [
      { id: 'right-dagger', name: '날붙이 공격', kind: 'basic', effect: 'hit', cost: 0, damage: 4, description: '적 하나에게 4 피해, 파편 1 회복 · 임시 스킬' },
      { id: 'double-cut', name: '연속 베기', kind: 'skill', effect: 'hit', cost: 1, damage: 7, description: '적 하나에게 7 피해 · 임시 스킬' }
    ] },
    { id: 'left-hand', name: '제인의 왼팔', hp: 45, role: '자객의 부하', aiPattern: ['left-dagger', 'ambush'], skills: [
      { id: 'left-dagger', name: '기습 단검', kind: 'basic', effect: 'hit', cost: 0, damage: 4, description: '적 하나에게 4 피해, 파편 1 회복 · 임시 스킬' },
      { id: 'ambush', name: '매복 찌르기', kind: 'skill', effect: 'hit', cost: 1, damage: 7, description: '적 하나에게 7 피해 · 임시 스킬' }
    ] }
  ]
};
const PRESENTATION = { typingIntervalMs: 35, autoDelayMs: 1400, skipDelayMs: 120 };

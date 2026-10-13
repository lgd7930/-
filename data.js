// 이 파일의 모든 인물, 장소, 대사, 결과는 임시 설정입니다.
// 이야기 변경: STORY / 전투 밸런스 변경: COMBAT. 엔진 파일은 수정하지 않아도 됩니다.
const STORY = {
  title: '엘리멘트리',
  sceneTitle: '등불이 꺼지기 전에',
  location: '임시 설정 · 안개 숲 입구',
  dialogue: [
    { speaker: '서술', text: '마을의 마지막 등불이 흔들린다. 견습 수호자 아린은 숲에서 들려오는 구조 신호를 따라 나선다.' },
    { speaker: '동료 미루', text: '저 너머에 길을 잃은 아이가 있어. 하지만 그림자 늑대가 다리를 막고 있어.' },
    { speaker: '아린', text: '도망치지 않을 거야. 아이를 데리고 돌아오겠어.' }
  ],
  choiceTitle: '무엇을 준비할까?',
  choices: [
    { id: 'blade', title: '검에 빛을 두른다', description: '이번 전투의 일반 공격 피해 +3', attackBonus: 3, hpBonus: 0, response: '아린의 검끝에 푸른 빛이 맺힌다. 짧은 전투로 끝내겠다는 다짐이다.' },
    { id: 'charm', title: '미루의 수호 부적을 받는다', description: '이번 전투의 최대 체력 +10', attackBonus: 0, hpBonus: 10, response: '미루가 손에 부적을 쥐여 준다. 따뜻한 온기가 아린의 숨을 고르게 한다.' }
  ],
  encounter: '낡은 다리 위로 그림자 늑대가 모습을 드러낸다. 아이가 건너올 시간을 벌어야 한다.',
  victory: { title: '다시 켜진 등불', text: '늑대가 안개 속으로 물러난다. 아린과 미루는 아이의 손을 잡고 마을로 돌아온다. 오늘의 약속은 지켜졌다.' },
  defeat: { title: '잠시 물러서는 용기', text: '미루가 아린을 부축해 안전한 곳으로 물러난다. 아이는 다리 아래 은신처에 숨어 있다. 준비를 바꿔 다시 도전해 보자.' }
};
const COMBAT = {
  player: { name: '아린', hp: 40, attack: 8, skills: 2, skillDamage: 18 },
  enemy: { name: '그림자 늑대', hp: 48, attack: 9, heavyAttack: 15, heavyEvery: 3 },
  defenseMultiplier: 0.25,
  skillName: '새벽의 빛'
};

// 텍스트 연출 설정 (밀리초). 원작 설정과 별도로 조정할 수 있습니다.
const PRESENTATION = { typingIntervalMs: 35, autoDelayMs: 1400, skipDelayMs: 120 };

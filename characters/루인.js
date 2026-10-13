// 루인의 설정과 스킬을 이 파일에서 수정하세요.
// 숫자는 임시 수치입니다. 이름과 기술의 기본 효과는 사용자 설정입니다.
// 숫자에는 따옴표를 쓰지 않고, 글에는 따옴표를 유지하세요.
const RUIN = {
  id: 'ruin',               // 게임 연결용 이름: 다른 인물과 중복 금지
  name: '루인',              // 화면에 표시되는 이름
  hp: 75,                  // 최대 체력 (임시)
  portraitStyle: 'miru',    // 임시 초상 스타일

  // 소설 설정용 메모. 아직 게임 화면에는 출력하지 않습니다.
  profile: {
    relationship: '루이의 동생',
    age: null,
    affiliation: '미정',
    personality: '미정',
    backstory: '미정'
  },

  // 스킬 하나는 { ... } 한 묶음입니다. 추가할 때 id를 중복하지 마세요.
  skills: [
    {
      id: 'faint-light',
      name: '어둠을 밝히는 빛',
      kind: 'basic',        // basic: 기본 공격 / skill: 파편을 쓰는 기술
      effect: 'hit',        // 선택한 적 하나에게 피해와 상태 스택
      cost: 0,
      damage: 10,          // 피해량 (임시)
      status: 'radiance',   // radiance: 광채 / dark: 암흑
      stacks: 1,
      description: '미약한 빛줄기를 적 하나에게 날린다.'
    },
    {
      id: 'cutting-light',
      name: '어둠을 가르는 빛',
      kind: 'skill',
      effect: 'hit',
      cost: 1,             // 파편 소모량
      damage: 20,          // 피해량 (임시)
      status: 'radiance',
      stacks: 3,           // 부여할 광채 스택 수. 추가 효과는 아직 미정
      description: '전방을 가르는 빛줄기를 적 하나에게 날린다.'
    }
  ]
};

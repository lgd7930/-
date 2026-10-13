// 루이의 설정과 스킬을 이 파일에서 수정하세요.
// 숫자는 임시 수치입니다. 이름과 기술의 기본 효과는 사용자 설정입니다.
// 숫자에는 따옴표를 쓰지 않고, 글에는 따옴표를 유지하세요.
const LOUIS = {
  id: 'louis',              // 게임 연결용 이름: 다른 인물과 중복 금지
  name: '루이',             // 화면에 표시되는 이름
  hp: 85,                  // 최대 체력 (임시)
  portraitStyle: 'arin',    // 임시 초상 스타일

  // 소설 설정을 정리하는 메모입니다. 아직 게임 화면에는 출력하지 않습니다.
  profile: {
    relationship: '루인의 손위 형제',
    age: null,             // 미정. 예: 20
    affiliation: '미정',    // 소속
    personality: '미정',    // 성격
    backstory: '미정'       // 배경 이야기
  },

  // 스킬을 추가하려면 아래 { ... } 한 묶음을 복사해 skills 안에 넣으세요.
  // id는 각각 달라야 합니다. 새 기술의 기본 처리 방식은 아래 effect 중 선택합니다.
  skills: [
    {
      id: 'gravity-ball',
      name: '그라비티 볼',
      kind: 'basic',        // basic: 기본 공격 / skill: 파편을 쓰는 기술
      effect: 'hit',        // hit: 선택한 적 하나에 피해와 상태 스택
      cost: 0,             // 기본 공격은 0. 공격 후 공통 규칙에 따라 파편 회복
      damage: 12,          // 피해량 (임시). 전투 준비 보너스는 별도 적용
      status: 'dark',       // dark: 암흑 / radiance: 광채
      stacks: 1,           // 부여할 스택 수
      description: '중력을 응축한 구체를 적 하나에게 날린다.'
    },
    {
      id: 'gravity-fall',
      name: '그라비티 폴',
      kind: 'skill',
      effect: 'detonate-dark', // 암흑이 있는 모든 적에게 스택을 소진하며 피해
      cost: 1,                // 파편 소모량
      damagePerStack: 18,      // 암흑 1스택당 피해량 (임시)
      allowOverdraw: false,    // 초과 사용 보류. 공통 허용 설정도 켜져야 사용 가능
      description: '암흑이 있는 모든 적의 스택을 각각 모두 소진해 피해를 준다.'
    },
    {
      id: 'gravity-chase',
      name: '그라비티 체이스',
      kind: 'skill',
      effect: 'spread-dark',   // 선택한 적의 암흑을 생존 적 전체에 확산
      cost: 1,
      description: '암흑이 있는 적 하나의 스택을 전체로 확산. 모든 생존 적에게 최소 1스택, 추가분은 균등 분배.'
    }
  ]
};

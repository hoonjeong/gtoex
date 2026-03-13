export const STRINGS = {
  appTitle: 'GTOex',
  appSubtitle: '홀덤 GTO 트레이너',

  // Setup page
  setupTitle: '게임 설정',
  modeLabel: '게임 모드',
  modeCash: '링게임 (Cash)',
  modeTournament: '토너먼트 (MTT)',
  anteLabel: '앤티',
  formatLabel: '테이블 형식',
  format6Max: '6-Max',
  format9Max: '9-Max',
  stackLabel: '스택 사이즈',
  positionLabel: '히어로 포지션',
  randomPosition: '랜덤',
  scenarioLabel: '시나리오',
  scenarioRFI: 'RFI (오픈 레이즈)',
  scenarioVsRFI: 'vs RFI (오픈에 대한 대응)',
  scenarioVs3Bet: 'vs 3-Bet',
  scenarioAll: '전체 (랜덤)',
  startGame: '게임 시작',
  randomSetup: '랜덤 설정',

  // Play page
  fold: '폴드',
  call: '콜',
  check: '체크',
  raise: '레이즈',
  bet: '벳',
  potLabel: '팟',
  heroLabel: '히어로',
  nextHand: '다음 핸드',
  backToSetup: '설정으로',

  // Feedback
  correct: '정답!',
  incorrect: '오답',
  acceptable: '허용 가능',
  gtoFrequencies: 'GTO 빈도',
  explanation: '해설',
  rangeView: '레인지 보기',
  sessionStats: '세션 통계',

  // Stats
  totalHands: '총 핸드',
  accuracy: '정답률',
  byPosition: '포지션별',
  byStreet: '스트릿별',
  preflopAccuracy: '프리플랍 정답률',
  flopAccuracy: '플랍 정답률',
  turnAccuracy: '턴 정답률',
  riverAccuracy: '리버 정답률',
  resetStats: '통계 초기화',

  // Hand strengths
  monster: '몬스터 핸드',
  very_strong: '매우 강한 핸드',
  strong: '강한 핸드',
  medium: '중간 핸드',
  weak: '약한 핸드',
  draw: '드로우',
  nothing: '에어 (노 메이드)',
} as const;

import React, { useState, useMemo } from 'react';
import {
  Building2, Users, TrendingUp, Wallet, RotateCcw, ArrowRight,
  AlertTriangle, CheckCircle2, Lightbulb, MapPin, Trophy, Sparkles
} from 'lucide-react';

/* =========================================================================
   밸런스 상수 (단일 난이도 · 긴장감 중심)
   빠듯한 예산 + 매 턴 도시 쇠퇴 압력 + 낮은 시작 지표 + 높은 합격선
   ========================================================================= */
const START_BUDGET = 6500;   // 6,500만원 (모든 고급안을 다 살 수는 없음)
const START_SCORE  = 25;     // 침체된 원도심
const DECAY        = 1;      // 매 턴 진입 시 모든 지표 -1
const PASS_LINE    = 60;     // 평균 60 이상이면 재생 성공

/* =========================================================================
   턴별 이벤트 (소극적 선택의 페널티 강화 → 긴장감)
   ========================================================================= */
const gameEvents = [
  { tag: '정책 전환', icon: '🧭', title: '정책 방향 전환 (모관지구)',
    description: "전면 철거 대신, 지역 특성을 살린 '기능 회복' 중심으로 원도심 재생 정책을 전환합니다. 첫 핵심 사업을 선택하세요.",
    options: [
      { text: '창업·커뮤니티 거점시설 조성', cost: 1000, effects: { infra: 15, people: 5, economy: 5 }, log: '창업·커뮤니티 거점을 조성해 주민 참여 기반을 마련했습니다.' },
      { text: '생활 SOC 확충 및 주거지 정비', cost: 1500, effects: { infra: 25, people: 5, economy: 0 }, log: '기초 인프라를 정비해 원도심 정주 여건을 개선했습니다.' },
    ] },
  { tag: '공공기관 이전', icon: '🏢', title: '공공기관 전략적 원도심 이전',
    description: '청년·창업·문화·교육 분야 공공기관 및 단체(제주청년센터, 더큰내일센터 등 9개)를 원도심으로 순차 이전시킬 기회입니다.',
    options: [
      { text: '9개 기관·단체 이전 감행', cost: 2000, effects: { people: 25, economy: 15, infra: 5 }, log: '220여 명의 상주 인력과 청년 이용자가 유입되며 생활인구가 급증했습니다!' },
      { text: '이전 보류 및 예산 비축', cost: 0, effects: { people: -8, economy: -8, infra: 0 }, log: '기관 이전이 보류되며 원도심 공동화가 오히려 심화됩니다.' },
    ] },
  { tag: '상권 활성화', icon: '🛍️', title: '자율상권구역 지정 및 활성화',
    description: "칠성로·중앙로·중앙지하상가 일대를 '자율상권구역'으로 지정하고 상권활성화사업(최대 100억원 규모)을 추진합니다.",
    options: [
      { text: '100억 규모 상권 집중 투자', cost: 1500, effects: { economy: 25, people: 5, infra: 5 }, log: '칠성로·지하상가에 소비 수요가 살아나며 빈 점포가 줄어듭니다.' },
      { text: '소규모 홍보 마케팅만 진행', cost: 500, effects: { economy: 10, people: 0, infra: 0 }, log: '단기 홍보 효과에 그쳐 상권 체질 개선에는 아쉬움이 남습니다.' },
    ] },
  { tag: '앵커시설', icon: '📍', title: '원도심 앵커 거점시설 건립',
    description: '원도심으로 유동인구를 끌어들일 핵심 문화·관광 거점 시설을 조성하고자 합니다.',
    options: [
      { text: '제주여행자센터 신설', cost: 1000, effects: { people: 15, economy: 10, infra: 10 }, log: '외부 관광객이 원도심으로 진입하는 게이트웨이가 생겼습니다.' },
      { text: "문화공간 '갤러리 숨비마루' 조성", cost: 800, effects: { infra: 15, people: 10, economy: 5 }, log: '도민과 예술인이 모이는 문화 예술 거점이 둥지를 텄습니다.' },
    ] },
  { tag: '거버넌스', icon: '🤝', title: '(가칭)원도심 활성화 협의체 구성',
    description: '입주한 공공기관과 민간 단체 간 상호교류·소통을 강화하기 위한 거버넌스 체계를 구축해야 합니다.',
    options: [
      { text: '민관 협의체 공식 발족', cost: 300, effects: { people: 10, economy: 5, infra: 5 }, log: '민관 소통이 강화되며 지역 맞춤형 로컬 프로젝트가 활발해집니다.' },
      { text: '기존 관주도 방식 유지', cost: 0, effects: { people: -8, economy: 0, infra: 0 }, log: '소통 부족으로 공공기관 종사자와 기존 상권의 연계가 약화됩니다.' },
    ] },
  { tag: '혁신지구', icon: '⚓', title: '탑동 도시재생혁신지구 후보지 선정',
    description: "국토부 도시재생혁신지구 후보지로 '탑동 혁신지구'가 선정되었습니다! 제주신항과 원도심을 잇는 전략을 세우세요.",
    options: [
      { text: '해양관광–원도심 상권 연계망 구축', cost: 1200, effects: { infra: 20, economy: 15, people: 5 }, log: '제주신항 방문객 동선이 칠성로·중앙로로 이어지기 시작합니다.' },
      { text: '혁신지구 구역 내 독립 개발', cost: 1000, effects: { infra: 20, economy: 5, people: 0 }, log: '탑동은 화려해졌으나 내륙 상권과의 시너지는 다소 부족합니다.' },
    ] },
  { tag: '복합시설', icon: '🎪', title: '탑동 복합 앵커시설 도입',
    description: '탑동 혁신지구 핵심이 될 복합 앵커시설의 주력 기능을 결정해야 합니다.',
    options: [
      { text: '실내외 공연장 및 문화·여가 공간', cost: 1500, effects: { infra: 25, people: 15, economy: 5 }, log: "대규모 축제가 열리며 '사람 중심' 원도심의 상징이 되었습니다." },
      { text: '대형 공영주차장 및 행정 편의시설', cost: 1200, effects: { infra: 20, economy: 15, people: 5 }, log: '고질적 주차 문제가 풀리며 상가 접근성이 크게 좋아졌습니다.' },
    ] },
  { tag: '로컬창업', icon: '☕', title: '로컬 크리에이터 창업 열풍',
    description: '활성화 소식에 청년 창업가들이 빈 점포를 활용해 로컬 브랜드 카페·편집숍을 열기 시작했습니다.',
    options: [
      { text: '청년 로컬 브랜드 정착 지원', cost: 800, effects: { economy: 15, people: 10, infra: 5 }, log: '원도심만의 감성이 생겨나며 젊은 층 발길이 끊이지 않습니다.' },
      { text: '자연스러운 시장 경쟁에 위탁', cost: 0, effects: { economy: 5, people: -8, infra: 0 }, log: '일부 점포는 높은 임대료를 못 버티고 다시 공실이 됩니다.' },
    ] },
  { tag: '15분도시', icon: '🚶', title: "'15분 도시' 보행 환경 개선",
    description: '걸어서 15분 내에 문화·상권·행정 서비스를 누릴 수 있도록 보행 동선 혁신을 추진합니다.',
    options: [
      { text: '차없는 거리·보행자 중심 도로 개설', cost: 1000, effects: { infra: 15, people: 15, economy: 5 }, log: '걷기 좋은 거리가 되어 유동인구의 체류 시간이 늘었습니다.' },
      { text: '현행 도로 유지 + 스마트 가로등', cost: 400, effects: { infra: 10, people: 5, economy: 0 }, log: '안전성은 확보됐지만 머무는 매력적인 거리엔 부족합니다.' },
    ] },
  { tag: '최종평가', icon: '📢', title: '최종 캠페인: 사람이 다시 모이는 원도심',
    description: '재생 프로젝트의 최종 결과 발표를 앞두고, 마지막 홍보 캠페인을 추진합니다.',
    options: [
      { text: '성과 공유회 및 대도민 축제 개최', cost: 500, effects: { people: 10, economy: 10, infra: 0 }, log: "'다시 시작하는 원도심' 브랜딩을 도민과 관광객에게 각인시켰습니다." },
      { text: '백서 발간 및 행정 마무리', cost: 100, effects: { people: 0, economy: 0, infra: 5 }, log: '조용히 행정 절차를 마무리하며 최종 스코어를 집계합니다.' },
    ] },
];

/* 턴별 정책 배경 Tip (학습 요소) */
const policyTips = [
  { title: '기능 회복형 도시재생', body: "과거 도시정비는 '전면 철거 후 재개발'이 많았지만, 최근 패러다임은 기존 건물·골목·공동체를 보존하며 쇠퇴한 기능을 점진적으로 되살리는 방식입니다. 사람을 내쫓지 않는 재생이 핵심 원칙으로 자리잡았습니다." },
  { title: '생활인구와 공동화 해소', body: "원도심 쇠퇴의 핵심은 인구 유출로 인한 '공동화'입니다. 공공기관·청년시설을 이전시키면 안정적인 상주·유동 인구가 생겨 주변 상권 회복의 마중물이 됩니다. 거주인구뿐 아니라 '낮 시간대 생활인구'가 중요한 이유입니다." },
  { title: '자율상권구역 제도', body: "'지역상권 상생 및 활성화에 관한 법률'에 근거한 제도로, 상인·임대인·주민이 자율적으로 활성화 계획을 세우고 정부가 지원합니다. 임대료 안정을 위한 상생협약과 묶어 추진하면 효과가 오래갑니다." },
  { title: '앵커(거점) 시설의 역할', body: "앵커시설은 사람을 끌어들이는 '닻' 역할을 합니다. 여행자센터·문화공간 같은 방문 목적지가 생기면 체류 시간과 소비가 늘고, 그 효과가 주변 골목 상권으로 번집니다." },
  { title: '민관 거버넌스', body: "도시재생의 성패는 결국 '주체 간 협력'에 달려 있습니다. 행정 지원이 끝난 뒤에도 스스로 굴러가는 자생력을 만들려면 주민·상인·기관이 함께 의사결정하는 거버넌스가 필수입니다." },
  { title: '도시재생혁신지구', body: "도시재생 특별법상 '혁신지구'는 쇠퇴 지역에 주거·상업·문화 기능을 집적시키는 거점개발 방식입니다. 국가 시범사업으로 지정되면 규제 특례와 재정 지원을 받아 큰 변화를 만들 수 있습니다." },
  { title: '복합 기능의 집객력', body: "단일 기능보다 문화·상업·편의가 결합된 복합 시설이 사람을 더 오래 머물게 합니다. 다만 주차·접근성 같은 기반시설도 방문을 좌우하는 현실 변수라, 둘 사이 균형이 중요합니다." },
  { title: '젠트리피케이션 주의', body: "빈 점포를 청년·로컬 브랜드가 채우는 '리노베이션 창업'은 원도심 고유의 매력을 만듭니다. 다만 인기가 오르면 임대료가 급등해 정작 그 동네를 살린 사람들이 밀려나는 젠트리피케이션을 경계해야 합니다." },
  { title: "'15분 도시' 개념", body: "도보·자전거로 15분 안에 일상 서비스에 닿게 하는 도시계획 패러다임으로, 파리 등 세계 도시가 채택했습니다. 보행 친화 환경은 체류·소비를 늘리지만 차량 이용자와의 갈등을 조정하는 것이 과제입니다." },
  { title: '성과 환류와 지속가능성', body: "재생사업은 성과 공유와 브랜딩을 통해 시민 인식을 바꾸고 다음 투자를 끌어냅니다. 백서·평가로 무엇이 통했는지 다음 정책에 피드백(환류)하는 것까지가 재생의 한 사이클입니다." },
];

/* 시드 랜덤 (렌더 안정) */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260104);
const STARS = Array.from({ length: 48 }, () => ({ x: rng() * 600, y: rng() * 190, r: rng() * 1.3 + 0.3, d: (rng() * 4).toFixed(2) }));
const PEOPLE_SPOTS = Array.from({ length: 16 }, () => ({ x: 55 + rng() * 500, y: 384 + rng() * 12, d: (rng() * 3).toFixed(2) }));
const BUILDINGS = [
  { x: 64, w: 50, h: 86, c: '#27375a' }, { x: 128, w: 44, h: 124, c: '#2f4267' },
  { x: 186, w: 58, h: 158, c: '#283a5e' }, { x: 258, w: 48, h: 104, c: '#2f4267' },
  { x: 322, w: 62, h: 182, c: '#283a5e' }, { x: 400, w: 46, h: 116, c: '#2f4267' },
  { x: 460, w: 56, h: 146, c: '#283a5e' }, { x: 532, w: 46, h: 96, c: '#2f4267' },
];
const NEON_COLORS = ['#fb923c', '#f472b6', '#fbbf24', '#22d3ee', '#a78bfa', '#fb7185', '#34d399', '#60a5fa'];

const clamp = (v) => Math.min(100, Math.max(0, v));
const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);
const getGrade = (avg) =>
  avg >= 85 ? { g: 'S', c: '#fbbf24' } :
  avg >= 72 ? { g: 'A', c: '#34d399' } :
  avg >= 60 ? { g: 'B', c: '#60a5fa' } :
  avg >= 45 ? { g: 'C', c: '#fb923c' } : { g: 'D', c: '#fb7185' };

/* 성장하는 원도심 야경 */
function CityScape({ scores }) {
  const avg = (scores.people + scores.economy + scores.infra) / 3;
  const litCount = Math.round((scores.infra / 100) * BUILDINGS.length);
  const neonCount = Math.round((scores.economy / 100) * BUILDINGS.length);
  const peopleCount = Math.round((scores.people / 100) * PEOPLE_SPOTS.length);
  const ground = 380;
  return (
    <svg viewBox="0 0 600 410" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block', borderRadius: 12 }}>
      <defs>
        <linearGradient id="jsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a1428" /><stop offset="60%" stopColor="#0c1730" /><stop offset="100%" stopColor="#0a1020" /></linearGradient>
        <radialGradient id="jamb" cx="50%" cy="100%" r="80%"><stop offset="0%" stopColor="#f97316" stopOpacity={0.1 + (avg / 100) * 0.4} /><stop offset="100%" stopColor="#f97316" stopOpacity="0" /></radialGradient>
        <linearGradient id="jsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#13315c" /><stop offset="100%" stopColor="#0a1a33" /></linearGradient>
        <radialGradient id="jmoon" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="600" height="410" fill="url(#jsky)" />
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cbd5e1" className="twinkle" style={{ animationDelay: `${s.d}s` }} />)}
      <circle cx="528" cy="58" r="20" fill="url(#jmoon)" />
      <path d="M -20 300 Q 150 150 300 220 Q 450 130 640 300 Z" fill="#101d38" opacity="0.85" />
      <path d="M 250 210 Q 300 188 350 210 L 330 235 Q 300 222 270 235 Z" fill="#0b1730" opacity="0.9" />
      <rect x="0" y="200" width="600" height="210" fill="url(#jamb)" />
      {BUILDINGS.map((b, i) => {
        const active = i < litCount;
        const top = ground - b.h;
        const cols = Math.max(2, Math.floor(b.w / 15));
        const rows = Math.max(3, Math.floor(b.h / 22));
        const lit = i < neonCount && active;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={active ? b.c : '#16213a'} stroke={active ? '#3f567f' : '#1b2840'} strokeWidth="1" style={active ? { filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.35))' } : undefined} />
            {Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((_, c) => {
              const wx = b.x + 6 + c * ((b.w - 10) / cols);
              const wy = top + 8 + r * ((b.h - 14) / rows);
              const on = active && ((r * 31 + c * 17 + i * 7) % 5 !== 0);
              return <rect key={`${r}-${c}`} x={wx} y={wy} width={(b.w - 12) / cols * 0.62} height={6} rx="1" fill={on ? (lit ? '#fde68a' : '#7dd3fc') : '#1f2c47'} opacity={on ? 0.92 : 0.5} />;
            }))}
            {lit && <rect x={b.x + b.w / 2 - 9} y={top - 9} width="18" height="6" rx="2" fill={NEON_COLORS[i % NEON_COLORS.length]} className="neon" style={{ animationDelay: `${(i * 0.3).toFixed(1)}s` }} />}
          </g>
        );
      })}
      <rect x="0" y={ground} width="600" height="6" fill="#1c2a47" />
      <rect x="0" y={ground + 6} width="600" height="14" fill="#15223c" />
      {PEOPLE_SPOTS.slice(0, peopleCount).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="#22d3ee" className="walker" style={{ animationDelay: `${p.d}s`, filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.9))' }} />
      ))}
      <rect x="0" y={ground + 20} width="600" height="20" fill="url(#jsea)" />
      <text x="14" y={ground + 34} fontSize="9" fill="#64748b" letterSpacing="2">탑동 앞바다</text>
      {avg < 8 && <text x="300" y="220" textAnchor="middle" fontSize="11" fill="#475569">— 침체된 원도심 —</text>}
    </svg>
  );
}

const COL = {
  bg: '#070c18', panel: '#111a2e', panelSoft: '#0e1626', border: '#1f2c45',
  text: '#e8eefb', mute: '#94a3b8', faint: '#64748b',
  orange: '#fb923c', orangeD: '#f97316',
  people: '#22d3ee', economy: '#fbbf24', infra: '#818cf8', ok: '#34d399', bad: '#fb7185',
};
const FONT = "'Pretendard Variable','Pretendard',system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const panel = (extra = {}) => ({ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.35)', ...extra });

function Badge({ c, t }) {
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: c + '1a', padding: '3px 8px', borderRadius: 6 }}>{t}</span>;
}

function Bar({ icon, label, value, color, delta }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COL.text }}>{icon}{label}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {delta != null && delta !== 0 && <span style={{ fontSize: 11, fontWeight: 700, color: delta > 0 ? COL.ok : COL.bad }}>{fmt(delta)}</span>}
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}<span style={{ color: COL.faint, fontWeight: 600 }}>/100</span></span>
        </span>
      </div>
      <div style={{ width: '100%', height: 8, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .5s cubic-bezier(.2,.8,.2,1)', boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [turn, setTurn] = useState(1);
  const [budget, setBudget] = useState(START_BUDGET);
  const [scores, setScores] = useState({ people: START_SCORE, economy: START_SCORE, infra: START_SCORE });
  const [logs, setLogs] = useState(['프로젝트 시작 전 — 원도심은 깊은 침체에 빠져 있습니다.']);
  const [lastDelta, setLastDelta] = useState(null);
  const [tip, setTip] = useState(null);

  const event = gameEvents[turn - 1];
  const avg = useMemo(() => Math.round((scores.people + scores.economy + scores.infra) / 3), [scores]);
  const grade = getGrade(avg);
  const canAffordAny = event.options.some((o) => budget >= o.cost);

  const startGame = () => {
    setPhase('play'); setTurn(1); setBudget(START_BUDGET);
    setScores({ people: START_SCORE, economy: START_SCORE, infra: START_SCORE });
    setLogs(['제주 원도심 재생 프로젝트가 시작되었습니다.']);
    setLastDelta(null); setTip(null);
  };
  const choose = (o) => {
    if (budget < o.cost) return;
    setBudget((b) => b - o.cost);
    setScores((s) => ({ people: clamp(s.people + o.effects.people), economy: clamp(s.economy + o.effects.economy), infra: clamp(s.infra + o.effects.infra) }));
    setLastDelta(o.effects);
    setLogs((l) => [o.log, ...l]);
    setTip({ idx: turn - 1, option: o });
  };
  const skipTurn = () => {
    const o = { text: '사업 보류 (예산 부족)', cost: 0, effects: { people: -3, economy: -3, infra: -3 },
      log: '예산 부족으로 이번 사업을 추진하지 못했습니다. 원도심이 한 발 더 쇠퇴합니다.' };
    setScores((s) => ({ people: clamp(s.people + o.effects.people), economy: clamp(s.economy + o.effects.economy), infra: clamp(s.infra + o.effects.infra) }));
    setLastDelta(o.effects);
    setLogs((l) => [o.log, ...l]);
    setTip({ idx: turn - 1, option: o });
  };
  const nextTurn = () => {
    if (turn < 10) {
      if (DECAY > 0) setScores((s) => ({ people: clamp(s.people - DECAY), economy: clamp(s.economy - DECAY), infra: clamp(s.infra - DECAY) }));
      setTurn((t) => t + 1); setTip(null);
    } else { setTip(null); setPhase('result'); }
  };
  const reset = () => setPhase('intro');

  return (
    <div style={{ background: COL.bg, minHeight: '100vh', color: COL.text, fontFamily: FONT, padding: '20px 16px' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css');
        @keyframes twinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
        @keyframes neonPulse { 0%,100%{opacity:.55; filter:drop-shadow(0 0 2px currentColor)} 50%{opacity:1; filter:drop-shadow(0 0 7px currentColor)} }
        @keyframes walk { 0%{transform:translateX(0)} 100%{transform:translateX(14px)} }
        @keyframes fadeUp { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }
        @keyframes pop { from{opacity:0; transform:scale(.94)} to{opacity:1; transform:scale(1)} }
        .twinkle{ animation:twinkle 3.5s ease-in-out infinite; }
        .neon{ animation:neonPulse 2.4s ease-in-out infinite; }
        .walker{ animation:walk 2.6s ease-in-out infinite alternate; }
        .fadeup{ animation:fadeUp .45s ease both; }
        .pop{ animation:pop .28s ease both; }
        .opt:hover:not(:disabled){ border-color:#52689a !important; background:#16223c !important; transform:translateY(-2px); }
        .opt{ transition:all .18s ease; }
        .pbtn{ transition:all .15s ease; }
        .pbtn:hover{ filter:brightness(1.08); transform:translateY(-1px); }
        .logbox::-webkit-scrollbar{ width:6px; } .logbox::-webkit-scrollbar-thumb{ background:#2a3a5c; border-radius:4px; }
        .layout{ display:grid; grid-template-columns: minmax(0,1.55fr) minmax(280px,1fr); gap:16px; }
        .opts{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        @media (max-width: 860px){ .layout{ grid-template-columns: 1fr; } .opts{ grid-template-columns: 1fr; } }
      `}</style>

      {/* ===== 인트로 ===== */}
      {phase === 'intro' && (
        <div className="fadeup" style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={panel({ overflow: 'hidden' })}>
            <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0c1730,#0a1020)', borderBottom: `1px solid ${COL.border}` }}>
              <CityScape scores={{ people: 18, economy: 18, infra: 22 }} />
              <div style={{ position: 'absolute', top: 18, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: COL.orangeD, padding: 9, borderRadius: 12, display: 'flex' }}><Building2 size={22} color="#fff" /></div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>15분 도시 제주</h1>
                  <p style={{ margin: 0, fontSize: 12, color: COL.mute }}>원도심 도시재생 시뮬레이터</p>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <MapPin size={18} color={COL.orange} /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>제주 원도심이란?</h2>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.75, color: '#cbd5e1' }}>
                제주 <b style={{ color: COL.text }}>원도심</b>은 제주시의 옛 중심지인 <b style={{ color: COL.text }}>칠성로·중앙로·동문시장·탑동</b> 일대를 말합니다.
                한때 제주의 행정·상업·문화가 모이던 번화가였지만, 1990년대 이후 <b style={{ color: COL.text }}>신제주(연동·노형)</b> 등 외곽 신시가지가 개발되면서
                행정기관과 상권, 인구가 빠져나가 <b style={{ color: COL.orange }}>공동화(空洞化)</b>와 쇠퇴를 겪었습니다.
              </p>
              <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.75, color: '#cbd5e1' }}>
                제주도는 이를 되살리기 위해 <b style={{ color: COL.text }}>'15분 도시'</b> 비전과 연계해 공공기관 이전, 자율상권구역 지정,
                탑동 도시재생혁신지구 등 다양한 재생 정책을 추진하고 있습니다. 이 게임은 그 과정을 10턴의 정책 결정으로 압축한 것입니다.
              </p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
                <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COL.orange }}>🎯 당신의 역할</div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: COL.mute }}>
                    당신은 <b style={{ color: COL.text }}>원도심 재생 추진단장</b>입니다. 10턴 동안 핵심 정책을 선택해
                    <b style={{ color: COL.people }}> 생활인구</b> · <b style={{ color: COL.economy }}>상권 활력</b> · <b style={{ color: COL.infra }}>문화/기반시설</b> 세 지표를 끌어올리세요.
                  </p>
                </div>
                <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COL.orange }}>📐 규칙</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: COL.mute }}>
                    <li>시작 예산 <b style={{ color: COL.text }}>{START_BUDGET.toLocaleString()}만원</b> — 좋은 안을 전부 살 수는 없습니다. 선택과 집중!</li>
                    <li>모든 지표는 <b style={{ color: COL.text }}>{START_SCORE}점</b>에서 시작 (침체 상태)</li>
                    <li>매 턴 진입 시 도시 쇠퇴로 모든 지표가 <b style={{ color: COL.bad }}>−{DECAY}</b> — 가만히 두면 무너집니다.</li>
                    <li>10턴 후 평균 <b style={{ color: COL.ok }}>{PASS_LINE}점 이상</b>이면 재생 성공!</li>
                  </ul>
                </div>
              </div>
              <button onClick={startGame} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 12, padding: 15, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Sparkles size={18} /> 프로젝트 시작하기
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: COL.faint, marginTop: 14 }}>
            2026년 1월 4일 제주특별자치도 15분도시과 보도자료를 기반으로 기획된 행정 시뮬레이션입니다.
          </p>
        </div>
      )}

      {/* ===== 플레이 ===== */}
      {phase === 'play' && (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${COL.border}`, paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: COL.orangeD, padding: 8, borderRadius: 10, display: 'flex' }}><Building2 size={20} color="#fff" /></div>
              <div><h1 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>15분 도시 제주</h1><p style={{ margin: 0, fontSize: 11, color: COL.mute }}>원도심 재생 시뮬레이터</p></div>
            </div>
            <button onClick={reset} className="pbtn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#1e293b', color: COL.text, border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
              <RotateCcw size={14} /> 다시 시작
            </button>
          </header>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
            <span style={{ fontSize: 12, color: COL.mute, marginRight: 4 }}>Round</span>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i < turn - 1 ? COL.orangeD : i === turn - 1 ? COL.orange : '#1e293b', boxShadow: i === turn - 1 ? `0 0 8px ${COL.orange}` : 'none', transition: 'all .3s' }} />
            ))}
            <span style={{ fontSize: 12, fontWeight: 800, color: COL.orange, marginLeft: 4 }}>{turn}/10</span>
          </div>

          <div className="layout">
            {/* 좌 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <div style={panel({ padding: 10 })}><CityScape scores={scores} /></div>
              <div key={turn} className="fadeup" style={panel({ padding: 22 })}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e293b', borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 700, color: COL.mute, letterSpacing: '0.05em', marginBottom: 12 }}>
                  TURN {turn} · {event.tag}
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em' }}><span style={{ marginRight: 6 }}>{event.icon}</span>{event.title}</h2>
                <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.7, color: '#cbd5e1', background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 10, padding: '12px 14px' }}>{event.description}</p>
                <div className="opts">
                  {event.options.map((o, i) => {
                    const afford = budget >= o.cost;
                    return (
                      <button key={i} className="opt" disabled={!afford} onClick={() => choose(o)} style={{ textAlign: 'left', background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: 16, cursor: afford ? 'pointer' : 'not-allowed', opacity: afford ? 1 : 0.4, display: 'flex', flexDirection: 'column', gap: 12, color: COL.text }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.4 }}>{o.text}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {o.effects.people !== 0 && <Badge c={COL.people} t={`인구 ${fmt(o.effects.people)}`} />}
                          {o.effects.economy !== 0 && <Badge c={COL.economy} t={`상권 ${fmt(o.effects.economy)}`} />}
                          {o.effects.infra !== 0 && <Badge c={COL.infra} t={`기반 ${fmt(o.effects.infra)}`} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${COL.border}`, paddingTop: 10 }}>
                          <span style={{ fontSize: 12, color: COL.mute }}>필요 사업비</span>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: o.cost > 0 ? COL.bad : COL.ok }}>{o.cost > 0 ? `${o.cost.toLocaleString()}만원` : '무료 (민간 유치)'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!canAffordAny && (
                  <button onClick={skipTurn} className="pbtn" style={{ marginTop: 14, width: '100%', background: '#1e293b', color: COL.bad, border: `1px solid ${COL.bad}44`, borderRadius: 10, padding: 13, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <AlertTriangle size={15} /> 예산 부족 — 이번 턴 사업 보류하고 넘어가기 (지표 −3)
                  </button>
                )}
              </div>
            </div>

            {/* 우 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={panel({ padding: 18 })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700 }}><Trophy size={16} color={COL.economy} /> 도시 활력 지수</span>
                  <span style={{ background: grade.c + '22', color: grade.c, fontWeight: 900, fontSize: 14, padding: '2px 10px', borderRadius: 8 }}>{grade.g}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{avg}</span><span style={{ fontSize: 14, color: COL.faint, fontWeight: 700 }}>/ 100</span>
                </div>
                <div style={{ marginTop: 12, width: '100%', height: 8, background: '#1e293b', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${avg}%`, height: '100%', background: `linear-gradient(90deg,${COL.orangeD},${COL.economy})`, transition: 'width .5s', boxShadow: `0 0 10px ${COL.orange}` }} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: COL.faint }}>합격선 평균 {PASS_LINE}점</p>
              </div>

              <div style={panel({ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: COL.mute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>남은 사업 예산</p>
                  <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: COL.text }}>{budget.toLocaleString()}<span style={{ fontSize: 13, color: COL.mute, fontWeight: 700 }}> 만원</span></p>
                </div>
                <div style={{ background: COL.ok + '1a', color: COL.ok, padding: 11, borderRadius: 12, display: 'flex' }}><Wallet size={22} /></div>
              </div>

              <div style={panel({ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 })}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', borderBottom: `1px solid ${COL.border}`, paddingBottom: 10 }}>도시 재생 핵심 지표</span>
                <Bar icon={<Users size={15} color={COL.people} />} label="생활인구" value={scores.people} color={COL.people} delta={lastDelta?.people} />
                <Bar icon={<TrendingUp size={15} color={COL.economy} />} label="상권 활력" value={scores.economy} color={COL.economy} delta={lastDelta?.economy} />
                <Bar icon={<Building2 size={15} color={COL.infra} />} label="문화/기반" value={scores.infra} color={COL.infra} delta={lastDelta?.infra} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: COL.bad, background: COL.bad + '12', borderRadius: 8, padding: '6px 10px' }}>
                  <AlertTriangle size={13} /> 매 턴 도시 쇠퇴로 모든 지표 −{DECAY}
                </div>
              </div>

              <div style={panel({ padding: 14 })}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COL.mute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>행정 이력</span>
                <div className="logbox" style={{ maxHeight: 120, overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: i === 0 ? COL.text : COL.mute, lineHeight: 1.5 }}>
                      <span style={{ color: COL.orange, flexShrink: 0 }}>➔</span><span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 결과 ===== */}
      {phase === 'result' && (
        <div className="fadeup" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 18, padding: 30, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ width: 88, height: 88, margin: '0 auto 14px', borderRadius: '50%', background: grade.c + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${grade.c}55` }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: grade.c }}>{grade.g}</span>
            </div>
            {avg >= PASS_LINE
              ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COL.ok, fontSize: 13, fontWeight: 700, marginBottom: 8 }}><CheckCircle2 size={16} /> 재생 성공</div>
              : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COL.bad, fontSize: 13, fontWeight: 700, marginBottom: 8 }}><AlertTriangle size={16} /> 재생 미달</div>}
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900 }}>{avg >= PASS_LINE ? '사람이 다시 모이는 원도심' : '아직 비어 있는 거리'}</h2>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: COL.mute }}>10턴 종합 평균 <b style={{ color: COL.text, fontSize: 16 }}>{avg}점</b> (합격선 {PASS_LINE}점)</p>
            <div style={{ textAlign: 'left', background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: 16, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Bar icon={<Users size={15} color={COL.people} />} label="생활인구" value={scores.people} color={COL.people} />
              <Bar icon={<TrendingUp size={15} color={COL.economy} />} label="상권 활력" value={scores.economy} color={COL.economy} />
              <Bar icon={<Building2 size={15} color={COL.infra} />} label="문화/기반시설" value={scores.infra} color={COL.infra} />
            </div>
            <blockquote style={{ textAlign: 'left', background: '#0a1326', borderLeft: `4px solid ${COL.orange}`, borderRadius: 8, padding: '14px 16px', fontSize: 13, lineHeight: 1.7, fontStyle: 'italic', color: '#cbd5e1', margin: '0 0 22px' }}>
              "도시를 형성하고 유지하며 성장시키는 데 가장 중요한 요소는 결국 '사람'으로, 원도심 재생의 궁극적 목표는 떠나간 사람이 다시 돌아오게 하는 것입니다."
              <span style={{ display: 'block', textAlign: 'right', fontStyle: 'normal', fontSize: 11, color: COL.faint, marginTop: 8 }}>— 15분도시추진단장 보도자료 중</span>
            </blockquote>
            <button onClick={reset} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RotateCcw size={17} /> 처음부터 다시 도전
            </button>
          </div>
        </div>
      )}

      {/* ===== Tip 모달 ===== */}
      {tip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 50 }}>
          <div className="pop" style={{ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 18, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1a2540,#111a2e)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COL.border}` }}>
              <div style={{ background: COL.economy + '22', color: COL.economy, padding: 8, borderRadius: 10, display: 'flex' }}><Lightbulb size={18} /></div>
              <div><p style={{ margin: 0, fontSize: 11, color: COL.mute, letterSpacing: '0.05em' }}>정책 배경 도움말</p><h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800 }}>{policyTips[tip.idx].title}</h3></div>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.78, color: '#cbd5e1' }}>{policyTips[tip.idx].body}</p>
              <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: COL.mute }}>이번 선택 — <b style={{ color: COL.text }}>{tip.option.text}</b></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tip.option.effects.people !== 0 && <Badge c={COL.people} t={`인구 ${fmt(tip.option.effects.people)}`} />}
                  {tip.option.effects.economy !== 0 && <Badge c={COL.economy} t={`상권 ${fmt(tip.option.effects.economy)}`} />}
                  {tip.option.effects.infra !== 0 && <Badge c={COL.infra} t={`기반 ${fmt(tip.option.effects.infra)}`} />}
                  {tip.option.cost > 0 ? <Badge c={COL.bad} t={`예산 −${tip.option.cost.toLocaleString()}`} /> : <Badge c={COL.ok} t="예산 절약" />}
                </div>
              </div>
              <button onClick={nextTurn} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {turn < 10 ? '다음 턴으로' : '최종 결과 보기'} <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

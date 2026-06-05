import React, { useState, useMemo, useRef } from 'react';
import {
  Building2, Users, TrendingUp, Wallet, RotateCcw, ArrowRight,
  AlertTriangle, CheckCircle2, Lightbulb, MapPin, Trophy, Sparkles,
  Volume2, VolumeX
} from 'lucide-react';

/* =========================================================================
   ▶ 직접 찍은 사진(4:3 권장) 넣기. public 폴더에 올린 뒤 경로 지정.
   - INTRO_PHOTO : 시작 화면 사진 (예: '/intro.jpg')
   - PLAY_PHOTOS : 게임 화면 사진을 '턴별'로 지정하는 배열.
       [0]=1턴, [1]=2턴 ... [9]=10턴 (최대 10개).
       어떤 턴 칸을 ''(빈칸)으로 두면 직전에 지정한 사진이 그대로 유지됩니다.
       → 한 장만 모든 턴에 쓰려면 [0]에만 넣으면 됩니다.
   각각 비워두면 그 화면은 기본 도시 그림이 표시됩니다.
   (사진은 늘어남 없이 cover로 꽉 차게 들어갑니다)
   ========================================================================= */
const INTRO_PHOTO = '';
const PLAY_PHOTOS = [
  // 예시) '/play1.jpg', '', '', '', '/play5.jpg', '', '', '', '', '/play10.jpg'
];

/* ▶ 배경음악 파일을 쓰려면 public 에 mp3 넣고 BGM_URL 지정 (저작권 없는 음원만).
     비워두면 코드로 생성한 잔잔한 앰비언트가 재생됩니다. */
const BGM_URL = '';

/* 밸런스 */
const START_BUDGET = 7000;
const START_SCORE = 25;
const DECAY = 1;
const PASS_LINE = 60;

/* 턴별 이벤트 ( question = 쉬운 말 핵심 질문 ) */
const gameEvents = [
  { tag: '정책 전환', icon: '🧭', title: '정책 방향 전환 (모관지구)', question: '첫 사업, 어디에 투자할까?',
    description: '전면 철거 대신 지역 특성을 살리는 방향으로 전환했습니다. 첫 핵심 사업을 고르세요.',
    options: [
      { text: '창업·커뮤니티 거점시설 조성', cost: 1000, effects: { infra: 15, people: 5, economy: 5 }, log: '창업·커뮤니티 거점을 조성해 주민 참여 기반을 마련했습니다.' },
      { text: '생활 SOC 확충 및 주거지 정비', cost: 1500, effects: { infra: 25, people: 5, economy: 0 }, log: '기초 인프라를 정비해 원도심 정주 여건을 개선했습니다.' },
    ] },
  { tag: '공공기관 이전', icon: '🏢', title: '공공기관 전략적 원도심 이전', question: '공공기관 9곳을 원도심으로 옮길까?',
    description: '청년·창업·문화 분야 공공기관 9곳을 원도심으로 이전시킬 기회입니다. 사람을 불러올 가장 강력한 카드.',
    options: [
      { text: '9개 기관·단체 이전 감행', cost: 2000, effects: { people: 25, economy: 15, infra: 5 }, log: '220여 명의 상주 인력과 청년 이용자가 유입되며 생활인구가 급증했습니다!' },
      { text: '이전 보류 및 예산 비축', cost: 0, effects: { people: -8, economy: -8, infra: 0 }, log: '기관 이전이 보류되며 원도심 공동화가 오히려 심화됩니다.' },
    ] },
  { tag: '상권 활성화', icon: '🛍️', title: '자율상권구역 지정 및 활성화', question: '상권 살리기에 얼마나 투자할까?',
    description: '칠성로·중앙로 일대를 자율상권구역으로 지정합니다. 빈 점포를 줄일 기회예요.',
    options: [
      { text: '100억 규모 상권 집중 투자', cost: 1500, effects: { economy: 25, people: 5, infra: 5 }, log: '칠성로·지하상가에 소비 수요가 살아나며 빈 점포가 줄어듭니다.' },
      { text: '소규모 홍보 마케팅만 진행', cost: 500, effects: { economy: 10, people: 0, infra: 0 }, log: '단기 홍보 효과에 그쳐 상권 체질 개선에는 아쉬움이 남습니다.' },
    ] },
  { tag: '앵커시설', icon: '📍', title: '원도심 앵커 거점시설 건립', question: '사람을 끌어들일 거점, 무엇으로?',
    description: '유동인구를 불러올 핵심 거점 시설을 만듭니다. 관광형이냐, 문화형이냐.',
    options: [
      { text: '제주여행자센터 신설', cost: 1000, effects: { people: 15, economy: 10, infra: 10 }, log: '외부 관광객이 원도심으로 진입하는 게이트웨이가 생겼습니다.' },
      { text: "문화공간 '갤러리 숨비마루' 조성", cost: 800, effects: { infra: 15, people: 10, economy: 5 }, log: '도민과 예술인이 모이는 문화 예술 거점이 둥지를 텄습니다.' },
    ] },
  { tag: '거버넌스', icon: '🤝', title: '원도심 활성화 협의체 구성', question: '민관 협력 체계를 만들까?',
    description: '입주 기관과 주민·상인이 함께 의사결정하는 협의체. 사업의 지속가능성을 좌우합니다.',
    options: [
      { text: '민관 협의체 공식 발족', cost: 300, effects: { people: 10, economy: 5, infra: 5 }, log: '민관 소통이 강화되며 지역 맞춤형 로컬 프로젝트가 활발해집니다.' },
      { text: '기존 관주도 방식 유지', cost: 0, effects: { people: -8, economy: 0, infra: 0 }, log: '소통 부족으로 공공기관 종사자와 기존 상권의 연계가 약화됩니다.' },
    ] },
  { tag: '혁신지구', icon: '⚓', title: '탑동 도시재생혁신지구', question: '탑동과 원도심, 어떻게 연결할까?',
    description: '국토부 혁신지구 후보지로 탑동이 선정됐습니다. 제주신항 방문객을 원도심까지 끌어올 전략은?',
    options: [
      { text: '해양관광–원도심 상권 연계망 구축', cost: 1200, effects: { infra: 20, economy: 15, people: 5 }, log: '제주신항 방문객 동선이 칠성로·중앙로로 이어지기 시작합니다.' },
      { text: '혁신지구 구역 내 독립 개발', cost: 1000, effects: { infra: 20, economy: 5, people: 0 }, log: '탑동은 화려해졌으나 내륙 상권과의 시너지는 다소 부족합니다.' },
    ] },
  { tag: '복합시설', icon: '🎪', title: '탑동 복합 앵커시설 도입', question: '복합시설의 핵심 기능은?',
    description: '혁신지구의 중심이 될 복합시설. 문화로 사람을 모을지, 편의로 접근성을 높일지.',
    options: [
      { text: '실내외 공연장 및 문화·여가 공간', cost: 1500, effects: { infra: 25, people: 15, economy: 5 }, log: "대규모 축제가 열리며 '사람 중심' 원도심의 상징이 되었습니다." },
      { text: '대형 공영주차장 및 행정 편의시설', cost: 1200, effects: { infra: 20, economy: 15, people: 5 }, log: '고질적 주차 문제가 풀리며 상가 접근성이 크게 좋아졌습니다.' },
    ] },
  { tag: '로컬창업', icon: '☕', title: '로컬 크리에이터 창업 열풍', question: '청년 로컬 창업, 어떻게 대응할까?',
    description: '청년들이 빈 점포에 로컬 브랜드를 열기 시작했습니다. 지원할까, 시장에 맡길까.',
    options: [
      { text: '청년 로컬 브랜드 정착 지원', cost: 800, effects: { economy: 15, people: 10, infra: 5 }, log: '원도심만의 감성이 생겨나며 젊은 층 발길이 끊이지 않습니다.' },
      { text: '자연스러운 시장 경쟁에 위탁', cost: 0, effects: { economy: 5, people: -8, infra: 0 }, log: '일부 점포는 높은 임대료를 못 버티고 다시 공실이 됩니다.' },
    ] },
  { tag: '15분도시', icon: '🚶', title: "'15분 도시' 보행 환경 개선", question: '걷는 도시로 바꿀까?',
    description: '걸어서 15분 안에 모든 걸 누리는 도시. 차를 줄이고 사람을 위한 거리로 바꿀지 결정하세요.',
    options: [
      { text: '차없는 거리·보행자 중심 도로 개설', cost: 1000, effects: { infra: 15, people: 15, economy: 5 }, log: '걷기 좋은 거리가 되어 유동인구의 체류 시간이 늘었습니다.' },
      { text: '현행 도로 유지 + 스마트 가로등', cost: 400, effects: { infra: 10, people: 5, economy: 0 }, log: '안전성은 확보됐지만 머무는 매력적인 거리엔 부족합니다.' },
    ] },
  { tag: '최종평가', icon: '📢', title: '최종 캠페인', question: '마지막 마무리, 어떻게?',
    description: '10년간의 재생 프로젝트, 마지막 홍보 캠페인으로 마무리합니다.',
    options: [
      { text: '성과 공유회 및 대도민 축제 개최', cost: 500, effects: { people: 10, economy: 10, infra: 0 }, log: "'다시 시작하는 원도심' 브랜딩을 도민과 관광객에게 각인시켰습니다." },
      { text: '백서 발간 및 행정 마무리', cost: 100, effects: { people: 0, economy: 0, infra: 5 }, log: '조용히 행정 절차를 마무리하며 최종 스코어를 집계합니다.' },
    ] },
];

const policyTips = [
  { title: '기능 회복형 도시재생', body: "과거 도시정비는 '전면 철거 후 재개발'이 많았지만, 최근 패러다임은 기존 건물·골목·공동체를 보존하며 쇠퇴한 기능을 점진적으로 되살리는 방식입니다. 사람을 내쫓지 않는 재생이 핵심 원칙입니다." },
  { title: '생활인구와 공동화 해소', body: "원도심 쇠퇴의 핵심은 인구 유출로 인한 '공동화'입니다. 공공기관·청년시설을 이전시키면 안정적인 상주·유동 인구가 생겨 주변 상권 회복의 마중물이 됩니다." },
  { title: '자율상권구역 제도', body: "'지역상권 상생 및 활성화에 관한 법률'에 근거한 제도로, 상인·임대인·주민이 자율적으로 활성화 계획을 세우고 정부가 지원합니다. 임대료 안정을 위한 상생협약과 묶으면 효과가 오래갑니다." },
  { title: '앵커(거점) 시설의 역할', body: "앵커시설은 사람을 끌어들이는 '닻' 역할을 합니다. 여행자센터·문화공간 같은 방문 목적지가 생기면 체류 시간과 소비가 늘고, 그 효과가 주변 골목 상권으로 번집니다." },
  { title: '민관 거버넌스', body: "도시재생의 성패는 결국 '주체 간 협력'에 달려 있습니다. 행정 지원이 끝난 뒤에도 스스로 굴러가는 자생력을 만들려면 주민·상인·기관이 함께 의사결정하는 거버넌스가 필수입니다." },
  { title: '도시재생혁신지구', body: "도시재생 특별법상 '혁신지구'는 쇠퇴 지역에 주거·상업·문화 기능을 집적시키는 거점개발 방식입니다. 국가 시범사업으로 지정되면 규제 특례와 재정 지원을 받습니다." },
  { title: '복합 기능의 집객력', body: "단일 기능보다 문화·상업·편의가 결합된 복합 시설이 사람을 더 오래 머물게 합니다. 다만 주차·접근성 같은 기반시설도 방문을 좌우하는 현실 변수라 균형이 중요합니다." },
  { title: '젠트리피케이션 주의', body: "빈 점포를 청년·로컬 브랜드가 채우는 '리노베이션 창업'은 원도심 고유의 매력을 만듭니다. 다만 인기가 오르면 임대료가 급등해 동네를 살린 사람들이 밀려나는 젠트리피케이션을 경계해야 합니다." },
  { title: "'15분 도시' 개념", body: "도보·자전거로 15분 안에 일상 서비스에 닿게 하는 도시계획 패러다임으로, 파리 등 세계 도시가 채택했습니다. 보행 친화 환경은 체류·소비를 늘리지만 차량 이용자와의 갈등 조정이 과제입니다." },
  { title: '성과 환류와 지속가능성', body: "재생사업은 성과 공유와 브랜딩으로 시민 인식을 바꾸고 다음 투자를 끌어냅니다. 백서·평가로 무엇이 통했는지 다음 정책에 환류하는 것까지가 재생의 한 사이클입니다." },
];

/* 시드 랜덤 */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260104);
const PEOPLE_SPOTS = Array.from({ length: 16 }, () => ({ x: 55 + rng() * 500, y: 265 + rng() * 7, d: (rng() * 3).toFixed(2) }));
const CLOUDS = [
  { x: 95, y: 70, s: 1.0, d: 0 }, { x: 235, y: 46, s: 1.3, d: 1.2 },
  { x: 385, y: 92, s: 0.85, d: 2.4 }, { x: 470, y: 56, s: 1.05, d: 0.6 }, { x: 165, y: 122, s: 0.75, d: 3 },
];
const TREE_SPOTS = [48, 152, 248, 352, 448, 558];
const BUILDINGS = [
  { x: 64, w: 50, h: 86 }, { x: 128, w: 44, h: 124 }, { x: 186, w: 58, h: 158 },
  { x: 258, w: 48, h: 104 }, { x: 322, w: 62, h: 182 }, { x: 400, w: 46, h: 116 },
  { x: 460, w: 56, h: 146 }, { x: 532, w: 46, h: 96 },
];
const DAY_FACADES = ['#ead9bf', '#d3e2f2', '#dfe8c8', '#ecd6df', '#cfe6df', '#e6dec6', '#d6def0', '#ecd9c6'];
const SIGN_COLORS = ['#f97316', '#ec4899', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6'];

const clamp = (v) => Math.min(100, Math.max(0, v));
const fmt = (n) => (n > 0 ? `+${n}` : `${n}`);
const getGrade = (avg) =>
  avg >= 85 ? { g: 'S', c: '#d97706' } :
  avg >= 72 ? { g: 'A', c: '#059669' } :
  avg >= 60 ? { g: 'B', c: '#2563eb' } :
  avg >= 45 ? { g: 'C', c: '#ea580c' } : { g: 'D', c: '#e11d48' };

/* 앰비언트 사운드 (외부 파일 불필요) */
function createAmbience() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 950;
  lp.connect(master); master.connect(ctx.destination);
  [130.81, 196.0, 293.66, 329.63].forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
    const g = ctx.createGain(); g.gain.value = 0.085;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.025;
    const lg = ctx.createGain(); lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(lp); o.start(); lfo.start();
  });
  const buf = ctx.createBuffer(1, 2 * ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 360;
  const ng = ctx.createGain(); ng.gain.value = 0.045;
  const nlfo = ctx.createOscillator(); nlfo.frequency.value = 0.08;
  const nlg = ctx.createGain(); nlg.gain.value = 0.03;
  nlfo.connect(nlg); nlg.connect(ng.gain);
  noise.connect(nf); nf.connect(ng); ng.connect(master); noise.start(); nlfo.start();
  return {
    ctx, master,
    fadeTo(v, t = 2) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.linearRampToValueAtTime(v, now + t);
    },
  };
}

/* ===== 밝은 테마 팔레트 ===== */
const COL = {
  bg: '#eef3fa', panel: '#ffffff', panelSoft: '#f4f7fc', border: '#e3e9f2',
  text: '#0f1b33', body: '#3a4760', mute: '#64748b', faint: '#94a3b8',
  orange: '#ea580c', orangeD: '#f97316',
  people: '#0891b2', economy: '#d97706', infra: '#6366f1', ok: '#059669', bad: '#e11d48',
};
const FONT = "'Pretendard Variable','Pretendard',system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
const panel = (extra = {}) => ({ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 16, boxShadow: '0 6px 20px rgba(15,30,60,0.07)', ...extra });

function Badge({ c, t }) {
  return <span style={{ fontSize: 11.5, fontWeight: 800, color: c, background: c + '1f', padding: '3px 9px', borderRadius: 6 }}>{t}</span>;
}
function Bar({ icon, label, value, color, delta }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: COL.text, fontWeight: 600 }}>{icon}{label}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {delta != null && delta !== 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: delta > 0 ? COL.ok : COL.bad }}>{fmt(delta)}</span>}
          <span style={{ fontSize: 14, fontWeight: 900, color }}>{value}<span style={{ color: COL.faint, fontWeight: 600 }}>/100</span></span>
        </span>
      </div>
      <div style={{ width: '100%', height: 9, background: '#e6ecf5', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
      </div>
    </div>
  );
}

/* ===== 낮 시간대 원도심 (지표에 반응) ===== */
function CityScape({ scores }) {
  const avg = (scores.people + scores.economy + scores.infra) / 3;
  const litCount = Math.round((scores.infra / 100) * BUILDINGS.length);
  const signCount = Math.round((scores.economy / 100) * BUILDINGS.length);
  const peopleCount = Math.round((scores.people / 100) * PEOPLE_SPOTS.length);
  const treeCount = Math.round((scores.infra / 100) * TREE_SPOTS.length);
  const ground = 260;
  return (
    <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', display: 'block', borderRadius: 12 }}>
      <defs>
        <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#bfe2ff" /><stop offset="70%" stopColor="#e3f1ff" /><stop offset="100%" stopColor="#f3f9ff" /></linearGradient>
        <radialGradient id="dsun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fffbe8" /><stop offset="100%" stopColor="#ffe08a" /></radialGradient>
        <radialGradient id="dsunglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fff3c4" stopOpacity="0.85" /><stop offset="100%" stopColor="#fff3c4" stopOpacity="0" /></radialGradient>
        <radialGradient id="damb" cx="50%" cy="100%" r="80%"><stop offset="0%" stopColor="#fdba74" stopOpacity={0.04 + (avg / 100) * 0.16} /><stop offset="100%" stopColor="#fdba74" stopOpacity="0" /></radialGradient>
        <linearGradient id="dsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7fc8ef" /><stop offset="100%" stopColor="#3f97cf" /></linearGradient>
        <linearGradient id="dsunref" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff4c8" stopOpacity="0.8" /><stop offset="100%" stopColor="#fff4c8" stopOpacity="0" /></linearGradient>
        <clipPath id="dseaClip"><rect x="0" y="274" width="600" height="26" /></clipPath>
      </defs>

      <rect x="0" y="0" width="600" height="300" fill="url(#dsky)" />
      {/* 해 */}
      <circle cx="524" cy="46" r="38" fill="url(#dsunglow)" />
      <circle cx="524" cy="46" r="17" fill="url(#dsun)" />
      {/* 구름 */}
      {CLOUDS.map((c, i) => (
        <g key={i} className="cloud" style={{ animationDelay: `${c.d}s` }} opacity="0.92" transform={`translate(${c.x},${c.y * 0.62}) scale(${c.s * 0.85})`}>
          <ellipse cx="0" cy="0" rx="22" ry="12" fill="#ffffff" />
          <ellipse cx="18" cy="4" rx="16" ry="10" fill="#ffffff" />
          <ellipse cx="-16" cy="5" rx="14" ry="9" fill="#f4f9ff" />
        </g>
      ))}
      {/* 한라산 */}
      <path d="M -20 230 Q 150 110 300 168 Q 450 95 640 230 Z" fill="#a7cbe0" opacity="0.7" />
      <path d="M 266 168 L 300 148 L 334 168 L 320 176 Q 300 167 280 176 Z" fill="#ffffff" opacity="0.85" />
      <rect x="0" y="150" width="600" height="150" fill="url(#damb)" />

      {/* 건물 */}
      {BUILDINGS.map((b, i) => {
        const active = i < litCount;
        const top = ground - b.h;
        const cols = Math.max(2, Math.floor(b.w / 15));
        const rows = Math.max(3, Math.floor(b.h / 22));
        const hasSign = i < signCount && active;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} rx="2" fill={active ? DAY_FACADES[i] : '#d6deea'} stroke={active ? '#b3c2d8' : '#c7d1e0'} strokeWidth="1" />
            {Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((_, c) => {
              const wx = b.x + 6 + c * ((b.w - 10) / cols);
              const wy = top + 8 + r * ((b.h - 14) / rows);
              const on = active && ((r * 31 + c * 17 + i * 7) % 5 !== 0);
              return <rect key={`${r}-${c}`} x={wx} y={wy} width={(b.w - 12) / cols * 0.62} height={6} rx="1" fill={on ? '#9fc6ec' : '#c3cedd'} opacity={on ? 0.95 : 0.6} />;
            }))}
            {hasSign && <rect x={b.x + b.w / 2 - 10} y={top - 8} width="20" height="6" rx="2" fill={SIGN_COLORS[i % SIGN_COLORS.length]} />}
          </g>
        );
      })}

      {/* 도로 / 보행로 */}
      <rect x="0" y={ground} width="600" height="5" fill="#c4cfde" />
      <rect x="0" y={ground + 5} width="600" height="9" fill="#cdd7e4" />
      {/* 나무 (기반시설↑) */}
      {TREE_SPOTS.slice(0, treeCount).map((tx, i) => (
        <g key={i} className="tree" style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }}>
          <rect x={tx - 1.5} y={ground - 10} width="3" height="12" rx="1" fill="#8a5a3b" />
          <circle cx={tx} cy={ground - 14} r="8" fill="#6fae5a" />
          <circle cx={tx - 5} cy={ground - 11} r="6" fill="#7cb866" />
          <circle cx={tx + 5} cy={ground - 11} r="6" fill="#65a350" />
        </g>
      ))}
      {/* 사람 */}
      {PEOPLE_SPOTS.slice(0, peopleCount).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="#0e7490" className="walker" style={{ animationDelay: `${p.d}s` }} />
      ))}

      {/* === 탑동 앞바다 === */}
      <rect x="0" y="274" width="600" height="26" fill="url(#dsea)" />
      <rect className="searef" x="512" y="274" width="24" height="26" fill="url(#dsunref)" />
      <g className="wave" opacity="0.75">
        {Array.from({ length: 26 }).map((_, i) => <rect key={i} x={i * 30} y={282} width={12} height={2} rx={1} fill="#ffffff" />)}
        {Array.from({ length: 26 }).map((_, i) => <rect key={'b' + i} x={i * 30 + 15} y={290} width={12} height={2} rx={1} fill="#d6efff" />)}
      </g>
      <text x="12" y="295" fontSize="8" fill="rgba(255,255,255,0.9)" letterSpacing="2">탑동 앞바다</text>
      {avg < 8 && <text x="300" y="150" textAnchor="middle" fontSize="11" fill="#7a8aa3">— 침체된 원도심 —</text>}
    </svg>
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
  const [music, setMusic] = useState(true);
  const audioRef = useRef(null);
  const bgmRef = useRef(null);

  const event = gameEvents[turn - 1];
  const avg = useMemo(() => Math.round((scores.people + scores.economy + scores.infra) / 3), [scores]);
  const grade = getGrade(avg);
  const canAffordAny = event.options.some((o) => budget >= o.cost);
  // 현재 턴의 게임 사진 (빈 칸이면 직전에 지정한 사진 유지)
  let playPhoto = '';
  for (let t = turn - 1; t >= 0; t--) { if (PLAY_PHOTOS[t]) { playPhoto = PLAY_PHOTOS[t]; break; } }

  const playMusic = (on) => {
    if (BGM_URL) {
      if (!bgmRef.current) { bgmRef.current = new Audio(BGM_URL); bgmRef.current.loop = true; bgmRef.current.volume = 0.4; }
      if (on) bgmRef.current.play().catch(() => {}); else bgmRef.current.pause();
      return;
    }
    if (!audioRef.current) audioRef.current = createAmbience();
    const a = audioRef.current; if (!a) return;
    if (a.ctx.state === 'suspended') a.ctx.resume();
    a.fadeTo(on ? 0.2 : 0, on ? 3 : 1.2);
  };
  const toggleMusic = () => setMusic((m) => { const n = !m; playMusic(n); return n; });

  const startGame = () => {
    setPhase('play'); setTurn(1); setBudget(START_BUDGET);
    setScores({ people: START_SCORE, economy: START_SCORE, infra: START_SCORE });
    setLogs(['제주 원도심 재생 프로젝트가 시작되었습니다.']);
    setLastDelta(null); setTip(null);
    if (music) playMusic(true);
  };
  const choose = (o) => {
    if (budget < o.cost) return;
    setBudget((b) => b - o.cost);
    setScores((s) => ({ people: clamp(s.people + o.effects.people), economy: clamp(s.economy + o.effects.economy), infra: clamp(s.infra + o.effects.infra) }));
    setLastDelta(o.effects); setLogs((l) => [o.log, ...l]); setTip({ idx: turn - 1, option: o });
  };
  const skipTurn = () => {
    const o = { text: '사업 보류 (예산 부족)', cost: 0, effects: { people: -3, economy: -3, infra: -3 }, log: '예산 부족으로 이번 사업을 추진하지 못했습니다. 원도심이 한 발 더 쇠퇴합니다.' };
    setScores((s) => ({ people: clamp(s.people + o.effects.people), economy: clamp(s.economy + o.effects.economy), infra: clamp(s.infra + o.effects.infra) }));
    setLastDelta(o.effects); setLogs((l) => [o.log, ...l]); setTip({ idx: turn - 1, option: o });
  };
  const nextTurn = () => {
    if (turn < 10) {
      if (DECAY > 0) setScores((s) => ({ people: clamp(s.people - DECAY), economy: clamp(s.economy - DECAY), infra: clamp(s.infra - DECAY) }));
      setTurn((t) => t + 1); setTip(null);
    } else { setTip(null); setPhase('result'); }
  };
  const reset = () => setPhase('intro');

  const MusicBtn = ({ compact }) => (
    <button onClick={toggleMusic} className="pbtn" title={music ? '음악 끄기' : '음악 켜기'}
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: music ? COL.orangeD + '1a' : '#eef1f6', color: music ? COL.orange : COL.mute, border: `1px solid ${music ? COL.orange + '55' : COL.border}`, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
      {music ? <Volume2 size={15} /> : <VolumeX size={15} />}{!compact && (music ? '음악 ON' : '음악 OFF')}
    </button>
  );

  return (
    <div style={{ background: COL.bg, minHeight: '100vh', color: COL.text, fontFamily: FONT, padding: '20px 16px' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css');
        @keyframes cloudDrift { 0%{transform:translateX(0)} 100%{transform:translateX(16px)} }
        @keyframes walk { 0%{transform:translateX(0)} 100%{transform:translateX(14px)} }
        @keyframes waveMove { from{transform:translateX(0)} to{transform:translateX(-30px)} }
        @keyframes searefAnim { 0%,100%{opacity:.35} 50%{opacity:.85} }
        @keyframes treePop { from{transform:scale(.4); opacity:0} to{transform:scale(1); opacity:1} }
        @keyframes bldRise { from{transform:translateY(10px) scaleY(.8); opacity:0} to{transform:none; opacity:1} }
        @keyframes fadeUp { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }
        @keyframes pop { from{opacity:0; transform:scale(.94)} to{opacity:1; transform:scale(1)} }
        .cloud{ animation:cloudDrift 9s ease-in-out infinite alternate; }
        .walker{ animation:walk 2.6s ease-in-out infinite alternate; }
        .wave{ animation:waveMove 6s linear infinite; }
        .searef{ animation:searefAnim 4s ease-in-out infinite; }
        .tree{ animation:treePop .5s ease both; transform-box:fill-box; transform-origin:center bottom; }
        .bldpop{ animation:bldRise .5s ease both; transform-box:fill-box; transform-origin:center bottom; }
        .fadeup{ animation:fadeUp .45s ease both; }
        .pop{ animation:pop .28s ease both; }
        .opt:hover:not(:disabled){ border-color:${COL.orange} !important; background:#fff7f1 !important; transform:translateY(-2px); box-shadow:0 8px 20px rgba(249,115,22,0.12); }
        .opt{ transition:all .18s ease; }
        .pbtn{ transition:all .15s ease; }
        .pbtn:hover{ filter:brightness(1.04); transform:translateY(-1px); }
        .logbox::-webkit-scrollbar{ width:6px; } .logbox::-webkit-scrollbar-thumb{ background:#cbd5e1; border-radius:4px; }
        .layout{ display:grid; grid-template-columns: minmax(0,1.55fr) minmax(280px,1fr); gap:16px; }
        .opts{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
        @media (max-width: 860px){ .layout{ grid-template-columns: 1fr; } .opts{ grid-template-columns: 1fr; } }
      `}</style>

      {/* ===== 인트로 ===== */}
      {phase === 'intro' && (
        <div className="fadeup" style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={panel({ overflow: 'hidden' })}>
            <div style={{ position: 'relative', borderBottom: `1px solid ${COL.border}` }}>
              {INTRO_PHOTO ? (
                <div style={{ width: '100%', aspectRatio: '16 / 9', maxHeight: 360, overflow: 'hidden', position: 'relative' }}>
                  <img src={INTRO_PHOTO} alt="제주 원도심" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.25) 32%, rgba(0,0,0,0) 58%)' }} />
                </div>
              ) : (
                <CityScape scores={{ people: 18, economy: 18, infra: 22 }} />
              )}
              <div style={{ position: 'absolute', top: 18, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: COL.orangeD, padding: 9, borderRadius: 12, display: 'flex', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}><Building2 size={22} color="#fff" /></div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: COL.text, textShadow: '0 1px 8px rgba(255,255,255,0.7)' }}>구해줘! 제주 원도심</h1>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#3f5170', fontWeight: 600, textShadow: '0 1px 6px rgba(255,255,255,0.7)' }}>15분 도시 제주: 원도심 활성화 시뮬레이터</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: 18, right: 18 }}><MusicBtn compact /></div>
            </div>
            <div style={{ padding: '26px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MapPin size={18} color={COL.orange} /><h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>제주 원도심이란?</h2>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.8, color: COL.body }}>
                제주 <b style={{ color: COL.text }}>원도심</b>은 제주시의 옛 중심지인 <b style={{ color: COL.text }}>칠성로·중앙로·동문시장·탑동</b> 일대입니다.
                한때 제주의 행정·상업·문화가 모이던 번화가였지만, 1990년대 이후 <b style={{ color: COL.text }}>신제주(연동·노형)</b> 개발로
                기관과 상권, 인구가 빠져나가 <b style={{ color: COL.orange }}>공동화(空洞化)</b>와 쇠퇴를 겪었습니다.
              </p>
              <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.8, color: COL.body }}>
                제주도는 이를 되살리기 위해 <b style={{ color: COL.text }}>'15분 도시'</b> 비전과 함께 공공기관 이전, 자율상권구역 지정,
                탑동 도시재생혁신지구 등을 추진 중입니다. 이 게임은 그 과정을 10턴의 정책 결정으로 압축한 것입니다.
              </p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: '15px 16px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8, color: COL.orange }}>🎯 당신의 역할</div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.75, color: COL.body }}>
                    당신은 <b style={{ color: COL.text }}>원도심 재생 추진단장</b>입니다. 10턴 동안 정책을 선택해
                    <b style={{ color: COL.people }}> 생활인구</b> · <b style={{ color: COL.economy }}>상권 활력</b> · <b style={{ color: COL.infra }}>문화/기반시설</b> 세 지표를 끌어올리세요.
                  </p>
                </div>
                <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: '15px 16px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8, color: COL.orange }}>📐 규칙</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.85, color: COL.body }}>
                    <li>시작 예산 <b style={{ color: COL.text }}>{START_BUDGET.toLocaleString()}만원</b> — 전부 살 수 없으니 선택과 집중!</li>
                    <li>모든 지표는 <b style={{ color: COL.text }}>{START_SCORE}점</b>에서 시작 (침체 상태)</li>
                    <li>매 턴 도시 쇠퇴로 모든 지표 <b style={{ color: COL.bad }}>−{DECAY}</b> — 가만히 두면 무너집니다.</li>
                    <li>10턴 후 평균 <b style={{ color: COL.ok }}>{PASS_LINE}점 이상</b>이면 재생 성공!</li>
                  </ul>
                </div>
              </div>
              <button onClick={startGame} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 12, padding: 16, fontSize: 16.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 16px rgba(249,115,22,0.3)' }}>
                <Sparkles size={18} /> 프로젝트 시작하기
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11.5, color: COL.faint, marginTop: 14 }}>
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
              <div><h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>15분 도시 제주</h1><p style={{ margin: 0, fontSize: 11.5, color: COL.mute }}>원도심 재생 시뮬레이터</p></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <MusicBtn />
              <button onClick={reset} className="pbtn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#eef1f6', color: COL.text, border: `1px solid ${COL.border}`, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                <RotateCcw size={14} /> 다시 시작
              </button>
            </div>
          </header>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
            <span style={{ fontSize: 12, color: COL.mute, marginRight: 4 }}>Round</span>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i < turn - 1 ? COL.orangeD : i === turn - 1 ? COL.orange : '#dbe2ec', transition: 'all .3s' }} />
            ))}
            <span style={{ fontSize: 12.5, fontWeight: 900, color: COL.orange, marginLeft: 4 }}>{turn}/10</span>
          </div>

          <div className="layout">
            {/* 좌 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <div style={panel({ padding: 10 })}>
                {playPhoto ? (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', maxHeight: 320, overflow: 'hidden', borderRadius: 12 }}>
                    <img src={playPhoto} alt="제주 원도심" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <CityScape scores={scores} />
                )}
              </div>
              <div key={turn} className="fadeup" style={panel({ padding: 24 })}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: COL.orangeD + '1a', borderRadius: 999, padding: '4px 12px', fontSize: 11.5, fontWeight: 800, color: COL.orange, letterSpacing: '0.03em', marginBottom: 12 }}>
                  TURN {turn} · 이번 턴의 결정
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3, color: COL.text }}>
                  <span style={{ marginRight: 8 }}>{event.icon}</span>{event.question}
                </h2>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: COL.mute }}>관련 정책 · {event.title}</p>
                <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.75, color: COL.body, background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 10, padding: '14px 16px' }}>{event.description}</p>

                <div className="opts">
                  {event.options.map((o, i) => {
                    const afford = budget >= o.cost;
                    return (
                      <button key={i} className="opt" disabled={!afford} onClick={() => choose(o)} style={{ textAlign: 'left', background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: 17, cursor: afford ? 'pointer' : 'not-allowed', opacity: afford ? 1 : 0.45, display: 'flex', flexDirection: 'column', gap: 12, color: COL.text }}>
                        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4 }}>{o.text}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {o.effects.people !== 0 && <Badge c={COL.people} t={`인구 ${fmt(o.effects.people)}`} />}
                          {o.effects.economy !== 0 && <Badge c={COL.economy} t={`상권 ${fmt(o.effects.economy)}`} />}
                          {o.effects.infra !== 0 && <Badge c={COL.infra} t={`기반 ${fmt(o.effects.infra)}`} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${COL.border}`, paddingTop: 11 }}>
                          <span style={{ fontSize: 12.5, color: COL.mute }}>필요 사업비</span>
                          <span style={{ fontSize: 14.5, fontWeight: 900, color: o.cost > 0 ? COL.bad : COL.ok }}>{o.cost > 0 ? `${o.cost.toLocaleString()}만원` : '무료 (민간 유치)'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!canAffordAny && (
                  <button onClick={skipTurn} className="pbtn" style={{ marginTop: 14, width: '100%', background: '#fff1f2', color: COL.bad, border: `1px solid ${COL.bad}44`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <AlertTriangle size={15} /> 예산 부족 — 이번 턴 사업 보류하고 넘어가기 (지표 −3)
                  </button>
                )}
              </div>
            </div>

            {/* 우 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={panel({ padding: 18 })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 800 }}><Trophy size={16} color={COL.economy} /> 도시 활력 지수</span>
                  <span style={{ background: grade.c + '22', color: grade.c, fontWeight: 900, fontSize: 14, padding: '2px 10px', borderRadius: 8 }}>{grade.g}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{avg}</span><span style={{ fontSize: 14, color: COL.faint, fontWeight: 700 }}>/ 100</span>
                </div>
                <div style={{ marginTop: 12, width: '100%', height: 9, background: '#e6ecf5', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${avg}%`, height: '100%', background: `linear-gradient(90deg,${COL.orangeD},${COL.economy})`, transition: 'width .5s' }} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11.5, color: COL.faint }}>합격선 평균 {PASS_LINE}점</p>
              </div>

              <div style={panel({ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, color: COL.mute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>남은 사업 예산</p>
                  <p style={{ margin: '4px 0 0', fontSize: 23, fontWeight: 900, color: COL.text }}>{budget.toLocaleString()}<span style={{ fontSize: 13, color: COL.mute, fontWeight: 700 }}> 만원</span></p>
                </div>
                <div style={{ background: COL.ok + '15', color: COL.ok, padding: 11, borderRadius: 12, display: 'flex' }}><Wallet size={22} /></div>
              </div>

              <div style={panel({ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 })}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: COL.text, borderBottom: `1px solid ${COL.border}`, paddingBottom: 10 }}>도시 재생 핵심 지표</span>
                <Bar icon={<Users size={15} color={COL.people} />} label="생활인구" value={scores.people} color={COL.people} delta={lastDelta?.people} />
                <Bar icon={<TrendingUp size={15} color={COL.economy} />} label="상권 활력" value={scores.economy} color={COL.economy} delta={lastDelta?.economy} />
                <Bar icon={<Building2 size={15} color={COL.infra} />} label="문화/기반" value={scores.infra} color={COL.infra} delta={lastDelta?.infra} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: COL.bad, background: '#fff1f2', borderRadius: 8, padding: '6px 10px' }}>
                  <AlertTriangle size={13} /> 매 턴 도시 쇠퇴로 모든 지표 −{DECAY}
                </div>
              </div>

              <div style={panel({ padding: 14 })}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: COL.mute, letterSpacing: '0.05em', textTransform: 'uppercase' }}>행정 이력</span>
                <div className="logbox" style={{ maxHeight: 120, overflowY: 'auto', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12.5, color: i === 0 ? COL.text : COL.mute, lineHeight: 1.5 }}>
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
          <div style={{ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 18, padding: 30, textAlign: 'center', boxShadow: '0 20px 50px rgba(15,30,60,0.12)' }}>
            <div style={{ width: 88, height: 88, margin: '0 auto 14px', borderRadius: '50%', background: grade.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${grade.c}55` }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: grade.c }}>{grade.g}</span>
            </div>
            {avg >= PASS_LINE
              ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COL.ok, fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}><CheckCircle2 size={16} /> 재생 성공</div>
              : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: COL.bad, fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}><AlertTriangle size={16} /> 재생 미달</div>}
            <h2 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 900 }}>{avg >= PASS_LINE ? '사람이 다시 모이는 원도심' : '아직 비어 있는 거리'}</h2>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: COL.mute }}>10턴 종합 평균 <b style={{ color: COL.text, fontSize: 16 }}>{avg}점</b> (합격선 {PASS_LINE}점)</p>
            <div style={{ textAlign: 'left', background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 12, padding: 16, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Bar icon={<Users size={15} color={COL.people} />} label="생활인구" value={scores.people} color={COL.people} />
              <Bar icon={<TrendingUp size={15} color={COL.economy} />} label="상권 활력" value={scores.economy} color={COL.economy} />
              <Bar icon={<Building2 size={15} color={COL.infra} />} label="문화/기반시설" value={scores.infra} color={COL.infra} />
            </div>
            <blockquote style={{ textAlign: 'left', background: '#fff7ef', borderLeft: `4px solid ${COL.orange}`, borderRadius: 8, padding: '14px 16px', fontSize: 13.5, lineHeight: 1.75, fontStyle: 'italic', color: COL.body, margin: '0 0 22px' }}>
              "도시를 형성하고 유지하며 성장시키는 데 가장 중요한 요소는 결국 '사람'으로, 원도심 재생의 궁극적 목표는 떠나간 사람이 다시 돌아오게 하는 것입니다."
              <span style={{ display: 'block', textAlign: 'right', fontStyle: 'normal', fontSize: 11.5, color: COL.faint, marginTop: 8 }}>— 15분도시추진단장 보도자료 중</span>
            </blockquote>
            <button onClick={reset} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 16px rgba(249,115,22,0.3)' }}>
              <RotateCcw size={17} /> 처음부터 다시 도전
            </button>
          </div>
        </div>
      )}

      {/* ===== Tip 모달 ===== */}
      {tip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 50 }}>
          <div className="pop" style={{ background: COL.panel, border: `1px solid ${COL.border}`, borderRadius: 18, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(15,30,60,0.25)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#fff3e6,#ffffff)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COL.border}` }}>
              <div style={{ background: COL.economy + '20', color: COL.economy, padding: 8, borderRadius: 10, display: 'flex' }}><Lightbulb size={18} /></div>
              <div><p style={{ margin: 0, fontSize: 11.5, color: COL.mute, letterSpacing: '0.05em' }}>정책 배경 도움말</p><h3 style={{ margin: '2px 0 0', fontSize: 15.5, fontWeight: 800 }}>{policyTips[tip.idx].title}</h3></div>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.8, color: COL.body }}>{policyTips[tip.idx].body}</p>
              <div style={{ background: COL.panelSoft, border: `1px solid ${COL.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11.5, color: COL.mute }}>이번 선택 — <b style={{ color: COL.text }}>{tip.option.text}</b></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tip.option.effects.people !== 0 && <Badge c={COL.people} t={`인구 ${fmt(tip.option.effects.people)}`} />}
                  {tip.option.effects.economy !== 0 && <Badge c={COL.economy} t={`상권 ${fmt(tip.option.effects.economy)}`} />}
                  {tip.option.effects.infra !== 0 && <Badge c={COL.infra} t={`기반 ${fmt(tip.option.effects.infra)}`} />}
                  {tip.option.cost > 0 ? <Badge c={COL.bad} t={`예산 −${tip.option.cost.toLocaleString()}`} /> : <Badge c={COL.ok} t="예산 절약" />}
                </div>
              </div>
              <button onClick={nextTurn} className="pbtn" style={{ width: '100%', background: COL.orangeD, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {turn < 10 ? '다음 턴으로' : '최종 결과 보기'} <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Sympnote · Shared primitives, icons, and design tokens
   ============================================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ----- Icons (Lucide-style) ----- */
const Icon = {
  ArrowLeft: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>),
  ArrowRight: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>),
  Mic: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/></svg>),
  Home: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>),
  Clipboard: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>),
  History: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 14"/></svg>),
  Star: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>),
  Copy: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>),
  Share: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/><path d="M5 21h14"/></svg>),
  Dot: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="12" r="3"/></svg>),
  Stop: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="7" y="7" width="10" height="10" rx="2"/></svg>),
  Sparkle: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>),
  Flame: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2s4 4 4 8a4 4 0 0 1-1 2.6c1.2.6 2 1.9 2 3.4a5 5 0 0 1-10 0c0-1.9 1.1-3.3 2-4.2.6-.6 1-1.4 1-2.3 0-1.6-.7-2.9-.7-2.9S12 5 12 2z"/></svg>),
  Trophy: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 4h10v2h3v3a4 4 0 0 1-4 4h-.2A5 5 0 0 1 13 15.9V18h2a2 2 0 0 1 2 2v1H7v-1a2 2 0 0 1 2-2h2v-2.1A5 5 0 0 1 7.2 13H7a4 4 0 0 1-4-4V6h3V4zm0 4H5v1a2 2 0 0 0 2 2V8zm10 0v3a2 2 0 0 0 2-2V8h-2z"/></svg>),
  Bolt: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>),
  Heart: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.65 12 21 12 21z"/></svg>),
  Lock: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>),
  Plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Gift: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20 12v9H4v-9h16zM3 8h18v3H3V8zm9 0h1a3 3 0 0 0 0-6 4 4 0 0 0-4 4c0 .7.2 1.4.5 2H7v4h5V8zm0 0V4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm0 0V4c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2h-2z"/></svg>),
  TrendUp: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>),
  TrendDown: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/></svg>),
  ChevronRight: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="9 6 15 12 9 18"/></svg>),
  ChevronDown: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9"/></svg>),
  Settings: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>),
  ChartLine: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><polyline points="7 15 11 11 14 14 20 8"/></svg>),
  Bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>),
  Users: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="6" r="3"/><path d="M15 21a7 7 0 0 1 7-7"/></svg>),
  Download: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 21h14"/></svg>),
  Accessibility: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="4" r="2"/><path d="M12 7v5l-3 9M12 12l3 9M7 10h10"/></svg>),
  LogOut: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  Filter: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="3 4 21 4 14 12 14 20 10 18 10 12"/></svg>),
  Pill: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7" transform="rotate(-45 12 12)"/></svg>),
  Info: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></svg>),
  Edit: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>),
  X: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>),
};

/* ----- Brand Logo Mark (distinctive app icon) ----- */
const SympnoteMark = ({ size = 32, rounded = true }) => {
  const id = useMemo(() => 'sn-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id={id+'-bg'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3BA79F"/>
          <stop offset="55%" stopColor="#2C6E6B"/>
          <stop offset="100%" stopColor="#1F504E"/>
        </linearGradient>
        <linearGradient id={id+'-wave'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F6C06A"/>
          <stop offset="100%" stopColor="#FFE6B0"/>
        </linearGradient>
        <radialGradient id={id+'-glow'} cx="35%" cy="28%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx={rounded ? 16 : 0} fill={`url(#${id}-bg)`}/>
      <rect x="0" y="0" width="64" height="64" rx={rounded ? 16 : 0} fill={`url(#${id}-glow)`}/>
      {/* speech-bubble/cross hybrid */}
      <path d="M18 20 Q18 14 24 14 H40 Q46 14 46 20 V34 Q46 40 40 40 H30 L24 46 V40 Q18 40 18 34 Z" fill="#F5F1EA" opacity="0.95"/>
      {/* waveform bars inside */}
      <g>
        <rect x="24" y="26" width="2.5" height="6" rx="1.25" fill="url(#${id}-wave)" style={{ fill: '#2C6E6B' }}/>
        <rect x="28.5" y="22" width="2.5" height="14" rx="1.25" fill="#2C6E6B"/>
        <rect x="33" y="18" width="2.5" height="22" rx="1.25" fill="#2C6E6B"/>
        <rect x="37.5" y="22" width="2.5" height="14" rx="1.25" fill="#2C6E6B"/>
      </g>
      {/* spark */}
      <g transform="translate(44,14)">
        <circle r="6" fill="#F6C06A"/>
        <path d="M0 -3 L0.8 -0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8 -0.8 Z" fill="#FFF" opacity="0.9"/>
      </g>
    </svg>
  );
};

/* Big hero version with animated waveform */
const SympnoteHero = ({ size = 128 }) => (
  <div className="relative" style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-[28%] pulse-ring" style={{ background: 'rgba(246,192,106,0.35)' }}/>
    <div className="absolute inset-0 rounded-[28%] pulse-ring-delay" style={{ background: 'rgba(59,167,159,0.25)' }}/>
    <div className="relative">
      <SympnoteMark size={size} />
    </div>
  </div>
);

/* ----- Status bar ----- */
const StatusBar = ({ dark = false }) => (
  <div className="status-bar" style={{ color: dark ? '#fff' : '#1A1F1E' }}>
    <span>9:41</span>
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="0.5" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 4.5C3 2.5 5.5 1 8 1s5 1.5 7 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M3.5 7c1.3-1.3 2.8-2 4.5-2s3.2.7 4.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="10" r="1.2" fill="currentColor"/></svg>
      <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor"/><rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.5"/></svg>
    </span>
  </div>
);

/* ----- Buttons ----- */
const PrimaryButton = ({ children, onClick, className = '', icon = null, disabled = false }) => (
  <button onClick={onClick} disabled={disabled}
    className={`press w-full h-[56px] rounded-full text-white flex items-center justify-center gap-2 disabled:opacity-40 relative overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(135deg, #3BA79F 0%, #2C6E6B 55%, #1F504E 100%)',
      boxShadow: '0 8px 24px rgba(44,110,107,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
      fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em'
    }}>
    <span className="relative z-10 flex items-center gap-2">{children}{icon}</span>
    <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
      style={{ background: 'linear-gradient(135deg, #4DB8B0 0%, #337D7A 100%)' }}/>
  </button>
);

const SecondaryButton = ({ children, onClick, className = '' }) => (
  <button onClick={onClick}
    className={`press w-full h-[52px] rounded-full bg-bg-muted text-text-primary font-semibold flex items-center justify-center gap-2 hover:bg-[#DFD7C6] ${className}`}
    style={{ fontSize: 15, fontWeight: 600 }}>
    {children}
  </button>
);

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="press w-10 h-10 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-muted">
    <Icon.ArrowLeft width="22" height="22" />
  </button>
);

/* ----- Tag chip ----- */
const TagChip = ({ t, color }) => (
  <span className="inline-flex items-center t-caption px-2 py-0.5 rounded-full font-medium"
    style={{
      background: color ? color + '26' : '#EBE5DA',
      color: color || '#5A6361'
    }}>
    #{t}
  </span>
);

/* ----- Confetti burst (used on key moments) ----- */
const Confetti = ({ show, count = 32 }) => {
  if (!show) return null;
  const colors = ['#2C6E6B', '#F6C06A', '#5A8F6E', '#A8C4C2', '#E07A5F'];
  const pieces = Array.from({ length: count }).map((_, i) => {
    const angle = (Math.random() * Math.PI * 2);
    const dist = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = Math.random() * 540 - 270;
    const size = 6 + Math.random() * 8;
    const delay = Math.random() * 120;
    const color = colors[i % colors.length];
    const shape = i % 3;
    return (
      <span key={i} className="confetti-piece"
        style={{
          '--dx': `${dx}px`, '--dy': `${dy}px`, '--rot': `${rot}deg`,
          width: size, height: size, background: color,
          borderRadius: shape === 0 ? '50%' : shape === 1 ? '2px' : '0',
          animationDelay: `${delay}ms`,
        }}/>
    );
  });
  return <div className="confetti-layer">{pieces}</div>;
};

/* ----- Progress ring ----- */
const ProgressRing = ({ value, size = 56, stroke = 5, color = '#2C6E6B', track = '#EBE5DA', children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }}/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

/* ----- XP Pill (shared top chrome) ----- */
const StreakPill = ({ days = 5, compact = false, className = '' }) => (
  <div className={`flex items-center gap-1 rounded-full ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} ${className}`}
    style={{ background: 'linear-gradient(135deg, #FFE0B2 0%, #F6C06A 100%)',
             border: compact ? '2px solid #fff' : 'none' }}>
    <Icon.Flame width={compact ? 10 : 12} height={compact ? 10 : 12} color="#B45309"/>
    <span className="font-bold" style={{ color: '#7C2D12', fontSize: compact ? 10 : 12 }}>{days}</span>
  </div>
);

const XPPill = ({ xp = 340 }) => (
  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent">
    <Icon.Bolt width="10" height="10" color="#FFE6B0"/>
    <span className="t-label font-bold text-white">{xp} XP</span>
  </div>
);

/* ----- Export ----- */
Object.assign(window, {
  useState, useEffect, useRef, useMemo, useCallback,
  Icon, SympnoteMark, SympnoteHero,
  StatusBar, PrimaryButton, SecondaryButton, BackButton,
  TagChip, Confetti, ProgressRing, StreakPill, XPPill,
});

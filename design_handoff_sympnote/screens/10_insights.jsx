/* Tab 4 — Insights (new: patterns, trends, correlations) */

const INSIGHT_SYMPTOMS = [
  { name: 'Knee pain', count: 18, trend: 'up', pct: 72, color: '#2C6E6B', sparkline: [3,4,5,4,6,7,6,5,7,8] },
  { name: 'Fatigue', count: 12, trend: 'up', pct: 48, color: '#F6C06A', sparkline: [4,5,4,6,5,7,6,5,6,7] },
  { name: 'Headache', count: 6, trend: 'down', pct: 24, color: '#E07A5F', sparkline: [5,6,4,3,4,3,2,2,3,2] },
  { name: 'Nausea', count: 3, trend: 'flat', pct: 12, color: '#D97706', sparkline: [2,3,2,3,2,3,2,2,3,2] },
];

const CORRELATIONS = [
  { a: 'Fatigue', b: 'Poor sleep', strength: 0.8, pattern: 'Fatigue follows nights with <6h sleep 4 of 5 times.', severity: 'strong' },
  { a: 'Knee pain', b: 'Stairs', strength: 0.7, pattern: 'Knee pain is ~2× more severe on days you mention stairs.', severity: 'strong' },
  { a: 'Headache', b: 'Dehydration', strength: 0.5, pattern: 'Headaches cluster on low-water days.', severity: 'moderate' },
];

const Sparkline = ({ data, color }) => {
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const w = 80, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={h - ((data[data.length-1] - min) / (max - min || 1)) * h} r="2.5" fill={color}/>
    </svg>
  );
};

const TabInsights = () => {
  const [range, setRange] = useState('30d');
  return (
    <div className="screen-in h-full flex flex-col">
      <StatusBar />
      <div className="pt-14 px-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="t-h1 text-text-primary">Insights</h1>
            <p className="t-body text-text-secondary">Patterns from your notes.</p>
          </div>
        </div>
      </div>

      {/* Range selector */}
      <div className="px-6 pb-3">
        <div className="inline-flex bg-bg-muted rounded-full p-1">
          {['7d','30d','90d','All'].map(r => {
            const active = range === r;
            return (
              <button key={r} onClick={() => setRange(r)}
                className="press h-8 px-3.5 rounded-full t-label font-semibold"
                style={{ background: active ? '#fff' : 'transparent', color: active ? '#2C6E6B' : '#5A6361',
                         boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}>
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 phone-scroll overflow-y-auto flex-1 pb-28 space-y-5">
        {/* Headline stat */}
        <div className="fade-up rounded-2xl p-4 relative overflow-hidden shadow-soft-lg"
             style={{ background: 'linear-gradient(135deg, #2C6E6B 0%, #1F504E 100%)' }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: 'rgba(246,192,106,0.15)' }}/>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Icon.ChartLine width="22" height="22" color="#F6C06A"/>
            </div>
            <div className="flex-1">
              <div className="t-label font-semibold" style={{ color: '#F6C06A', letterSpacing: '0.05em' }}>LAST 30 DAYS</div>
              <div className="t-h2 text-white">42 voice notes</div>
              <div className="t-caption text-white/80">4 symptoms tracked · 18h 12m recorded</div>
            </div>
          </div>
        </div>

        {/* Symptom frequency */}
        <div className="fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="t-label text-text-tertiary font-semibold uppercase tracking-wide">Symptom frequency</span>
          </div>
          <div className="bg-bg-surface rounded-2xl border border-border-soft shadow-soft overflow-hidden">
            {INSIGHT_SYMPTOMS.map((s, i) => {
              const TrendIcon = s.trend === 'up' ? Icon.TrendUp : s.trend === 'down' ? Icon.TrendDown : Icon.Dot;
              const trendColor = s.trend === 'up' ? '#E07A5F' : s.trend === 'down' ? '#5A8F6E' : '#8A9290';
              return (
                <div key={i} className={`px-4 py-3 ${i > 0 ? 'border-t border-border-soft' : ''}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }}/>
                      <span className="t-body font-semibold text-text-primary truncate">{s.name}</span>
                      <span className="t-caption text-text-tertiary flex-shrink-0">{s.count}×</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Sparkline data={s.sparkline} color={s.color}/>
                      <div className="flex items-center gap-0.5" style={{ color: trendColor }}>
                        <TrendIcon width="12" height="12"/>
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${s.pct}%`, background: s.color }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Correlations */}
        <div className="fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="t-label text-text-tertiary font-semibold uppercase tracking-wide">Patterns detected</span>
            <span className="t-label text-accent font-semibold">{CORRELATIONS.length}</span>
          </div>
          <div className="space-y-2">
            {CORRELATIONS.map((c, i) => (
              <div key={i} className="bg-bg-surface border border-border-soft rounded-2xl p-4 shadow-soft">
                <div className="flex items-center gap-2 mb-2">
                  <span className="t-caption font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#2C6E6B18', color: '#2C6E6B' }}>{c.a}</span>
                  <span className="t-caption text-text-tertiary">↔</span>
                  <span className="t-caption font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#E07A5F18', color: '#E07A5F' }}>{c.b}</span>
                  <span className="ml-auto t-caption font-bold"
                        style={{ color: c.severity === 'strong' ? '#E07A5F' : '#D97706' }}>
                    {c.severity.toUpperCase()}
                  </span>
                </div>
                <p className="t-body text-text-primary leading-snug" style={{ textWrap: 'pretty' }}>{c.pattern}</p>
                <div className="mt-2 h-1 bg-bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                       style={{ width: `${c.strength*100}%`,
                                background: `linear-gradient(90deg, #F6C06A, #E07A5F)` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time-of-day heatmap */}
        <div className="fade-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="t-label text-text-tertiary font-semibold uppercase tracking-wide">When symptoms strike</span>
          </div>
          <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 shadow-soft">
            <div className="grid grid-cols-8 gap-1">
              <div></div>
              {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="t-caption text-text-tertiary text-center">{d}</div>)}
              {['AM','Noon','PM','Eve','Night'].map((label, row) => (
                <React.Fragment key={row}>
                  <div className="t-caption text-text-tertiary pr-1 text-right self-center">{label}</div>
                  {Array.from({length: 7}).map((_, col) => {
                    const intensity = (Math.sin(row*1.3 + col*0.7) + 1) / 2;
                    const cell = row === 0 || row === 2 ? intensity * 0.9 : intensity * 0.4;
                    return (
                      <div key={col} className="aspect-square rounded-sm"
                           style={{ background: `rgba(44,110,107,${0.08 + cell*0.7})` }}/>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <p className="t-caption text-text-tertiary mt-3 leading-snug" style={{ textWrap: 'pretty' }}>
              Symptoms peak in the <span className="font-semibold text-text-primary">morning</span> and <span className="font-semibold text-text-primary">afternoon</span>.
            </p>
          </div>
        </div>

        <p className="t-caption text-text-tertiary text-center pb-2 px-4" style={{ textWrap: 'pretty' }}>
          Patterns are observational, based on your notes. Not a diagnosis.
        </p>
      </div>
    </div>
  );
};
window.TabInsights = TabInsights;

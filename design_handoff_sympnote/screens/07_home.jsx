/* Tab 1 — Home
   Calmer, more purposeful daily surface:
   - Minimal greeting, no avatar badges
   - Hero "Up Next" appointment (the single most-important thing)
   - Quick-log row (3 common entry types + mic)
   - Today grouped entries w/ timeline
   - Insight nudge inline, lower priority
*/

const QUICK_LOGS = [
  { e: '💊', t: 'Medication', c: '#5A8F6E' },
  { e: '😣', t: 'Symptom',    c: '#E07A5F' },
  { e: '🩹', t: 'Side effect', c: '#F6C06A' },
];

const TODAY_ENTRIES_HOME = [
  { time: '10:42', period: 'AM', text: 'Morning knee pain, 6/10, worse climbing stairs.', tags: [{t:'knee',c:'#E07A5F'}], dur: '1:24', kind: 'voice' },
  { time: '08:15', period: 'AM', text: 'Fatigue returning — slept ~6h, groggy through breakfast.', tags: [{t:'fatigue',c:'#F6C06A'},{t:'sleep',c:'#5A8F6E'}], dur: '0:48', kind: 'voice' },
  { time: '07:30', period: 'AM', text: 'Methotrexate 15mg + folic acid.', tags: [{t:'meds',c:'#5A8F6E'}], kind: 'med' },
];

const TabHome = ({ onOpenSettings, onOpenPrep, onOpenInsights }) => {
  return (
    <div className="screen-in h-full flex flex-col relative bg-bg-primary">
      <StatusBar />

      {/* Header — greeting + avatar */}
      <div className="pt-14 px-6 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="t-label text-text-tertiary">Thursday, Nov 21</p>
            <h1 className="t-h1 text-text-primary truncate" style={{ marginTop: 2 }}>Good morning, Maya</h1>
          </div>
          <button onClick={onOpenSettings}
                  className="press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2C6E6B, #1F504E)' }}
                  aria-label="Settings">
            <span className="t-body font-bold text-white">M</span>
          </button>
        </div>
      </div>

      <div className="px-6 phone-scroll overflow-y-auto flex-1 pb-40">
        {/* Up-next appointment */}
        <button onClick={onOpenPrep}
                className="press fade-up w-full text-left rounded-2xl p-5 relative overflow-hidden shadow-soft-lg"
                style={{ background: 'linear-gradient(135deg, #2C6E6B 0%, #1F504E 100%)' }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'rgba(246,192,106,0.1)' }}/>
          <div className="absolute right-6 top-6 t-caption font-semibold" style={{ color: 'rgba(246,192,106,0.9)', letterSpacing: '0.08em' }}>
            NEXT VISIT
          </div>
          <div className="relative mt-1">
            <div className="t-h1 text-white" style={{ fontWeight: 700 }}>Dr. Chen</div>
            <div className="t-body text-white/75 mt-0.5">Rheumatology</div>
          </div>
          <div className="relative mt-4 flex items-end justify-between gap-4">
            <div>
              <div className="t-caption text-white/60 uppercase tracking-wide">Fri Nov 28</div>
              <div className="t-h3 text-white font-semibold">2:00 PM · in 7d</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-sm">
              <Icon.Sparkle width="12" height="12" color="#F6C06A"/>
              <span className="t-label font-semibold text-white">Prep ready</span>
            </div>
          </div>
        </button>

        {/* Quick-log shortcuts */}
        <div className="fade-up mt-4" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="t-label text-text-tertiary font-semibold uppercase tracking-wide">Quick log</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_LOGS.map(q => (
              <button key={q.t}
                className="press rounded-2xl bg-bg-surface border border-border-soft p-3 flex flex-col items-center gap-1.5 hover:border-accent-light shadow-soft">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                     style={{ background: q.c + '18' }}>
                  {q.e}
                </div>
                <span className="t-label font-semibold text-text-primary">{q.t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today entries */}
        <div className="mt-5 fade-up" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="t-label text-text-tertiary font-semibold uppercase tracking-wide">Today</span>
            <span className="t-label text-text-tertiary tabular-nums">{TODAY_ENTRIES_HOME.length} entries</span>
          </div>
          <div className="bg-bg-surface rounded-2xl border border-border-soft shadow-soft overflow-hidden">
            {TODAY_ENTRIES_HOME.map((e, i) => (
              <div key={i} className={`flex gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-border-soft' : ''}`}>
                {/* Timeline column */}
                <div className="flex flex-col items-end pt-0.5 flex-shrink-0" style={{ width: 46 }}>
                  <div className="t-body font-semibold text-text-primary tabular-nums leading-none">{e.time}</div>
                  <div className="t-caption text-text-tertiary">{e.period}</div>
                </div>
                <div className="w-px bg-border-soft relative flex-shrink-0">
                  <div className="absolute left-1/2 top-1.5 w-2 h-2 rounded-full -translate-x-1/2"
                       style={{ background: e.kind === 'med' ? '#5A8F6E' : '#2C6E6B',
                                boxShadow: '0 0 0 3px #fff' }}/>
                </div>
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {e.kind === 'voice' && (
                      <span className="inline-flex items-center gap-1 t-caption text-text-tertiary">
                        <Icon.Mic width="10" height="10"/> {e.dur}
                      </span>
                    )}
                    {e.kind === 'med' && (
                      <span className="inline-flex items-center gap-1 t-caption text-text-tertiary">
                        <Icon.Pill width="10" height="10"/> Medication
                      </span>
                    )}
                    <div className="flex gap-1 ml-auto">
                      {e.tags.map(tg => <TagChip key={tg.t} t={tg.t} color={tg.c}/>)}
                    </div>
                  </div>
                  <p className="t-body text-text-primary leading-snug" style={{ textWrap: 'pretty' }}>{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight nudge — inline, softer */}
        <button onClick={onOpenInsights}
                className="press fade-up w-full text-left mt-4 rounded-2xl p-3.5 bg-bg-surface border border-border-soft shadow-soft flex items-center gap-3 hover:border-accent-light"
                style={{ animationDelay: '200ms' }}>
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
               style={{ background: '#E07A5F18' }}>
            <Icon.TrendUp width="16" height="16" color="#E07A5F"/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-body text-text-primary leading-snug font-medium" style={{ textWrap: 'pretty' }}>
              Knee pain logged 6 days in a row
            </div>
            <div className="t-caption text-text-tertiary mt-0.5">See pattern in Insights</div>
          </div>
          <Icon.ChevronRight width="16" height="16" color="#8A9290"/>
        </button>

        {/* Empty state hint */}
        <p className="t-caption text-text-tertiary text-center mt-5 px-6" style={{ textWrap: 'pretty' }}>
          Logging little and often makes your prep summaries sharper.
        </p>
      </div>

      {/* Pinned record FAB */}
      <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ bottom: 92 }}>
        <div className="relative pointer-events-auto">
          <div className="absolute inset-0 rounded-full pulse-ring" style={{ background: 'rgba(44,110,107,0.22)' }}/>
          <div className="absolute inset-0 rounded-full pulse-ring-delay" style={{ background: 'rgba(246,192,106,0.24)' }}/>
          <button className="press relative w-[68px] h-[68px] rounded-full flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #4DB8B0 0%, #2C6E6B 80%)',
                           boxShadow: '0 12px 28px rgba(44,110,107,0.45), 0 0 0 6px rgba(255,255,255,0.9)' }}
                  aria-label="Voice log">
            <Icon.Mic width="28" height="28" color="#fff"/>
          </button>
        </div>
      </div>
    </div>
  );
};
window.TabHome = TabHome;

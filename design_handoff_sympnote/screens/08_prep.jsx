/* Tab 2 — Prep (redesigned: tabbed sections, readable chart, inline editing) */
const PREP_APPTS = [
  { id: 0, doc: 'Dr. Chen', spec: 'Rheumatology', date: 'Nov 28', time: '2:00 PM', inDays: 7, color: '#2C6E6B' },
  { id: 1, doc: 'Dr. Patel', spec: 'Primary Care', date: 'Dec 12', time: '10:30 AM', inDays: 21, color: '#E07A5F' },
];

const PREP_CONTENT = {
  0: {
    concerns: [
      { t: 'Right knee pain', s: '2 weeks, worsening', sev: 7 },
      { t: 'Morning stiffness', s: 'After waking, lasts ~30min', sev: 5 },
      { t: 'Afternoon fatigue', s: 'Despite 7–8h sleep', sev: 6 },
    ],
    timeline: 'Started ~Nov 6. Gradual onset, no injury. Stairs trigger sharpest pain. Symptoms progressively more frequent over the past 10 days.',
    severity: [
      { d: 'Nov 12', v: 4 }, { d: 'Nov 13', v: 5 }, { d: 'Nov 14', v: 7 }, { d: 'Nov 15', v: 6 },
      { d: 'Nov 16', v: 5 }, { d: 'Nov 17', v: 8 }, { d: 'Nov 18', v: 6 }, { d: 'Nov 19', v: 5 },
      { d: 'Nov 20', v: 7 }, { d: 'Nov 21', v: 4 },
    ],
    meds: [{ name: 'Ibuprofen', dose: '400mg', freq: 'As needed', last: 'Today, 9am' }],
    questions: [
      'Should I get imaging (MRI) for the knee?',
      'Could the fatigue be related to the joint symptoms?',
      'Anti-inflammatory options other than ibuprofen?',
      'Is physical therapy worth trying first?',
      'Any labs I should request?',
    ],
  },
  1: {
    concerns: [{ t: 'Annual wellness check', s: 'Routine visit', sev: 2 }],
    timeline: 'Routine annual physical.',
    severity: [],
    meds: [],
    questions: ['Update on vaccines', 'Blood work results from last visit', 'Sleep hygiene recommendations'],
  },
};

/* — Inner tabs — */
const PrepSectionTabs = ({ tab, setTab, color }) => {
  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'chart', label: 'Severity' },
    { id: 'questions', label: 'Questions' },
    { id: 'meds', label: 'Meds' },
  ];
  return (
    <div className="flex gap-1 bg-bg-muted rounded-full p-1">
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="press flex-1 h-9 rounded-full t-label font-semibold transition-colors"
            style={{
              background: active ? color : 'transparent',
              color: active ? '#fff' : '#5A6361',
            }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

/* — Severity chart with axes — */
const SeverityChart = ({ data, color }) => {
  if (!data.length) return <p className="t-body text-text-tertiary text-center py-8">No severity data yet.</p>;
  const max = 10;
  const avg = (data.reduce((s, d) => s + d.v, 0) / data.length).toFixed(1);
  const peak = Math.max(...data.map(d => d.v));
  return (
    <div>
      <div className="flex items-baseline gap-4 mb-3">
        <div>
          <div className="t-caption text-text-tertiary">Average</div>
          <div className="t-h2 text-text-primary tabular-nums">{avg}<span className="t-body text-text-tertiary">/10</span></div>
        </div>
        <div>
          <div className="t-caption text-text-tertiary">Peak</div>
          <div className="t-h2 text-coral tabular-nums">{peak}<span className="t-body text-text-tertiary">/10</span></div>
        </div>
        <div className="ml-auto flex items-center gap-1 t-caption text-coral font-semibold whitespace-nowrap">
          <Icon.TrendUp width="12" height="12"/>
          <span>Trending up</span>
        </div>
      </div>
      <div className="flex gap-2 items-stretch">
        {/* y-axis labels */}
        <div className="flex flex-col justify-between t-caption text-text-tertiary w-4 text-right py-0.5">
          <span>10</span><span>5</span><span>0</span>
        </div>
        {/* bars area */}
        <div className="flex-1 relative">
          {/* gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0,1,2].map(i => <div key={i} className="border-t border-border-soft/60"/>)}
          </div>
          <div className="relative h-28 flex items-end gap-1">
            {data.map((d, i) => {
              const severe = d.v >= 7;
              return (
                <div key={i} className="flex-1 rounded-t transition-all"
                     style={{
                       height: `${(d.v/max)*100}%`,
                       background: severe
                         ? 'linear-gradient(180deg, #E07A5F 0%, #C45C3F 100%)'
                         : `linear-gradient(180deg, #A8C4C2 0%, ${color} 100%)`,
                     }}/>
              );
            })}
          </div>
          {/* x-axis labels (sparse) */}
          <div className="flex justify-between t-caption text-text-tertiary mt-1">
            <span>{data[0].d}</span>
            <span>{data[data.length-1].d}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* — Concern row with severity bar — */
const ConcernRow = ({ c, color }) => {
  const severity = c.sev >= 7 ? 'coral' : c.sev >= 5 ? 'amber' : 'accent';
  const sevColor = severity === 'coral' ? '#E07A5F' : severity === 'amber' ? '#D97706' : color;
  return (
    <div className="bg-bg-primary/60 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1">
          <div className="t-body font-semibold text-text-primary">{c.t}</div>
          <div className="t-caption text-text-tertiary">{c.s}</div>
        </div>
        <span className="t-caption font-bold tabular-nums flex-shrink-0"
              style={{ color: sevColor }}>{c.sev}/10</span>
      </div>
      <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${c.sev*10}%`, background: sevColor }}/>
      </div>
    </div>
  );
};

/* — Per-appointment card — */
const AppointmentCard = ({ a, open, onToggle }) => {
  const [section, setSection] = useState('summary');
  const data = PREP_CONTENT[a.id];

  return (
    <div className="bg-bg-surface border border-border-soft rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="press w-full text-left p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{ background: a.color + '18', color: a.color }}>
          <Icon.Clipboard width="20" height="20"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="t-h3 text-text-primary truncate">{a.doc}</div>
            <span className="t-caption font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                  style={{ background: a.color + '18', color: a.color }}>
              in {a.inDays}d
            </span>
          </div>
          <div className="t-body text-text-secondary">{a.spec}</div>
          <div className="mt-1 flex items-center gap-1.5 t-label text-text-tertiary">
            <Icon.Calendar width="12" height="12"/>
            <span>{a.date} · {a.time}</span>
          </div>
        </div>
        <Icon.ChevronDown width="18" height="18" color="#8A9290"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}/>
      </button>

      {open && (
        <div className="fade-up border-t border-border-soft bg-[#FBF8F2]">
          <div className="p-4">
            <PrepSectionTabs tab={section} setTab={setSection} color={a.color}/>
          </div>

          <div className="px-4 pb-4">
            {section === 'summary' && (
              <div className="space-y-2">
                {data.concerns.map((c, i) => <ConcernRow key={i} c={c} color={a.color}/>)}
                <div className="pt-2">
                  <div className="t-label text-text-tertiary uppercase tracking-wide font-semibold mb-1">Timeline</div>
                  <p className="t-body text-text-primary leading-snug" style={{ textWrap: 'pretty' }}>{data.timeline}</p>
                </div>
              </div>
            )}

            {section === 'chart' && <SeverityChart data={data.severity} color={a.color}/>}

            {section === 'questions' && (
              <div className="space-y-1.5">
                {data.questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-bg-primary/60 rounded-xl px-3 py-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: a.color + '18', color: a.color }}>
                      <span className="t-caption font-bold">{i+1}</span>
                    </div>
                    <p className="t-body text-text-primary flex-1 leading-snug" style={{ textWrap: 'pretty' }}>{q}</p>
                    <button className="press p-1 text-text-tertiary hover:text-text-primary"><Icon.Edit width="14" height="14"/></button>
                  </div>
                ))}
                <button className="press w-full rounded-xl border-2 border-dashed border-border-soft py-2.5 flex items-center justify-center gap-1.5 text-text-tertiary hover:border-accent hover:text-accent">
                  <Icon.Plus width="14" height="14"/>
                  <span className="t-label font-semibold">Add question</span>
                </button>
              </div>
            )}

            {section === 'meds' && (
              <div className="space-y-2">
                {data.meds.length === 0 ? (
                  <p className="t-body text-text-tertiary text-center py-6">No medications logged.</p>
                ) : data.meds.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-bg-primary/60 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: a.color + '18', color: a.color }}>
                      <Icon.Pill width="18" height="18"/>
                    </div>
                    <div className="flex-1">
                      <div className="t-body font-semibold text-text-primary">{m.name} · {m.dose}</div>
                      <div className="t-caption text-text-tertiary">{m.freq} · Last: {m.last}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button className="press flex-1 h-11 rounded-full bg-bg-muted text-text-primary t-label font-semibold flex items-center justify-center gap-1.5 hover:bg-[#DFD7C6]">
              <Icon.Download width="14" height="14"/> Export PDF
            </button>
            <button className="press flex-1 h-11 rounded-full text-white t-label font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: a.color }}>
              <Icon.Share width="14" height="14"/> Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TabPrep = () => {
  const [expanded, setExpanded] = useState(0);
  return (
    <div className="screen-in h-full flex flex-col">
      <StatusBar />
      <div className="pt-14 px-6 pb-3">
        <h1 className="t-h1 text-text-primary">Prep</h1>
        <p className="t-body text-text-secondary">AI summaries for your upcoming visits.</p>
      </div>

      <div className="px-6 phone-scroll overflow-y-auto flex-1 pb-28 space-y-3">
        {PREP_APPTS.map((a, i) => (
          <div key={a.id} className="fade-up" style={{ animationDelay: `${i*80}ms` }}>
            <AppointmentCard a={a} open={expanded === a.id} onToggle={() => setExpanded(expanded === a.id ? -1 : a.id)}/>
          </div>
        ))}
        <button className="press w-full rounded-2xl border-2 border-dashed border-border-soft p-4 flex items-center justify-center gap-2 text-text-secondary hover:border-accent hover:text-accent">
          <Icon.Plus width="16" height="16"/>
          <span className="t-body font-semibold">Add appointment</span>
        </button>
        <p className="t-caption text-text-tertiary text-center pt-2">
          Summaries are organizational tools · not medical advice
        </p>
      </div>
    </div>
  );
};
window.TabPrep = TabPrep;

/* Screen — Primary Focus (redesigned: 2-col gradient tile grid) */
const ScreenFocus = ({ onNext, onBack }) => {
  const [sel, setSel] = useState(null);
  const options = [
    { id: 'chronic',  t: 'Chronic condition',     s: 'Ongoing, recurring',     e: '🌀', grad: ['#2C6E6B', '#1F504E'], fg: '#fff' },
    { id: 'new',      t: 'New symptom',           s: 'Unexplained, recent',    e: '🔎', grad: ['#E07A5F', '#C45C3F'], fg: '#fff' },
    { id: 'mental',   t: 'Mental health',         s: 'Mood, sleep, anxiety',   e: '🧠', grad: ['#A8C4C2', '#6FA19E'], fg: '#1F504E' },
    { id: 'pre-op',   t: 'Procedure prep',        s: 'Before or after',        e: '🏥', grad: ['#F6C06A', '#D9964A'], fg: '#5C3D12' },
    { id: 'loved',    t: 'For someone else',      s: 'Caregiver mode',         e: '💗', grad: ['#F5A3A3', '#D97575'], fg: '#fff' },
    { id: 'general',  t: 'General journal',       s: 'Just keeping track',     e: '📔', grad: ['#C7B98F', '#9E8F5F'], fg: '#fff' },
  ];

  return (
    <div className="screen-in w-full h-full flex flex-col bg-bg-primary">
      <StatusBar />
      <div className="pt-14 px-6 flex items-center justify-between">
        <BackButton onClick={onBack} />
        <span className="t-label text-text-tertiary whitespace-nowrap">5 of 9</span>
        <div className="w-10"/>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 phone-scroll overflow-y-auto">
        <div className="t-label text-accent font-semibold fade-up tracking-wide">YOUR FOCUS</div>
        <h1 className="t-h1 text-text-primary fade-up mt-1" style={{ textWrap: 'balance' }}>
          What are you tracking?
        </h1>
        <p className="t-body text-text-secondary mt-1.5 fade-up" style={{ animationDelay: '80ms' }}>
          We'll tailor prompts and summaries. Change this anytime.
        </p>

        {/* 2-col tile grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 pb-4">
          {options.map((o, i) => {
            const selected = sel === o.id;
            return (
              <button key={o.id} onClick={() => setSel(o.id)}
                className="press fade-up relative rounded-2xl p-3.5 text-left overflow-hidden transition-all"
                style={{
                  aspectRatio: '1 / 1.05',
                  background: `linear-gradient(135deg, ${o.grad[0]} 0%, ${o.grad[1]} 100%)`,
                  color: o.fg,
                  transform: selected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: selected
                    ? `0 12px 32px ${o.grad[1]}55, 0 0 0 3px #fff, 0 0 0 5px ${o.grad[0]}`
                    : '0 6px 16px rgba(26,31,30,0.1)',
                  animationDelay: `${120 + i*70}ms`,
                }}>
                {/* decorative blob */}
                <div className="absolute -right-5 -top-5 w-16 h-16 rounded-full pointer-events-none"
                     style={{ background: 'rgba(255,255,255,0.15)' }}/>
                <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full pointer-events-none"
                     style={{ background: 'rgba(255,255,255,0.08)' }}/>

                {/* emoji */}
                <div className="text-3xl relative z-10 leading-none mb-2">{o.e}</div>

                {/* label */}
                <div className="relative z-10">
                  <div className="font-semibold leading-tight" style={{ fontSize: 15 }}>{o.t}</div>
                  <div className="mt-0.5 leading-tight" style={{ fontSize: 11, opacity: 0.85 }}>{o.s}</div>
                </div>

                {/* selected check */}
                {selected && (
                  <div className="check-in absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white flex items-center justify-center z-10"
                       style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Icon.Check width="14" height="14" color={o.grad[1]}/>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-10 pt-2">
        <PrimaryButton onClick={onNext} disabled={!sel}>
          {sel ? 'Continue' : 'Pick one to continue'}
        </PrimaryButton>
      </div>
    </div>
  );
};
window.ScreenFocus = ScreenFocus;

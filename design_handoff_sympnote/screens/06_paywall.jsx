/* Screen 06 — Paywall (gamified with streak/reward framing) */
const ScreenPaywall = ({ onNext, onBack }) => {
  const [plan, setPlan] = useState('annual');
  const plans = [
    { id: 'weekly', label: 'Weekly', price: '$4.99', per: '/week', note: '' },
    { id: 'monthly', label: 'Monthly', price: '$9.99', per: '/month', note: '' },
    { id: 'annual', label: 'Annual', price: '$59.99', per: '/year', note: 'Just $4.99/month', badge: 'BEST VALUE · SAVE 50%' },
  ];

  return (
    <div className="screen-in w-full h-full flex flex-col bg-bg-primary">
      <StatusBar />
      <div className="pt-14 px-6 flex items-center justify-between">
        <BackButton onClick={onBack} />
        <span className="t-label text-text-tertiary whitespace-nowrap">9 of 9</span>
        <div className="w-10"/>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 phone-scroll overflow-y-auto">
        <div className="flex items-center justify-center gap-2 fade-up">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap"
               style={{ background: 'linear-gradient(135deg, #F6C06A, #E07A5F)' }}>
            <Icon.Trophy width="12" height="12" color="#fff"/>
            <span className="t-label font-bold text-white">SYMPNOTE PLUS</span>
          </div>
        </div>
        <h1 className="t-h1 text-text-primary text-center mt-5 fade-up" style={{ textWrap: 'balance', animationDelay: '60ms' }}>
          Keep your streak alive
        </h1>
        <p className="t-body text-text-secondary text-center mt-2 fade-up" style={{ animationDelay: '120ms' }}>
          Unlimited recordings + AI summary before every visit
        </p>

        {/* Progress you've made visual */}
        <div className="mt-5 p-4 rounded-2xl bg-bg-surface border border-border-soft shadow-soft fade-up"
             style={{ animationDelay: '160ms' }}>
          <div className="flex items-baseline justify-between gap-2 mb-2 whitespace-nowrap">
            <span className="t-label text-text-tertiary font-semibold">PROGRESS</span>
            <span className="t-label font-bold text-accent tabular-nums">90 / 100 XP</span>
          </div>
          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: '90%', background: 'linear-gradient(90deg, #3BA79F, #2C6E6B)' }}/>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Icon.Flame width="12" height="12" color="#E07A5F"/>
            <span className="t-caption text-text-secondary">1 more recording unlocks Day 1 of your streak</span>
          </div>
        </div>

        <div className="mt-5 space-y-2 fade-up" style={{ animationDelay: '200ms' }}>
          {[
            { e: '🎙️', t: 'Unlimited voice notes' },
            { e: '✨', t: 'AI summary for every appointment' },
            { e: '🔒', t: 'Private & encrypted' },
            { e: '📤', t: 'Export to your doctor' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{f.e}</span>
              <span className="t-body text-text-primary">{f.t}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 pb-4">
          {plans.map((p, i) => {
            const sel = plan === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`press fade-up relative w-full rounded-2xl p-4 text-left shadow-soft border-2 transition-colors ${sel ? 'border-accent bg-bg-surface' : 'border-border-soft bg-bg-surface'}`}
                style={{ animationDelay: `${240 + i*80}ms` }}
              >
                {p.badge && (
                  <div className="badge-pulse absolute -top-2.5 left-4 t-caption font-bold px-2.5 py-1 rounded-full text-white"
                       style={{ background: 'linear-gradient(90deg, #E07A5F, #F6C06A)' }}>
                    {p.badge}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="t-h3 text-text-primary">{p.label}</div>
                    {p.note && <div className="t-caption text-text-tertiary mt-0.5">{p.note}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="t-h3 text-text-primary">{p.price}</span>
                      <span className="t-caption text-text-tertiary">{p.per}</span>
                    </div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${sel ? 'bg-accent border-accent' : 'border-border-soft'}`}>
                      {sel && <Icon.Check width="12" height="12" color="#fff"/>}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-10 pt-3 space-y-2">
        <PrimaryButton onClick={onNext}>Start 3-day free trial</PrimaryButton>
        <p className="t-caption text-center text-text-tertiary">Cancel anytime. No charge during trial.</p>
      </div>
    </div>
  );
};
window.ScreenPaywall = ScreenPaywall;

/* Screen 04 — Analyzing (orbital pulse, staged checks) */
const ScreenAnalyzing = ({ onNext, onBack }) => {
  const steps = [
    { t: "Analyzing your needs", e: "🧠" },
    { t: "Building your prep plan", e: "📋" },
    { t: "Personalizing your path", e: "✨" },
  ];
  const [done, setDone] = useState([false, false, false]);
  const [activeText, setActiveText] = useState(0);
  const [ready, setReady] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => { setDone(d => [true, d[1], d[2]]); setActiveText(1); }, 1100));
    timers.push(setTimeout(() => { setDone(d => [d[0], true, d[2]]); setActiveText(2); }, 2300));
    timers.push(setTimeout(() => { setDone(d => [d[0], d[1], true]); }, 3500));
    timers.push(setTimeout(() => { setReady(true); setShowConfetti(true); }, 4000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="screen-in w-full h-full flex flex-col bg-bg-primary relative overflow-hidden">
      <StatusBar />
      <div className="pt-14 px-6 flex items-center">
        <BackButton onClick={onBack} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <Confetti show={showConfetti}/>
        <div className="relative mb-10">
          {/* Outer orbit rings */}
          <div className="absolute inset-0 rounded-full" style={{
            width: 220, height: 220, left: -40, top: -40,
            border: '2px dashed rgba(44,110,107,0.25)',
            animation: 'spin 12s linear infinite'
          }}/>
          <div className="absolute inset-0 rounded-full" style={{
            width: 180, height: 180, left: -20, top: -20,
            border: '2px solid rgba(246,192,106,0.3)',
            animation: 'spin 8s linear infinite reverse'
          }}/>
          <div className="w-[140px] h-[140px] rounded-full orb-pulse"
               style={{ background: 'radial-gradient(circle at 30% 30%, #A8C4C2 0%, #2C6E6B 70%)' }}/>
          <div className="absolute inset-0 flex items-center justify-center">
            {ready ? <Icon.Check width="44" height="44" color="#fff"/> : <Icon.Sparkle width="40" height="40" color="#fff"/>}
          </div>
        </div>

        <div className="h-8 mb-8 relative w-full text-center">
          {ready ? (
            <h2 className="t-h1 text-text-primary fade-up">Your plan is ready! 🎉</h2>
          ) : (
            <h2 key={activeText} className="t-h2 text-text-primary fade-up">{steps[activeText].t}<span className="caret"/></h2>
          )}
        </div>

        <div className="w-full max-w-[300px] space-y-2.5">
          {steps.map((s, i) => (
            <div key={i}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${done[i] ? 'bg-success/8' : 'bg-transparent'}`}
              style={{ opacity: done[i] ? 1 : 0.5 }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done[i] ? 'bg-success' : 'bg-bg-muted'}`}>
                {done[i] ? <div className="check-in"><Icon.Check width="16" height="16" color="#fff"/></div> : <span className="text-base">{s.e}</span>}
              </div>
              <span className={`t-body-lg ${done[i] ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>{s.t}</span>
              {done[i] && <span className="ml-auto t-label font-bold text-success">+10 XP</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10">
        <PrimaryButton onClick={onNext} disabled={!ready}>
          {ready ? "Let's go · +30 XP" : 'Preparing…'}
        </PrimaryButton>
      </div>
    </div>
  );
};
window.ScreenAnalyzing = ScreenAnalyzing;

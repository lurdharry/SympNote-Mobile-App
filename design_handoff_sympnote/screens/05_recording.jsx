/* Screen 05 — First Recording (gamified with XP burst on complete) */
const PROMPTS = [
  "My knee has been hurting when I climb stairs…",
  "I've been getting headaches in the afternoon…",
  "I feel more tired than usual…",
];
const SAMPLE_TRANSCRIPT = "So my right knee has been hurting for about two weeks now. It's worse when I climb stairs, especially in the morning. I'd say it's about a 6 out of 10. No swelling but it feels stiff.";
const STRUCTURED = [
  { k: 'Symptom', v: 'Knee pain', e: '🦵' },
  { k: 'Location', v: 'Right knee', e: '📍' },
  { k: 'Duration', v: '2 weeks', e: '⏳' },
  { k: 'Severity', v: '6/10', e: '📊' },
  { k: 'Triggers', v: 'Climbing stairs, morning', e: '⚡' },
];

const ScreenFirstRecording = ({ onNext, onBack }) => {
  const [phase, setPhase] = useState('idle');
  const [promptIdx, setPromptIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [fieldCount, setFieldCount] = useState(0);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (phase !== 'idle') return;
    const id = setInterval(() => setPromptIdx(i => (i + 1) % PROMPTS.length), 3000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'recording') {
      const t = setTimeout(() => setPhase('processing'), 3000);
      return () => clearTimeout(t);
    }
    if (phase === 'processing') {
      const t = setTimeout(() => setPhase('transcript'), 1600);
      return () => clearTimeout(t);
    }
    if (phase === 'transcript') {
      let i = 0;
      const id = setInterval(() => {
        i++;
        setTranscript(SAMPLE_TRANSCRIPT.slice(0, i));
        if (i >= SAMPLE_TRANSCRIPT.length) {
          clearInterval(id);
          setTimeout(() => setPhase('structured'), 500);
        }
      }, 18);
      return () => clearInterval(id);
    }
    if (phase === 'structured') {
      let n = 0;
      const id = setInterval(() => {
        n++;
        setFieldCount(n);
        if (n >= STRUCTURED.length) {
          clearInterval(id);
          setTimeout(() => setBurst(true), 200);
        }
      }, 220);
      return () => clearInterval(id);
    }
  }, [phase]);

  const recording = phase === 'recording';

  return (
    <div className="screen-in w-full h-full flex flex-col bg-bg-primary relative">
      <StatusBar />
      <div className="pt-14 px-6 flex items-center justify-between">
        <BackButton onClick={onBack} />
        <span className="t-label text-text-tertiary whitespace-nowrap">8 of 9</span>
        <div className="w-10"/>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 phone-scroll overflow-y-auto">
        <h1 className="t-h1 text-text-primary text-center fade-up" style={{ textWrap: 'balance' }}>
          Tell us what's going on
        </h1>
        <p className="t-body text-text-secondary text-center mt-2 fade-up" style={{ animationDelay: '80ms' }}>
          Just talk. We turn it into a clinical summary.
        </p>

        <div className="flex flex-col items-center justify-center py-8 relative">
          <Confetti show={burst}/>
          <div className="relative">
            {!recording && phase === 'idle' && (
              <>
                <div className="absolute inset-0 rounded-full pulse-ring" style={{ background: 'rgba(44,110,107,0.18)' }}/>
                <div className="absolute inset-0 rounded-full pulse-ring-delay" style={{ background: 'rgba(246,192,106,0.22)' }}/>
              </>
            )}
            <button
              onClick={() => phase === 'idle' ? setPhase('recording') : null}
              className={`relative w-[120px] h-[120px] rounded-full flex items-center justify-center press transition-all duration-300`}
              style={{
                background: recording
                  ? 'radial-gradient(circle at 30% 30%, #F5B873 0%, #C97A1E 80%)'
                  : 'radial-gradient(circle at 30% 30%, #4DB8B0 0%, #2C6E6B 80%)',
                boxShadow: recording
                  ? '0 10px 30px rgba(201,122,30,0.4)'
                  : '0 10px 30px rgba(44,110,107,0.35)',
                transform: recording ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              {recording ? <Icon.Stop width="32" height="32" color="#fff"/> : <Icon.Mic width="44" height="44" color="#fff"/>}
            </button>
          </div>

          <div className="h-16 mt-6 w-full flex items-center justify-center px-4">
            {phase === 'idle' && (
              <p key={promptIdx} className="t-body text-text-tertiary text-center fade-up italic" style={{ textWrap: 'balance' }}>
                {PROMPTS[promptIdx]}
              </p>
            )}
            {recording && (
              <div className="flex items-end gap-1 h-10">
                {Array.from({length: 28}).map((_, i) => (
                  <div key={i} className="wave-bar rounded-full"
                       style={{
                         width: 3,
                         height: `${10 + (i*7)%28}px`,
                         background: 'linear-gradient(180deg, #F5B873 0%, #C97A1E 100%)',
                         animationDelay: `${(i*70)%900}ms`,
                         animationDuration: `${0.8 + (i%3)*0.15}s`
                       }}/>
                ))}
              </div>
            )}
            {phase === 'processing' && (
              <div className="w-full max-w-[260px] space-y-2">
                <div className="shimmer h-4 rounded"/>
                <div className="shimmer h-4 rounded w-5/6"/>
                <div className="shimmer h-4 rounded w-4/6"/>
              </div>
            )}
          </div>
        </div>

        {(phase === 'transcript' || phase === 'structured') && (
          <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 shadow-soft fade-up mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon.Mic width="12" height="12" color="#8A9290"/>
              <div className="t-label text-text-tertiary">TRANSCRIPT</div>
            </div>
            <p className="t-body text-text-primary" style={{ textWrap: 'pretty' }}>
              {transcript}{phase==='transcript' && <span className="caret"/>}
            </p>
          </div>
        )}

        {phase === 'structured' && (
          <div className="bg-bg-surface border-2 border-accent rounded-2xl p-4 shadow-soft mb-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10" style={{ background: '#F6C06A' }}/>
            <div className="flex items-center justify-between mb-3 relative">
              <div className="flex items-center gap-1.5">
                <Icon.Sparkle width="14" height="14" color="#2C6E6B"/>
                <div className="t-label text-accent font-bold">AI SUMMARY</div>
              </div>
              {burst && <span className="fade-up t-label font-bold px-2 py-0.5 rounded-full bg-success text-white">+50 XP</span>}
            </div>
            <div className="space-y-2.5 relative">
              {STRUCTURED.slice(0, fieldCount).map((f, i) => (
                <div key={i} className="fade-up flex items-center gap-3 bg-bg-primary/60 rounded-lg px-3 py-2">
                  <span className="text-lg">{f.e}</span>
                  <div className="t-label text-text-tertiary w-16 flex-shrink-0">{f.k}</div>
                  <div className="t-body text-text-primary font-semibold flex-1">{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-2">
        <PrimaryButton onClick={onNext} disabled={phase !== 'structured'}>
          {phase === 'structured' ? 'Amazing · Continue' : phase === 'idle' ? 'Tap mic to begin' : 'Listening…'}
        </PrimaryButton>
      </div>
    </div>
  );
};
window.ScreenFirstRecording = ScreenFirstRecording;

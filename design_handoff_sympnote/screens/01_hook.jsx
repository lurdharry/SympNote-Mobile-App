/* Screen 01 — Hook (gamified, bolder) */
const ScreenHook = ({ onNext }) => {
  const [typed, setTyped] = useState('');
  const full = "Your doctor's visit,\nfinally prepared.";
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="screen-in relative w-full h-full flex flex-col hero-overlay" style={{ background: '#F5F1EA' }}>
      <StatusBar />
      {/* floating badges */}
      <div className="pt-16 px-6 flex items-center justify-between fade-up">
        <div className="flex items-center gap-2">
          <SympnoteMark size={36}/>
          <span className="t-h3 text-accent" style={{ letterSpacing: '-0.01em' }}>Sympnote</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-border-soft shadow-soft">
          <Icon.Star width="10" height="10" color="#F6C06A"/>
          <span className="t-caption font-semibold text-text-primary">4.9 · 48k+</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-6">
        <div className="fade-up mb-6" style={{ animationDelay: '150ms' }}>
          <SympnoteHero size={124}/>
        </div>

        <h1 className="t-display text-center text-text-primary px-2 whitespace-pre-line" style={{ textWrap: 'balance', minHeight: 96 }}>
          {typed}<span className="caret"/>
        </h1>

        <p className="t-body-lg text-text-secondary text-center mt-4 fade-up" style={{ animationDelay: '1200ms' }}>
          Record. Organize. Walk in ready.
        </p>

        {/* Floating highlight chips */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center fade-up" style={{ animationDelay: '1400ms' }}>
          {[
            { ic: <Icon.Bolt width="12" height="12"/>, t: '2-min daily' },
            { ic: <Icon.Heart width="12" height="12"/>, t: 'HIPAA-safe' },
            { ic: <Icon.Sparkle width="12" height="12"/>, t: 'AI summary' },
          ].map((c,i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-surface border border-border-soft shadow-soft t-label text-text-secondary">
              <span className="text-accent">{c.ic}</span>{c.t}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-10 space-y-3 fade-up" style={{ animationDelay: '1600ms' }}>
        <PrimaryButton onClick={onNext}>Get started · Free</PrimaryButton>
        <p className="t-caption text-center text-text-tertiary">Private. Encrypted. Not medical advice.</p>
      </div>
    </div>
  );
};
window.ScreenHook = ScreenHook;

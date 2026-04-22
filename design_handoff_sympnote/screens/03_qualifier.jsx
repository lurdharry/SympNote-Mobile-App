/* Screen 02 — Qualifier (chat-style)
   - Sympnote assistant asks, user answers via chips
   - Answers become user bubbles on the right
   - A "Your plan" card at the top fills in live as they answer
*/

const QUALIFIER_QS = [
  {
    id: 'doctor',
    ask: "First — do you see a doctor regularly?",
    options: [
      { t: 'Yes, often',  v: 'often' },
      { t: 'Sometimes',   v: 'sometimes' },
      { t: 'Rarely',      v: 'rarely' },
    ],
  },
  {
    id: 'pain',
    ask: "What's hardest about doctor visits for you?",
    options: [
      { t: 'Remembering symptoms', v: 'memory' },
      { t: 'Explaining clearly',   v: 'clarity' },
      { t: 'Feeling rushed',       v: 'time' },
      { t: 'Taking notes',         v: 'notes' },
    ],
  },
  {
    id: 'forget',
    ask: "And honestly — how often do you forget something important?",
    options: [
      { t: 'Almost always', v: 'always' },
      { t: 'Often',         v: 'often' },
      { t: 'Sometimes',     v: 'sometimes' },
      { t: 'Rarely',        v: 'rarely' },
    ],
  },
  {
    id: 'next',
    ask: "When's your next appointment? We'll count down and prep you.",
    kind: 'date',
  },
];

/* Plan items unlocked per (question id, answer value) */
const PLAN_UNLOCKS = {
  'doctor:often':     { icon: '📅', title: 'Cross-visit timeline',  sub: 'We connect patterns between visits' },
  'doctor:sometimes': { icon: '📅', title: 'Visit-ready summaries', sub: 'Ready whenever you book next' },
  'doctor:rarely':    { icon: '🌱', title: 'Grow-at-your-pace',     sub: 'Log when it matters, no pressure' },

  'pain:memory':      { icon: '🧠', title: 'Daily memory nudges',   sub: 'Gentle reminders to log small things' },
  'pain:clarity':     { icon: '💬', title: 'Clear summaries',       sub: 'Your words, organized for your doctor' },
  'pain:time':        { icon: '⏱️', title: 'One-page visit brief',  sub: 'Nothing important gets rushed past' },
  'pain:notes':       { icon: '📝', title: 'Automatic note-taking', sub: 'We capture, you focus on the doctor' },

  'forget:always':    { icon: '🎯', title: 'Gentle recall prompts', sub: "We'll jog memory before each visit" },
  'forget:often':     { icon: '🔔', title: 'Pre-visit checklist',   sub: 'Key things to mention, ready to go' },
  'forget:sometimes': { icon: '✨', title: 'Smart highlights',        sub: 'We surface what matters most' },
  'forget:rarely':    { icon: '📚', title: 'Deep visit archive',    sub: 'Searchable history of every visit' },

  'next:scheduled':   { icon: '⏳', title: 'Appointment countdown',  sub: 'Prep builds as your visit approaches' },
  'next:none':        { icon: '📌', title: 'Ready when you book',    sub: "We'll prep the moment you schedule" },
};

const ScreenQualifier = ({ onNext, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({}); // {id: {v, t}}
  const [typing, setTyping] = useState(true);
  const scrollRef = useRef(null);

  // Typing indicator before each question
  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 650);
    return () => clearTimeout(t);
  }, [step]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [step, typing, answers]);

  const cur = QUALIFIER_QS[step];
  const answered = step; // number of completed turns
  const total = QUALIFIER_QS.length;

  const answer = (opt) => {
    setAnswers(a => ({ ...a, [cur.id]: opt }));
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else setTimeout(onNext, 600);
    }, 450);
  };

  /* ----- Plan card (live) ----- */
  const planItems = useMemo(() => {
    const items = [];
    Object.entries(answers).forEach(([qid, a]) => {
      const u = PLAN_UNLOCKS[`${qid}:${a.v}`];
      if (u) items.push(u);
    });
    return items;
  }, [answers]);

  /* ----- Render conversation (only answered turns, not current) ----- */
  const renderHistory = () => {
    const bubbles = [];
    for (let i = 0; i < step; i++) {
      const q = QUALIFIER_QS[i];
      const a = answers[q.id];
      bubbles.push(
        <div key={q.id + '-q'} className="flex items-start gap-2 fade-up">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #3BA79F, #1F504E)' }}>
            <Icon.Sparkle width="12" height="12" color="#F6C06A"/>
          </div>
          <div className="max-w-[82%] bg-bg-surface border border-border-soft rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-soft">
            <p className="t-body text-text-primary leading-snug">{q.ask}</p>
          </div>
        </div>
      );
      if (a) {
        bubbles.push(
          <div key={q.id + '-a'} className="flex justify-end fade-up">
            <div className="max-w-[75%] rounded-2xl rounded-tr-md px-3.5 py-2 shadow-soft"
                 style={{ background: 'linear-gradient(135deg, #2C6E6B, #1F504E)' }}>
              <p className="t-body text-white font-medium">{a.t}</p>
            </div>
          </div>
        );
      }
    }
    return bubbles;
  };

  return (
    <div className="w-full h-full flex flex-col bg-bg-primary relative overflow-hidden">
      <StatusBar />

      {/* Top bar */}
      <div className="pt-14 px-5 flex items-center gap-3">
        <BackButton onClick={() => step === 0 ? onBack() : setStep(step - 1)} />
        <div className="flex-1 flex gap-1">
          {QUALIFIER_QS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#EBE5DA' }}>
              <div className="h-full transition-all duration-500"
                   style={{ width: i < step ? '100%' : i === step ? '50%' : '0%',
                            background: 'linear-gradient(90deg, #3BA79F, #2C6E6B)' }}/>
            </div>
          ))}
        </div>
        <span className="t-label text-text-tertiary whitespace-nowrap tabular-nums">{Math.min(step+1, total)}/{total}</span>
      </div>

      {/* Live plan card */}
      <div className="px-5 mt-3">
        <div className="rounded-2xl border border-border-soft shadow-soft overflow-hidden"
             style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFBF6 100%)' }}>
          <div className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #2C6E6B, #1F504E)' }}>
              <Icon.Sparkle width="10" height="10" color="#F6C06A"/>
            </div>
            <span className="t-caption font-bold text-accent tracking-wider">YOUR SYMPNOTE PLAN</span>
            <span className="ml-auto t-caption text-text-tertiary tabular-nums">
              {planItems.length}/{total}
            </span>
          </div>

          <div className="px-3.5 pb-3 min-h-[60px]">
            {planItems.length === 0 ? (
              <p className="t-caption text-text-tertiary italic">
                Tell me a bit about you — I'll build this as we go.
              </p>
            ) : (
              <div className="space-y-1.5">
                {planItems.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 fade-up" style={{ animationDelay: `${i*60}ms` }}>
                    <span className="text-base leading-none mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="t-label font-semibold text-text-primary leading-tight">{p.title}</div>
                      <div className="t-caption text-text-tertiary leading-tight">{p.sub}</div>
                    </div>
                    <Icon.Check width="12" height="12" color="#5A8F6E" style={{ marginTop: 4, flexShrink: 0 }}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversation feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto phone-scroll px-5 pt-4 space-y-3">
        {renderHistory()}

        {/* Current question */}
        {typing ? (
          <div className="flex items-start gap-2 fade-up">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3BA79F, #1F504E)' }}>
              <Icon.Sparkle width="12" height="12" color="#F6C06A"/>
            </div>
            <div className="bg-bg-surface border border-border-soft rounded-2xl rounded-tl-md px-3.5 py-3 shadow-soft flex items-center gap-1.5">
              <span className="typing-dot"/>
              <span className="typing-dot" style={{ animationDelay: '160ms' }}/>
              <span className="typing-dot" style={{ animationDelay: '320ms' }}/>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 fade-up">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3BA79F, #1F504E)' }}>
              <Icon.Sparkle width="12" height="12" color="#F6C06A"/>
            </div>
            <div className="max-w-[82%] bg-bg-surface border border-border-soft rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-soft">
              <p className="t-body text-text-primary leading-snug">{cur.ask}</p>
            </div>
          </div>
        )}

        <div style={{ height: 8 }}/>
      </div>

      {/* Answer tray */}
      <div className="px-5 pt-2 pb-6 border-t border-border-soft/60 bg-bg-primary">
        {cur.kind === 'date' ? (
          <div className="space-y-2 fade-up">
            <div className="rounded-xl border border-border-soft bg-bg-surface p-3 shadow-soft flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Icon.Calendar width="18" height="18"/>
              </div>
              <div className="flex-1">
                <div className="t-label text-text-tertiary">Appointment date</div>
                <div className="t-h3 text-text-primary">Nov 28, 2026</div>
              </div>
              <div className="text-right">
                <div className="t-caption text-text-tertiary">in</div>
                <div className="t-h3 text-accent">7 days</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => answer({ t: 'Not scheduled yet', v: 'none' })}
                className="press flex-1 h-11 rounded-full bg-bg-muted text-text-primary font-semibold t-label hover:bg-[#DFD7C6]">
                Not scheduled
              </button>
              <button onClick={() => answer({ t: 'Nov 28, 2026', v: 'scheduled' })}
                className="press flex-[2] h-11 rounded-full text-white font-semibold t-body"
                style={{ background: 'linear-gradient(135deg, #3BA79F, #2C6E6B)',
                         boxShadow: '0 6px 16px rgba(44,110,107,0.3)' }}>
                Use this date →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 fade-up">
            {cur.options.map((opt, i) => (
              <button key={opt.v}
                onClick={() => answer(opt)}
                disabled={typing}
                className="press t-label font-semibold rounded-full px-4 py-2.5 bg-bg-surface border border-border-soft text-text-primary hover:border-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-40"
                style={{ animationDelay: `${i*60}ms` }}>
                {opt.t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dots styles */}
      <style>{`
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #8A9290; display: inline-block;
          animation: typingBounce 1.1s infinite ease-in-out;
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
window.ScreenQualifier = ScreenQualifier;

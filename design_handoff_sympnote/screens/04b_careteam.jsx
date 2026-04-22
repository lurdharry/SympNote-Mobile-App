/* Screen — Care Team (optional, populates Prep) */
const ScreenCareTeam = ({ onNext, onBack }) => {
  const [members, setMembers] = useState([
    { id: 1, name: 'Dr. Chen', role: 'Rheumatology', color: '#2C6E6B' },
  ]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const add = () => {
    if (!name.trim()) return;
    setMembers(m => [...m, { id: Date.now(), name: name.trim(), role: role.trim() || 'Clinician', color: '#E07A5F' }]);
    setName(''); setRole(''); setAdding(false);
  };

  return (
    <div className="screen-in w-full h-full flex flex-col bg-bg-primary">
      <StatusBar />
      <div className="pt-14 px-6 flex items-center justify-between">
        <BackButton onClick={onBack} />
        <span className="t-label text-text-tertiary whitespace-nowrap">7 of 9</span>
        <button onClick={onNext} className="press t-label font-semibold text-accent">Skip</button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 phone-scroll overflow-y-auto">
        <h1 className="t-h1 text-text-primary fade-up" style={{ textWrap: 'balance' }}>
          Who's on your care team?
        </h1>
        <p className="t-body text-text-secondary mt-2 fade-up" style={{ animationDelay: '80ms' }}>
          Optional. Adding clinicians lets us tag entries and build summaries by doctor.
        </p>

        <div className="mt-5 space-y-2">
          {members.map((m, i) => (
            <div key={m.id} className="fade-up bg-bg-surface border border-border-soft rounded-2xl p-4 shadow-soft flex items-center gap-3"
                 style={{ animationDelay: `${i*80}ms` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                   style={{ background: m.color }}>
                {m.name.replace(/^Dr\.?\s*/, '')[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="t-h3 text-text-primary truncate">{m.name}</div>
                <div className="t-caption text-text-tertiary">{m.role}</div>
              </div>
              <button onClick={() => setMembers(ms => ms.filter(x => x.id !== m.id))}
                      className="press t-label text-text-tertiary hover:text-coral">Remove</button>
            </div>
          ))}

          {adding ? (
            <div className="fade-up bg-bg-surface border-2 border-accent rounded-2xl p-4 shadow-soft space-y-2">
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Doctor name (e.g. Dr. Patel)"
                     className="w-full bg-bg-primary border border-border-soft rounded-xl px-3 h-11 t-body outline-none focus:border-accent"/>
              <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Specialty (e.g. Primary care)"
                     className="w-full bg-bg-primary border border-border-soft rounded-xl px-3 h-11 t-body outline-none focus:border-accent"/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAdding(false); setName(''); setRole(''); }}
                        className="press flex-1 h-10 rounded-full bg-bg-muted t-label font-semibold text-text-primary">Cancel</button>
                <button onClick={add} disabled={!name.trim()}
                        className="press flex-1 h-10 rounded-full bg-accent text-white t-label font-semibold disabled:opacity-40">Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="press w-full rounded-2xl border-2 border-dashed border-border-soft p-4 flex items-center justify-center gap-2 text-text-secondary hover:border-accent hover:text-accent">
              <Icon.Plus width="16" height="16"/>
              <span className="t-body font-semibold">Add clinician</span>
            </button>
          )}
        </div>

        <p className="t-caption text-text-tertiary text-center mt-4">
          We never contact your clinicians. This is just for your records.
        </p>
      </div>

      <div className="px-6 pb-10 pt-2">
        <PrimaryButton onClick={onNext}>{members.length > 0 ? 'Continue' : 'Skip for now'}</PrimaryButton>
      </div>
    </div>
  );
};
window.ScreenCareTeam = ScreenCareTeam;

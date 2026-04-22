/* Tab 3 — History (redesigned: filter pills, clinical tone, no gamification) */
const HISTORY_ITEMS = [
  { date: 'Today', time: '10:42 AM', dur: '1:24', text: 'Morning knee pain, 6/10, worse on stairs. Stiffness lasted about 30 minutes after waking.', tags: [{t:'knee',c:'#2C6E6B'},{t:'pain',c:'#E07A5F'}] },
  { date: 'Today', time: '08:15 AM', dur: '0:48', text: 'Afternoon fatigue returning, slept 6h. Feeling drained mid-afternoon again.', tags: [{t:'fatigue',c:'#F6C06A'},{t:'sleep',c:'#5A8F6E'}] },
  { date: 'Yesterday', time: '07:22 PM', dur: '2:10', text: 'Knee pain after walk, noted slight swelling around kneecap. 7/10 after 30min walk.', tags: [{t:'knee',c:'#2C6E6B'},{t:'pain',c:'#E07A5F'}] },
  { date: 'Yesterday', time: '09:20 AM', dur: '0:52', text: 'Ibuprofen 400mg for knee pain. Took with breakfast.', tags: [{t:'meds',c:'#5A8F6E'}] },
  { date: 'Nov 20', time: '09:05 AM', dur: '1:38', text: 'Headache behind eyes, took ibuprofen. Resolved in an hour.', tags: [{t:'headache',c:'#E07A5F'},{t:'meds',c:'#5A8F6E'}] },
  { date: 'Nov 19', time: '06:50 PM', dur: '0:55', text: 'Feeling tired, mild nausea after dinner. Ate late.', tags: [{t:'fatigue',c:'#F6C06A'},{t:'nausea',c:'#D97706'}] },
  { date: 'Nov 18', time: '11:10 AM', dur: '1:12', text: 'Right knee stiff in the morning. Eased after 20 min of movement.', tags: [{t:'knee',c:'#2C6E6B'}] },
];

const ALL_TAGS = [
  { t: 'knee', c: '#2C6E6B' }, { t: 'pain', c: '#E07A5F' }, { t: 'fatigue', c: '#F6C06A' },
  { t: 'sleep', c: '#5A8F6E' }, { t: 'meds', c: '#5A8F6E' }, { t: 'headache', c: '#E07A5F' },
  { t: 'nausea', c: '#D97706' },
];

const TabHistory = () => {
  const [q, setQ] = useState('');
  const [activeTags, setActiveTags] = useState([]);

  const toggleTag = (t) => setActiveTags(a => a.includes(t) ? a.filter(x => x !== t) : [...a, t]);

  const filtered = HISTORY_ITEMS.filter(h => {
    const matchesQ = !q || (h.text + h.tags.map(x=>x.t).join(' ')).toLowerCase().includes(q.toLowerCase());
    const matchesT = activeTags.length === 0 || h.tags.some(tg => activeTags.includes(tg.t));
    return matchesQ && matchesT;
  });

  const groups = filtered.reduce((acc, it) => {
    acc[it.date] = acc[it.date] || [];
    acc[it.date].push(it);
    return acc;
  }, {});

  return (
    <div className="screen-in h-full flex flex-col">
      <StatusBar />
      <div className="pt-14 px-6 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="t-h1 text-text-primary">History</h1>
          <span className="t-label text-text-tertiary">{filtered.length} entries</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-2">
        <div className="flex items-center gap-2 bg-bg-surface border border-border-soft rounded-full px-4 h-11 shadow-soft">
          <Icon.Search width="16" height="16" color="#8A9290"/>
          <input value={q} onChange={e => setQ(e.target.value)}
                 placeholder="Search notes…"
                 className="flex-1 bg-transparent outline-none t-body text-text-primary placeholder:text-text-tertiary"/>
          {q && <button onClick={() => setQ('')} className="press text-text-tertiary"><Icon.X width="14" height="14"/></button>}
        </div>
      </div>

      {/* Tag filter pills */}
      <div className="px-6 pb-3 fade-up">
        <div className="flex gap-1.5 overflow-x-auto phone-scroll -mx-6 px-6 pb-1">
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])}
                    className="press flex-shrink-0 h-8 px-3 rounded-full bg-text-primary text-white t-label font-semibold flex items-center gap-1">
              <Icon.X width="10" height="10"/>Clear
            </button>
          )}
          {ALL_TAGS.map(tg => {
            const active = activeTags.includes(tg.t);
            return (
              <button key={tg.t} onClick={() => toggleTag(tg.t)}
                className="press flex-shrink-0 h-8 px-3 rounded-full t-label font-semibold border whitespace-nowrap"
                style={{
                  background: active ? tg.c : tg.c + '14',
                  borderColor: active ? tg.c : tg.c + '33',
                  color: active ? '#fff' : tg.c,
                }}>
                #{tg.t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="phone-scroll overflow-y-auto flex-1 pb-28">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date} className="mb-2">
            <div className="px-6 pt-3 pb-2 t-label text-text-tertiary uppercase tracking-wide font-semibold flex items-center justify-between">
              <span>{date}</span>
              <span className="text-text-tertiary">{items.length}</span>
            </div>
            <div className="bg-bg-surface mx-6 rounded-2xl border border-border-soft shadow-soft overflow-hidden">
              {items.map((it, i) => (
                <div key={i} className={`px-4 py-3.5 ${i > 0 ? 'border-t border-border-soft' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 t-label text-text-tertiary whitespace-nowrap">
                      <Icon.Mic width="10" height="10"/>
                      <span>{it.time}</span>
                      <span>·</span>
                      <span>{it.dur}</span>
                    </div>
                    <div className="flex gap-1">
                      {it.tags.map(tg => <TagChip key={tg.t} t={tg.t} color={tg.c}/>)}
                    </div>
                  </div>
                  <p className="t-body text-text-primary leading-snug" style={{ textWrap: 'pretty' }}>{it.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-6 pt-12 text-center">
            <div className="inline-flex w-14 h-14 rounded-full bg-bg-muted items-center justify-center mb-3">
              <Icon.Search width="22" height="22" color="#8A9290"/>
            </div>
            <p className="t-body text-text-primary font-semibold">No matches</p>
            <p className="t-caption text-text-tertiary mt-1">Try a different tag or search term</p>
          </div>
        )}
      </div>
    </div>
  );
};
window.TabHistory = TabHistory;

/* Settings screen (modal overlay from Home avatar) */

const SETTINGS_SECTIONS = [
  {
    title: 'Profile',
    items: [
      { icon: 'User', label: 'Personal info', value: 'Maya Rivera' },
      { icon: 'Users', label: 'Care team', value: '3 clinicians' },
      { icon: 'Heart', label: 'Focus area', value: 'Chronic condition' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'Bell', label: 'Notifications', value: 'On · Morning 9am' },
      { icon: 'Accessibility', label: 'Accessibility', value: 'Default' },
      { icon: 'Mic', label: 'Voice-only mode', toggle: false },
    ],
  },
  {
    title: 'Privacy & data',
    items: [
      { icon: 'Lock', label: 'Privacy settings', value: 'On-device only' },
      { icon: 'Download', label: 'Export all data', value: 'JSON · PDF' },
      { icon: 'Info', label: 'Medical disclaimer' },
    ],
  },
  {
    title: 'Subscription',
    items: [
      { icon: 'Sparkle', label: 'Sympnote Plus', value: 'Annual · Renews Nov 2027', badge: 'PLUS' },
    ],
  },
];

const ScreenSettings = ({ onClose }) => {
  const [voiceOnly, setVoiceOnly] = useState(false);
  return (
    <div className="screen-in absolute inset-0 bg-bg-primary z-40 flex flex-col">
      <StatusBar />

      {/* Header */}
      <div className="pt-14 px-6 pb-3 flex items-center justify-between">
        <h1 className="t-h1 text-text-primary">Settings</h1>
        <button onClick={onClose} className="press w-10 h-10 rounded-full flex items-center justify-center bg-bg-muted">
          <Icon.X width="18" height="18"/>
        </button>
      </div>

      <div className="phone-scroll overflow-y-auto flex-1 pb-10">
        {/* Profile header */}
        <div className="px-6 pb-4">
          <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #2C6E6B, #1F504E)' }}>
              <span className="t-h2 font-bold text-white">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="t-h3 text-text-primary">Maya Rivera</div>
              <div className="t-caption text-text-tertiary">maya@example.com</div>
              <div className="mt-1.5 flex items-center gap-2">
                <StreakPill days={5}/>
                <span className="t-caption text-text-tertiary whitespace-nowrap">5-day streak</span>
              </div>
            </div>
            <button className="press p-2 text-text-tertiary hover:text-text-primary">
              <Icon.Edit width="16" height="16"/>
            </button>
          </div>
        </div>

        {SETTINGS_SECTIONS.map((section, si) => (
          <div key={si} className="mb-5">
            <div className="px-6 pb-2 t-label text-text-tertiary font-semibold uppercase tracking-wide">{section.title}</div>
            <div className="bg-bg-surface mx-6 rounded-2xl border border-border-soft shadow-soft overflow-hidden">
              {section.items.map((item, ii) => {
                const IconC = Icon[item.icon] || Icon.Dot;
                const isToggle = item.toggle !== undefined;
                const toggleVal = item.label === 'Voice-only mode' ? voiceOnly : item.toggle;
                return (
                  <button key={ii}
                    onClick={() => item.label === 'Voice-only mode' && setVoiceOnly(v => !v)}
                    className={`press w-full text-left px-4 py-3 flex items-center gap-3 ${ii > 0 ? 'border-t border-border-soft' : ''} hover:bg-bg-muted/50`}>
                    <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <IconC width="18" height="18"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="t-body font-medium text-text-primary">{item.label}</span>
                        {item.badge && (
                          <span className="t-caption font-bold px-1.5 py-0.5 rounded text-white"
                                style={{ background: 'linear-gradient(90deg, #E07A5F, #F6C06A)' }}>{item.badge}</span>
                        )}
                      </div>
                      {item.value && <div className="t-caption text-text-tertiary truncate">{item.value}</div>}
                    </div>
                    {isToggle ? (
                      <div className="w-10 h-6 rounded-full flex items-center p-0.5 transition-colors flex-shrink-0"
                           style={{ background: toggleVal ? '#2C6E6B' : '#D3C9B5' }}>
                        <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                             style={{ transform: toggleVal ? 'translateX(16px)' : 'translateX(0)' }}/>
                      </div>
                    ) : (
                      <Icon.ChevronRight width="16" height="16" color="#8A9290"/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Achievements / gamification moved here */}
        <div className="mb-5">
          <div className="px-6 pb-2 t-label text-text-tertiary font-semibold uppercase tracking-wide">Milestones</div>
          <div className="mx-6 bg-bg-surface rounded-2xl border border-border-soft shadow-soft p-4">
            <div className="flex items-center gap-3 mb-3">
              <ProgressRing value={68} size={48} stroke={4} color="#2C6E6B" track="#EBE5DA">
                <div className="t-caption font-bold text-accent">LV 3</div>
              </ProgressRing>
              <div className="flex-1">
                <div className="t-body font-semibold text-text-primary">Health Historian</div>
                <div className="t-caption text-text-tertiary">340 / 500 XP to Level 4</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { e: '🎙️', n: 'First note', u: true },
                { e: '🔥', n: '5-day', u: true },
                { e: '📋', n: 'Prep pro', u: true },
                { e: '💯', n: '30 notes', u: false },
              ].map((b, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl mb-0.5" style={{ filter: b.u ? 'none' : 'grayscale(1) opacity(0.4)' }}>{b.e}</div>
                  <div className="t-caption text-text-tertiary leading-tight">{b.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="px-6">
          <button className="press w-full h-12 rounded-full bg-bg-surface border border-border-soft t-label font-semibold text-coral flex items-center justify-center gap-2">
            <Icon.LogOut width="16" height="16"/> Sign out
          </button>
          <p className="t-caption text-text-tertiary text-center mt-3">Sympnote v1.0.2</p>
        </div>
      </div>
    </div>
  );
};
window.ScreenSettings = ScreenSettings;

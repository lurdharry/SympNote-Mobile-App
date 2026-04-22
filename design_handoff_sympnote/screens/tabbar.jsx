/* Tab bar — 4 tabs: Home / Prep / Insights / History */
const TabBar = ({ tab, setTab }) => (
  <div className="absolute bottom-0 left-0 right-0 bg-bg-surface/95 backdrop-blur-md border-t border-border-soft z-30" style={{ paddingBottom: 18 }}>
    <div className="flex">
      {[
        { id: 'home', label: 'Home', Ico: Icon.Home },
        { id: 'prep', label: 'Prep', Ico: Icon.Clipboard },
        { id: 'insights', label: 'Insights', Ico: Icon.ChartLine },
        { id: 'history', label: 'History', Ico: Icon.History },
      ].map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)}
                  className="press flex-1 pt-2 pb-1 flex flex-col items-center gap-0.5 relative">
            {active && <div className="absolute top-0 h-0.5 w-10 bg-accent rounded-full"/>}
            <t.Ico width="22" height="22" color={active ? '#2C6E6B' : '#8A9290'}/>
            <span className="t-caption" style={{ color: active ? '#2C6E6B' : '#8A9290', fontWeight: active ? 600 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);
window.TabBar = TabBar;

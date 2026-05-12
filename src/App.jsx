import React from 'react';
import { TERMINALS } from './data/agents';
import { useLive } from './hooks/useLive';
import { Icon } from './components/Icons';
import { Home, ActivityRail } from './components/Home';
import { AgentProfile } from './components/AgentProfile';
import { MyWork, ActivityPage, TaskDrawer } from './components/Work';

export default function App() {
  const [view, setView] = React.useState('home');
  const [agentId, setAgentId] = React.useState(null);
  const [terminal, setTerminal] = React.useState('all');
  const [timeWindow, setTimeWindow] = React.useState('today');
  const [taskId, setTaskId] = React.useState(null);
  const [workTab, setWorkTab] = React.useState('all');

  const live = useLive(terminal, timeWindow);

  const navTabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'work', label: 'My Work', icon: 'inbox', count: live.hitlCount },
    { id: 'activity', label: 'Activity', icon: 'pulse' },
  ];

  const goAgent = (id) => { setAgentId(id); setView('agent'); window.scrollTo(0, 0); };
  const goHome = () => { setView('home'); setAgentId(null); };
  const goView = (v, tab) => {
    setView(v);
    if (v !== 'agent') setAgentId(null);
    if (v === 'work' && tab) setWorkTab(tab);
  };

  const showRail = view === 'home' || view === 'agent';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <img src="/carrix-logo.png" alt="Carrix" className="topbar-brand-logo" />
            <span className="topbar-brand-text">Carrix</span>
            <span className="topbar-brand-sub">AgentFleet</span>
          </div>
          <div className="topbar-divider"></div>
          <nav className="nav-tabs">
            {navTabs.map(t => (
              <button
                key={t.id}
                className={`nav-tab ${view === t.id || (view === 'agent' && t.id === 'home') ? 'active' : ''}`}
                onClick={() => goView(t.id)}
              >
                <Icon name={t.icon} size={14} />
                <span>{t.label}</span>
                {t.count > 0 && <span className="count">{t.count}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" title="Search"><Icon name="search" size={15} /></button>
          <button className="topbar-icon-btn" title="Notifications"><Icon name="bell" size={15} /></button>
          <button className="topbar-icon-btn" title="Settings"><Icon name="gear" size={15} /></button>
          <div className="topbar-avatar" title="Maya Chen, Operations Lead">MC</div>
        </div>
      </header>

      {(view === 'home' || view === 'work' || view === 'activity') && (
        <div className="control-bar">
          <div className="control-bar-left">
            <div>
              <div className="control-bar-title">
                {view === 'home' && 'Operations Pulse'}
                {view === 'work' && 'My Work'}
                {view === 'activity' && 'Live Activity'}
              </div>
              <div className="control-bar-sub">
                {view === 'home' && 'Real-time view of agents, inquiries and SLA across terminals'}
                {view === 'work' && 'Tasks waiting on you and recent agent runs'}
                {view === 'activity' && 'Every event your agents emit'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="terminal-filter">
              {TERMINALS.map(t => (
                <button key={t.id} className={`terminal-chip ${terminal === t.id ? 'active' : ''}`} onClick={() => setTerminal(t.id)}>
                  <span>{t.name}</span>
                  <span className="code">{t.short}</span>
                </button>
              ))}
            </div>
            {view === 'home' && (
              <div className="time-toggle">
                {['today', '7d', '30d'].map(w => (
                  <button key={w} className={`time-toggle-btn ${timeWindow === w ? 'active' : ''}`} onClick={() => setTimeWindow(w)}>
                    {w === 'today' ? 'Today' : w === '7d' ? '7 days' : '30 days'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`app-body ${showRail ? '' : 'no-rail'}`}>
        <main className="main-content">
          {view === 'home' && (
            <Home
              terminal={terminal}
              window={timeWindow}
              theme="theme-default"
              onAgent={goAgent}
              onView={goView}
              kpis={live.kpis}
              agents={live.agents}
              hitlCount={live.hitlCount}
              urgentCount={live.urgentCount}
              oldestHitl={live.oldestHitl}
            />
          )}
          {view === 'agent' && (
            <AgentProfile agentId={agentId} terminal={terminal} onBack={goHome} onOpenWork={() => goView('work', 'hitl')} onOpenTask={setTaskId} />
          )}
          {view === 'work' && <MyWork terminal={terminal} onOpenTask={setTaskId} initialTab={workTab} />}
          {view === 'activity' && <ActivityPage terminal={terminal} events={live.events} />}
        </main>
        {showRail && <ActivityRail events={live.events} terminal={terminal} />}
      </div>

      <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} />
    </div>
  );
}

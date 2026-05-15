import React from 'react';
import { TERMINALS, AGENTS } from '../data/agents';
import { HITL_ITEMS } from '../data/tasks';
import { Icon } from './Icons';
import { fmtNum, Sparkline } from './Primitives';

export function Home({ terminal, window: timeWindow, theme, onAgent, onView, kpis, agents, hitlCount, urgentCount, oldestHitl }) {
  const windowLabel = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days' }[timeWindow];
  const termLabel = TERMINALS.find(t => t.id === terminal).name;

  // Tiny "Xs ago" indicator so the live refresh is visible to users (and testable).
  const [, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sinceTick = kpis._lastTickAt ? Math.max(0, Math.floor((Date.now() - kpis._lastTickAt) / 1000)) : 0;

  return (
    <div className="home-view" data-testid="home-view">
      <div className={`headline ${theme}`}>
        <div className="headline-header">
          <div>
            <div className="headline-title">Operations Pulse · Customer Support</div>
            <div className="headline-subtitle">{termLabel.toUpperCase()} · {windowLabel.toUpperCase()} · LIVE</div>
          </div>
          <div className="headline-pulse">
            <span className="headline-pulse-dot"></span>
            <span>{agents.length} agents live · {hitlCount} HITL open</span>
            <span style={{ opacity: 0.6, marginLeft: 8 }} data-testid="last-tick">· updated {sinceTick}s ago</span>
          </div>
        </div>
        <div className="headline-grid">
          <div className="headline-cell hero">
            <div className="headline-label">Customer Inquiries Handled</div>
            <div className={`headline-value hero ${kpis._bumped ? 'bumped' : ''}`} data-testid="kpi-handled">{fmtNum(kpis.handled)}</div>
            <div className="headline-sub">
              <span className="up">▲ 9.4%</span>
              <span style={{ opacity: 0.5 }}>vs prior period</span>
            </div>
            <div className="headline-mini">
              <span className="headline-mini-item"><span className="dot" style={{ background: '#34D399' }}></span>Email <span data-testid="kpi-email">{fmtNum(kpis.email)}</span></span>
              <span className="headline-mini-item"><span className="dot" style={{ background: '#FCD34D' }}></span>Phone <span data-testid="kpi-phone">{fmtNum(kpis.phone)}</span></span>
            </div>
          </div>

          <div className="headline-cell">
            <div className="headline-label">Auto-Resolution Rate</div>
            <div className="headline-value" data-testid="kpi-autoAvg">{kpis.autoAvg}<span style={{ fontSize: 22, marginLeft: 2, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>%</span></div>
            <div className="headline-sub"><span className="up">▲ 3.6 pts</span></div>
          </div>

          <div className="headline-cell">
            <div className="headline-label">FTE Hours Saved</div>
            <div className="headline-value" data-testid="kpi-fteHours">{fmtNum(parseInt(kpis.fteHours))}<span style={{ fontSize: 18, marginLeft: 4, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>h</span></div>
            <div className="headline-sub" style={{ fontSize: 10 }}>~{Math.round(parseInt(kpis.fteHours) / 8)} FTE-days</div>
          </div>

          <div className="headline-cell">
            <div className="headline-label">Avg Handle Time</div>
            <div className="headline-value" data-testid="kpi-ahtAvg">{kpis.ahtAvg}<span style={{ fontSize: 18, marginLeft: 4, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>min</span></div>
            <div className="headline-sub"><span className="up">▼ 8.7%</span></div>
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className={`kpi-card ${kpis.slaBreaches ? 'alert' : ''}`} onClick={() => onView('work')}>
          <div className="kpi-label">SLA Breaches <span className="pill" style={{ background: 'rgba(220,38,38,0.10)', color: '#DC2626' }}>NOW</span></div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#DC2626' }} data-testid="kpi-slaBreaches">{kpis.slaBreaches}</span>
          </div>
          <div className="kpi-sub">2 gate · 1 customs · oldest 1h 42m</div>
        </div>
        <div className="kpi-card warning" onClick={() => onView('work')}>
          <div className="kpi-label">HITL Pending</div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: '#D97706' }} data-testid="kpi-hitlOpen">{kpis.hitlOpen}</span>
          </div>
          <div className="kpi-sub">{urgentCount} urgent · oldest {oldestHitl}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Containers Touched</div>
          <div className="kpi-value-row">
            <span className="kpi-value" data-testid="kpi-containers">{fmtNum(kpis.containers)}</span>
          </div>
          <div className="kpi-sub"><span className="up">▲ 6.1%</span> 62% of inquiries</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Demurrage $ Explained</div>
          <div className="kpi-value-row">
            <span className="kpi-value" data-testid="kpi-demExplained">${fmtNum(kpis.demExplained)}</span>
          </div>
          <div className="kpi-sub">$1.2M auto · $645k disputes</div>
        </div>
      </div>

      {hitlCount > 0 && (
        <div className="hitl-banner" onClick={() => onView('work', 'hitl')}>
          <div className="hitl-banner-icon"><Icon name="warn" size={16} /></div>
          <div className="hitl-banner-text">
            <div><strong>{hitlCount}</strong> task{hitlCount === 1 ? '' : 's'} awaiting your approval</div>
            <div className="hitl-banner-meta">{urgentCount} urgent · oldest {oldestHitl} · across {new Set(HITL_ITEMS.map(h => h.agentId)).size} agents</div>
          </div>
          <div className="hitl-banner-cta">Review now <Icon name="arrow-right" size={12} /></div>
        </div>
      )}

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <Icon name="bot" size={14} /> Agent Fleet
            <span className="section-badge">{agents.length} live</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Click an agent to open profile</div>
        </div>
        <div className="section-body">
          <div className="agents-grid">
            {agents.map(a => {
              const handled = a.liveHandled ?? a.metrics[0].value;
              const auto = a.liveAuto ?? a.metrics[1].value;
              const aht = a.liveAht ?? a.metrics[2].value;
              const hc = HITL_ITEMS.filter(h => h.agentId === a.id).length;
              return (
                <div key={a.id} className="agent-card" onClick={() => onAgent(a.id)} data-testid={`agent-card-${a.id}`}>
                  <div className="agent-card-accent" style={{ background: a.color }}></div>
                  <div className="agent-card-head">
                    <div className="agent-card-icon" style={{ background: `${a.color}1A`, color: a.color }}><Icon name={a.icon} size={18} /></div>
                    <div className="agent-card-status"><span className="dot"></span>Live</div>
                  </div>
                  <div className="agent-card-name">{a.name}</div>
                  <div className="agent-card-sub">{a.subtitle}</div>
                  <Sparkline data={a.metrics[0].spark} color={a.color} height={22} />
                  <div className="agent-card-metrics">
                    <div>
                      <div className="agent-card-metric-label">Handled</div>
                      <div className="agent-card-metric-value" data-testid={`agent-${a.id}-handled`}>{fmtNum(handled)}</div>
                    </div>
                    <div>
                      <div className="agent-card-metric-label">Auto-rate</div>
                      <div className="agent-card-metric-value" data-testid={`agent-${a.id}-auto`}>{auto}<span className="agent-card-metric-unit">%</span></div>
                    </div>
                    <div>
                      <div className="agent-card-metric-label">AHT</div>
                      <div className="agent-card-metric-value" data-testid={`agent-${a.id}-aht`}>{aht}<span className="agent-card-metric-unit">m</span></div>
                    </div>
                  </div>
                  <div className="agent-card-foot">
                    <span>{a.channels.slice(0, 3).join(' · ')}</span>
                    {hc > 0 && <span className="agent-card-hitl" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="warn" size={11} />{hc} HITL</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityRail({ events, terminal }) {
  const filtered = terminal === 'all' ? events : events.filter(e => e.terminal === terminal);
  return (
    <aside className="activity-rail">
      <div className="activity-rail-head">
        <div className="activity-rail-head-left">
          <Icon name="pulse" size={14} />
          <div className="activity-rail-title">Live Activity</div>
        </div>
        <div className="activity-rail-pulse"><span className="dot"></span>Streaming</div>
      </div>
      <div className="activity-rail-body">
        {filtered.map((ev) => {
          const ag = AGENTS.find(a => a.id === ev.agentId);
          const kind = ev.type === 'task_completed' ? 'completed'
            : ev.type === 'hitl_requested' ? 'hitl'
            : ev.type === 'task_started' ? 'started'
            : 'error';
          const iconName = kind === 'completed' ? 'check' : kind === 'hitl' ? 'warn' : kind === 'started' ? 'play' : 'x';
          return (
            <div key={ev.id} className={`activity-row ${ev.fresh ? 'fresh' : ''}`}>
              <div className={`activity-icon ${kind}`}><Icon name={iconName} size={11} /></div>
              <div className="activity-content">
                <div className="activity-meta-row">
                  <span className="activity-agent">{ag?.short || ev.agentId}</span>
                  <span className="activity-term">{ev.terminal.toUpperCase()}</span>
                  <span className="activity-time">{ev.relTime || ''}</span>
                </div>
                <div className="activity-msg">{ev.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

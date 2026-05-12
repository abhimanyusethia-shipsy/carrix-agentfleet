import React from 'react';
import { AGENTS } from '../data/agents';
import { MY_WORK_TASKS, HITL_ITEMS, slaLabel } from '../data/tasks';
import { Icon } from './Icons';
import { fmtNum, Sparkline, PRIORITY_COLOR, StatusBadge } from './Primitives';

function ResolutionDonut({ data, totalHandled }) {
  const total = data.reduce((s, x) => s + x.value, 0);
  const r = 52, c = 80, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 160 160">
        <circle cx={c} cy={c} r={r} fill="none" stroke="#F1F5F9" strokeWidth="22" />
        {data.map((d, i) => {
          const pct = d.value / total;
          const len = pct * circ;
          const dash = `${len} ${circ - len}`;
          const seg = (
            <circle
              key={i}
              cx={c} cy={c} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
              style={{ transition: 'stroke-dasharray 0.4s' }}
            />
          );
          offset += len;
          return seg;
        })}
        <text x={c} y={c - 4} textAnchor="middle" className="donut-center-value">{fmtNum(totalHandled)}</text>
        <text x={c} y={c + 14} textAnchor="middle" className="donut-center-label">Handled</text>
      </svg>
      <div className="donut-legend">
        {data.map(d => {
          const count = Math.round((d.value / total) * totalHandled);
          return (
            <div key={d.label} className="donut-legend-row">
              <span className="donut-legend-swatch" style={{ background: d.color }}></span>
              <span className="donut-legend-label">{d.label}</span>
              <span className="donut-legend-pct">{d.value}%</span>
              <span className="donut-legend-count">{fmtNum(count)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgentProfile({ agentId, terminal, onBack, onOpenWork, onOpenTask }) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return null;

  const tasks = MY_WORK_TASKS.filter(t => t.agentId === agentId && (terminal === 'all' || t.terminal === terminal));
  const hitlForAgent = HITL_ITEMS.filter(h => h.agentId === agentId);
  const urgentForAgent = hitlForAgent.filter(h => {
    const s = slaLabel(h.sla).status;
    return s === 'breach' || s === 'warning';
  }).length;

  return (
    <div className="agent-profile">
      <div className="agent-profile-head">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={onBack}>Home</span>
          <span>›</span>
          <span className="breadcrumb-link" onClick={onBack}>Agent Fleet</span>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.name}</span>
        </div>
        <div className="agent-profile-title-row">
          <div className="agent-profile-title-left">
            <div className="agent-profile-icon" style={{ background: `${a.color}1A`, color: a.color }}><Icon name={a.icon} size={28} /></div>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="agent-profile-name">{a.name}</div>
                <span className="agent-card-status" style={{ background: 'rgba(5,150,105,0.10)', color: '#059669' }}>
                  <span className="dot"></span>Live
                </span>
              </div>
              <div className="agent-profile-sub">{a.subtitle}</div>
              <div className="agent-profile-desc">{a.description}</div>
            </div>
          </div>
          <div className="agent-profile-actions">
            <button className="btn"><Icon name="gear" size={12} /> Configure</button>
            <button className="btn"><Icon name="pause" size={12} /> Pause</button>
            <button className="btn primary">View Logs</button>
          </div>
        </div>
      </div>

      <div className="agent-profile-body">
        {hitlForAgent.length > 0 && (
          <div className="full">
            <div className="hitl-banner" onClick={onOpenWork} style={{ cursor: 'pointer' }}>
              <div className="hitl-banner-icon"><Icon name="warn" size={16} /></div>
              <div className="hitl-banner-text">
                <div><strong>{hitlForAgent.length}</strong> task{hitlForAgent.length === 1 ? '' : 's'} from this agent awaiting your approval</div>
                <div className="hitl-banner-meta">{urgentForAgent} urgent · oldest {slaLabel([...hitlForAgent].sort((x, y) => new Date(x.sla) - new Date(y.sla))[0].sla).text}</div>
              </div>
              <div className="hitl-banner-cta">Review in My Work <Icon name="arrow-right" size={12} /></div>
            </div>
          </div>
        )}

        <div className="full">
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="chart" size={14} /> Key Metrics</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Last 14 days</div>
            </div>
            <div className="section-body">
              <div className="metric-grid">
                {a.metrics.map(m => (
                  <div key={m.id} className="metric-card">
                    <div className="metric-card-label">{m.label}</div>
                    <div className="metric-card-row">
                      <div>
                        <span className="metric-card-value">{fmtNum(m.value, m.format, m.unit)}</span>
                        {m.unit && m.format !== 'percent' && <span className="metric-card-unit">{m.unit}</span>}
                      </div>
                      <span className={`metric-card-trend ${m.trend > 0 ? 'up' : 'down'}`}>
                        {m.trend > 0 ? '▲' : '▼'} {Math.abs(m.trend).toFixed(1)}%
                      </span>
                    </div>
                    <Sparkline data={m.spark} color={a.color} height={28} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="full">
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="flow" size={14} /> Workflow</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{a.triggerType}</div>
            </div>
            <div className="section-body">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.55 }}>{a.triggerDescription}</div>
              <div className="workflow">
                {a.workflow.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className={`workflow-step ${s.kind}`}>
                      <div className="workflow-step-label">{s.label}</div>
                      <div className="workflow-step-sub">{s.sub}</div>
                    </div>
                    {i < a.workflow.length - 1 && <span className="workflow-arrow">→</span>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent-blue)', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }}></span>Auto step</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent-amber)', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }}></span>Decision branch</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent-purple)', borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }}></span>HITL gate</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="trend" size={14} /> Resolution Breakdown</div>
            </div>
            <div className="section-body">
              <ResolutionDonut data={a.resolution} totalHandled={a.metrics[0].value} />
            </div>
          </div>
        </div>

        <div>
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="gear" size={14} /> Configuration</div>
            </div>
            <div className="section-body">
              <div style={{ marginBottom: 12 }}>
                {a.config.map(c => (
                  <div key={c.key} className="kv-row">
                    <div className="kv-key">{c.key}</div>
                    <div className="kv-val">{c.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="message" size={14} /> Sample Inquiries</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Patterns the agent handles</div>
            </div>
            <div className="section-body">
              <div className="examples-list">
                {a.examples.map((e, i) => (
                  <div key={i} className="example-row">{e}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="section-card">
            <div className="section-header">
              <div className="section-title"><Icon name="list" size={14} /> Recent Tasks</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{tasks.length} in last 24h</div>
            </div>
            <div className="section-body tight">
              {tasks.slice(0, 8).map(t => {
                const sla = slaLabel(t.sla);
                return (
                  <div key={t.id} className="quick-item" onClick={() => onOpenTask(t.id)}>
                    <div className="quick-item-priority" style={{ background: PRIORITY_COLOR[t.priority] }}></div>
                    <div className="quick-item-content">
                      <div className="quick-item-title">{t.summary}</div>
                      <div className="quick-item-meta">
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 600 }}>{t.id}</span>
                        <span className="term-tag">{t.terminal.toUpperCase()}</span>
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                    <div className={`quick-item-sla ${sla.status}`}>{sla.text}</div>
                  </div>
                );
              })}
              {tasks.length === 0 && <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>No tasks for this terminal yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

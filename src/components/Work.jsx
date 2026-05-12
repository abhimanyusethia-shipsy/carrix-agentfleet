import React from 'react';
import { AGENTS } from '../data/agents';
import { MY_WORK_TASKS, HITL_ITEMS, slaLabel, fmtTime } from '../data/tasks';
import { Icon } from './Icons';
import { fmtNum, PriorityDot, StatusBadge, PRIORITY_COLOR } from './Primitives';

export function MyWork({ terminal, onOpenTask, initialTab }) {
  const [tab, setTab] = React.useState(initialTab || 'all');
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  let rows = MY_WORK_TASKS;
  if (terminal !== 'all') rows = rows.filter(r => r.terminal === terminal);
  if (tab === 'hitl') rows = rows.filter(r => r.status === 'hitl');
  else if (tab === 'running') rows = rows.filter(r => r.status === 'running');
  else if (tab === 'failed') rows = rows.filter(r => r.status === 'failed');
  else if (tab === 'success') rows = rows.filter(r => r.status === 'success');
  if (search) rows = rows.filter(r => (r.summary + ' ' + r.id).toLowerCase().includes(search.toLowerCase()));

  rows = [...rows].sort((a, b) => {
    if (a.status === 'hitl' && b.status !== 'hitl') return -1;
    if (b.status === 'hitl' && a.status !== 'hitl') return 1;
    return new Date(a.sla) - new Date(b.sla);
  });

  const counts = {
    all: MY_WORK_TASKS.filter(r => terminal === 'all' || r.terminal === terminal).length,
    hitl: MY_WORK_TASKS.filter(r => r.status === 'hitl' && (terminal === 'all' || r.terminal === terminal)).length,
    running: MY_WORK_TASKS.filter(r => r.status === 'running' && (terminal === 'all' || r.terminal === terminal)).length,
    failed: MY_WORK_TASKS.filter(r => r.status === 'failed' && (terminal === 'all' || r.terminal === terminal)).length,
    success: MY_WORK_TASKS.filter(r => r.status === 'success' && (terminal === 'all' || r.terminal === terminal)).length,
  };

  return (
    <div className="work-view">
      <div className="work-tabs">
        <button className={`work-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All Tasks <span className="tab-count">{counts.all}</span></button>
        <button className={`work-tab ${tab === 'hitl' ? 'active' : ''}`} onClick={() => setTab('hitl')}><Icon name="warn" size={12} /> HITL <span className="tab-count">{counts.hitl}</span></button>
        <button className={`work-tab ${tab === 'running' ? 'active' : ''}`} onClick={() => setTab('running')}>Running <span className="tab-count">{counts.running}</span></button>
        <button className={`work-tab ${tab === 'failed' ? 'active' : ''}`} onClick={() => setTab('failed')}>Failed <span className="tab-count">{counts.failed}</span></button>
        <button className={`work-tab ${tab === 'success' ? 'active' : ''}`} onClick={() => setTab('success')}>Completed <span className="tab-count">{counts.success}</span></button>
      </div>

      <div className="work-toolbar">
        <div className="work-search">
          <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex' }}><Icon name="search" size={12} /></span>
          <input placeholder="Search tasks, container, booking…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {rows.length} task{rows.length === 1 ? '' : 's'} · sorted by SLA
        </div>
      </div>

      <div className="task-row-header">
        <div>Task ID</div>
        <div>Summary</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Agent</div>
        <div>Object</div>
        <div>Source</div>
        <div>SLA</div>
      </div>
      <div className="task-table">
        {rows.map(t => {
          const sla = slaLabel(t.sla);
          const ag = AGENTS.find(a => a.id === t.agentId);
          return (
            <div key={t.id} className="task-row" onClick={() => onOpenTask(t.id)}>
              <div className="task-id">{t.id}</div>
              <div className="task-summary">{t.summary}</div>
              <div><StatusBadge status={t.status} /></div>
              <div><PriorityDot priority={t.priority} /></div>
              <div className="task-agent-tag">{ag?.short}</div>
              <div className="task-meta" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="term-tag" style={{ fontFamily: 'var(--font-mono)', padding: '1px 5px', borderRadius: 3, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 9 }}>{t.terminal.toUpperCase()}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.objectId}</span>
              </div>
              <div className="task-source">{t.source}</div>
              <div className={`task-sla ${sla.status}`}>{sla.text}</div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No tasks match your filter.</div>
        )}
      </div>
    </div>
  );
}

export function ActivityPage({ terminal, events }) {
  const items = (terminal === 'all' ? events : events.filter(e => e.terminal === terminal));
  return (
    <div style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <div className="section-card">
        <div className="section-header">
          <div className="section-title"><Icon name="pulse" size={14} /> Live Activity Stream</div>
          <span className="section-badge">{items.length} events</span>
        </div>
        <div className="section-body tight">
          {items.map(ev => {
            const ag = AGENTS.find(a => a.id === ev.agentId);
            const dotKind = ev.type === 'task_completed' ? 'completed'
              : ev.type === 'hitl_requested' ? 'hitl'
              : ev.type === 'task_started' ? 'started'
              : 'error';
            return (
              <div key={ev.id} className={`activity-row ${ev.fresh ? 'fresh' : ''}`}>
                <div className={`activity-icon ${dotKind}`}><Icon name={dotKind === 'completed' ? 'check' : dotKind === 'hitl' ? 'warn' : dotKind === 'started' ? 'play' : 'x'} size={11} /></div>
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
      </div>
    </div>
  );
}

function hitlRecommendation(hitl) {
  if (!hitl) return null;
  const recRow = hitl.context.find(c => /recommend/i.test(c.k));
  const action = recRow ? recRow.v : 'Approve as drafted by agent';
  const seed = (hitl.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const confidence = 78 + (seed % 19);
  const firstSentence = (hitl.summary || '').split(/\.\s+/)[0] + '.';
  return { action, confidence, rationale: firstSentence };
}

export function TaskDrawer({ taskId, onClose }) {
  const t = MY_WORK_TASKS.find(x => x.id === taskId);
  const open = !!t;
  const hitl = t ? HITL_ITEMS.find(h => h.taskId === t.id) : null;
  const ag = t ? AGENTS.find(a => a.id === t.agentId) : null;
  const sla = t ? slaLabel(t.sla) : null;
  const rec = hitlRecommendation(hitl);

  return (
    <React.Fragment>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer ${open ? 'open' : ''}`}>
        {t && (
          <React.Fragment>
            <div className="drawer-head">
              <div className="drawer-head-left">
                <div className="drawer-task-id">{t.id}</div>
                <div className="drawer-title">{t.summary}</div>
                <div className="drawer-meta">
                  <StatusBadge status={t.status} />
                  <PriorityDot priority={t.priority} />
                  <span style={{ color: ag?.color, fontWeight: 600 }}>{ag?.short}</span>
                  <span className="term-tag" style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--bg-elevated)', fontWeight: 600, fontSize: 9 }}>{t.terminal.toUpperCase()}</span>
                  <span>{t.source}</span>
                  <span>started {fmtTime(t.started)}</span>
                  <span className={`task-sla ${sla.status}`}>{sla.text}</span>
                </div>
              </div>
              <button className="drawer-close" onClick={onClose}>✕</button>
            </div>

            <div className="drawer-body">
              {hitl ? (
                <React.Fragment>
                  <div className="drawer-section">
                    <div className="drawer-section-title">AI Summary</div>
                    <div className="drawer-summary">{hitl.summary}</div>
                  </div>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Recommended Action</div>
                    <div className="hitl-card">
                      <div className="hitl-card-head">
                        <div className="hitl-card-head-left">
                          <Icon name="warn" size={12} />
                          <span>Agent suggests</span>
                        </div>
                        <div className="hitl-card-confidence">
                          <span style={{ color: 'var(--text-tertiary)' }}>Confidence</span>{' '}
                          <strong style={{ color: rec.confidence >= 90 ? 'var(--accent-green)' : rec.confidence >= 80 ? 'var(--accent-amber)' : 'var(--accent-blue)' }}>{rec.confidence}%</strong>
                        </div>
                      </div>
                      <div className="hitl-card-body">
                        <div className="hitl-action">{rec.action}</div>
                        <div className="hitl-rationale">
                          <div className="hitl-rationale-label">Why</div>
                          {rec.rationale}
                        </div>
                      </div>
                      <div className="hitl-card-actions">
                        <button className="btn">Reject</button>
                        <button className="btn">Edit</button>
                        <button className="btn primary">Approve</button>
                      </div>
                    </div>
                  </div>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Context</div>
                    {hitl.context.map(c => (
                      <div key={c.k} className="kv-row">
                        <div className="kv-key">{c.k}</div>
                        <div className="kv-val">{c.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Object</div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>{t.objectId}</div>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Summary</div>
                    <div className="drawer-summary">{t.summary}</div>
                  </div>
                  <div className="drawer-section">
                    <div className="drawer-section-title">Details</div>
                    <div className="kv-row"><div className="kv-key">Agent</div><div className="kv-val">{ag?.name}</div></div>
                    <div className="kv-row"><div className="kv-key">Terminal</div><div className="kv-val">{t.terminal.toUpperCase()}</div></div>
                    <div className="kv-row"><div className="kv-key">Object</div><div className="kv-val">{t.objectId}</div></div>
                    <div className="kv-row"><div className="kv-key">Source</div><div className="kv-val">{t.source}</div></div>
                    <div className="kv-row"><div className="kv-key">Started</div><div className="kv-val">{fmtTime(t.started)}</div></div>
                  </div>
                </React.Fragment>
              )}
            </div>

            {hitl && (
              <div className="drawer-actions">
                <button className="btn">Snooze 30m</button>
                <button className="btn">Reassign</button>
                <button className="btn primary"><Icon name="message" size={12} /> Reply to customer</button>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

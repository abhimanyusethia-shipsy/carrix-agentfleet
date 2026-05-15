import React from 'react';
import { AGENTS } from '../data/agents';
import { MY_WORK_TASKS, HITL_ITEMS, slaLabel, fmtTime } from '../data/tasks';
import { Icon } from './Icons';
import { fmtNum, PriorityDot, StatusBadge, PRIORITY_COLOR } from './Primitives';

export function MyWork({ terminal, onOpenTask, initialTab, extraTasks = [] }) {
  const [tab, setTab] = React.useState(initialTab || 'all');
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const allTasks = React.useMemo(() => [...extraTasks, ...MY_WORK_TASKS], [extraTasks]);

  let rows = allTasks;
  if (terminal !== 'all') rows = rows.filter(r => r.terminal === terminal);
  if (tab === 'hitl') rows = rows.filter(r => r.status === 'hitl');
  else if (tab === 'running') rows = rows.filter(r => r.status === 'running');
  else if (tab === 'failed') rows = rows.filter(r => r.status === 'failed');
  else if (tab === 'success') rows = rows.filter(r => r.status === 'success');
  if (search) rows = rows.filter(r => (r.summary + ' ' + r.id).toLowerCase().includes(search.toLowerCase()));

  const extraIds = new Set(extraTasks.map(t => t.id));
  rows = [...rows].sort((a, b) => {
    const aExtra = extraIds.has(a.id);
    const bExtra = extraIds.has(b.id);
    if (aExtra && !bExtra) return -1;
    if (bExtra && !aExtra) return 1;
    if (aExtra && bExtra) return new Date(b.started || 0) - new Date(a.started || 0);
    if (a.status === 'hitl' && b.status !== 'hitl') return -1;
    if (b.status === 'hitl' && a.status !== 'hitl') return 1;
    return new Date(a.sla) - new Date(b.sla);
  });

  const counts = {
    all: allTasks.filter(r => terminal === 'all' || r.terminal === terminal).length,
    hitl: allTasks.filter(r => r.status === 'hitl' && (terminal === 'all' || r.terminal === terminal)).length,
    running: allTasks.filter(r => r.status === 'running' && (terminal === 'all' || r.terminal === terminal)).length,
    failed: allTasks.filter(r => r.status === 'failed' && (terminal === 'all' || r.terminal === terminal)).length,
    success: allTasks.filter(r => r.status === 'success' && (terminal === 'all' || r.terminal === terminal)).length,
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

const RELEASE_CHANNELS = [
  { id: 'sms',   label: 'SMS',   icon: 'message' },
  { id: 'email', label: 'Email', icon: 'message' },
  { id: 'voice', label: 'Voice', icon: 'pulse' },
];

// Canonical Carrix platforms (sourced from the agent configs in data/agents.js).
const CARRIX_PLATFORMS = {
  mainsail:  { name: 'Mainsail',          category: 'TOS',             color: '#0891B2', purpose: 'Terminal Operating System — bookings, discharge, holds, gate events, LFD' },
  spinnaker: { name: 'Spinnaker',         category: 'Yard',            color: '#7C3AED', purpose: 'Yard inventory — row / stack / block positions, peel-pile config' },
  emodal:    { name: 'eModal',            category: 'Customer Portal', color: '#059669', purpose: 'US customer-visible scheduling and gate appointments' },
  citas:     { name: 'CiTAS',             category: 'Customer Portal', color: '#D97706', purpose: 'ZLO customer-visible scheduling (Manzanillo)' },
  forecast:  { name: 'Forecast',          category: 'Reconciliation',  color: '#DB2777', purpose: 'Vessel cutoffs and cross-system reconciliation' },
  traffic:   { name: 'Traffic Control',   category: 'Gate',            color: '#DC2626', purpose: 'Gate transactions, trouble-window data, ERR codes' },
  billing:   { name: 'Billing Integration', category: 'Billing',       color: '#16A34A', purpose: 'Payment posting feed, tariff/demurrage schedule' },
  tideworks: { name: 'Tide Works EDI',    category: 'EDI',             color: '#8B5CF6', purpose: 'External EDI for customs (CBP/USDA), steamship lines and vendor feeds' },
  ivr:       { name: 'Voice IVR',         category: 'Channel',         color: '#64748B', purpose: 'Inbound voice routing and caller ANI capture' },
  nlu:       { name: 'Carrix NLU',        category: 'AI',              color: '#475569', purpose: 'Intent classification and entity extraction' },
  tts:       { name: 'Voice Synthesis',   category: 'AI',              color: '#475569', purpose: 'Text-to-speech response generation' },
  'operator-queue': { name: 'Operator Queue', category: 'Workflow',    color: '#0EA5E9', purpose: 'HITL follow-up queue surfaced in My Work' },
};

function defaultReleaseMessage(vc) {
  const pr = vc.pendingRelease || {};
  const hold = pr.holdCode || 'customs hold';
  const cont = pr.container || vc.objectId || '';
  const slot = pr.slot || 'your scheduled appointment';
  const term = pr.terminal || 'the terminal';
  const yard = pr.yardPosition ? `; container is staged at ${pr.yardPosition}` : '';
  return `Carrix release alert: the ${hold} on container ${cont} has just been lifted. You're cleared for pickup. Your appointment window ${slot} at ${term} is good to go${yard}. Reply STOP to opt out.`;
}

function VoiceCallBody({ vc }) {
  const [notifyState, setNotifyState] = React.useState('idle'); // 'idle' | 'sending' | 'sent'
  const [channel, setChannel] = React.useState('sms');
  const [message, setMessage] = React.useState(() => defaultReleaseMessage(vc));
  const [sentAt, setSentAt] = React.useState(null);
  const [showTranscript, setShowTranscript] = React.useState(false);

  React.useEffect(() => {
    if (notifyState !== 'sending') return;
    const id = setTimeout(() => {
      setNotifyState('sent');
      setSentAt(new Date());
    }, 1500);
    return () => clearTimeout(id);
  }, [notifyState]);

  const destination =
    channel === 'sms'   ? vc.callerPhone :
    channel === 'email' ? (vc.callerEmail || 'caller email on file') :
                          vc.callerPhone;

  return (
    <React.Fragment>
      <div className="drawer-section">
        <div className="drawer-section-title"><Icon name="bot" size={12} /> AI Summary</div>
        <div className="drawer-summary" data-testid="voice-call-summary">{vc.summary}</div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title"><Icon name="message" size={12} /> Call snapshot</div>
        <div className="call-snapshot" data-testid="voice-call-snapshot">
          <div className="call-snapshot-meta">
            <span className="call-snapshot-caller">{vc.caller}</span>
            <span className="call-snapshot-sep">·</span>
            <span className="call-snapshot-mono">{vc.callerPhone}</span>
            <span className="call-snapshot-sep">·</span>
            <span>{vc.duration}</span>
          </div>
          {vc.callRecordingUrl && (
            <audio controls preload="none" src={vc.callRecordingUrl} className="call-snapshot-audio" />
          )}
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title"><Icon name="pulse" size={12} /> How the agent answered</div>

        {vc.sourcePlatforms && vc.sourcePlatforms.length > 0 && (
          <div className="platform-chip-row" data-testid="voice-call-platforms">
            {vc.sourcePlatforms.map(pid => {
              const p = CARRIX_PLATFORMS[pid];
              if (!p) return null;
              return (
                <span
                  key={pid}
                  className="platform-chip-compact"
                  title={p.purpose}
                  style={{ borderColor: `${p.color}40`, color: p.color }}
                >
                  <span className="platform-chip-dot" style={{ background: p.color }} />
                  {p.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="voice-call-steps" data-testid="voice-call-steps">
          {vc.sources.map(s => (
            <div key={s.step} className="voice-call-step">
              <div className="voice-call-step-bullet">{s.step}</div>
              <div className="voice-call-step-body">
                <div className="voice-call-step-head">
                  <span className="voice-call-step-label">{s.label}</span>
                  {s.platforms && s.platforms.map(pid => {
                    const p = CARRIX_PLATFORMS[pid];
                    if (!p) return null;
                    return (
                      <span
                        key={pid}
                        className="voice-call-step-source platform-pill"
                        title={p.purpose}
                        style={{ background: `${p.color}14`, color: p.color }}
                      >
                        {p.name}
                      </span>
                    );
                  })}
                </div>
                <div className="voice-call-step-result">{s.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {vc.transcript && vc.transcript.length > 0 && (
        <div className="drawer-section">
          <button
            className="drawer-section-toggle"
            onClick={() => setShowTranscript(v => !v)}
            data-testid="voice-call-transcript-toggle"
            aria-expanded={showTranscript}
          >
            <span className="drawer-section-title" style={{ marginBottom: 0 }}>
              <Icon name="message" size={12} /> Transcript
              <span className="drawer-section-count">{vc.transcript.length} lines</span>
            </span>
            <span className="drawer-section-chevron">{showTranscript ? '−' : '+'}</span>
          </button>
          {showTranscript && (
            <div className="voice-call-transcript" style={{ marginTop: 10 }}>
              {vc.transcript.map((line, i) => (
                <div key={i} className={`voice-call-line ${line.who}`}>
                  <span className="voice-call-line-who">{line.who === 'agent' ? 'Agent' : 'Caller'}</span>
                  <span className="voice-call-line-text">{line.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="drawer-section">
        <div className="drawer-section-title"><Icon name="warn" size={12} /> Notify release alert</div>
        {vc.pendingRelease && (
          <div className="release-info" data-testid="release-info">
            <div className="release-info-row">
              <span className="release-info-mono">{vc.pendingRelease.container}</span>
              {vc.pendingRelease.vessel && <><span className="release-info-sep">·</span><span>Ex {vc.pendingRelease.vessel}</span></>}
              {vc.pendingRelease.yardPosition && <><span className="release-info-sep">·</span><span>{vc.pendingRelease.yardPosition}</span></>}
              {vc.pendingRelease.terminal && <><span className="release-info-sep">·</span><span>{vc.pendingRelease.terminal}</span></>}
            </div>
            <div className="release-info-row">
              <span className="release-info-tag hold">{vc.pendingRelease.holdCode}</span>
              <span className="release-info-muted">owner {vc.pendingRelease.owner}{vc.pendingRelease.expectedClear ? ` · clears ${vc.pendingRelease.expectedClear}` : ''}</span>
            </div>
            <div className="release-info-row">
              <span className="release-info-tag ok">Pickup</span>
              <span className="release-info-muted">{vc.pendingRelease.slot}</span>
            </div>
          </div>
        )}

        {notifyState !== 'sent' && (
          <div className="voice-notify-panel" data-testid="voice-notify-panel">
            <div className="voice-notify-channels" role="radiogroup" aria-label="Notification channel">
              {RELEASE_CHANNELS.map(c => (
                <button
                  key={c.id}
                  className={`voice-notify-channel ${channel === c.id ? 'active' : ''}`}
                  onClick={() => setChannel(c.id)}
                  disabled={notifyState === 'sending'}
                  data-testid={`voice-notify-channel-${c.id}`}
                  role="radio"
                  aria-checked={channel === c.id}
                >
                  <Icon name={c.icon} size={12} /> {c.label}
                </button>
              ))}
            </div>
            <div className="voice-notify-dest">
              Sending to <strong>{destination}</strong>
            </div>
            <textarea
              className="voice-notify-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              disabled={notifyState === 'sending'}
              data-testid="voice-notify-message"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={() => setMessage(defaultReleaseMessage(vc))}
                disabled={notifyState === 'sending'}
              >
                Reset message
              </button>
              <button
                className="btn primary"
                data-testid="voice-notify-send-btn"
                onClick={() => setNotifyState('sending')}
                disabled={notifyState === 'sending' || !message.trim()}
              >
                <Icon name="warn" size={12} />
                {notifyState === 'sending' ? 'Sending release alert…' : 'Send release alert'}
              </button>
            </div>
          </div>
        )}

        {notifyState === 'sent' && (
          <div className="voice-notify-sent" data-testid="voice-notify-sent">
            <div className="voice-notify-sent-row">
              <span className="voice-callback-dot connected" />
              Release alert sent via <strong>{channel.toUpperCase()}</strong> to <strong>{destination}</strong>
              {sentAt && <span style={{ marginLeft: 6, color: 'var(--text-tertiary)', fontWeight: 500 }}>· {sentAt.toLocaleTimeString()}</span>}
            </div>
            <div className="voice-notify-sent-message">"{message}"</div>
            <button className="btn" onClick={() => { setNotifyState('idle'); setSentAt(null); }}>
              Send another
            </button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

export function TaskDrawer({ taskId, onClose, extraTasks = [] }) {
  const t = extraTasks.find(x => x.id === taskId) || MY_WORK_TASKS.find(x => x.id === taskId);
  const open = !!t;
  const hitl = t ? HITL_ITEMS.find(h => h.taskId === t.id) : null;
  const ag = t ? AGENTS.find(a => a.id === t.agentId) : null;
  const sla = t ? slaLabel(t.sla) : null;
  const rec = hitlRecommendation(hitl);
  const isVoice = !!(t && t.voiceCall);

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
              {isVoice ? (
                <VoiceCallBody vc={t.voiceCall} />
              ) : hitl ? (
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

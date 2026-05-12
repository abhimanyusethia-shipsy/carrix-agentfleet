import React from 'react';
import { AGENTS, buildHeadlineKpis } from '../data/agents';
import { ACTIVITY, HITL_ITEMS, slaLabel } from '../data/tasks';

const NEW_EVENT_TEMPLATES = [
  { agentId: 'appointments', type: 'task_completed', terminal: 't18', message: 'Appointment confirmed — MAEU%CN% Mon 14:00' },
  { agentId: 'yard',         type: 'task_completed', terminal: 'zlo', message: 'Yard position confirmed — Block %YB%' },
  { agentId: 'gate',         type: 'task_started',   terminal: 'slc', message: 'Trouble window assist — driver redirected, %CN%' },
  { agentId: 'billing',      type: 'task_completed', terminal: 't18', message: 'Demurrage breakdown sent — %DAY% days · $%FEE%' },
  { agentId: 'customs',      type: 'task_completed', terminal: 't5',  message: 'CBP hold cleared — release propagated for %CN%' },
  { agentId: 'constraints',  type: 'task_completed', terminal: 'slc', message: 'Cutoff explained — gate-eligibility %DAY% days early' },
  { agentId: 'appointments', type: 'hitl_requested', terminal: 'slc', message: 'Waiver request — driver missed appt (I-90 closure)' },
  { agentId: 'yard',         type: 'task_started',   terminal: 'zlo', message: 'Yard position lookup — %CN%' },
  { agentId: 'billing',      type: 'task_completed', terminal: 'zlo', message: 'Refund posted — %CN% released, fee waived' },
  { agentId: 'gate',         type: 'task_completed', terminal: 't5',  message: 'Hold denial explained — line hold (CMA CGM)' },
  { agentId: 'customs',      type: 'task_started',   terminal: 'slc', message: 'USDA staging — %N% reefers being scheduled' },
  { agentId: 'appointments', type: 'task_completed', terminal: 'zlo', message: 'Slot rebooked — %CN% moved to Tue 08:30' },
  { agentId: 'yard',         type: 'hitl_requested', terminal: 't18', message: 'Yard mismatch — Spinnaker vs driver report (%CN%)' },
  { agentId: 'gate',         type: 'task_completed', terminal: 'slc', message: 'ERR-204 size mismatch resolved — driver rebooked' },
  { agentId: 'billing',      type: 'task_started',   terminal: 't18', message: 'Demurrage dispute opened — outage Mar 12 cited' },
];

const PREFIXES = ['MSCU', 'MAEU', 'TCKU', 'CMAU', 'HMMU', 'PONU', 'EGLV', 'GESU'];
const YARDS    = ['A-12-04', 'B-08-22', 'C-11-17', 'D-05-09', 'E-14-21', 'F-02-06'];

function fillTemplate(msg) {
  return msg
    .replace('%CN%',  PREFIXES[Math.floor(Math.random() * PREFIXES.length)] + (1000000 + Math.floor(Math.random() * 8999999)))
    .replace('%YB%',  YARDS[Math.floor(Math.random() * YARDS.length)])
    .replace('%DAY%', String(2 + Math.floor(Math.random() * 6)))
    .replace('%FEE%', String(180 + Math.floor(Math.random() * 1820)))
    .replace('%N%',   String(2 + Math.floor(Math.random() * 8)));
}

function formatRel(t) {
  const ms = Date.now() - new Date(t).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function useLive(terminal, timeWindow) {
  const initialAgentHandled = React.useMemo(
    () => Object.fromEntries(AGENTS.map(a => [a.id, a.metrics[0].value])),
    []
  );

  const [events, setEvents] = React.useState(() =>
    ACTIVITY.map(e => ({ ...e, fresh: false, relTime: formatRel(e.t) }))
  );
  const [agentHandled, setAgentHandled] = React.useState(initialAgentHandled);
  const [kpiBump, setKpiBump] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => prev.map(e => ({ ...e, fresh: false, relTime: formatRel(e.t) })));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    function schedule() {
      const wait = 9000 + Math.random() * 5000;
      setTimeout(() => {
        if (cancelled) return;
        const tpl = NEW_EVENT_TEMPLATES[Math.floor(Math.random() * NEW_EVENT_TEMPLATES.length)];
        const newEv = {
          id: 'live-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          agentId: tpl.agentId,
          type: tpl.type,
          terminal: tpl.terminal,
          message: fillTemplate(tpl.message),
          t: new Date().toISOString(),
          fresh: true,
          relTime: 'just now',
        };
        setEvents(prev => [newEv, ...prev].slice(0, 80));
        if (tpl.type === 'task_completed' || tpl.type === 'task_started') {
          setAgentHandled(prev => ({ ...prev, [tpl.agentId]: (prev[tpl.agentId] || 0) + 1 }));
          setKpiBump(b => b + 1);
        }
        schedule();
      }, wait);
    }
    schedule();
    return () => { cancelled = true; };
  }, []);

  const kpis = React.useMemo(() => {
    const base = buildHeadlineKpis(terminal, timeWindow);
    let delta = 0;
    Object.entries(agentHandled).forEach(([id, v]) => {
      const base0 = initialAgentHandled[id] || 0;
      delta += Math.max(0, v - base0);
    });
    const tShare = terminal === 'all' ? 1 : 0.25;
    return { ...base, handled: base.handled + Math.round(delta * tShare), _bumped: kpiBump > 0 && (kpiBump % 1 === 0) };
  }, [terminal, timeWindow, agentHandled, kpiBump, initialAgentHandled]);

  const agents = React.useMemo(() => {
    return AGENTS.map(a => ({ ...a, liveHandled: agentHandled[a.id] }));
  }, [agentHandled]);

  const hitlCount = HITL_ITEMS.length;
  const urgentCount = HITL_ITEMS.filter(h => slaLabel(h.sla).status === 'breach' || slaLabel(h.sla).status === 'warning').length;
  const oldestHitl = (() => {
    if (!HITL_ITEMS.length) return '—';
    const sorted = [...HITL_ITEMS].sort((a, b) => new Date(a.sla) - new Date(b.sla));
    return slaLabel(sorted[0].sla).text;
  })();

  return { events, kpis, agents, hitlCount, urgentCount, oldestHitl };
}

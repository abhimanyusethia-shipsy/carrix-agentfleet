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

// Max interval between ticks — enforces the "≤ 7 seconds" requirement.
const MAX_TICK_MS = 7000;
const MIN_TICK_MS = 3000;
const randTick = () => MIN_TICK_MS + Math.random() * (MAX_TICK_MS - MIN_TICK_MS);

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

// Recursive setTimeout that keeps every interval ≤ MAX_TICK_MS.
function useTicker(callback) {
  const cbRef = React.useRef(callback);
  cbRef.current = callback;
  React.useEffect(() => {
    let cancelled = false;
    let id;
    function loop() {
      id = setTimeout(() => {
        if (cancelled) return;
        cbRef.current();
        loop();
      }, randTick());
    }
    loop();
    return () => { cancelled = true; clearTimeout(id); };
  }, []);
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
  const [lastTickAt, setLastTickAt] = React.useState(() => Date.now());

  // Per-KPI drift offsets. Reset to 0 when terminal/window changes (recomputed base).
  const [kpiDrift, setKpiDrift] = React.useState({
    autoAvg: 0,
    ahtAvg: 0,
    fteHours: 0,
    slaBreaches: 0,
    hitlOpen: 0,
    containers: 0,
    demExplained: 0,
    email: 0,
    phone: 0,
  });

  // Per-agent metric drift for the agent cards (auto-rate, AHT).
  const [agentDrift, setAgentDrift] = React.useState(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, { auto: 0, aht: 0 }]))
  );

  // Re-format relative timestamps on each event row.
  React.useEffect(() => {
    const id = setInterval(() => {
      setEvents(prev => prev.map(e => ({ ...e, fresh: false, relTime: formatRel(e.t) })));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Append an externally-generated event (e.g. from the voice-call demo button).
  const pushEvent = React.useCallback((ev) => {
    const newEv = {
      id: ev.id || 'ext-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      agentId: ev.agentId,
      type: ev.type || 'task_completed',
      terminal: ev.terminal || 'slc',
      message: ev.message || '',
      t: ev.t || new Date().toISOString(),
      fresh: true,
      relTime: 'just now',
    };
    setEvents(prev => [newEv, ...prev].slice(0, 80));
    setLastTickAt(Date.now());
  }, []);

  // Event stream: now ticks every 3–7s (was 9–14s) so kpis.handled bumps within the 7s budget.
  useTicker(() => {
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
    setLastTickAt(Date.now());
  });

  // KPI drift tick: small realistic jitter on every headline + strip number.
  useTicker(() => {
    setKpiDrift(prev => {
      const jitter = (mag) => (Math.random() - 0.5) * 2 * mag;
      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
      return {
        autoAvg: clamp(prev.autoAvg + jitter(0.4), -2, 2),
        ahtAvg: clamp(prev.ahtAvg + jitter(0.05), -0.4, 0.4),
        // Cumulative counters: trend upward.
        fteHours: prev.fteHours + Math.floor(Math.random() * 3),
        containers: prev.containers + Math.floor(Math.random() * 4),
        demExplained: prev.demExplained + Math.floor(Math.random() * 1200),
        email: prev.email + Math.floor(Math.random() * 3),
        phone: prev.phone + Math.floor(Math.random() * 2),
        // Open counts oscillate within a band.
        slaBreaches: clamp(prev.slaBreaches + (Math.random() < 0.5 ? -1 : 1), -2, 3),
        hitlOpen: clamp(prev.hitlOpen + (Math.random() < 0.5 ? -1 : 1), -3, 4),
      };
    });
    setLastTickAt(Date.now());
  });

  // Per-agent jitter for auto-rate and AHT shown on the agent cards.
  useTicker(() => {
    setAgentDrift(prev => {
      const next = { ...prev };
      for (const a of AGENTS) {
        const cur = prev[a.id] || { auto: 0, aht: 0 };
        const dAuto = (Math.random() - 0.5) * 0.8;
        const dAht = (Math.random() - 0.5) * 0.1;
        next[a.id] = {
          auto: Math.max(-3, Math.min(3, cur.auto + dAuto)),
          aht: Math.max(-0.4, Math.min(0.4, cur.aht + dAht)),
        };
      }
      return next;
    });
    setLastTickAt(Date.now());
  });

  // Reset drift when slice changes (so numbers stay anchored to the new base).
  React.useEffect(() => {
    setKpiDrift({
      autoAvg: 0, ahtAvg: 0, fteHours: 0, slaBreaches: 0,
      hitlOpen: 0, containers: 0, demExplained: 0, email: 0, phone: 0,
    });
  }, [terminal, timeWindow]);

  const kpis = React.useMemo(() => {
    const base = buildHeadlineKpis(terminal, timeWindow);
    let delta = 0;
    Object.entries(agentHandled).forEach(([id, v]) => {
      const base0 = initialAgentHandled[id] || 0;
      delta += Math.max(0, v - base0);
    });
    const tShare = terminal === 'all' ? 1 : 0.25;
    const handled = base.handled + Math.round(delta * tShare);
    return {
      ...base,
      handled,
      autoAvg: Math.max(0, Math.min(100, Math.round((base.autoAvg + kpiDrift.autoAvg) * 10) / 10)),
      ahtAvg: Math.max(0.5, +(parseFloat(base.ahtAvg) + kpiDrift.ahtAvg).toFixed(1)),
      fteHours: String(Math.max(0, parseInt(base.fteHours) + kpiDrift.fteHours)),
      slaBreaches: Math.max(0, base.slaBreaches + kpiDrift.slaBreaches),
      hitlOpen: Math.max(0, base.hitlOpen + kpiDrift.hitlOpen),
      containers: base.containers + kpiDrift.containers,
      demExplained: base.demExplained + kpiDrift.demExplained,
      email: base.email + kpiDrift.email,
      phone: base.phone + kpiDrift.phone,
      _bumped: kpiBump > 0,
      _lastTickAt: lastTickAt,
    };
  }, [terminal, timeWindow, agentHandled, kpiBump, kpiDrift, lastTickAt, initialAgentHandled]);

  const agents = React.useMemo(() => {
    return AGENTS.map(a => {
      const d = agentDrift[a.id] || { auto: 0, aht: 0 };
      const baseAuto = a.metrics[1].value;
      const baseAht = a.metrics[2].value;
      const liveAuto = Math.max(0, Math.min(100, Math.round((baseAuto + d.auto) * 10) / 10));
      const liveAht = Math.max(0.5, +(baseAht + d.aht).toFixed(1));
      return {
        ...a,
        liveHandled: agentHandled[a.id],
        liveAuto,
        liveAht,
      };
    });
  }, [agentHandled, agentDrift]);

  const hitlCount = HITL_ITEMS.length;
  const urgentCount = HITL_ITEMS.filter(h => slaLabel(h.sla).status === 'breach' || slaLabel(h.sla).status === 'warning').length;
  const oldestHitl = (() => {
    if (!HITL_ITEMS.length) return '—';
    const sorted = [...HITL_ITEMS].sort((a, b) => new Date(a.sla) - new Date(b.sla));
    return slaLabel(sorted[0].sla).text;
  })();

  return { events, kpis, agents, hitlCount, urgentCount, oldestHitl, lastTickAt, pushEvent };
}

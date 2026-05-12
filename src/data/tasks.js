// Carrix AgentFleet — Tasks, HITL, Activity feed

function pastDate(minutesAgo) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d.toISOString();
}
function futureHours(h) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Math.round(h * 60));
  return d.toISOString();
}
export function fmtTime(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return 'now';
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}
export function slaLabel(iso) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  if (diff < 0) return { text: `${Math.abs(Math.round(diff))}m overdue`, status: 'breach' };
  if (diff < 30) return { text: `${Math.round(diff)}m left`, status: 'warning' };
  if (diff < 240) return { text: `${Math.round(diff / 60)}h left`, status: 'on_track' };
  return { text: `${Math.round(diff / 1440)}d left`, status: 'on_track' };
}

export const HITL_ITEMS = [
  {
    id: 'h1', taskId: 'APT-21847', agentId: 'appointments',
    title: 'Approve waiver — driver missed appt due to I-90 accident',
    summary: 'Trucker XPO Logistics missed a 09:30 appointment for MAEU8847291 at SLC due to a multi-vehicle accident on I-90. Yard has 14% slack capacity. Recommend granting same-day waiver.',
    sla: futureHours(0.4), terminal: 'slc',
    context: [
      { k: 'Container', v: 'MAEU8847291' },
      { k: 'Original Slot', v: 'Mon 09:30' },
      { k: 'Reason', v: 'I-90 accident at MP 17' },
      { k: 'Trucker', v: 'XPO Logistics #4421' },
      { k: 'Yard slack', v: '14% (slot available)' },
      { k: 'Recommendation', v: 'Approve — late by 38 min' },
    ],
  },
  {
    id: 'h2', taskId: 'YRD-44218', agentId: 'yard',
    title: 'Yard mismatch — Spinnaker shows D-12-04, driver reports empty slot',
    summary: 'Container TCKU7732145 shows position D-12-04 in Spinnaker but driver at the block reports the slot is empty. Mainsail discharge timestamp is 4h old. Likely move not propagated.',
    sla: futureHours(1.2), terminal: 'zlo',
    context: [
      { k: 'Container', v: 'TCKU7732145' },
      { k: 'Spinnaker pos', v: 'D-12-04' },
      { k: 'Driver report', v: 'Slot empty' },
      { k: 'Last move', v: '4h 12m ago' },
      { k: 'Recommendation', v: 'Trigger Tier-2 sync + reposition' },
    ],
  },
  {
    id: 'h3', taskId: 'GAT-17782', agentId: 'gate',
    title: 'ERR-204 size/type mismatch — booking says 40HC, driver has 20DV',
    summary: 'Driver at trouble window. Booking BKG-991204 specified 40HC; chassis has 20DV. Steamship line approval needed to rebook or send back.',
    sla: futureHours(0.2), terminal: 'slc',
    context: [
      { k: 'Booking', v: 'BKG-991204' },
      { k: 'Booked', v: '40HC' },
      { k: 'Arrived', v: '20DV (PONU2241817)' },
      { k: 'Driver', v: 'Swift Transport — Tractor 9912' },
      { k: 'Owner', v: 'Steamship line (CMA CGM)' },
    ],
  },
  {
    id: 'h4', taskId: 'BIL-08812', agentId: 'billing',
    title: 'Demurrage dispute — system outage Mar 12 (4h gap)',
    summary: 'Customer cites Mainsail outage 04:00–08:12 on Mar 12 as cause for missed pickup. $1,840 in demurrage accrued. Audit log confirms the outage. Recommend credit.',
    sla: futureHours(2.6), terminal: 'slc',
    context: [
      { k: 'Container', v: 'CMAU4471203' },
      { k: 'Disputed amt', v: '$1,840.00' },
      { k: 'Outage window', v: 'Mar 12 04:00–08:12' },
      { k: 'Customer', v: 'TransGlobal Brokers' },
      { k: 'Audit', v: 'Mainsail incident INC-7741' },
      { k: 'Recommendation', v: 'Approve credit' },
    ],
  },
  {
    id: 'h5', taskId: 'CUS-03377', agentId: 'customs',
    title: 'USDA staging request — 6 containers for inspection Thu 14:00',
    summary: 'USDA Inspector R. Vela requested staging of 6 reefer containers at SLC bonded yard for Thu 14:00. Spinnaker move plan generated; needs ops approval to execute.',
    sla: futureHours(4.1), terminal: 'slc',
    context: [
      { k: 'Inspection', v: 'USDA-2026-1142' },
      { k: 'Containers', v: '6 (reefers)' },
      { k: 'Slot', v: 'Thu 14:00 — Bonded Yard B' },
      { k: 'Inspector', v: 'R. Vela (USDA)' },
      { k: 'Move ETA', v: '2h 40m' },
      { k: 'Demurrage hold', v: 'Waived for inspection' },
    ],
  },
  {
    id: 'h6', taskId: 'CON-99124', agentId: 'constraints',
    title: 'Constraint lift request — "May Move Off-dock" on 14 containers',
    summary: 'BCO Pacific Logistics requested lift of off-dock constraint on 14 containers for direct gate-out. Yard congestion at 78%; lifting could create chassis bottleneck.',
    sla: futureHours(3.4), terminal: 't18',
    context: [
      { k: 'BCO', v: 'Pacific Logistics' },
      { k: 'Containers', v: '14' },
      { k: 'Constraint', v: 'May Move Off-dock' },
      { k: 'Yard utilization', v: '78%' },
      { k: 'Risk', v: 'Chassis bottleneck' },
      { k: 'Recommendation', v: 'Phased lift — 6 containers first' },
    ],
  },
  {
    id: 'h7', taskId: 'APT-21822', agentId: 'appointments',
    title: 'Capacity request — 3 extra slots for reefer drop-off Wed PM',
    summary: 'FreshExports requested 3 additional reefer drop-off slots Wed 15:00–18:00. Yard capacity allows; reefer racks at 62%.',
    sla: futureHours(5.5), terminal: 'zlo',
    context: [
      { k: 'Customer', v: 'FreshExports MX' },
      { k: 'Slots', v: '3 × Wed 15:00–18:00' },
      { k: 'Type', v: 'Reefer drop-off' },
      { k: 'Reefer rack util', v: '62%' },
      { k: 'Recommendation', v: 'Approve' },
    ],
  },
  {
    id: 'h8', taskId: 'YRD-44196', agentId: 'yard',
    title: 'Peel-pile guidance — customer expected MSCU8847, got MSCU8851',
    summary: 'Customer dispute on peel-pile booking BKG-77441. Agent confirms peel-pile config is in-sequence; customer wants exception. Terminal-owned decision.',
    sla: futureHours(7.1), terminal: 'slc',
    context: [
      { k: 'Booking', v: 'BKG-77441' },
      { k: 'Expected', v: 'MSCU8847221' },
      { k: 'Received', v: 'MSCU8851033' },
      { k: 'Sequence config', v: 'FIFO peel pile' },
      { k: 'Customer', v: 'Container Movers Inc' },
    ],
  },
  {
    id: 'h9', taskId: 'GAT-17744', agentId: 'gate',
    title: 'Ban removal review — Driver J. Morales, 90-day expired',
    summary: 'Driver J. Morales banned 2026-01-29 for safety violation (parking in fire lane). 90-day window ended yesterday. No further incidents. Protection Area cleared review.',
    sla: futureHours(8.2), terminal: 'zlo',
    context: [
      { k: 'Driver ID', v: 'D-22018 (J. Morales)' },
      { k: 'Ban date', v: '2026-01-29' },
      { k: 'Reason', v: 'Fire lane parking' },
      { k: 'Window', v: '90 days — expired' },
      { k: 'Protection Area', v: 'Cleared' },
    ],
  },
  {
    id: 'h10', taskId: 'BIL-08801', agentId: 'billing',
    title: 'Prepayment guidance — $8,400 demurrage for delayed pickup',
    summary: 'Customer Atlas Imports plans pickup delay to next Mon. Projected demurrage $8,400. Above $5k auto-quote threshold — needs ops approval before sending payment instructions.',
    sla: futureHours(10.0), terminal: 'slc',
    context: [
      { k: 'Customer', v: 'Atlas Imports' },
      { k: 'Containers', v: '4' },
      { k: 'Planned pickup', v: 'Mon (5 days late)' },
      { k: 'Projected demurrage', v: '$8,400' },
      { k: 'Threshold', v: '> $5,000' },
    ],
  },
  {
    id: 'h11', taskId: 'CUS-03361', agentId: 'customs',
    title: 'Stuck release — CBP cleared 6h ago, Mainsail still shows hold',
    summary: 'CBP cleared MEDU2284192 at 03:14 (6h ago). Mainsail still shows CHL hold. EDI feed delay suspected. Customer at gate now.',
    sla: futureHours(0.5), terminal: 't18',
    context: [
      { k: 'Container', v: 'MEDU2284192' },
      { k: 'CBP cleared', v: '03:14 (6h ago)' },
      { k: 'Mainsail status', v: 'CHL (active)' },
      { k: 'Customer', v: 'At gate now' },
      { k: 'Suspected', v: 'EDI feed lag (Tide Works)' },
    ],
  },
];

export const MY_WORK_TASKS = [
  { id: 'APT-21851', agentId: 'appointments', terminal: 't18', status: 'success', summary: 'Confirmed appt for MAEU2245890 — slot Mon 11:00 valid', priority: 'low',    started: pastDate(8),   sla: futureHours(2),   source: 'Email', objectId: 'MAEU2245890' },
  { id: 'YRD-44231', agentId: 'yard',         terminal: 'slc', status: 'success', summary: 'Container availability confirmed — TCKU8821447 ready, no holds', priority: 'low', started: pastDate(12),  sla: futureHours(3),   source: 'Email', objectId: 'TCKU8821447' },
  { id: 'BIL-08825', agentId: 'billing',      terminal: 'zlo', status: 'success', summary: 'LFD quoted — CMAU7741203 LFD = Apr 30, current accrual $0',     priority: 'low', started: pastDate(14),  sla: futureHours(4),   source: 'Email', objectId: 'CMAU7741203' },
  { id: 'GAT-17801', agentId: 'gate',         terminal: 'slc', status: 'success', summary: 'ERR-101 explained — booking sizing OK, retried gate-in successful', priority: 'medium', started: pastDate(22),  sla: futureHours(1),   source: 'Phone', objectId: 'GTX-449811' },
  { id: 'CON-99182', agentId: 'constraints',  terminal: 't5',  status: 'success', summary: 'Cutoff verified — Vessel ZIM Atlanta open until Fri 18:00',     priority: 'low', started: pastDate(28),  sla: futureHours(5),   source: 'Email', objectId: 'BKG-882201' },
  { id: 'CUS-03398', agentId: 'customs',      terminal: 'slc', status: 'success', summary: 'Customs hold released — EVRG6614207 cleared by CBP at 02:14',  priority: 'medium', started: pastDate(35),  sla: futureHours(2),   source: 'Email', objectId: 'EVRG6614207' },

  { id: 'APT-21847', agentId: 'appointments', terminal: 'slc', status: 'hitl', summary: 'Approve waiver — driver missed appt due to I-90 accident', priority: 'urgent', started: pastDate(45),  sla: futureHours(0.4), source: 'Phone', objectId: 'MAEU8847291' },
  { id: 'YRD-44218', agentId: 'yard',         terminal: 'zlo', status: 'hitl', summary: 'Yard mismatch — Spinnaker pos vs driver report', priority: 'high',   started: pastDate(58),  sla: futureHours(1.2), source: 'Phone', objectId: 'TCKU7732145' },
  { id: 'GAT-17782', agentId: 'gate',         terminal: 'slc', status: 'hitl', summary: 'ERR-204 size/type mismatch — needs steamship approval', priority: 'urgent', started: pastDate(11),  sla: futureHours(0.2), source: 'Phone', objectId: 'GTX-449920' },
  { id: 'BIL-08812', agentId: 'billing',      terminal: 'slc', status: 'hitl', summary: 'Demurrage dispute — Mainsail outage Mar 12 (4h gap)', priority: 'high',   started: pastDate(82),  sla: futureHours(2.6), source: 'Email', objectId: 'CMAU4471203' },
  { id: 'CUS-03377', agentId: 'customs',      terminal: 'slc', status: 'hitl', summary: 'USDA staging — 6 reefers Thu 14:00 bonded yard',     priority: 'medium', started: pastDate(115), sla: futureHours(4.1), source: 'Email', objectId: 'USDA-2026-1142' },
  { id: 'CON-99124', agentId: 'constraints',  terminal: 't18', status: 'hitl', summary: 'Off-dock constraint lift — 14 containers, yard at 78%',     priority: 'high',   started: pastDate(140), sla: futureHours(3.4), source: 'Email', objectId: 'BKG-554120' },
  { id: 'APT-21822', agentId: 'appointments', terminal: 'zlo', status: 'hitl', summary: 'Capacity req — 3 reefer drop slots Wed PM',     priority: 'medium', started: pastDate(165), sla: futureHours(5.5), source: 'Email', objectId: 'BKG-771229' },
  { id: 'YRD-44196', agentId: 'yard',         terminal: 'slc', status: 'hitl', summary: 'Peel-pile dispute — customer wants exception',     priority: 'medium', started: pastDate(190), sla: futureHours(7.1), source: 'Email', objectId: 'BKG-77441' },
  { id: 'GAT-17744', agentId: 'gate',         terminal: 'zlo', status: 'hitl', summary: 'Ban removal — Driver J. Morales, 90-day expired',     priority: 'low',    started: pastDate(225), sla: futureHours(8.2), source: 'Email', objectId: 'D-22018' },
  { id: 'BIL-08801', agentId: 'billing',      terminal: 'slc', status: 'hitl', summary: 'Prepayment guidance — $8,400 demurrage above threshold',     priority: 'medium', started: pastDate(255), sla: futureHours(10),  source: 'Email', objectId: 'BKG-882047' },
  { id: 'CUS-03361', agentId: 'customs',      terminal: 't18', status: 'hitl', summary: 'Stuck release — CBP cleared 6h ago, TOS lagging',     priority: 'urgent', started: pastDate(7),   sla: futureHours(0.5), source: 'Phone', objectId: 'MEDU2284192' },

  { id: 'YRD-44247', agentId: 'yard',         terminal: 'zlo', status: 'running', summary: 'Querying Spinnaker for empty container counts (40HC)', priority: 'low',    started: pastDate(2),   sla: futureHours(1),   source: 'Email', objectId: 'INQ-44521' },
  { id: 'BIL-08832', agentId: 'billing',      terminal: 'slc', status: 'running', summary: 'Computing projected demurrage for 12 containers',     priority: 'medium', started: pastDate(3),   sla: futureHours(2),   source: 'Email', objectId: 'INQ-44512' },
  { id: 'APT-21861', agentId: 'appointments', terminal: 'slc', status: 'running', summary: 'Cross-checking eModal vs Mainsail for sync mismatch',     priority: 'medium', started: pastDate(1),   sla: futureHours(0.8), source: 'Phone', objectId: 'INQ-44518' },

  { id: 'GAT-17777', agentId: 'gate',         terminal: 't18', status: 'failed', summary: 'Traffic Control API timeout — gate transaction not retrievable', priority: 'high',   started: pastDate(48),  sla: futureHours(-0.2), source: 'Phone', objectId: 'GTX-449703' },
  { id: 'CUS-03340', agentId: 'customs',      terminal: 'slc', status: 'failed', summary: 'Hold catalog mismatch — code USDA-X11 unmapped',     priority: 'medium', started: pastDate(98),  sla: futureHours(-1.4),source: 'Email', objectId: 'CONT-9912' },
];

export const ACTIVITY = [
  { id: 'a1',  agentId: 'gate',         type: 'task_completed', terminal: 'slc', message: 'ERR-101 explained — driver cleared at gate-in (GTX-449811)', t: pastDate(2)  },
  { id: 'a2',  agentId: 'appointments', type: 'hitl_requested', terminal: 'slc', message: 'Waiver approval needed — I-90 accident missed appt (MAEU8847291)', t: pastDate(3) },
  { id: 'a3',  agentId: 'yard',         type: 'task_completed', terminal: 'zlo', message: 'Container availability confirmed — TCKU8821447 ready', t: pastDate(5) },
  { id: 'a4',  agentId: 'customs',      type: 'task_completed', terminal: 'slc', message: 'Customs release confirmed — EVRG6614207 picked up clearance', t: pastDate(7) },
  { id: 'a5',  agentId: 'billing',      type: 'task_completed', terminal: 'slc', message: 'LFD quoted — CMAU7741203 (LFD Apr 30, $0 accrued)', t: pastDate(9) },
  { id: 'a6',  agentId: 'constraints',  type: 'task_completed', terminal: 't5',  message: 'Cutoff verified — ZIM Atlanta open until Fri 18:00', t: pastDate(11) },
  { id: 'a7',  agentId: 'gate',         type: 'hitl_requested', terminal: 'slc', message: 'ERR-204 size mismatch — steamship approval needed', t: pastDate(14) },
  { id: 'a8',  agentId: 'yard',         type: 'task_started',   terminal: 'zlo', message: 'Empty container availability query for 40HC', t: pastDate(16) },
  { id: 'a9',  agentId: 'customs',      type: 'hitl_requested', terminal: 't18', message: 'Stuck release — CBP cleared 6h ago, TOS lagging (MEDU2284192)', t: pastDate(18) },
  { id: 'a10', agentId: 'appointments', type: 'task_completed', terminal: 't18', message: 'Confirmed appointment MAEU2245890 — Mon 11:00 valid', t: pastDate(21) },
  { id: 'a11', agentId: 'billing',      type: 'hitl_requested', terminal: 'slc', message: 'Demurrage dispute — Mainsail outage Mar 12 cited', t: pastDate(24) },
  { id: 'a12', agentId: 'gate',         type: 'error',          terminal: 't18', message: 'Traffic Control API timeout — retrying (GTX-449703)', t: pastDate(28) },
  { id: 'a13', agentId: 'yard',         type: 'task_completed', terminal: 'slc', message: 'Yard position confirmed — Block C-08-21', t: pastDate(31) },
  { id: 'a14', agentId: 'constraints',  type: 'task_completed', terminal: 'zlo', message: 'Late-gate referral sent — steamship line owns decision', t: pastDate(35) },
  { id: 'a15', agentId: 'appointments', type: 'task_completed', terminal: 'slc', message: 'Sync defect detected — Mainsail vs eModal (escalated Tier-2)', t: pastDate(38) },
  { id: 'a16', agentId: 'billing',      type: 'task_completed', terminal: 'zlo', message: 'Payment posted — container released (HMMU8847221)', t: pastDate(42) },
  { id: 'a17', agentId: 'customs',      type: 'task_completed', terminal: 'slc', message: 'Hold ownership identified — USDA (routed to Govt Team)', t: pastDate(46) },
  { id: 'a18', agentId: 'gate',         type: 'task_completed', terminal: 'zlo', message: 'Hold denial explained — line hold (CMA CGM)', t: pastDate(51) },
  { id: 'a19', agentId: 'yard',         type: 'hitl_requested', terminal: 'zlo', message: 'Yard mismatch detected — Spinnaker vs driver report', t: pastDate(55) },
  { id: 'a20', agentId: 'constraints',  type: 'hitl_requested', terminal: 't18', message: 'Constraint lift request — 14 off-dock containers', t: pastDate(60) },
  { id: 'a21', agentId: 'billing',      type: 'task_completed', terminal: 'slc', message: 'Fee ownership identified — terminal-owned, $215 lifted', t: pastDate(68) },
  { id: 'a22', agentId: 'appointments', type: 'task_completed', terminal: 't5',  message: 'Gate-eligibility timing explained — appt OK, on-time', t: pastDate(75) },
  { id: 'a23', agentId: 'customs',      type: 'task_completed', terminal: 'slc', message: 'Inspection coordinated — 6 reefers Thu 14:00 staging', t: pastDate(82) },
  { id: 'a24', agentId: 'gate',         type: 'task_completed', terminal: 'slc', message: 'Trouble window assistance — driver redirected to lane 4', t: pastDate(89) },
  { id: 'a25', agentId: 'yard',         type: 'task_completed', terminal: 'zlo', message: 'Rail status explained — Ferromex equipment shortage', t: pastDate(96) },
];

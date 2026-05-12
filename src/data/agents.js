// Carrix AgentFleet — data layer
// All numbers are illustrative but grounded in URD volumes:
// SLC ~239k conv/yr, ZLO ~309k conv/yr, T18+T5 ~67k conv/yr combined
// Annual ≈ 615k conversations across all 4 terminals → ~1,690/day

export const TERMINALS = [
  { id: 'all',  name: 'All Terminals',  short: 'ALL', region: '—' },
  { id: 't18',  name: 'Seattle T18',    short: 'T18', region: 'US West' },
  { id: 't5',   name: 'Seattle T5',     short: 'T5',  region: 'US West' },
  { id: 'slc',  name: 'Salt Lake City', short: 'SLC', region: 'US Mountain' },
  { id: 'zlo',  name: 'Manzanillo',     short: 'ZLO', region: 'Mexico' },
];

const TERMINAL_VOLUME = {
  t18: { email: 122, phone: 18,  conv: 140 },
  t5:  { email: 56,  phone: 9,   conv: 65 },
  slc: { email: 552, phone: 168, conv: 720 },
  zlo: { email: 678, phone: 103, conv: 781 },
};
TERMINAL_VOLUME.all = Object.values(TERMINAL_VOLUME).reduce(
  (a, b) => ({ email: a.email + b.email, phone: a.phone + b.phone, conv: a.conv + b.conv }),
  { email: 0, phone: 0, conv: 0 }
);

const WINDOW_MULT = { today: 1, '7d': 7, '30d': 30 };

export function spark(base, variance, points = 14, seed = 1) {
  let s = seed;
  return Array.from({ length: points }, () => {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    return Math.max(0, Math.round(base + (r - 0.5) * variance * 2));
  });
}

export const AGENTS = [
  {
    id: 'appointments',
    name: 'Appointments Agent',
    short: 'Appointments',
    subtitle: 'Mainsail · eModal · CiTAS · Forecast',
    icon: 'calendar',
    color: '#7C3AED',
    description:
      'Verifies appointment status, explains gate-eligibility timing rules, and refers slot creation or waiver requests to the right Tier-1 owner. Reads from Mainsail (TOS), eModal/CiTAS (customer-visible scheduling) and Forecast for cross-system reconciliation.',
    examples: [
      '"Do I have an appointment?" / "Is it confirmed?"',
      '"No appointments available today — can you add a slot?"',
      '"Driver missed the appointment due to an accident."',
      '"I confirmed but the gate rejected me."',
      '"Appointment exists in Mainsail but not visible in eModal."',
    ],
    channels: ['Email', 'Phone', 'eModal', 'CiTAS', 'Mainsail'],
    triggerType: 'Email + Phone intake (Tier-0)',
    triggerDescription:
      'Watches the Tier-0 inbox and call queue for appointment-related intent. Classifies into 5 sub-flows: status verification, capacity request, waiver, gate-timing, and sync defect. Read-only verifications resolve autonomously; capacity/waiver requests are routed to terminal ops.',
    config: [
      { key: 'TOS lookup', value: 'Mainsail (gate transactions, bookings, LFD)' },
      { key: 'Customer view', value: 'eModal (US) · CiTAS (ZLO)' },
      { key: 'Sync confidence', value: '≥ 95% match required' },
      { key: 'Auto-respond if', value: 'Read-only verification + clean match' },
      { key: 'HITL flag if', value: 'Capacity request, waiver, sync mismatch' },
      { key: 'Tier-1 routing', value: 'Terminal Ops queue (eModal slot tools)' },
      { key: 'Tier-2 escalation', value: 'Carrix Service Center (vendor EDI)' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify intent', sub: '5 sub-flows', kind: 'auto' },
      { id: 'lookup',   label: 'Mainsail + eModal lookup', sub: 'cross-check', kind: 'auto' },
      { id: 'decide',   label: 'Resolution decision', sub: 'auto / refer / HITL', kind: 'branch' },
      { id: 'respond',  label: 'Send response', sub: 'email or call note', kind: 'auto' },
      { id: 'route',    label: 'Route to Tier-1/2', sub: 'if needed', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-resolved (status/timing)', value: 71, color: '#22c55e' },
      { label: 'Routed to Terminal Ops',         value: 18, color: '#3b82f6' },
      { label: 'Awaiting HITL',                  value: 6,  color: '#f59e0b' },
      { label: 'Tier-2 sync defect',             value: 3,  color: '#8b5cf6' },
      { label: 'Failed / unresolved',            value: 2,  color: '#ef4444' },
    ],
    metrics: [
      { id: 'apt-handled',    label: 'Inquiries Handled',     value: 412, format: 'number',  trend: 8.2,  spark: spark(58, 9, 14, 11),  primary: true },
      { id: 'apt-auto',       label: 'Auto-Resolution Rate',  value: 71,  format: 'percent', trend: 4.3,  spark: spark(68, 4, 14, 12) },
      { id: 'apt-aht',        label: 'Avg Handle Time',       value: 2.4, format: 'duration', unit: 'min', trend: -11.0, spark: spark(3, 1, 14, 13) },
      { id: 'apt-confirm',    label: 'Confirmations Verified', value: 287, format: 'number',  trend: 6.1,  spark: spark(40, 6, 14, 14) },
      { id: 'apt-gate-reject', label: 'Gate Rejects Explained', value: 38, format: 'number',  trend: -4.1, spark: spark(5, 2, 14, 15) },
      { id: 'apt-sync',       label: 'Sync Mismatches Caught', value: 7,   format: 'number',  trend: 12.5, spark: spark(1, 1, 14, 16) },
    ],
  },
  {
    id: 'yard',
    name: 'Yard & Container Agent',
    short: 'Yard & Container',
    subtitle: 'Mainsail · Spinnaker · Forecast',
    icon: 'package',
    color: '#0891B2',
    description:
      'Answers "is my container ready?" inquiries by cross-referencing Mainsail discharge status with Spinnaker yard position. Handles peel-pile guidance, empty container availability, rail movement status and yard data mismatches.',
    examples: [
      '"Is this container ready for pickup?"',
      '"Where is this container in the yard?"',
      '"Why didn\'t I get the container I expected?" (peel pile)',
      '"Are empties available today?"',
      '"Why hasn\'t this container left for rail?"',
      '"System shows wrong yard location."',
    ],
    channels: ['Email', 'Phone', 'Mainsail', 'Spinnaker'],
    triggerType: 'Email + Phone intake (Tier-0)',
    triggerDescription:
      'Receives container-availability and yard-location inquiries. Reads discharge state, holds, and yard row/stack from Mainsail + Spinnaker. Answers status-only requests autonomously; flags location mismatches for the Carrix Service Center.',
    config: [
      { key: 'TOS', value: 'Mainsail (discharge, holds)' },
      { key: 'Yard system', value: 'Spinnaker (row/stack/block)' },
      { key: 'Disclaimer', value: 'Empty availability not guaranteed' },
      { key: 'Mismatch threshold', value: 'Flag if location delta > 1 row' },
      { key: 'Peel-pile lookup', value: 'Booking + Container Group' },
      { key: 'Tier-2 escalation', value: 'EDI (Tide Works)' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify intent', sub: 'avail / location / peel / empty / rail', kind: 'auto' },
      { id: 'lookup', label: 'Mainsail + Spinnaker', sub: 'status + position', kind: 'auto' },
      { id: 'consistency', label: 'Cross-system check', sub: 'flag mismatches', kind: 'branch' },
      { id: 'respond', label: 'Send response', sub: 'with disclaimer if empty', kind: 'auto' },
      { id: 'escalate', label: 'Escalate', sub: 'mismatch → Tier-2', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-resolved (availability/location)', value: 76, color: '#22c55e' },
      { label: 'Empty info provided (non-guaranteed)',  value: 11, color: '#3b82f6' },
      { label: 'Routed to Terminal Ops',                value: 7,  color: '#8b5cf6' },
      { label: 'Yard mismatch → Tier-2',                value: 4,  color: '#f59e0b' },
      { label: 'Failed / unresolved',                   value: 2,  color: '#ef4444' },
    ],
    metrics: [
      { id: 'yrd-handled',  label: 'Inquiries Handled',         value: 528, format: 'number',  trend: 11.2, spark: spark(75, 12, 14, 21), primary: true },
      { id: 'yrd-auto',     label: 'Auto-Resolution Rate',      value: 76,  format: 'percent', trend: 2.8,  spark: spark(74, 3, 14, 22) },
      { id: 'yrd-aht',      label: 'Avg Handle Time',           value: 1.9, format: 'duration', unit: 'min', trend: -8.4, spark: spark(2, 1, 14, 23) },
      { id: 'yrd-avail',    label: 'Container Availability Lookups', value: 401, format: 'number',  trend: 9.1, spark: spark(57, 8, 14, 24) },
      { id: 'yrd-mismatch', label: 'Yard Mismatches Flagged',   value: 21,  format: 'number',  trend: -6.2, spark: spark(3, 2, 14, 25) },
      { id: 'yrd-rail',     label: 'Rail Status Inquiries',     value: 47,  format: 'number',  trend: 14.7, spark: spark(7, 3, 14, 26) },
    ],
  },
  {
    id: 'gate',
    name: 'Gate & Access Agent',
    short: 'Gate & Access',
    subtitle: 'Mainsail · Traffic Control',
    icon: 'truck',
    color: '#D97706',
    description:
      'Diagnoses gate transaction errors (ERR codes), explains hold-based denials, and triages truck/driver ban inquiries. Coordinates with the trouble window and resolves system-vs-gate mismatches via Tier-2.',
    examples: [
      '"I\'m at the trouble window — what went wrong?"',
      '"Why can\'t my truck enter the terminal?"',
      '"Gate says there\'s a hold — what is it?"',
      '"They sent me to the trouble window."',
      '"System says OK but gate rejected me."',
    ],
    channels: ['Phone', 'Email', 'Traffic Control', 'Mainsail'],
    triggerType: 'Gate + Tier-0 phone intake',
    triggerDescription:
      'Picks up gate-related calls (highest phone share at 50–70%). Looks up the gate transaction in Traffic Control, cross-references hold codes in Mainsail, identifies ownership (terminal vs steamship vs customs) and explains next steps. Bans and ERR resolutions are routed to gate supervisors.',
    config: [
      { key: 'Gate system', value: 'Traffic Control' },
      { key: 'TOS', value: 'Mainsail (holds, bookings, sizing)' },
      { key: 'Phone-first SLA', value: '≤ 90 sec to first response' },
      { key: 'Ban-status source', value: 'Protection Area report (ZLO)' },
      { key: 'ERR catalog', value: '37 codes mapped to plain-language' },
      { key: 'Auto-respond if', value: 'Hold owner identified + non-terminal' },
      { key: 'Tier-1 routing', value: 'Gate supervisor / Terminal Ops' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify ERR / Ban / Hold', sub: '4 sub-flows', kind: 'auto' },
      { id: 'lookup', label: 'Traffic Control + Mainsail', sub: 'transaction + holds', kind: 'auto' },
      { id: 'ownership', label: 'Identify hold owner', sub: 'terminal / line / customs', kind: 'branch' },
      { id: 'explain', label: 'Explain to driver', sub: 'plain language', kind: 'auto' },
      { id: 'route', label: 'Route ERR fix', sub: 'gate supervisor', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-explained (ERR / hold)',  value: 64, color: '#22c55e' },
      { label: 'Routed to Gate Supervisor',     value: 21, color: '#3b82f6' },
      { label: 'Awaiting HITL',                 value: 8,  color: '#f59e0b' },
      { label: 'Tier-2 (system mismatch)',      value: 5,  color: '#8b5cf6' },
      { label: 'Failed / unresolved',           value: 2,  color: '#ef4444' },
    ],
    metrics: [
      { id: 'gate-handled', label: 'Inquiries Handled',     value: 318, format: 'number',  trend: 5.4,  spark: spark(45, 7, 14, 31), primary: true },
      { id: 'gate-auto',    label: 'Auto-Resolution Rate',  value: 64,  format: 'percent', trend: 3.1,  spark: spark(62, 4, 14, 32) },
      { id: 'gate-aht',     label: 'Avg Handle Time',       value: 3.1, format: 'duration', unit: 'min', trend: -6.2, spark: spark(3, 1, 14, 33) },
      { id: 'gate-err',     label: 'ERR Codes Resolved',    value: 142, format: 'number',  trend: 7.5,  spark: spark(20, 4, 14, 34) },
      { id: 'gate-hold',    label: 'Hold Denials Explained', value: 89, format: 'number',  trend: 2.1,  spark: spark(13, 3, 14, 35) },
      { id: 'gate-ban',     label: 'Ban Status Inquiries',  value: 27,  format: 'number',  trend: -3.4, spark: spark(4, 2, 14, 36) },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Demurrage Agent',
    short: 'Billing & Demurrage',
    subtitle: 'Mainsail · Billing Integration',
    icon: 'dollar',
    color: '#059669',
    description:
      'Handles last-free-day lookups, demurrage projections, payment posting confirmations and prepayment guidance. Validates fee disputes by reconstructing event timelines and routes adjustments to the billing team. Identifies fee ownership (terminal vs steamship line).',
    examples: [
      '"How much demurrage will I owe tomorrow?"',
      '"I paid — why can\'t I pick up yet?"',
      '"I\'ll pick up Monday — how do I prepay?"',
      '"I was charged due to system delay."',
      '"Why can\'t you waive this charge?"',
      '"Portal shows fees that Mainsail doesn\'t."',
    ],
    channels: ['Email', 'Phone', 'Mainsail', 'Billing System'],
    triggerType: 'Email + Phone intake (Tier-0)',
    triggerDescription:
      'High email-share (~80%) topic. Computes projected demurrage from discharge date + LFD + tariff schedule. Confirms payment posting via Billing Integration. Validates dispute timelines using gate-in/out events. Routes valid adjustments to the billing team.',
    config: [
      { key: 'TOS source', value: 'Mainsail (discharge, LFD, gate events)' },
      { key: 'Billing system', value: 'Billing Integration (payment feed)' },
      { key: 'Tariff schedule', value: 'Per-terminal demurrage tables' },
      { key: 'Auto-quote LFD if', value: 'Container in TOS + clean state' },
      { key: 'Dispute flag if', value: 'Timeline gap > 4h or system outage tag' },
      { key: 'HITL for', value: 'Disputes, prepayment > $5k, ownership ambiguity' },
      { key: 'Tier-1 routing', value: 'Demurrage / Billing Team' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify intent', sub: 'status / payment / prepay / dispute', kind: 'auto' },
      { id: 'compute', label: 'Compute LFD + projection', sub: 'tariff lookup', kind: 'auto' },
      { id: 'verify', label: 'Verify payment / timeline', sub: 'billing feed', kind: 'auto' },
      { id: 'decide', label: 'Auto / HITL decision', sub: 'dispute or prepay', kind: 'branch' },
      { id: 'route', label: 'Route to Billing', sub: 'with evidence', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-quoted (LFD/projection)', value: 68, color: '#22c55e' },
      { label: 'Payment confirmed',             value: 14, color: '#3b82f6' },
      { label: 'Dispute → Billing Team',         value: 9,  color: '#8b5cf6' },
      { label: 'Awaiting HITL approval',         value: 7,  color: '#f59e0b' },
      { label: 'Tier-2 sync defect',             value: 2,  color: '#ef4444' },
    ],
    metrics: [
      { id: 'bill-handled', label: 'Inquiries Handled',      value: 367, format: 'number',  trend: 6.8,  spark: spark(52, 8, 14, 41), primary: true },
      { id: 'bill-auto',    label: 'Auto-Resolution Rate',   value: 68,  format: 'percent', trend: 5.2,  spark: spark(65, 4, 14, 42) },
      { id: 'bill-aht',     label: 'Avg Handle Time',        value: 2.7, format: 'duration', unit: 'min', trend: -9.1, spark: spark(3, 1, 14, 43) },
      { id: 'bill-dem',     label: 'Demurrage $ Explained',  value: 1845000, format: 'currency', trend: 12.4, spark: spark(260000, 40000, 14, 44) },
      { id: 'bill-disputes', label: 'Disputes Routed',       value: 23,  format: 'number',  trend: -4.7, spark: spark(3, 1, 14, 45) },
      { id: 'bill-pay',     label: 'Payment Confirms',       value: 51,  format: 'number',  trend: 8.3,  spark: spark(7, 2, 14, 46) },
    ],
  },
  {
    id: 'customs',
    name: 'Customs Agent',
    short: 'Customs',
    subtitle: 'Mainsail · Spinnaker',
    icon: 'shield',
    color: '#DC2626',
    description:
      'Verifies customs / regulatory hold status, identifies the owning authority (Customs, USDA, FDA, steamship line, terminal), and confirms release status. Coordinates inspection staging with the Government Team and Spinnaker.',
    examples: [
      '"Why does this container show a customs hold?"',
      '"Who do I contact to release this?"',
      '"USDA needs this container staged."',
      '"Customs released it — can I pick up?"',
      '"Customs released it but system still shows hold."',
    ],
    channels: ['Email', 'Phone', 'Mainsail', 'Spinnaker'],
    triggerType: 'Email + Phone intake (Tier-0)',
    triggerDescription:
      'Reads customs / government hold codes from Mainsail, maps them to owning authority. Routes inspection staging requests to the Government Team. Verifies release propagation across systems and escalates stuck holds to Tier-2 (EDI).',
    config: [
      { key: 'Hold catalog', value: '24 codes (Customs, USDA, FDA, Line, Terminal)' },
      { key: 'Inspection routing', value: 'SLC Government Team + ZLO Bounded Area' },
      { key: 'Release propagation SLA', value: '15 min after authority release' },
      { key: 'Auto-respond if', value: 'Owner identified + non-terminal hold' },
      { key: 'HITL for', value: 'Inspection scheduling, scanning fees, Vessel-level holds' },
      { key: 'Tier-2', value: 'EDI team (Tide Works) for sync defects' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify hold type', sub: 'customs / agency / line', kind: 'auto' },
      { id: 'owner', label: 'Identify owner', sub: 'authority lookup', kind: 'auto' },
      { id: 'verify', label: 'Verify release', sub: 'cross-system', kind: 'auto' },
      { id: 'decide', label: 'Auto explain or stage', sub: '', kind: 'branch' },
      { id: 'stage', label: 'Stage for inspection', sub: 'Spinnaker move', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-explained (owner + status)', value: 73, color: '#22c55e' },
      { label: 'Inspection staged via Govt team',  value: 11, color: '#3b82f6' },
      { label: 'Release propagation OK',            value: 8,  color: '#10b981' },
      { label: 'Awaiting HITL',                     value: 5,  color: '#f59e0b' },
      { label: 'Tier-2 sync defect',                value: 3,  color: '#8b5cf6' },
    ],
    metrics: [
      { id: 'cus-handled', label: 'Inquiries Handled',         value: 198, format: 'number',  trend: 4.9,  spark: spark(28, 5, 14, 51), primary: true },
      { id: 'cus-auto',    label: 'Auto-Resolution Rate',      value: 73,  format: 'percent', trend: 2.5,  spark: spark(71, 3, 14, 52) },
      { id: 'cus-aht',     label: 'Avg Handle Time',           value: 2.2, format: 'duration', unit: 'min', trend: -7.6, spark: spark(2, 1, 14, 53) },
      { id: 'cus-holds',   label: 'Holds Verified',            value: 134, format: 'number',  trend: 6.0,  spark: spark(19, 4, 14, 54) },
      { id: 'cus-stage',   label: 'Inspections Coordinated',   value: 19,  format: 'number',  trend: 11.2, spark: spark(3, 1, 14, 55) },
      { id: 'cus-stuck',   label: 'Stuck Releases Escalated',  value: 4,   format: 'number',  trend: -22.0, spark: spark(1, 1, 14, 56) },
    ],
  },
  {
    id: 'constraints',
    name: 'Constraints & Policy Agent',
    short: 'Constraints & Policy',
    subtitle: 'Mainsail · Spinnaker · Forecast',
    icon: 'signal',
    color: '#DB2777',
    description:
      'Explains export cutoffs, late-gate referrals, missed-slot extensions and constraint codes (e.g. "May Move Off-dock"). Routes late-gate decisions to the steamship line and missed-slot extensions to terminal ops.',
    examples: [
      '"Is this booking still open for receiving?"',
      '"Can I bring this export in after cutoff?"',
      '"I\'m 15 minutes late — can I still enter?"',
      '"Why does this say \'May Move Off-dock\'?"',
      '"Why was I turned away at the gate?"',
    ],
    channels: ['Email', 'Phone', 'Mainsail', 'Forecast'],
    triggerType: 'Email + Phone intake (Tier-0)',
    triggerDescription:
      'Looks up export cutoffs from Mainsail/Forecast, identifies cutoff status and constraint codes. Late-gate authority sits with the steamship line — agent routes correctly. Missed-slot extensions are routed to the gate supervisor.',
    config: [
      { key: 'Cutoff source', value: 'Mainsail + Forecast (vessel cutoff)' },
      { key: 'Constraint catalog', value: '18 constraint codes mapped' },
      { key: 'Late-gate authority', value: 'Steamship line (always external)' },
      { key: 'Missed-slot SLA', value: 'Same-day extension only' },
      { key: 'Auto-respond if', value: 'Cutoff lookup + ownership clear' },
      { key: 'HITL for', value: 'Constraint lifts, ambiguous cutoffs' },
    ],
    workflow: [
      { id: 'classify', label: 'Classify constraint', sub: 'cutoff / late / missed / code', kind: 'auto' },
      { id: 'lookup', label: 'Mainsail + Forecast', sub: 'cutoff + code', kind: 'auto' },
      { id: 'owner', label: 'Identify owner', sub: 'terminal / line / yard', kind: 'auto' },
      { id: 'explain', label: 'Explain + refer', sub: 'with referral path', kind: 'auto' },
      { id: 'route', label: 'Route to terminal', sub: 'extensions, code lifts', kind: 'hitl' },
    ],
    resolution: [
      { label: 'Auto-explained (cutoff/code)',  value: 70, color: '#22c55e' },
      { label: 'Referred to steamship line',     value: 14, color: '#3b82f6' },
      { label: 'Missed-slot extension routed',   value: 9,  color: '#10b981' },
      { label: 'Awaiting HITL',                  value: 5,  color: '#f59e0b' },
      { label: 'Failed / unresolved',            value: 2,  color: '#ef4444' },
    ],
    metrics: [
      { id: 'con-handled', label: 'Inquiries Handled',     value: 241, format: 'number',  trend: 7.1,  spark: spark(34, 6, 14, 61), primary: true },
      { id: 'con-auto',    label: 'Auto-Resolution Rate',  value: 70,  format: 'percent', trend: 3.8,  spark: spark(68, 4, 14, 62) },
      { id: 'con-aht',     label: 'Avg Handle Time',       value: 2.0, format: 'duration', unit: 'min', trend: -10.5, spark: spark(2, 1, 14, 63) },
      { id: 'con-cutoff',  label: 'Cutoff Inquiries',      value: 128, format: 'number',  trend: 5.4,  spark: spark(18, 4, 14, 64) },
      { id: 'con-late',    label: 'Late-Gate Referrals',   value: 31,  format: 'number',  trend: 1.7,  spark: spark(4, 2, 14, 65) },
      { id: 'con-codes',   label: 'Constraint Codes Explained', value: 56, format: 'number', trend: 9.2, spark: spark(8, 3, 14, 66) },
    ],
  },
];

export function buildHeadlineKpis(terminal, window) {
  const mult = WINDOW_MULT[window];
  const tShare = terminal === 'all' ? 1 : TERMINAL_VOLUME[terminal].conv / TERMINAL_VOLUME.all.conv;
  const totalHandled = AGENTS.reduce((s, a) => s + a.metrics[0].value, 0);
  const handled = Math.round(totalHandled * mult * tShare);
  const autoAvg = Math.round(AGENTS.reduce((s, a) => s + a.metrics[1].value, 0) / AGENTS.length);
  const ahtAvg = (AGENTS.reduce((s, a) => s + a.metrics[2].value, 0) / AGENTS.length).toFixed(1);

  const deflected = Math.round(handled * (autoAvg / 100));
  const fteHours = (deflected * 4 / 60).toFixed(0);

  const demExplained = Math.round(1845000 * mult * tShare);
  const containers = Math.round(handled * 0.62);

  return {
    handled,
    autoAvg,
    ahtAvg,
    fteHours,
    deflected,
    demExplained,
    containers,
    hitlOpen: 11,
    slaBreaches: 3,
    email: Math.round(handled * 0.78),
    phone: Math.round(handled * 0.22),
  };
}

export function terminalSplit(window) {
  const mult = WINDOW_MULT[window];
  return ['t18', 't5', 'slc', 'zlo'].map(id => ({
    id, name: TERMINALS.find(t => t.id === id).name, short: TERMINALS.find(t => t.id === id).short,
    region: TERMINALS.find(t => t.id === id).region,
    conv: Math.round(TERMINAL_VOLUME[id].conv * mult),
    email: Math.round(TERMINAL_VOLUME[id].email * mult),
    phone: Math.round(TERMINAL_VOLUME[id].phone * mult),
  }));
}

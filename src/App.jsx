import React from 'react';
import { TERMINALS } from './data/agents';
import { useLive } from './hooks/useLive';
import { Icon } from './components/Icons';
import { Home, ActivityRail } from './components/Home';
import { AgentProfile } from './components/AgentProfile';
import { MyWork, ActivityPage, TaskDrawer } from './components/Work';

const VOICE_CALL_AUDIO = '/Carrix-VoiceAgent.mp3';

const futureHoursIso = (h) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Math.round(h * 60));
  return d.toISOString();
};

function buildVoiceTask(index) {
  const id = `VOX-${String(index).padStart(3, '0')}`;
  const container = 'CN4421';
  return {
    id,
    agentId: 'yard',
    terminal: 't18',
    status: 'success',
    summary: `Voice call — Container ${container} status (West Coast Drayage); Customs Hold active, release alert queued for ~16:00 tomorrow`,
    priority: 'medium',
    started: new Date().toISOString(),
    sla: futureHoursIso(21),
    source: 'Voice',
    objectId: container,
    voiceCall: {
      caller: 'West Coast Drayage — dispatch',
      callerPhone: '+1 (555) 014-2207',
      callerEmail: 'dispatch@westcoastdrayage.example',
      duration: '1m 28s',
      channel: 'Inbound voice (Tier-0 IVR → AI agent)',
      callRecordingUrl: VOICE_CALL_AUDIO,
      summary:
        `West Coast Drayage called about container ${container} — discharged ex Horizon Spirit, staged Row 12 · Stack C at T18, but with an active CBP Customs Hold expected to clear ~16:00 tomorrow. Caller opted into an SMS release alert for the 15:00 – 19:00 pickup window; operator follow-up queued in My Work.`,
      transcript: [
        { who: 'caller', text: 'Hi there.' },
        { who: 'agent',  text: 'Hello, you\'ve reached the Carrix Terminal Assistant. I see you\'re calling from West Coast Drayage. Are you calling to check on a container or an appointment today?' },
        { who: 'caller', text: 'Check on a container.' },
        { who: 'agent',  text: 'Got it. Could you please provide the container ID you\'d like to check on?' },
        { who: 'caller', text: 'I\'d like to check container ID CN4421.' },
        { who: 'agent',  text: 'One moment while I check the yard records… I see that container was discharged from the vessel Horizon Spirit this morning at 6 AM. It\'s currently staged in Row 12, Stack C of Terminal 18.' },
        { who: 'caller', text: 'Thank you. Can I collect it tomorrow during my appointment?' },
        { who: 'agent',  text: 'I see an active Customs Hold on the container, and based on current processing times, it\'s expected to clear by 4 PM tomorrow. The container should be available for pickup right after that, and I can see you have an allocated appointment window between 3 PM and 7 PM tomorrow. Would you like me to text you the moment the container is officially released so that you can coordinate accordingly?' },
        { who: 'caller', text: 'Yes, that would be helpful.' },
        { who: 'agent',  text: 'Great. I\'ve got you set up for a release alert, and I\'ll text you the moment the Customs Hold is lifted so you\'re ready for your 3 to 7 PM window tomorrow. Is there anything else I can help with?' },
        { who: 'caller', text: 'That\'s all. Thank you.' },
        { who: 'agent',  text: 'Thanks for calling Carrix — have a great day.' },
      ],
      sources: [
        { step: 1, label: 'Caller identification',   source: 'Voice IVR + Mainsail party records',          platforms: ['ivr', 'mainsail'],            result: 'West Coast Drayage · known dispatcher account · ANI matched', kind: 'auto' },
        { step: 2, label: 'Classify intent',         source: 'Carrix Voice NLU',                            platforms: ['nlu'],                        result: 'Container status inquiry · single-container scope', kind: 'auto' },
        { step: 3, label: 'Discharge lookup',        source: 'Mainsail (TOS)',                              platforms: ['mainsail'],                   result: `Ex "Horizon Spirit" · discharged 06:00 today · ${container}`, kind: 'auto' },
        { step: 4, label: 'Yard position',           source: 'Spinnaker',                                   platforms: ['spinnaker'],                  result: 'Row 12 · Stack C · Terminal 18', kind: 'auto' },
        { step: 5, label: 'Hold check',              source: 'Mainsail holds + Tide Works EDI (CBP feed)',  platforms: ['mainsail', 'tideworks'],      result: 'Active CBP Customs Hold · est. clear ~16:00 tomorrow', kind: 'branch' },
        { step: 6, label: 'Appointment cross-check', source: 'Mainsail + eModal',                           platforms: ['mainsail', 'emodal'],         result: 'Allocated pickup window 15:00 – 19:00 tomorrow', kind: 'auto' },
        { step: 7, label: 'Release-alert opt-in',    source: 'Carrix Voice Synthesis + Operator queue',     platforms: ['tts', 'operator-queue'],      result: 'Caller opted into SMS · operator follow-up queued in My Work', kind: 'auto' },
      ],
      sourcePlatforms: ['mainsail', 'spinnaker', 'emodal', 'tideworks'],
      pendingRelease: {
        container,
        vessel: 'Horizon Spirit',
        dischargedAt: '06:00 today',
        yardPosition: 'Row 12 · Stack C',
        holdCode: 'CBP Customs Hold',
        owner: 'CBP',
        expectedClear: '~16:00 tomorrow',
        terminal: 'Seattle T18',
        slot: '15:00 – 19:00 tomorrow',
        gateWindow: '15:00 – 19:00',
      },
    },
  };
}

export default function App() {
  const [view, setView] = React.useState('home');
  const [agentId, setAgentId] = React.useState(null);
  const [terminal, setTerminal] = React.useState('all');
  const [timeWindow, setTimeWindow] = React.useState('today');
  const [taskId, setTaskId] = React.useState(null);
  const [workTab, setWorkTab] = React.useState('all');

  const live = useLive(terminal, timeWindow);

  // Voice-call demo state
  const audioRef = React.useRef(null);
  const [audioPlaying, setAudioPlaying] = React.useState(false);
  const [audioError, setAudioError] = React.useState(null);
  const [voiceTasks, setVoiceTasks] = React.useState([]);
  const voiceCounterRef = React.useRef(0);

  const onAvatarClick = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (audioPlaying) return;
    setAudioError(null);
    try {
      el.currentTime = 0;
      await el.play();
      setAudioPlaying(true);
    } catch (e) {
      setAudioError(`Could not play ${VOICE_CALL_AUDIO} — ensure the file exists in /public.`);
      console.error('Voice-call audio failed:', e);
    }
  };

  const onAudioEnded = () => {
    setAudioPlaying(false);
    voiceCounterRef.current += 1;
    const task = buildVoiceTask(voiceCounterRef.current);
    setVoiceTasks(prev => [task, ...prev]);
    live.pushEvent({
      agentId: 'yard',
      type: 'task_completed',
      terminal: task.terminal,
      message: `Voice agent — Container query answered for ${task.objectId} (West Coast Drayage); CBP Customs Hold active, release alert queued for operator`,
    });
  };

  const navTabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'work', label: 'My Work', icon: 'inbox', count: live.hitlCount + voiceTasks.length },
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
      <audio ref={audioRef} src={VOICE_CALL_AUDIO} preload="auto" onEnded={onAudioEnded} />
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
          <button
            type="button"
            className="topbar-avatar"
            title="Maya Chen, Operations Lead"
            onClick={onAvatarClick}
            data-testid="avatar-voice-trigger"
          >
            MC
          </button>
        </div>
      </header>

      {audioError && (
        <div className="audio-error-banner">{audioError}</div>
      )}

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
          {view === 'work' && <MyWork terminal={terminal} onOpenTask={setTaskId} initialTab={workTab} extraTasks={voiceTasks} />}
          {view === 'activity' && <ActivityPage terminal={terminal} events={live.events} />}
        </main>
        {showRail && <ActivityRail events={live.events} terminal={terminal} />}
      </div>

      <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} extraTasks={voiceTasks} />
    </div>
  );
}

import React from 'react';

export function Icon({ name, size = 14, color, style }) {
  const s = { width: size, height: size, color, verticalAlign: 'middle', flexShrink: 0, ...(style || {}) };
  const props = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: s };
  switch (name) {
    case 'home': return (<svg {...props}><path d="M2.5 7L8 2.5 13.5 7v6a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7Z"/><path d="M6.5 14V9h3v5"/></svg>);
    case 'inbox': return (<svg {...props}><path d="M2.5 9h3l1 2h3l1-2h3"/><path d="M2.5 9V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v5"/><path d="M2.5 9v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9"/></svg>);
    case 'pulse': return (<svg {...props}><path d="M1.5 8h3l1.5-4 3 8 1.5-4h4"/></svg>);
    case 'search': return (<svg {...props}><circle cx="7" cy="7" r="4"/><path d="m13.5 13.5-3.5-3.5"/></svg>);
    case 'bell': return (<svg {...props}><path d="M4 12V8a4 4 0 0 1 8 0v4l1 1.5H3L4 12Z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>);
    case 'gear': return (<svg {...props}><circle cx="8" cy="8" r="2"/><path d="M8 1.5v1.5M8 13v1.5M3.4 3.4l1 1M11.6 11.6l1 1M1.5 8h1.5M13 8h1.5M3.4 12.6l1-1M11.6 4.4l1-1"/></svg>);
    case 'pause': return (<svg {...props}><rect x="4.5" y="3" width="2" height="10" rx="0.5"/><rect x="9.5" y="3" width="2" height="10" rx="0.5"/></svg>);
    case 'chart': return (<svg {...props}><path d="M2 13h12"/><rect x="3.5" y="8" width="2" height="4"/><rect x="7" y="5" width="2" height="7"/><rect x="10.5" y="9" width="2" height="3"/></svg>);
    case 'flow': return (<svg {...props}><rect x="1.5" y="2.5" width="4" height="3" rx="0.5"/><rect x="10.5" y="6.5" width="4" height="3" rx="0.5"/><rect x="1.5" y="10.5" width="4" height="3" rx="0.5"/><path d="M5.5 4h2a1 1 0 0 1 1 1v3M10.5 8h-2a1 1 0 0 0-1 1v3"/></svg>);
    case 'trend': return (<svg {...props}><path d="M2 11l3.5-3.5 2.5 2.5L13 5"/><path d="M10 5h3v3"/></svg>);
    case 'message': return (<svg {...props}><path d="M2.5 3.5h11v8H6l-3 2.5v-2.5H2.5v-8Z"/></svg>);
    case 'list': return (<svg {...props}><path d="M3 4h10M3 8h10M3 12h7"/></svg>);
    case 'bot': return (<svg {...props}><rect x="2.5" y="5" width="11" height="8" rx="1.5"/><path d="M8 2.5v2.5"/><circle cx="8" cy="2" r="0.5"/><circle cx="6" cy="9" r="0.6"/><circle cx="10" cy="9" r="0.6"/><path d="M6.5 11.5h3"/></svg>);
    case 'warn': return (<svg {...props}><path d="M8 2.5 14 13H2L8 2.5Z"/><path d="M8 6.5v3.5"/><circle cx="8" cy="11.7" r="0.5" fill="currentColor"/></svg>);
    case 'mail': return (<svg {...props}><rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="M2.5 4.5 8 9l5.5-4.5"/></svg>);
    case 'phone': return (<svg {...props}><path d="M3 2.5h2.5l1 3-1.5 1a8 8 0 0 0 4 4l1-1.5 3 1V13a1 1 0 0 1-1 1A11 11 0 0 1 2 3.5a1 1 0 0 1 1-1Z"/></svg>);
    case 'arrow-right': return (<svg {...props}><path d="M3 8h10M9 4l4 4-4 4"/></svg>);
    case 'check': return (<svg {...props}><path d="M3 8.5 6.5 12l7-8"/></svg>);
    case 'x': return (<svg {...props}><path d="M4 4l8 8M12 4l-8 8"/></svg>);
    case 'play': return (<svg {...props}><path d="M5 3.5v9l7-4.5-7-4.5Z"/></svg>);
    case 'calendar': return (<svg {...props}><rect x="2" y="3.5" width="12" height="10" rx="1"/><path d="M2 6.5h12M5.5 2v3M10.5 2v3"/></svg>);
    case 'package': return (<svg {...props}><path d="M2.5 5 8 2.5 13.5 5v6L8 13.5 2.5 11V5Z"/><path d="M2.5 5 8 7.5 13.5 5M8 7.5v6"/></svg>);
    case 'truck': return (<svg {...props}><rect x="1.5" y="5" width="8" height="6" rx="0.5"/><path d="M9.5 7h3l2 2v2h-5"/><circle cx="4" cy="12" r="1.2"/><circle cx="11.5" cy="12" r="1.2"/></svg>);
    case 'dollar': return (<svg {...props}><path d="M8 2.5v11M11 5.5c0-1-.8-2-3-2s-3 .9-3 2 1.2 1.7 3 2 3 .8 3 2-1.2 2-3 2-3-.9-3-2"/></svg>);
    case 'shield': return (<svg {...props}><path d="M8 2 3 4v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V4l-5-2Z"/><path d="M5.8 8 7.3 9.5 10.3 6.5"/></svg>);
    case 'signal': return (<svg {...props}><circle cx="8" cy="8" r="2"/><path d="M5 5a4 4 0 0 0 0 6M11 5a4 4 0 0 1 0 6M2.5 2.5a8 8 0 0 0 0 11M13.5 2.5a8 8 0 0 1 0 11"/></svg>);
    default: return null;
  }
}

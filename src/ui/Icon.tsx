import React from 'react';

const P: Record<string, React.ReactNode> = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  sound: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>,
  mute: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9l5 6M22 9l-5 6" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  full: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  cc: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 10.2a2.5 2.5 0 1 0 0 3.6M17 10.2a2.5 2.5 0 1 0 0 3.6" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  star: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />,
  flame: <path d="M12 21c-4 0-7-2.7-7-6.6 0-3.2 2.2-5.4 3.6-7 .4 1.8 1.3 3 2.4 3.6C11 7.5 12.6 4.6 15 3c-.2 2.6.8 4.5 2.2 6.2 1.1 1.4 1.8 3 1.8 5.1C19 18.3 16 21 12 21z" />,
  bolt: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.4-6.5 8-6.5s7 2 8 6.5" /></>,
  bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />,
  chev: <path d="M9 6l6 6-6 6" />,
  speed: <><path d="M12 13l4-4" /><path d="M4 18a9 9 0 1 1 16 0" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  backspace: <><path d="M21 5H9l-6 7 6 7h12z" /><path d="M12 9.5l5 5M17 9.5l-5 5" /></>,
};

export const Icon: React.FC<{name: keyof typeof P | string; size?: number; className?: string; stroke?: number}> = ({name, size = 20, className, stroke = 2.2}) => (
  <svg
    className={`icon ${className ?? ''}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{display: 'inline-block', flex: 'none'}}
  >
    {P[name]}
  </svg>
);

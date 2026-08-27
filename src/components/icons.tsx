import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function Base({
  size = 20,
  className,
  strokeWidth = 1.8,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.4v13.2a.6.6 0 0 0 .9.5l10.5-6.6a.6.6 0 0 0 0-1L8.9 4.9a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none" />
  </Base>
);

export const IconPause = (p: IconProps) => (
  <Base {...p}>
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" />
  </Base>
);

export const IconReset = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 3.5v5h5" />
  </Base>
);

export const IconSkip = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 5.6v12.8a.6.6 0 0 0 .93.5l9.57-6.4a.6.6 0 0 0 0-1L6.93 5.1a.6.6 0 0 0-.93.5z" fill="currentColor" stroke="none" />
    <path d="M19 5.5v13" />
  </Base>
);

export const IconGear = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6.5 9.5 17 4 11.5" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 6.5h17" />
    <path d="M8.5 6.5v-2a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2" />
    <path d="M18.5 6.5 17.6 19a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const IconMinus = (p: IconProps) => (
  <Base {...p}>
    <path d="M5.5 12h13" />
  </Base>
);

export const IconFlame = (p: IconProps) => (
  <Base {...p}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconVolume = (p: IconProps) => (
  <Base {...p}>
    <path d="M11 5.5 6.5 9H3.5a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h3L11 18.5z" fill="currentColor" stroke="none" />
    <path d="M15 9a4.24 4.24 0 0 1 0 6" />
    <path d="M17.7 6.3a8 8 0 0 1 0 11.4" />
  </Base>
);

export const IconVolumeOff = (p: IconProps) => (
  <Base {...p}>
    <path d="M11 5.5 6.5 9H3.5a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h3L11 18.5z" fill="currentColor" stroke="none" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M17.5 6.5l-11 11M6.5 6.5l11 11" />
  </Base>
);

export const IconCoffee = (p: IconProps) => (
  <Base {...p}>
    <path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M4 9.5h13V15a4.5 4.5 0 0 1-4.5 4.5h-4A4.5 4.5 0 0 1 4 15z" />
    <path d="M8 3.5c-.8 1 .8 1.6 0 2.6M12 3.5c-.8 1 .8 1.6 0 2.6" />
  </Base>
);

export const IconTarget = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </Base>
);

/** the house tomato — fruit in currentColor, leaves follow --leaf */
export const IconTomato = ({ size = 24, className }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-hidden="true">
    <path
      d="M12 7.3c-4.9 0-8.3 3.1-8.3 7.1 0 4.2 3.7 7.1 8.3 7.1s8.3-2.9 8.3-7.1c0-4-3.4-7.1-8.3-7.1z"
      fill="currentColor"
    />
    <path d="M12 7.5c-.7-2.3.1-4 2.5-5.1-.2 1.8-1 3.5-2.5 5.1z" fill="var(--leaf, #4fd6a4)" />
    <path d="M12 7.5c.7-2.3-.1-4-2.5-5.1.2 1.8 1 3.5 2.5 5.1z" fill="var(--leaf, #4fd6a4)" />
    <path d="M12.1 7.8c-1.6-1-3.2-1.1-4.9-.4 1.5 1.1 3.1 1.4 4.9 1.1z" fill="var(--leaf, #4fd6a4)" />
    <path d="M11.9 7.8c1.6-1 3.2-1.1 4.9-.4-1.5 1.1-3.1 1.4-4.9 1.1z" fill="var(--leaf, #4fd6a4)" />
    <circle cx="9" cy="13.4" r="1.1" fill="rgba(255,255,255,0.28)" />
  </svg>
);

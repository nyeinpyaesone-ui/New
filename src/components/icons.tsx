import type { ReactNode, CSSProperties } from "react";

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

const Base = ({
  size = 18,
  strokeWidth = 1.75,
  children,
  ...rest
}: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </Base>
);

export const IconSearch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L21 21" />
  </Base>
);

export const IconAnchor = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.2 1.2" />
    <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.2-1.2" />
  </Base>
);

export const IconPrompt = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 7l6 5-6 5" />
    <path d="M13 18h6" />
  </Base>
);

export const IconHex = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" />
    <path d="M9.2 15.5V9l5.6 6.5V9" />
  </Base>
);

export const IconWire = (p: IconProps) => (
  <Base {...p}>
    <circle cx="5" cy="12" r="2.2" />
    <circle cx="19" cy="12" r="2.2" />
    <path d="M7.2 12h9.6" strokeDasharray="2.6 2.4" />
  </Base>
);

export const IconBranch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6.5" cy="5.5" r="2.4" />
    <circle cx="6.5" cy="18.5" r="2.4" />
    <circle cx="17.5" cy="8" r="2.4" />
    <path d="M6.5 7.9v8.2" />
    <path d="M17.5 10.4c0 3.6-3.6 4.1-8 4.4" />
  </Base>
);

export const IconFileBin = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 2.8h8l4 4V21a.8.8 0 0 1-.8.8H6A.8.8 0 0 1 5.2 21V3.6A.8.8 0 0 1 6 2.8z" />
    <path d="M14 2.8V7h4" />
    <path d="M8.5 12h2l1 2.4 1.6-4 1 1.6h1.9" />
  </Base>
);

export const IconSignal = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 18.5h2.5l2-4 2.5 6 2.5-10 2 7 1.5-3h3" />
  </Base>
);

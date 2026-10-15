import { useId } from "react";

export function FolderIcon() {
  const id = useId();
  return (
    <svg viewBox="0 0 96 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-back`} x1="48" y1="9" x2="48" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--folder-back-top)" />
          <stop offset="1" stopColor="var(--folder-back-bottom)" />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="48" y1="27" x2="48" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--folder-front-top)" />
          <stop offset="1" stopColor="var(--folder-front-bottom)" />
        </linearGradient>
      </defs>
      <path d="M7 17a7 7 0 0 1 7-7h22c2.7 0 4.3 1.2 6.1 3.6L47 20h35a7 7 0 0 1 7 7v36a8 8 0 0 1-8 8H15a8 8 0 0 1-8-8V17Z" fill={`url(#${id}-back)`} />
      <path d="M7 28a6 6 0 0 1 6-6h24.5c2.4 0 3.9-.7 5.7-2.4l2.3-2.2A5 5 0 0 1 49 16h33a7 7 0 0 1 7 7v7H7v-2Z" fill="var(--folder-lip)" />
      <rect x="6.5" y="27.5" width="83" height="44" rx="6.5" fill={`url(#${id}-front)`} stroke="var(--folder-edge)" />
      <path d="M13 28h70" stroke="white" strokeOpacity=".55" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon() {
  const id = useId();
  return (
    <svg viewBox="0 0 96 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-paper`} x1="48" y1="7" x2="48" y2="73" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="var(--paper-bottom)" />
        </linearGradient>
      </defs>
      <path d="M25 7h34l13 13v49a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4Z" fill={`url(#${id}-paper)`} stroke="var(--paper-edge)" />
      <path d="M59 7v10a3 3 0 0 0 3 3h10" fill="var(--paper-fold)" />
      <path d="M59 7v10a3 3 0 0 0 3 3h10" stroke="var(--paper-edge)" />
      <rect x="31" y="30" width="31" height="4" rx="1" fill="var(--paper-heading)" />
      <path d="M31 43h31M31 49h31M31 55h23" stroke="var(--paper-line)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  className?: string
}

export default function Logo({ className = 'w-8 h-8' }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle with gradient */}
      <circle cx="24" cy="24" r="22" fill="url(#logo-gradient1)" stroke="url(#logo-gradient-stroke)" strokeWidth="2" />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="logo-gradient1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#7B2FBE" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#161B22" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="logo-gradient-stroke" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="50%" stopColor="#7B2FBE" />
          <stop offset="100%" stopColor="#FF006E" />
        </linearGradient>
      </defs>

      {/* Bar chart */}
      <rect x="10" y="28" width="4" height="10" rx="1" fill="#00D4FF" opacity="0.9" />
      <rect x="16" y="24" width="4" height="14" rx="1" fill="#00D4FF" opacity="0.9" />
      <rect x="22" y="18" width="4" height="20" rx="1" fill="#7B2FBE" opacity="0.9" />
      <rect x="28" y="22" width="4" height="16" rx="1" fill="#7B2FBE" opacity="0.9" />

      {/* Line chart overlay */}
      <path
        d="M 10 32 L 16 26 L 22 28 L 28 20 L 34 24"
        stroke="#00D4FF"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx="10" cy="32" r="2" fill="#00D4FF" />
      <circle cx="16" cy="26" r="2" fill="#00D4FF" />
      <circle cx="22" cy="28" r="2" fill="#7B2FBE" />
      <circle cx="28" cy="20" r="2" fill="#7B2FBE" />
      <circle cx="34" cy="24" r="2" fill="#FF006E" />

      {/* Magnifying glass */}
      <circle cx="34" cy="34" r="5" fill="none" stroke="#00D4FF" strokeWidth="2" />
      <line x1="37.5" y1="37.5" x2="42" y2="42" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Glow effect */}
      <circle cx="24" cy="24" r="22" fill="url(#logo-glow)" opacity="0.3" />
      <defs>
        <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

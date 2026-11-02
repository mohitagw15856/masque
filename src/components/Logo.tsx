export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <defs>
        <linearGradient id="mq-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7a59" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path
        d="M32 6c14 0 24 8 24 20 0 15-10 30-24 32C18 56 8 41 8 26 8 14 18 6 32 6z"
        fill="url(#mq-g)"
      />
      <path d="M19 24c3-4 8-4 11 0" fill="none" stroke="#1b1530" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M34 24c3-4 8-4 11 0" fill="none" stroke="#1b1530" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M21 37c6 7 16 7 22 0" fill="none" stroke="#1b1530" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M50 52l10 6-4-10" fill="#a855f7" />
    </svg>
  );
}

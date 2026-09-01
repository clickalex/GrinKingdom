export default function Mascot({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="#7C3AED" />
      {/* continents */}
      <path
        d="M26 44c8-10 20-12 30-8 6 2 10 6 8 12-2 7-10 8-14 5-3-2-4 1-5 4-2 5-8 5-12 3-5-2-8-8-7-16z"
        fill="#43C06E"
        opacity="0.9"
      />
      <path
        d="M60 32c10-3 21 2 24 10 3 7-1 14-9 17-8 3-17-1-19-9-2-7 1-15 4-18z"
        fill="#22C55E"
        opacity="0.8"
      />
      <path
        d="M78 66c5 2 9 6 10 12 1 6-3 12-9 13-6 1-12-3-13-9-1-6 3-12 8-15 1-1 2-1 4-1z"
        fill="#43C06E"
        opacity="0.9"
      />
      {/* eyes */}
      <ellipse cx="47" cy="58" rx="6" ry="7" fill="#241F37" />
      <ellipse cx="73" cy="58" rx="6" ry="7" fill="#241F37" />
      <circle cx="49" cy="55" r="2.2" fill="#fff" />
      <circle cx="75" cy="55" r="2.2" fill="#fff" />
      {/* grin */}
      <path d="M45 72c9 8 21 8 30 0" stroke="#241F37" strokeWidth="5" strokeLinecap="round" />
      {/* cheeks */}
      <circle cx="37" cy="71" r="5.5" fill="#FF5C8A" opacity="0.55" />
      <circle cx="83" cy="71" r="5.5" fill="#FF5C8A" opacity="0.55" />
    </svg>
  )
}

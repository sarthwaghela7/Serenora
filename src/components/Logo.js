import { useId } from "react";

export default function Logo({ size = 36, className = "", animate = false }) {
  const uid = useId().replace(/:/g, "");
  const gradId  = `sg-${uid}`;
  const ringId  = `sr-${uid}`;
  const glowId  = `sglow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`serenora-logo${animate ? " logo-animate" : ""}${className ? ` ${className}` : ""}`}
      aria-label="Serenora"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fdf497" />
          <stop offset="30%"  stopColor="#fd5949" />
          <stop offset="65%"  stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285aeb" />
        </linearGradient>

        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fdf497" stopOpacity="0.6" />
          <stop offset="33%"  stopColor="#fd5949" stopOpacity="0.6" />
          <stop offset="67%"  stopColor="#d6249f" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#285aeb" stopOpacity="0.6" />
        </linearGradient>

        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer gem ring */}
      <circle
        cx="20" cy="20" r="19"
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth="0.6"
        opacity="0.55"
      />

      {/* Dark base circle */}
      <circle cx="20" cy="20" r="17.5" fill="#070710" />

      {/* Subtle inner glow */}
      <circle cx="20" cy="20" r="17.5" fill={`url(#${ringId})`} opacity="0.05" />

      {/* Gradient S */}
      <text
        x="20.5"
        y="27"
        textAnchor="middle"
        fontFamily="'Sora', 'DM Sans', Georgia, serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-0.5"
        fill={`url(#${gradId})`}
        filter={`url(#${glowId})`}
      >
        S
      </text>
    </svg>
  );
}
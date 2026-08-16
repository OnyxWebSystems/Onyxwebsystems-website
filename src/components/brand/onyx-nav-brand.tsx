import { cn } from "@/lib/utils";

function OnyxFaviconMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="ox-brand-mark"
      overflow="visible"
      aria-hidden="true"
    >
      <g className="ox-brand-cards" transform="translate(18 17.5) rotate(-10)">
        {[4, 3, 2, 1, 0].map((i) => (
          <rect
            key={i}
            className="ox-brand-card"
            x={-6.2}
            y={-8.4}
            width="12.4"
            height="16.8"
            rx="0.7"
            fill="#ffffff"
            stroke="#0a0a0a"
            strokeWidth="1.08"
            style={{ ["--i" as string]: i }}
          />
        ))}
      </g>
    </svg>
  );
}

export function OnyxNavBrand({ className }: { className?: string }) {
  return (
    <span className={cn("ox-brand inline-flex items-center gap-3", className)}>
      <span className="ox-brand-name whitespace-nowrap text-[22px] uppercase leading-none tracking-[0.16em] sm:text-[26px]">
        onyxwebsystems
      </span>
      <OnyxFaviconMark />
    </span>
  );
}

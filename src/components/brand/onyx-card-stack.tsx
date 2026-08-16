import { cn } from "@/lib/utils";

export function OnyxCardStack({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("ox-brand-mark", className)}
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

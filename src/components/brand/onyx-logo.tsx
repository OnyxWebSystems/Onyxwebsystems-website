import Image from "next/image";
import { cn } from "@/lib/utils";

export function OnyxLogo({
  className,
  size = 88,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/onyx-circle.png"
      alt="onyxwebsystems"
      width={size}
      height={size}
      className={cn("rounded-full bg-white object-cover", className)}
      style={{ width: size, height: size }}
      priority
    />
  );
}

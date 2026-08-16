import { cn } from "@/lib/utils";
import { OnyxCardStack } from "@/components/brand/onyx-card-stack";

export function OnyxNavBrand({ className }: { className?: string }) {
  return (
    <span className={cn("ox-brand inline-flex items-center gap-3", className)}>
      <span className="ox-brand-name whitespace-nowrap text-[22px] uppercase leading-none tracking-[0.16em] sm:text-[26px]">
        onyxwebsystems
      </span>
      <OnyxCardStack size={30} />
    </span>
  );
}

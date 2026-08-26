import { cn } from "@/lib/utils";
import { OnyxCardStack } from "@/components/brand/onyx-card-stack";

export function OnyxNavBrand({ className }: { className?: string }) {
  return (
    <span className={cn("ox-brand inline-flex items-center gap-2 md:gap-3", className)}>
      <span className="ox-brand-name whitespace-nowrap text-[15px] uppercase leading-none tracking-[0.08em] min-[380px]:text-[17px] min-[380px]:tracking-[0.1em] sm:text-[20px] lg:text-[26px] lg:tracking-[0.16em]">
        onyxwebsystems
      </span>
      <OnyxCardStack size={22} className="lg:hidden" />
      <OnyxCardStack size={30} className="hidden lg:block" />
    </span>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";
import styles from "./services.module.css";

export function LogoSwap({
  whiteSrc,
  blackSrc,
  alt,
}: {
  whiteSrc: string;
  blackSrc: string;
  alt: string;
}) {
  return (
    <div className={styles.logoSwap} tabIndex={0} aria-label={`${alt}. Hover or focus to see the black bag.`}>
      <div className={styles.logoSwapFrame}>
        <Image
          src={whiteSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 28vw, 90vw"
          className={cn(styles.logoLayer, styles.logoWhite, "object-contain")}
          priority
        />
        <Image
          src={blackSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 28vw, 90vw"
          className={cn(styles.logoLayer, styles.logoBlack, "object-contain")}
        />
      </div>
    </div>
  );
}

export function LogoStage({ src, alt, animate = true }: { src: string; alt: string; animate?: boolean }) {
  return (
    <div className={styles.logoStage}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 28vw, 90vw"
        className={cn("object-cover", animate && styles.logoEnter)}
        priority
      />
    </div>
  );
}

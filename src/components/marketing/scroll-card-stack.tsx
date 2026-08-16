"use client";

import { useEffect, useState } from "react";

type Pose = {
  x: number;
  y: number;
  rot: number;
  scale: number;
  opacity: number;
  spread: number;
};

const CARD_COUNT = 5;

const WAYPOINTS: { at: number; pose: Pose }[] = [
  { at: 0, pose: { x: 72, y: 48, rot: -10, scale: 1, opacity: 1, spread: 16 } },
  { at: 0.08, pose: { x: 68, y: 38, rot: -2, scale: 1.05, opacity: 1, spread: 18 } },
  { at: 0.18, pose: { x: 78, y: 28, rot: 8, scale: 0.98, opacity: 0.95, spread: 8 } },
  { at: 0.3, pose: { x: 42, y: 32, rot: -14, scale: 0.92, opacity: 0.88, spread: 4 } },
  { at: 0.42, pose: { x: 22, y: 52, rot: 10, scale: 0.9, opacity: 0.82, spread: 2 } },
  { at: 0.54, pose: { x: 48, y: 70, rot: -8, scale: 0.88, opacity: 0.78, spread: 6 } },
  { at: 0.66, pose: { x: 82, y: 62, rot: 12, scale: 0.86, opacity: 0.8, spread: 10 } },
  { at: 0.78, pose: { x: 70, y: 78, rot: -16, scale: 0.84, opacity: 0.84, spread: 14 } },
  { at: 0.9, pose: { x: 84, y: 84, rot: -6, scale: 0.82, opacity: 0.86, spread: 16 } },
  { at: 1, pose: { x: 86, y: 86, rot: -10, scale: 0.8, opacity: 0.88, spread: 18 } },
];

const FAN_OFFSETS = [
  { x: 210, y: -190, rot: 14 },
  { x: 360, y: 40, rot: -18 },
  { x: -400, y: 30, rot: 20 },
  { x: 300, y: 240, rot: -10 },
  { x: -370, y: -130, rot: 24 },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    rot: lerp(a.rot, b.rot, t),
    scale: lerp(a.scale, b.scale, t),
    opacity: lerp(a.opacity, b.opacity, t),
    spread: lerp(a.spread, b.spread, t),
  };
}

function poseAt(progress: number): Pose {
  const p = clamp(progress);
  for (let i = 0; i < WAYPOINTS.length - 1; i += 1) {
    const from = WAYPOINTS[i];
    const to = WAYPOINTS[i + 1];
    if (p >= from.at && p <= to.at) {
      const t = (p - from.at) / (to.at - from.at);
      return mixPose(from.pose, to.pose, t);
    }
  }
  return WAYPOINTS[WAYPOINTS.length - 1].pose;
}

function fanAmount(progress: number) {
  if (progress < 0.06) return 0;
  if (progress < 0.16) return clamp((progress - 0.06) / 0.1);
  const pulse = 0.82 + 0.18 * Math.sin(progress * Math.PI * 4);
  if (progress < 0.86) return pulse;
  return pulse * (1 - clamp((progress - 0.86) / 0.12));
}

export function ScrollCardStack() {
  const [progress, setProgress] = useState(0);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [band, setBand] = useState<{ top: number; bottom: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const captureOrigin = () => {
      const slot = document.getElementById("ox-hero-card-slot");
      if (!slot) return;
      const rect = slot.getBoundingClientRect();
      setOrigin({
        x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
        y: ((rect.top + window.scrollY + rect.height / 2) / window.innerHeight) * 100,
      });
    };

    captureOrigin();
    const frame = window.requestAnimationFrame(captureOrigin);
    window.addEventListener("resize", captureOrigin);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", captureOrigin);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    let ticking = false;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
      const el = document.getElementById("ox-services-band");
      if (!el) {
        setBand(null);
      } else {
        const rect = el.getBoundingClientRect();
        setBand({ top: rect.top, bottom: rect.bottom });
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  const pose = poseAt(progress);
  const fan = fanAmount(progress);
  const leave = origin ? clamp(progress / 0.12) : 0;
  const x = origin ? lerp(origin.x, pose.x, leave) : pose.x;
  const y = origin ? lerp(origin.y, pose.y, leave) : pose.y;

  return (
    <div className="ox-scroll-stack" aria-hidden="true">
      {Array.from({ length: CARD_COUNT }, (_, i) => {
        const stackX = i * pose.spread * -1;
        const stackY = i * pose.spread * -0.62;
        const morph = 0.7 + 0.3 * Math.sin(progress * Math.PI * 3.2 + i * 0.8);
        const wanderX = Math.sin(progress * Math.PI * 10 + i * 1.35) * (progress * 28 + fan * 90);
        const wanderY = Math.cos(progress * Math.PI * 7.5 + i * 0.9) * (progress * 22 + fan * 78);
        const fanX = FAN_OFFSETS[i].x * fan * morph + wanderX;
        const fanY = FAN_OFFSETS[i].y * fan * morph + wanderY;
        const rot =
          pose.rot + FAN_OFFSETS[i].rot * fan + Math.sin(progress * Math.PI * 6 + i) * (progress * 8 + fan * 10);
        const cardY = (y / 100) * (typeof window === "undefined" ? 0 : window.innerHeight) + stackY + fanY;
        const onDark = Boolean(band && cardY >= band.top && cardY <= band.bottom);

        return (
          <div
            key={i}
            className={onDark ? "ox-scroll-card ox-scroll-card-on-dark" : "ox-scroll-card"}
            style={{
              left: `${x}vw`,
              top: `${y}vh`,
              opacity: pose.opacity,
              transform: `translate(-50%, -50%) translate(${stackX + fanX}px, ${stackY + fanY}px) rotate(${rot}deg) scale(${pose.scale})`,
              zIndex: CARD_COUNT - i,
            }}
          />
        );
      })}
    </div>
  );
}

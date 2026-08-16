"use client";

import { useEffect, useRef, useState } from "react";

const GRID = 48;
const INFLUENCE = 160;
const FOLLOW = 0.07;
const DISPLACE = 7;
const GLOW = 210;

function canAnimate() {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function servicesBand() {
  const el = document.getElementById("ox-services-band");
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) return null;
  return { top: rect.top, bottom: rect.bottom };
}

export function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const sync = () => setLive(canAnimate());
    sync();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    motion.addEventListener("change", sync);
    hover.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      motion.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("ox-grid-live", live);
    return () => document.documentElement.classList.remove("ox-grid-live");
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = true;
    let hovering = false;
    let strength = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let cursorX = -9999;
    let cursorY = -9999;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const displace = (x: number, y: number) => {
      const dx = x - cursorX;
      const dy = y - cursorY;
      const dist = Math.hypot(dx, dy);
      if (dist >= INFLUENCE || dist < 0.001) return { x, y, t: 0 };
      const t = 1 - dist / INFLUENCE;
      const falloff = t * t * (3 - 2 * t) * strength;
      const pull = falloff * FOLLOW * INFLUENCE;
      const bulge = falloff * DISPLACE;
      const nx = dx / dist;
      const ny = dy / dist;
      return {
        x: x - nx * pull + nx * bulge,
        y: y - ny * pull + ny * bulge,
        t: falloff,
      };
    };

    const stroke = (light: boolean, peak: number) => {
      const alpha = light ? 0.08 + 0.12 * peak : 0.035 + 0.07 * peak;
      ctx.strokeStyle = light ? `rgba(255, 255, 255, ${alpha})` : `rgba(10, 10, 10, ${alpha})`;
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, vertical: boolean, light: boolean) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const near = Math.hypot(midX - cursorX, midY - cursorY) < INFLUENCE + GRID;
      ctx.beginPath();
      if (!near || strength < 0.02) {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        stroke(light, 0);
        ctx.stroke();
        return;
      }

      const steps = vertical ? Math.ceil(height / 14) : Math.ceil(width / 14);
      let peak = 0;
      for (let i = 0; i <= steps; i += 1) {
        const p = i / steps;
        const x = vertical ? x1 : width * p;
        const y = vertical ? height * p : y1;
        const point = displace(x, y);
        peak = Math.max(peak, point.t);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      stroke(light, peak);
      ctx.stroke();
    };

    const drawGrid = (light: boolean) => {
      const originX = -((window.scrollX || 0) % GRID);
      const originY = -((window.scrollY || 0) % GRID);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "butt";
      for (let x = originX; x <= width + GRID; x += GRID) {
        drawLine(x, 0, x, height, true, light);
      }
      for (let y = originY; y <= height + GRID; y += GRID) {
        drawLine(0, y, width, y, false, light);
      }
    };

    const drawGlow = (light: boolean) => {
      if (strength <= 0.01) return;
      const rgb = light ? "255, 255, 255" : "10, 10, 10";
      const glow = ctx.createRadialGradient(cursorX, cursorY, 18, cursorX, cursorY, GLOW);
      glow.addColorStop(0, `rgba(${rgb}, ${0.055 * strength})`);
      glow.addColorStop(0.4, `rgba(${rgb}, ${0.02 * strength})`);
      glow.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    };

    const curveY = () => Math.min(width * 0.22, 280);

    const servicesShape = (band: { top: number; bottom: number }) => {
      const ry = curveY();
      ctx.beginPath();
      ctx.moveTo(0, band.bottom);
      ctx.lineTo(0, band.top + ry);
      ctx.ellipse(width / 2, band.top + ry, width / 2, ry, 0, Math.PI, 0, true);
      ctx.lineTo(width, band.bottom);
      ctx.closePath();
    };

    const paint = (animated: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const band = servicesBand();
      const inBand = Boolean(band && cursorY >= band.top + curveY() * 0.15 && cursorY <= band.bottom);

      if (!animated) strength = 0;
      if (!inBand) drawGlow(false);
      drawGrid(false);

      if (band) {
        ctx.fillStyle = "#0a0a0a";
        servicesShape(band);
        ctx.fill();
        ctx.save();
        servicesShape(band);
        ctx.clip();
        if (animated) drawGlow(true);
        drawGrid(true);
        ctx.restore();
      }
    };

    const render = () => {
      if (!running) return;
      cursorX += (pointerX - cursorX) * 0.16;
      cursorY += (pointerY - cursorY) * 0.16;
      strength += ((hovering ? 1 : 0) - strength) * (hovering ? 0.12 : 0.06);
      paint(true);

      if (hovering || strength > 0.008) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = 0;
        paint(false);
      }
    };

    const kick = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      hovering = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      kick();
    };

    const onLeave = () => {
      hovering = false;
      kick();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onLeave();
    };

    const onScroll = () => {
      if (!hovering && strength < 0.01) paint(false);
      else kick();
    };

    resize();
    paint(false);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [live]);

  return (
    <div className="ox-live-grid" aria-hidden="true">
      {live ? <canvas ref={canvasRef} /> : <div className="ox-live-grid-static" />}
    </div>
  );
}

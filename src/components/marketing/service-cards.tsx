"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const SERVICES = [
  {
    id: "bos",
    index: "01",
    title: "Business Operating Systems",
    body: "Front desk, pipeline, ops, and follow-ups — running as one system.",
    href: "/services#bos",
    src: "/videos/bos.mp4",
    image: "/videos/bos.jpg",
  },
  {
    id: "apps",
    index: "02",
    title: "App Development",
    body: "Custom web and mobile products shaped around how you actually operate.",
    href: "/services#apps",
    src: "/videos/app.mp4",
    image: "/videos/app.jpg",
  },
  {
    id: "web",
    index: "03",
    title: "Web Development",
    body: "Premium sites, booking flows, and dashboards designed to convert.",
    href: "/services#web",
    src: "/videos/web.mp4",
    image: "/videos/web.jpg",
  },
] as const;

function canHoverPlay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function ServiceCard({ service }: { service: (typeof SERVICES)[number] }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function playVideo() {
    const video = videoRef.current;
    if (!video || !canHoverPlay()) return;
    void video.play().catch(() => undefined);
  }

  function stopVideo() {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  return (
    <Link
      href={service.href}
      className="ox-service-card group relative isolate block h-[26rem] overflow-hidden border border-black md:h-[32rem]"
      aria-label={`${service.title}. ${service.body}`}
      onPointerEnter={playVideo}
      onPointerLeave={stopVideo}
      onFocus={playVideo}
      onBlur={stopVideo}
    >
      <Image
        src={service.image}
        alt=""
        fill
        sizes="(min-width: 768px) 30vw, 100vw"
        className="ox-service-still object-cover"
        priority
      />
      <video
        ref={videoRef}
        className="ox-service-video absolute inset-0 h-full w-full object-cover"
        muted
        loop
        playsInline
        preload="auto"
        poster={service.image}
        aria-hidden="true"
      >
        <source src={service.src} type="video/mp4" />
      </video>
      <div className="ox-service-scrim absolute inset-0" />
      <div className="relative flex h-full flex-col justify-between p-6 text-white">
        <span className="text-xs tracking-[0.22em] text-white/70">{service.index}</span>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{service.title}</h3>
          <div className="ox-service-rule mt-3 h-px bg-white" />
          <p className="ox-service-copy mt-4 max-w-xs text-sm leading-relaxed text-white/85">{service.body}</p>
        </div>
      </div>
    </Link>
  );
}

export function ServiceCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-2xl font-semibold tracking-tight">Three ways we work with you</h2>
      <p className="mt-2 max-w-2xl text-sm text-[#5c5c5c]">
        Pick a lane — or combine them into a complete operating system for your business.
      </p>
      <div className="ox-service-grid mt-10 grid gap-5 md:grid-cols-3">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}

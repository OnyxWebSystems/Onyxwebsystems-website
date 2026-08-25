"use client";

import { useEffect, useRef, useState } from "react";
import { ServicesButton } from "./services-link";
import styles from "./services.module.css";

const VIDEO_SRC = "/work/thrift-rotate-testimonial.mp4";

export function TestimonialButton({ label = "View testimonial" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, [open]);

  return (
    <>
      <ServicesButton onClick={() => setOpen(true)}>{label}</ServicesButton>
      {open ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="thrift-testimonial-title"
          onClick={() => setOpen(false)}
        >
          <div className={styles.lightboxFrame} onClick={(event) => event.stopPropagation()}>
            <p id="thrift-testimonial-title" className="mb-4 text-xs uppercase tracking-[0.18em] text-white/70">
              Thrift Rotate · Testimonial
            </p>
            <button
              ref={closeRef}
              type="button"
              className={styles.lightboxClose}
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <video
              ref={videoRef}
              className="aspect-video w-full border border-white bg-black"
              controls
              playsInline
              preload="metadata"
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
        </div>
      ) : null}
    </>
  );
}

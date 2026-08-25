"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ServicesButton } from "./services-link";
import styles from "./services.module.css";

const VIDEO_SRC = "/work/thrift-rotate-testimonial.mp4";

export function TestimonialButton({ label = "View testimonial" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    void videoRef.current?.play().catch(() => undefined);

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

  function close() {
    setOpen(false);
  }

  const dialog =
    open && mounted
      ? createPortal(
          <div className={styles.lightbox} role="dialog" aria-modal="true" aria-labelledby="thrift-testimonial-title">
            <button type="button" className={styles.lightboxBackdrop} onClick={close} aria-label="Close testimonial" />
            <div className={styles.lightboxPanel}>
              <div className={styles.lightboxBar}>
                <p id="thrift-testimonial-title" className={styles.lightboxTitle}>
                  Thrift Rotate · Testimonial
                </p>
                <button ref={closeRef} type="button" className={styles.lightboxClose} onClick={close}>
                  Close
                </button>
              </div>
              <video
                ref={videoRef}
                className={styles.lightboxVideo}
                controls
                playsInline
                preload="auto"
                controlsList="nodownload"
              >
                <source src={VIDEO_SRC} type="video/mp4" />
              </video>
              <button type="button" className={styles.lightboxCloseBottom} onClick={close}>
                Close video
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <ServicesButton onClick={() => setOpen(true)}>{label}</ServicesButton>
      {dialog}
    </>
  );
}

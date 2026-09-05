"use client";

import { useEffect, useLayoutEffect } from "react";

export function LandingMotion() {
  useLayoutEffect(() => {
    document.documentElement.classList.add("motion-ready");
    return () => document.documentElement.classList.remove("motion-ready");
  }, []);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-scene]"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        target.classList.add("is-visible");
        if (target.hasAttribute("data-scene")) target.classList.add("is-playing");
        observer.unobserve(target);
      }
    }, { rootMargin: "0px 0px -14%", threshold: 0.12 });
    revealTargets.forEach((target) => observer.observe(target));

    const nav = document.querySelector<HTMLElement>(".rebuild-nav");
    const onScroll = () => nav?.classList.toggle("is-compact", window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const pointerScenes = Array.from(document.querySelectorAll<HTMLElement>("[data-pointer-scene]"));
    const cleanups = pointerScenes.map((scene) => {
      const onMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        const rect = scene.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        scene.style.setProperty("--pointer-x", x.toFixed(3));
        scene.style.setProperty("--pointer-y", y.toFixed(3));
      };
      const onLeave = () => { scene.style.setProperty("--pointer-x", "0"); scene.style.setProperty("--pointer-y", "0"); };
      scene.addEventListener("pointermove", onMove);
      scene.addEventListener("pointerleave", onLeave);
      return () => { scene.removeEventListener("pointermove", onMove); scene.removeEventListener("pointerleave", onLeave); };
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}

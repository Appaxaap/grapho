"use client";

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".studio");
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("studio-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    // Only animate offscreen elements; above-the-fold content never disappears on hydration.
    root.querySelectorAll<HTMLElement>("[data-studio-reveal]").forEach(element => {
      if (preference.matches || element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add("studio-pending");
      observer.observe(element);
    });
    const anchors = root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const onAnchor = (event: Event) => {
      const anchor = event.currentTarget as HTMLAnchorElement;
      const target = document.getElementById(anchor.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: preference.matches ? "instant" : "smooth" });
      history.replaceState(null, "", anchor.hash);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    anchors.forEach(anchor => anchor.addEventListener("click", onAnchor));
    return () => {
      observer.disconnect();
      anchors.forEach(anchor => anchor.removeEventListener("click", onAnchor));
      root.querySelectorAll(".studio-pending").forEach(element => element.classList.remove("studio-pending"));
    };
  }, []);
  return null;
}

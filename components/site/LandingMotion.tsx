"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".studio");
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    const setupScroll = () => {
      lenis?.destroy();
      lenis = undefined;
      if (!preference.matches) {
        lenis = new Lenis({
          autoRaf: true,
          duration: 1.05,
          smoothWheel: true,
          syncTouch: false,
          prevent: node => node.hasAttribute("data-lenis-prevent") || node.tagName === "TEXTAREA",
        });
      }
      root.dataset.scrollEngine = lenis ? "lenis" : "native";
    };
    setupScroll();
    preference.addEventListener("change", setupScroll);
    const updateProgress = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      root.style.setProperty("--studio-progress", String(total > 0 ? scrollY / total : 0));
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    const chapters = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("studio-chapter-seen");
        chapters.unobserve(entry.target);
      });
    }, { threshold: .12 });
    root.querySelectorAll("main > section, .studio-footer").forEach(section => chapters.observe(section));
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
      const click = event as MouseEvent;
      if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || click.button > 0) return;
      const anchor = event.currentTarget as HTMLAnchorElement;
      const target = document.getElementById(anchor.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -32 });
      else target.scrollIntoView({ behavior: "instant" });
      history.replaceState(null, "", anchor.hash);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    anchors.forEach(anchor => anchor.addEventListener("click", onAnchor));
    return () => {
      observer.disconnect();
      chapters.disconnect();
      lenis?.destroy();
      preference.removeEventListener("change", setupScroll);
      window.removeEventListener("scroll", updateProgress);
      delete root.dataset.scrollEngine;
      anchors.forEach(anchor => anchor.removeEventListener("click", onAnchor));
      root.querySelectorAll(".studio-pending").forEach(element => element.classList.remove("studio-pending"));
    };
  }, []);
  return null;
}

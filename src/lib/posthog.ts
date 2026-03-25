import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (posthog.__loaded) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: { maskAllInputs: false },
    persistence: "localStorage",
  });
}

export function identifyUser(userId: string, props: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, props);
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

export default posthog;

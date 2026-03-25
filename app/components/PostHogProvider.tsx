"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, trackEvent } from "@/lib/posthog";
import { useUser } from "./UserContext";
import posthog from "posthog-js";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { email, role, username, isAuthenticated } = useUser();

  // Init au montage
  useEffect(() => {
    initPostHog();
  }, []);

  // Identifier l'utilisateur
  useEffect(() => {
    if (!isAuthenticated || !email) return;
    posthog.identify(email, { email, role, username });
  }, [isAuthenticated, email, role, username]);

  // Tracker les changements de page
  useEffect(() => {
    if (!pathname) return;
    trackEvent("$pageview", { path: pathname, search: searchParams?.toString() });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

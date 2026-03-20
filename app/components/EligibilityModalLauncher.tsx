"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import EligibilityTunnel from "./EligibilityTunnel";

type Props = {
  isAuthenticated: boolean;
  delayMs?: number;
};

export default function EligibilityModalLauncher({
  isAuthenticated,
  delayMs = 5000,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }

    window.addEventListener("open-eligibility-modal", onOpen);

    return () => {
      window.removeEventListener("open-eligibility-modal", onOpen);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;

    const storageKey = `eligibility_modal_seen:${pathname}`;
    const alreadySeen = sessionStorage.getItem(storageKey);
    if (alreadySeen === "1") return;

    const id = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(storageKey, "1");
    }, delayMs);

    return () => window.clearTimeout(id);
  }, [isAuthenticated, delayMs, pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-2xl">
        <EligibilityTunnel onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
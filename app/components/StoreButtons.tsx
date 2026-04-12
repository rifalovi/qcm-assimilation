"use client";

import Image from "next/image";

export default function StoreButtons() {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
      <div className="flex items-center gap-3 mb-4">
        <Image src="/cap-citoyen.png" alt="Cap Citoyen" width={48} height={48} className="rounded-xl" />
        <div>
          <p className="text-sm font-bold text-white">Cap Citoyen</p>
          <p className="text-xs text-slate-400">Disponible sur mobile</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Google Play */}
        <a
          href="https://play.google.com/store/apps/details?id=fr.capcitoyen.app&pcampaignid=web_share"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10 hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none">
            <path d="M3.61 1.814L13.793 12 3.61 22.186a1.12 1.12 0 01-.306-.777V2.591c0-.29.113-.562.306-.777z" fill="#4285F4"/>
            <path d="M17.344 8.344L13.793 12l3.55 3.656 4.013-2.278a1.08 1.08 0 000-1.9l-4.012-3.134z" fill="#FBBC04"/>
            <path d="M3.61 1.814L13.793 12 17.344 8.344 6.384.87a1.12 1.12 0 00-1.218.044L3.61 1.814z" fill="#34A853"/>
            <path d="M3.61 22.186L6.384 23.13a1.12 1.12 0 001.218.044L17.344 15.656 13.793 12 3.61 22.186z" fill="#EA4335"/>
          </svg>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Disponible sur</p>
            <p className="text-sm font-bold text-white">Google Play</p>
          </div>
        </a>

        {/* App Store — bientôt */}
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 opacity-60">
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Bientôt sur</p>
            <p className="text-sm font-bold text-white">App Store</p>
          </div>
        </div>
      </div>
    </div>
  );
}

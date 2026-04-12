"use client";

import Link from "next/link";
import { getQuotaLabel, type AiMode } from "../../src/lib/aiQuota";

interface Props {
  mode: AiMode;
}

export default function AiPaywall({ mode }: Props) {
  const label = getQuotaLabel(mode);

  return (
    <div className="mt-4 rounded-[1.6rem] border border-amber-400/25 bg-gradient-to-br from-amber-500/12 via-orange-500/10 to-amber-500/12 p-5 shadow-[0_18px_45px_rgba(2,8,23,0.28)]">
      <div className="text-center">
        <p className="text-lg font-extrabold text-white mb-2">
          Vous avez utilisé vos {label} aujourd'hui
        </p>
        <p className="text-sm text-slate-300 mb-5">
          Les membres Premium ont accès à :
        </p>

        <div className="space-y-2.5 text-left max-w-sm mx-auto mb-6">
          {[
            "Explications IA illimitées",
            "Coach personnalisé après chaque quiz",
            "Assistant démarches complet",
            "Plan de révision intelligent",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-sm text-slate-200">{feature}</span>
            </div>
          ))}
        </div>

        <Link
          href="/pricing?utm_source=ai_limit&utm_campaign=upgrade"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]"
        >
          Passer à Premium →
        </Link>
      </div>
    </div>
  );
}

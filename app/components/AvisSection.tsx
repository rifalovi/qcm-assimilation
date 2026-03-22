"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Avis = {
  id: string;
  pseudo: string;
  rating: number;
  comment: string;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
          fill={n <= rating ? "#fbbf24" : "none"}
          stroke={n <= rating ? "#fbbf24" : "#475569"}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>
        </svg>
      ))}
    </div>
  );
}

export default function AvisSection() {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    async function loadAvis() {
      const supabase = createClient();
      const { data } = await supabase
        .from("feedbacks")
        .select("id, pseudo, rating, comment, created_at")
        .not("comment", "is", null)
        .neq("comment", "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setAvis(data);
        const avg = data.reduce((acc, a) => acc + a.rating, 0) / data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
      setLoading(false);
    }
    loadAvis();
  }, []);

  if (loading) return (
    <div id="avis-section" className="py-8 text-center text-slate-500 text-sm">
      Chargement des avis...
    </div>
  );

  if (avis.length === 0) return null;

  return (
    <section id="avis-section" className="space-y-5 pt-8 mt-4 border-t border-white/10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Ce qu&apos;ils en pensent</h2>
          <p className="mt-1 text-sm text-slate-400">
            Avis de candidats qui ont préparé leur entretien avec QCM Assimilation
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2.5">
          <div>
            <p className="text-2xl font-extrabold text-amber-300">{avgRating}/5</p>
            <Stars rating={Math.round(avgRating)} />
          </div>
          <div className="border-l border-white/10 pl-3">
            <p className="text-xs text-slate-400">{avis.length} avis</p>
            <p className="text-xs font-semibold text-white">Note moyenne</p>
          </div>
        </div>
      </div>

      {/* Grille d'avis */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {avis.map((a) => (
          <div key={a.id}
            className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-sm transition hover:border-white/20">
            {/* Header avis */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-sm font-bold text-violet-300">
                  {(a.pseudo || "A")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{a.pseudo || "Anonyme"}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <Stars rating={a.rating} />
            </div>

            {/* Commentaire */}
            <p className="mt-3 text-sm leading-6 text-slate-300">
              &ldquo;{a.comment}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

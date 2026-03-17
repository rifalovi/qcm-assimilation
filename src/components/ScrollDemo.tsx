"use client";

import { useEffect, useRef } from "react";

export default function ScrollDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-4">
      <div className="text-center mb-8">
        <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
          Fonctionnalité principale
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
          Révisez comme vous{" "}
          <span className="text-blue-400">scrolLez</span>.
        </h2>
        <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
          Swipez verticalement pour passer d'une question à l'autre. Swipez horizontalement pour voir les QCM associés. Simple, rapide, efficace.
        </p>
      </div>

      {/* Cadre téléphone */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Contour téléphone */}
          <div className="relative z-10 rounded-[2.8rem] border-[6px] border-slate-600 bg-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ width: 260, height: 520 }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 h-6 w-24 rounded-b-2xl bg-slate-600"/>
            {/* Vidéo */}
            <video
              ref={videoRef}
              src="/scroll-demo.mp4"
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          </div>

          {/* Reflet */}
          <div className="absolute inset-0 rounded-[2.8rem] bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20"/>

          {/* Glow */}
          <div className="absolute -inset-4 rounded-[3rem] bg-blue-500/10 blur-2xl -z-10"/>
        </div>
      </div>

      {/* Features sous la vidéo */}
      <div className="mt-10 grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
        {[
          { icon: "↕️", label: "Scroll vertical", desc: "Question suivante" },
          { icon: "↔️", label: "Swipe horizontal", desc: "3 QCM associés" },
          { icon: "🎯", label: "Lancer le test", desc: "À tout moment" },
        ].map((f) => (
          <div key={f.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-xs font-semibold text-white">{f.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
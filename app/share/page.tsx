"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function SharePage() {
  const router = useRouter();
  const [payload, setPayload] = useState<{ text: string; url: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("share_payload");
    if (!raw) return;
    try {
      setPayload(JSON.parse(raw));
    } catch {}
  }, []);

  if (!payload) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <Card>
          <h1 className="text-xl font-bold">Partager</h1>
          <p className="mt-2 text-slate-600">Aucune donnée à partager.</p>
          <Button className="mt-4" onClick={() => router.push("/")}>Retour</Button>
        </Card>
      </main>
    );
  }

  const enc = encodeURIComponent;
  const shareText = payload.text;
  const shareUrl = payload.url;

  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(shareText)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${enc(shareUrl)}&text=${enc(shareText)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}` },
    { name: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${enc(shareText)}` },
    { name: "Email", href: `mailto:?subject=${enc("QCM Assimilation FR — Simulation 2026")}&body=${enc(shareText)}` },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <h1 className="text-2xl font-extrabold">Partager la simulation</h1>
        <p className="mt-2 text-slate-600">Choisis un réseau social :</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold hover:bg-slate-50"
            >
              {l.name}
            </a>
          ))}
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={async () => {
            await navigator.clipboard.writeText(shareText);
            alert("Message copié ✅");
          }}>
            Copier le message
          </Button>
          <Button variant="secondary" onClick={() => router.push("/results")}>
            Retour résultats
          </Button>
        </div>
      </Card>
    </main>
  );
}
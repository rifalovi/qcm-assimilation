"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../components/UserContext";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "rifalovi@gmail.com";

type Stats = {
  totalUsers: number;
  premiumUsers: number;
  freemiumUsers: number;
  recentSignups: { username: string; role: string; created_at: string; city: string | null }[];
  topCities: { city: string; count: number }[];
  topEvents: { event_type: string; count: number }[];
  recentEvents: { event_type: string; properties: Record<string, unknown>; created_at: string }[];
};

export default function DashboardPage() {
  const { email, isAuthenticated, loading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!isAuthenticated || email !== ADMIN_EMAIL)) router.push("/");
  }, [loading, isAuthenticated, email, router]);

  useEffect(() => {
    if (!isAuthenticated || email !== ADMIN_EMAIL) return;
    fetchStats();
  }, [isAuthenticated, email]);

  async function fetchStats() {
    const supabase = createClient();
    setLoadingStats(true);
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("role, username, updated_at, city").order("updated_at", { ascending: false });
    console.log("profiles error:", profilesError, "count:", profiles?.length);
    const totalUsers = profiles?.length ?? 0;
    const premiumUsers = profiles?.filter(p => p.role === "premium").length ?? 0;
    const freemiumUsers = profiles?.filter(p => p.role === "freemium").length ?? 0;
    const recentSignups = (profiles ?? []).slice(0, 10).map(p => ({ username: p.username ?? "—", role: p.role, created_at: p.updated_at, city: p.city }));
    const cityCount: Record<string, number> = {};
    profiles?.forEach(p => { if (p.city) cityCount[p.city] = (cityCount[p.city] ?? 0) + 1; });
    const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) => ({ city, count }));
    const { data: events } = await supabase.from("user_events").select("event_type, properties, created_at").order("updated_at", { ascending: false }).limit(200);
    const eventCount: Record<string, number> = {};
    events?.forEach(e => { eventCount[e.event_type] = (eventCount[e.event_type] ?? 0) + 1; });
    const topEvents = Object.entries(eventCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([event_type, count]) => ({ event_type, count }));
    const recentEvents = (events ?? []).slice(0, 20).map(e => ({ event_type: e.event_type, properties: e.properties, created_at: e.created_at }));
    setStats({ totalUsers, premiumUsers, freemiumUsers, recentSignups, topCities, topEvents, recentEvents });
    setLoadingStats(false);
  }

  if (loading || !isAuthenticated || email !== ADMIN_EMAIL) {
    return <div className="flex h-screen items-center justify-center" style={{ color: "var(--cc-text-muted)" }}>Vérification...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ borderColor: "var(--cc-primary)", color: "var(--cc-primary)", background: "var(--cc-primary-soft)" }}>Admin Dashboard</div>
        <h1 className="mt-3 text-3xl font-extrabold" style={{ color: "var(--cc-text)" }}>Tableau de bord</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--cc-text-muted)" }}>Activité et métriques de Cap Citoyen</p>
      </div>
      {loadingStats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl border" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }} />)}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <KPICard label="Utilisateurs total" value={stats.totalUsers} icon="👥" color="blue" />
            <KPICard label="Comptes Premium" value={stats.premiumUsers} icon="👑" color="amber" />
            <KPICard label="Comptes Freemium" value={stats.freemiumUsers} icon="🆓" color="emerald" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
              <h2 className="mb-4 text-sm font-bold" style={{ color: "var(--cc-text)" }}>Dernières inscriptions</h2>
              <div className="space-y-2">
                {stats.recentSignups.map((u, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "var(--cc-text)" }}>{u.username}</span>
                      {u.city && <span className="ml-2 text-xs" style={{ color: "var(--cc-text-disabled)" }}>📍 {u.city}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.role === "premium" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300" : u.role === "freemium" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-gray-100 dark:bg-white/10"}`} style={u.role !== "premium" && u.role !== "freemium" ? { color: "var(--cc-text-muted)" } : {}}>{u.role}</span>
                      <span className="text-[10px]" style={{ color: "var(--cc-text-disabled)" }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
              <h2 className="mb-4 text-sm font-bold" style={{ color: "var(--cc-text)" }}>Répartition géographique</h2>
              {stats.topCities.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--cc-text-disabled)" }}>Aucune donnée encore collectée</p>
              ) : (
                <div className="space-y-2">
                  {stats.topCities.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-4 text-xs" style={{ color: "var(--cc-text-disabled)" }}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between">
                          <span className="text-sm" style={{ color: "var(--cc-text)" }}>{c.city}</span>
                          <span className="text-xs" style={{ color: "var(--cc-text-muted)" }}>{c.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "var(--cc-border)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${(c.count / stats.topCities[0].count) * 100}%`, background: "var(--cc-primary)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
              <h2 className="mb-4 text-sm font-bold" style={{ color: "var(--cc-text)" }}>Fonctionnalités les plus utilisées</h2>
              {stats.topEvents.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--cc-text-disabled)" }}>Aucun événement encore enregistré</p>
              ) : (
                <div className="space-y-2">
                  {stats.topEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                      <span className="text-sm" style={{ color: "var(--cc-text-muted)" }}>{e.event_type}</span>
                      <span className="cc-badge cc-badge-info">{e.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface)" }}>
              <h2 className="mb-4 text-sm font-bold" style={{ color: "var(--cc-text)" }}>Événements récents</h2>
              {stats.recentEvents.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--cc-text-disabled)" }}>Aucun événement encore enregistré</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {stats.recentEvents.map((e, i) => (
                    <div key={i} className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--cc-border)", background: "var(--cc-surface-alt)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: "var(--cc-text)" }}>{e.event_type}</span>
                        <span className="text-[10px]" style={{ color: "var(--cc-text-disabled)" }}>{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                      </div>
                      {Object.keys(e.properties).length > 0 && <p className="mt-1 truncate text-[10px]" style={{ color: "var(--cc-text-muted)" }}>{JSON.stringify(e.properties)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorStyles: Record<string, { border: string; bg: string; text: string }> = {
    blue: { border: "var(--cc-primary)", bg: "var(--cc-primary-soft)", text: "var(--cc-primary)" },
    amber: { border: "var(--cc-warning)", bg: "var(--cc-warning-soft)", text: "var(--cc-warning)" },
    emerald: { border: "var(--cc-success)", bg: "var(--cc-success-soft)", text: "var(--cc-success)" },
  };
  const c = colorStyles[color] ?? colorStyles.blue;
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: c.border, background: c.bg }}>
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 text-3xl font-extrabold" style={{ color: "var(--cc-text)" }}>{value}</div>
      <div className="mt-1 text-xs font-semibold" style={{ color: c.text }}>{label}</div>
    </div>
  );
}

"use client";
import { lazy, Suspense } from "react";
const LocationModal = lazy(() => import("./LocationModal"));

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "anonymous" | "freemium" | "premium" | "elite";

type UserContextType = {
  role: Role;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  refresh: () => void;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  role: "anonymous",
  username: null,
  email: null,
  isAuthenticated: false,
  loading: true,
  refresh: () => {},
  logout: async () => {},
});

function clearQcmLocalState() {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (
      key === "qcm_user" ||
      key === "quiz_settings" ||
      key === "last_result" ||
      key.startsWith("last_result:train:") ||
      key.startsWith("last_result:exam:") ||
      key.startsWith("account_merged:")
    ) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  if (typeof sessionStorage !== "undefined") {
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (key.startsWith("eligibility_modal_seen:")) {
        sessionKeysToRemove.push(key);
      }
    }
    for (const key of sessionKeysToRemove) {
      sessionStorage.removeItem(key);
    }
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("anonymous");
  const [username, setUsername] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  function refresh() {
    setTick((t) => t + 1);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearQcmLocalState();
    setRole("anonymous");
    setUsername(null);
    setEmail(null);
    setLoading(false);
    refresh();
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRole("anonymous");
        setUsername(null);
        setEmail(null);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, role, has_seen_location_modal")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("UserContext profiles load error:", error);
      }

      setRole((data?.role as Role) ?? "anonymous");
      setUsername(data?.username ?? user.user_metadata?.username ?? user.email?.split("@")[0] ?? null);
      setUserId(user.id);
      if (!data?.has_seen_location_modal) setShowLocationModal(true);
      setLoading(false);
    }

    load();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, [tick]);

  const isAuthenticated = !!email;

  return (
    <UserContext.Provider
      value={{ role, username, email, isAuthenticated, loading, refresh, logout }}
    >
      {children}
      {showLocationModal && userId && (
        <Suspense fallback={null}>
          <LocationModal userId={userId} onClose={() => setShowLocationModal(false)} />
        </Suspense>
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export const ROLE_LIMITS = {
  anonymous: {
    quizCount: 10,
    scrollCount: 10,
    levels: [1] as number[],
    canExam: false,
    canSeeExplanations: false,
    canSeeThemeStats: false,
    examTrials: 0,
  },
  freemium: {
    quizCount: 20,
    scrollCount: 999,
    levels: [1] as number[],
    canExam: true,
    canSeeExplanations: false,
    canSeeThemeStats: false,
    examTrials: 1,
  },
  premium: {
    quizCount: 40,
    scrollCount: 999,
    levels: [1, 2, 3] as number[],
    canExam: true,
    canSeeExplanations: true,
    canSeeThemeStats: true,
    examTrials: 999,
  },
  elite: {
    quizCount: 40,
    scrollCount: 999,
    levels: [1, 2, 3] as number[],
    canExam: true,
    canSeeExplanations: true,
    canSeeThemeStats: true,
    examTrials: 999,
  },
};
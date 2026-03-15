"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "anonymous" | "freemium" | "premium";

type UserContextType = {
  role: Role;
  username: string | null;
  email: string | null;
  loading: boolean;
  refresh: () => void;
};

const UserContext = createContext<UserContextType>({
  role: "anonymous",
  username: null,
  email: null,
  loading: true,
  refresh: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("anonymous");
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  function refresh() {
    setTick((t) => t + 1);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRole("anonymous");
        setUsername(null);
        setEmail(null);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();

      setRole((data?.role as Role) ?? "anonymous");
      setUsername(data?.username ?? user.email?.split("@")[0] ?? null);
      setLoading(false);
    }

    load();

    // Écoute les changements de session (connexion/déconnexion)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, [tick]);

  return (
    <UserContext.Provider value={{ role, username, email, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

// Limites par rôle
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
    canExam: true, // une seule fois
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
};

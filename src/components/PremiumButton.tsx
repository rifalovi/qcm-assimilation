"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useUser } from "../../app/components/UserContext";
import { getAccessQuota } from "../../src/lib/access";
import Button from "../../components/Button";

interface Props {
  onClick: () => void;
  label: string;
}

export default function PremiumButton({ onClick, label }: Props) {
  const { role } = useUser();
  const router = useRouter();
  const limits = getAccessQuota(role);

  if (limits.canExam) {
    return <Button onClick={onClick}>{label}</Button>;
  }

  return (
    <button
      onClick={() => router.push("/pricing")}
      className="flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
      style={{
        borderColor: "color-mix(in srgb, var(--cc-warning) 30%, transparent)",
        background: "color-mix(in srgb, var(--cc-warning) 10%, var(--cc-surface))",
        color: "var(--cc-warning)",
      }}
    >
      <Lock size={15} />
      <span>
        {label}
        <span className="block text-center text-[11px] transition mt-0.5" style={{ color: "color-mix(in srgb, var(--cc-warning) 70%, transparent)" }}>
          Voir les Pass →
        </span>
      </span>
    </button>
  );
}

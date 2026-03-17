"use client";

import { useRouter } from "next/navigation";
import { useUser, ROLE_LIMITS } from "../../app/components/UserContext";
import Button from "../../components/Button";

interface Props {
  onClick: () => void;
  label: string;
}

export default function PremiumButton({ onClick, label }: Props) {
  const { role } = useUser();
  const router = useRouter();
  const limits = ROLE_LIMITS[role];

  if (limits.canExam) {
    return <Button onClick={onClick}>{label}</Button>;
  }

  return (
    <button
      onClick={() => router.push("/account")}
      className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 cursor-pointer"
    >
      🔒 {label} — (Mode Premium)
    </button>
  );
}
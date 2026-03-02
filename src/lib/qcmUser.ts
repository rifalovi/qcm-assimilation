export type QcmUser = { pseudo: string; email: string };

export function normEmail(v: string) {
  return (v ?? "").trim().toLowerCase();
}

export function userKeyByEmail(email: string) {
  const e = normEmail(email);
  return e || "anonymous";
}

export function loadUser(): QcmUser | null {
  try {
    const raw = localStorage.getItem("qcm_user");
    return raw ? (JSON.parse(raw) as QcmUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(u: QcmUser) {
  localStorage.setItem("qcm_user", JSON.stringify(u));
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  questionId: number;
  userId?: string;
  sessionId: string;
}

interface Counts {
  likes: number;
  dislikes: number;
  comments: number;
}

export default function ScrollInteractions({ questionId, userId, sessionId }: Props) {
  const [counts, setCounts] = useState<Counts>({ likes: 0, dislikes: 0, comments: 0 });
  const [userActions, setUserActions] = useState<{ like: boolean; dislike: boolean }>({ like: false, dislike: false });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; username: string; content: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);

  const supabase = createClient();

  const [username, setUsername] = useState("Utilisateur");

useEffect(() => {
  if (!userId) return;
  const supabase = createClient();
  supabase.from("profiles").select("username").eq("id", userId).single()
    .then(({ data }) => { if (data?.username) setUsername(data.username); });
}, [userId]);

  useEffect(() => {
    loadCounts();
    loadUserActions();
  }, [questionId]);

  async function loadCounts() {
    const { data: likes } = await supabase
      .from("question_interactions")
      .select("id", { count: "exact" })
      .eq("question_id", questionId)
      .eq("type", "like");

    const { data: dislikes } = await supabase
      .from("question_interactions")
      .select("id", { count: "exact" })
      .eq("question_id", questionId)
      .eq("type", "dislike");

    const { count: commentsCount } = await supabase
      .from("question_comments")
      .select("id", { count: "exact" })
      .eq("question_id", questionId);

    setCounts({
      likes: likes?.length ?? 0,
      dislikes: dislikes?.length ?? 0,
      comments: commentsCount ?? 0,
    });
  }

  async function loadUserActions() {
    const id = userId || sessionId;
    const field = userId ? "user_id" : "session_id";

    const { data } = await supabase
      .from("question_interactions")
      .select("type")
      .eq("question_id", questionId)
      .eq(field, id);

    setUserActions({
      like: data?.some((d) => d.type === "like") ?? false,
      dislike: data?.some((d) => d.type === "dislike") ?? false,
    });
  }

  async function toggleAction(type: "like" | "dislike") {
    const id = userId || sessionId;
    const field = userId ? "user_id" : "session_id";
    const isActive = userActions[type];
    const opposite = type === "like" ? "dislike" : "like";

    if (isActive) {
      await supabase
        .from("question_interactions")
        .delete()
        .eq("question_id", questionId)
        .eq(field, id)
        .eq("type", type);
    } else {
      // Supprime l'opposé si actif
      if (userActions[opposite]) {
        await supabase
          .from("question_interactions")
          .delete()
          .eq("question_id", questionId)
          .eq(field, id)
          .eq("type", opposite);
      }
      await supabase.from("question_interactions").insert({
        question_id: questionId,
        [field]: id,
        type,
      });
    }
    await loadCounts();
    await loadUserActions();
  }

  async function loadComments() {
    const { data } = await supabase
      .from("question_comments")
      .select("id, username, content, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(20);
    setComments(data ?? []);
  }

  async function submitComment() {
    if (!newComment.trim() || !userId) return;
    setSending(true);
    await supabase.from("question_comments").insert({
      question_id: questionId,
      user_id: userId,
      username: username,
      content: newComment.trim(),
    });
    setNewComment("");
    await loadComments();
    await loadCounts();
    setSending(false);
  }

  async function handleShare() {
  const shareData = {
    title: "QCM Test civique FR",
    text: `Question #${questionId} — Teste tes connaissances sur la République française 🇫🇷`,
    url: `${window.location.origin}/scroll`,
  };
  
  if (navigator.share && navigator.canShare(shareData)) {
    await navigator.share(shareData);
  } else {
    await navigator.clipboard.writeText(shareData.url);
    alert("Lien copié dans le presse-papiers !");
  }

  await supabase.from("question_interactions").upsert({
    question_id: questionId,
    [userId ? "user_id" : "session_id"]: userId || sessionId,
    type: "share",
  });
}

  return (
    <>
      {/* Colonne d'interactions côté droit */}
      <div
        className="absolute right-2 flex flex-col items-center gap-4"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      >
        {/* Like */}
        <button onClick={() => toggleAction("like")} className="flex flex-col items-center gap-1">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
            userActions.like
              ? "border-blue-400/40 bg-blue-500/20 text-blue-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}>
            👍
          </div>
          <span className="text-xs text-slate-400">{counts.likes}</span>
        </button>

        {/* Dislike */}
        <button onClick={() => toggleAction("dislike")} className="flex flex-col items-center gap-1">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
            userActions.dislike
              ? "border-red-400/40 bg-red-500/20 text-red-300"
              : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
          }`}>
            👎
          </div>
          <span className="text-xs text-slate-400">{counts.dislikes}</span>
        </button>

        {/* Commenter */}
        <button
          onClick={() => { setShowComments(true); loadComments(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition">
            💬
          </div>
          <span className="text-xs text-slate-400">{counts.comments}</span>
        </button>

       {/* Partager */}
<button onClick={handleShare} className="flex flex-col items-center gap-1">
  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  </div>
  <span className="text-xs text-slate-400"></span>
</button>
      </div>

      {/* Modal commentaires */}
 {showComments && (
  <div
    className="fixed inset-0 z-50 flex items-end"
    style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)" }}
    onClick={() => setShowComments(false)}
  >
    <div
      className="w-full rounded-t-[2rem] border border-white/10 bg-slate-900/98 flex flex-col"
      style={{ maxHeight: "70vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header fixe */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-sm font-semibold text-white">Commentaires ({counts.comments})</p>
        <button onClick={() => setShowComments(false)} className="text-slate-400 hover:text-white">✕</button>
      </div>

      {/* Zone scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20 space-y-2">
        {userId ? (
          <div className="flex gap-2 mb-3">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-400/30"
              maxLength={200}
            />
            <button
              onClick={submitComment}
              disabled={sending || !newComment.trim()}
              className="rounded-xl border border-blue-400/20 bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-300 disabled:opacity-50 shrink-0"
            >
              {sending ? "..." : "Envoyer"}
            </button>
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Connecte-toi pour commenter
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Aucun commentaire — soyez le premier !</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-blue-300">{c.username}</p>
                <p className="text-xs text-slate-500">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-300 line-clamp-2">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
    </>
  );
}
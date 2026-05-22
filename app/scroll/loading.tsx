export default function ScrollLoading() {
  return (
    <div
      style={{
        height: "calc(100dvh - 128px)",
        maxWidth: "390px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        background: "var(--cc-surface)",
        color: "var(--cc-text)",
      }}
    >
      <div style={{ fontSize: "40px" }}>📚</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--cc-text)" }}>Chargement des cartes…</p>
        <p style={{ fontSize: "13px", color: "var(--cc-text-muted)" }}>Préparation de votre révision</p>
      </div>
      <div style={{ width: "120px", height: "3px", background: "var(--cc-border)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: "40%",
          background: "var(--cc-primary)",
          borderRadius: "99px",
          animation: "scroll-slide 1.2s ease-in-out infinite",
        }} />
      </div>
      <style>{`
        @keyframes scroll-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

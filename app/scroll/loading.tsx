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
        background: "linear-gradient(180deg, #08101d 0%, #070d18 45%, #050913 100%)",
        color: "#f1f5f9",
      }}
    >
      <div style={{ fontSize: "40px" }}>📚</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Chargement des cartes…</p>
        <p style={{ fontSize: "13px", color: "#64748b" }}>Préparation de votre révision</p>
      </div>
      <div style={{ width: "120px", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: "40%",
          background: "linear-gradient(90deg, #3b82f6, #818cf8)",
          borderRadius: "99px",
          animation: "slide 1.2s ease-in-out infinite",
        }} />
      </div>
      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

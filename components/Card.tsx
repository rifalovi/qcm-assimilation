export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/70 p-6 transition hover:shadow-xl">
      {children}
    </div>
  );
}
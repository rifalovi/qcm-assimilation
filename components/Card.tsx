type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border border-white/10
        bg-gradient-to-b from-slate-800/95 to-slate-900/95
        p-6
        text-slate-100
        shadow-[0_18px_45px_rgba(2,8,23,0.34)]
        backdrop-blur-md
        transition-all duration-300 ease-out
        hover:border-blue-400/20
        hover:shadow-[0_24px_55px_rgba(2,8,23,0.42)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
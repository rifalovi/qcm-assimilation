// components/Card.tsx
type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-slate-900 dark:text-slate-100 ${className}`}>
      {children}
    </div>
  );
}

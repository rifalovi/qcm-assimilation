export default function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = total <= 0 ? 0 : Math.min(100, Math.max(0, (value / total) * 100));

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
      <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

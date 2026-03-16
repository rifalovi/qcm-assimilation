export default function ProgressBar({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const percent = total <= 0 ? 0 : Math.min(100, Math.max(0, (value / total) * 100));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
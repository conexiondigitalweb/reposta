export default function UsageBar({ used, total }) {
  const pct = Math.min((used / total) * 100, 100)
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>Generaciones usadas</span>
        <span>{used} / {total === Infinity ? '∞' : total}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

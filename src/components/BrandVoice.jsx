export default function BrandVoice({ value, onChange, canUse, onUpgrade }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Tono de marca
      </label>
      <textarea
        className="w-full bg-gray-800 text-white rounded-xl p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-purple-500"
        rows={3}
        placeholder="Describe tu tono de marca: directo, cercano, técnico, inspirador..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {!canUse && (
        <p className="text-xs text-gray-500 mt-1">
          El tono de marca personalizado está disponible desde el plan{' '}
          <button onClick={onUpgrade} className="text-purple-400 underline">Creador</button>.
        </p>
      )}
    </div>
  )
}

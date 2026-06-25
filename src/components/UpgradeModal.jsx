export default function UpgradeModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold text-white mb-2">Límite alcanzado</h2>
        <p className="text-gray-400 mb-6">
          Has usado tus 3 generaciones gratuitas de este mes. Pasa a Creador por $12/mes y genera hasta 30 piezas.
        </p>
        <a
          href="/pricing"
          className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Ver planes
        </a>
        <button onClick={onClose} className="mt-3 w-full text-gray-500 text-sm hover:text-gray-300">
          Cerrar
        </button>
      </div>
    </div>
  )
}

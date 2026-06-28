import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { PLANS } from '../lib/plans'
import OutputCards from '../components/OutputCards'
import {
  ArrowLeft, Link2, AlignLeft, Sparkles, Loader2, AlertCircle, ArrowRight
} from 'lucide-react'

// ─── NavBar mínima ────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <img src="/LogoReposta.png" alt="Reposta" className="h-8 w-auto" />
      </div>
    </header>
  )
}

// ─── Tabs de entrada ──────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${
        active
          ? 'bg-purple-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

// ─── Barra de uso compacta ────────────────────────────────────────────────────

function UsagePill({ used, limit }) {
  const isUnlimited = limit === Infinity
  const remaining = isUnlimited ? '∞' : Math.max(limit - used, 0)
  const almostFull = !isUnlimited && used / limit >= 0.8
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
      almostFull ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800 text-gray-400'
    }`}>
      {isUnlimited ? '∞' : remaining} generacion{remaining === 1 ? '' : 'es'} disponibles
    </span>
  )
}

// ─── Reprocesar ───────────────────────────────────────────────────────────────

export default function Reprocesar() {
  const { user, profile, setProfile } = useAppStore()
  const navigate = useNavigate()

  const planKey = profile?.plan ?? 'free'
  const plan = PLANS[planKey]
  const limit = plan?.monthlyGenerations ?? 3
  const used = profile?.monthly_uses_count ?? 0
  const canGenerate = limit === Infinity || used < limit

  const [tab, setTab] = useState('youtube') // 'youtube' | 'texto'
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [transcriptSource, setTranscriptSource] = useState(null) // 'captions' | 'whisper'
  const [outputs, setOutputs] = useState(null)
  const [title, setTitle] = useState('')

  const inputVacio = tab === 'youtube' ? !youtubeUrl.trim() : !texto.trim()

  async function handleTransformar() {
    if (!canGenerate) return
    if (inputVacio) {
      setError('Pega una URL de YouTube o escribe el contenido a transformar.')
      return
    }

    setError('')
    setOutputs(null)
    setTranscriptSource(null)
    setLoading(true)
    setLoadingMsg(tab === 'youtube' ? 'Extrayendo contenido del video...' : 'Preparando contenido...')

    try {
      // ── Pestaña texto: va directo a generate, sin pasar por transcribe ──────
      let transcript = texto

      if (tab === 'youtube') {
        // Timeout de 12s para Vercel Free (limite real ~10s + margen de red)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        let transcribeRes, transcribeData
        try {
          transcribeRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: youtubeUrl.trim() }),
            signal: controller.signal,
          })
          transcribeData = await transcribeRes.json()
        } catch (fetchErr) {
          const isTimeout = fetchErr.name === 'AbortError'
          setError(
            isTimeout
              ? 'La transcripción automática tardó demasiado. Copia el transcript manualmente desde YouTube (tres puntos → Mostrar transcript) y usa la pestaña "Pegar texto".'
              : 'Error de conexión al extraer el video. Verifica tu internet e intenta de nuevo.'
          )
          setLoading(false)
          return
        } finally {
          clearTimeout(timeoutId)
        }

        if (!transcribeRes.ok) {
          setError(transcribeData.error ?? 'No pudimos extraer el contenido de ese video. Prueba con la pestaña "Pegar texto".')
          setLoading(false)
          return
        }

        transcript = transcribeData.transcript
        setTranscriptSource(transcribeData.source ?? null)
        setLoadingMsg('Transcript extraído — generando formatos...')
      } else {
        setLoadingMsg('Generando 6 formatos con IA...')
      }

      // ── Llamar a generate (texto o transcript) ───────────────────────────────
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          userId: user.id,
          language: 'es',
        }),
      })

      const data = await r.json()

      if (r.status === 429 && data.code === 'LIMIT_REACHED') {
        setError('Has alcanzado el límite de generaciones de tu plan este mes.')
        setLoading(false)
        return
      }

      if (!r.ok) {
        setError(data.error ?? 'Ocurrió un error. Intenta de nuevo.')
        setLoading(false)
        return
      }

      // Actualizar contador local para reflejar el uso inmediatamente
      if (profile) {
        setProfile({ ...profile, monthly_uses_count: (profile.monthly_uses_count ?? 0) + 1 })
      }

      setOutputs(data.generation.outputs)
      setTitle(data.generation.input_title ?? '')

      // Scroll suave a resultados
      setTimeout(() => {
        document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      const isTimeout = err.name === 'AbortError'
      setError(
        isTimeout
          ? 'La transcripción automática tardó demasiado. Copia el transcript manualmente desde YouTube (tres puntos → Mostrar transcript) y usa la pestaña "Pegar texto".'
          : 'Error de conexión. Verifica tu internet e intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Nueva generación</h1>
            <p className="text-sm text-gray-500">
              Pega tu contenido y lo transformamos en 6 formatos.
            </p>
          </div>
          <UsagePill used={used} limit={limit} />
        </div>

        {/* Tarjeta de entrada */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-950 p-1 rounded-xl mb-5">
            <TabBtn
              active={tab === 'youtube'}
              onClick={() => { setTab('youtube'); setError('') }}
              icon={Link2}
              label="URL de YouTube"
            />
            <TabBtn
              active={tab === 'texto'}
              onClick={() => { setTab('texto'); setError('') }}
              icon={AlignLeft}
              label="Pegar texto"
            />
          </div>

          {/* Input según tab */}
          {tab === 'youtube' ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                URL del video de YouTube
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-gray-950 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 leading-relaxed">
                Funciona con videos que tengan subtítulos activados.{' '}
                <span className="text-gray-600">
                  Si falla, copia el transcript desde YouTube (···&nbsp;→ Mostrar transcript) y pégalo en la otra pestaña.
                </span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Contenido a transformar
                </label>
                <span className="text-xs text-gray-600">{texto.length} / 10.000</span>
              </div>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, 10000))}
                placeholder="Pega aquí el texto de tu podcast, artículo, guión, transcripción o cualquier contenido largo..."
                rows={8}
                className="w-full bg-gray-950 border border-gray-700 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA — sin generaciones disponibles */}
        {!canGenerate && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-400">
              Has usado todas tus generaciones de este mes.
            </p>
            <Link
              to="/pricing"
              className="shrink-0 flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Ver planes <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Botón transformar */}
        <button
          onClick={handleTransformar}
          disabled={loading || !canGenerate || inputVacio}
          className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-colors active:scale-95"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {loadingMsg || 'Transformando contenido...'}
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Transformar contenido
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-gray-600 mt-3">
            {'Generando 6 formatos con IA — esto puede tardar entre 15 y 30 segundos.'}
          </p>
        )}

        {/* Resultados */}
        {outputs && (
          <div id="resultados" className="mt-10">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-white">
                {title || 'Resultados'}
              </h2>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-gray-600">6 formatos generados</span>
                {transcriptSource === 'captions' && (
                  <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                    Subtítulos nativos
                  </span>
                )}
                {transcriptSource === 'supadata' && (
                  <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                    Transcript extraído
                  </span>
                )}
              </div>
            </div>
            <OutputCards outputs={outputs} planKey={planKey} />
          </div>
        )}

      </main>
    </div>
  )
}

import { useState } from 'react'
import {
  Copy, Check, MessageSquare, Users, Play, LayoutGrid, Mail, BookOpen, Lock
} from 'lucide-react'

// ─── Hook copiar al portapapeles ─────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState(null)
  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copy, copied }
}

// ─── Botón copiar ─────────────────────────────────────────────────────────────

function CopyBtn({ text, id, copied, copy }) {
  const done = copied === id
  return (
    <button
      onClick={() => copy(text, id)}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        done
          ? 'bg-green-500/20 text-green-400'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
      }`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? 'Copiado' : 'Copiar'}
    </button>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ icon: Icon, title, badge, children }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-800">
        <Icon size={18} className="text-purple-400 shrink-0" />
        <h2 className="font-semibold text-white text-sm">{title}</h2>
        {badge && (
          <span className="ml-auto text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </section>
  )
}

// ─── Item individual con botón copiar ─────────────────────────────────────────

function Item({ text, label, id, copied, copy }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>}
      <div className="bg-gray-950 rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
      <div className="flex justify-end">
        <CopyBtn text={text} id={id} copied={copied} copy={copy} />
      </div>
    </div>
  )
}

// ─── Card lock (formatos premium en plan free) ────────────────────────────────

function LockedCard({ icon: Icon, title }) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-800">
        <Icon size={18} className="text-gray-600 shrink-0" />
        <h2 className="font-semibold text-gray-600 text-sm">{title}</h2>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-600">
          <Lock size={11} /> Plan Creador
        </span>
      </div>
      <div className="p-5 select-none">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-3 bg-gray-800 rounded blur-sm`} style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
        <a
          href="/pricing"
          className="mt-4 inline-block text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Actualiza tu plan →
        </a>
      </div>
    </section>
  )
}

// ─── TIPO_LABEL para tweets/linkedin ─────────────────────────────────────────

const TWEET_LABELS = {
  hook:         'Hook',
  insight:      'Insight',
  thread_start: 'Inicio de hilo',
  data:         'Dato / Estadística',
  cta:          'CTA',
}

const LINKEDIN_LABELS = {
  storytelling: 'Storytelling largo',
  insight:      'Insight corto',
  list:         'Lista numerada',
}

// ─── OutputCards principal ───────────────────────────────────────────────────

export default function OutputCards({ outputs, planKey = 'free' }) {
  const { copy, copied } = useCopy()
  const isPremium = planKey !== 'free'

  if (!outputs) return null

  const { tweets = [], linkedin = [], reels = [], newsletter, blog, carousel = [] } = outputs

  return (
    <div className="flex flex-col gap-5">

      {/* TWEETS */}
      {tweets.length > 0 && (
        <Card icon={MessageSquare} title="Twitter / X" badge={`${tweets.length} tweets`}>
          {tweets.map((t, i) => (
            <Item
              key={i}
              text={t.text}
              label={TWEET_LABELS[t.type] ?? t.type}
              id={`tweet-${i}`}
              copied={copied}
              copy={copy}
            />
          ))}
        </Card>
      )}

      {/* LINKEDIN */}
      {linkedin.length > 0 && (
        <Card icon={Users} title="LinkedIn" badge={`${linkedin.length} posts`}>
          {linkedin.map((p, i) => (
            <Item
              key={i}
              text={p.text}
              label={LINKEDIN_LABELS[p.type] ?? p.type}
              id={`linkedin-${i}`}
              copied={copied}
              copy={copy}
            />
          ))}
        </Card>
      )}

      {/* REELS */}
      {reels.length > 0 && (
        <Card icon={Play} title="Reels / TikTok" badge={`${reels.length} guiones`}>
          {reels.map((r, i) => (
            <Item
              key={i}
              text={r.script}
              label={`${r.duration} segundos`}
              id={`reel-${i}`}
              copied={copied}
              copy={copy}
            />
          ))}
        </Card>
      )}

      {/* CAROUSEL */}
      {carousel.length > 0 && (
        <Card icon={LayoutGrid} title="Carrusel" badge={`${carousel.length} slides`}>
          {carousel.map((s, i) => {
            const text = i === 0
              ? `${s.title}\n${s.subtitle ?? ''}`
              : `${s.title}\n${s.content ?? ''}`
            return (
              <Item
                key={i}
                text={text.trim()}
                label={`Slide ${s.slide}`}
                id={`carousel-${i}`}
                copied={copied}
                copy={copy}
              />
            )
          })}
          <div className="flex justify-end">
            <CopyBtn
              text={carousel.map((s, i) =>
                i === 0
                  ? `Slide 1\n${s.title}\n${s.subtitle ?? ''}`
                  : `Slide ${s.slide}\n${s.title}\n${s.content ?? ''}`
              ).join('\n\n')}
              id="carousel-all"
              copied={copied}
              copy={copy}
            />
          </div>
        </Card>
      )}

      {/* NEWSLETTER — premium */}
      {isPremium && newsletter ? (
        <Card icon={Mail} title="Newsletter">
          <Item
            text={newsletter}
            id="newsletter"
            copied={copied}
            copy={copy}
          />
        </Card>
      ) : !isPremium ? (
        <LockedCard icon={Mail} title="Newsletter" />
      ) : null}

      {/* BLOG — premium */}
      {isPremium && blog ? (
        <Card icon={BookOpen} title="Blog Post">
          <Item
            text={blog}
            id="blog"
            copied={copied}
            copy={copy}
          />
        </Card>
      ) : !isPremium ? (
        <LockedCard icon={BookOpen} title="Blog Post" />
      ) : null}

    </div>
  )
}

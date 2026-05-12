import { useEffect, useRef, useState } from 'react'
import { CloseIcon, SendIcon, SparklesIcon } from '@/components/common/Icons'
import { usePeriod } from '@/context/PeriodContext'
import apiClient from '@/api/client'

interface Message {
  role: 'user' | 'bot'
  text: string
  loading?: boolean
}

const SUGGESTIONS = [
  'Почему упал трафик и куда смотреть в первую очередь?',
  'Какой ресурс растёт, а какой проседает?',
  'Где самые высокие отказы и что это значит?',
  'Что показать директору в одном абзаце?',
]

interface Props {
  open: boolean
  onClose: () => void
  libraryId: string
}

export default function AiDrawer({ open, onClose, libraryId }: Props) {
  const { period, customFrom, customTo } = usePeriod()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Здравствуйте. Я анализирую данные дашборда и помогу разобраться, что происходит с посетителями. Спросите про конкретный ресурс, период, метрику — или выберите подсказку ниже.',
    },
  ])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, busy])

  useEffect(() => {
    if (open && taRef.current) {
      setTimeout(() => taRef.current?.focus(), 350)
    }
  }, [open])

  const send = async (text?: string) => {
    const q = (text ?? draft).trim()
    if (!q || busy) return
    setDraft('')

    const history = messages
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      { role: 'bot', text: '', loading: true },
    ])
    setBusy(true)

    try {
      const apiPeriod = period === 'custom' ? 'month' : period
      const params: Record<string, string> = {
        message: q,
        library_id: libraryId,
        period: apiPeriod,
      }
      if (period === 'custom' && customFrom && customTo) {
        params.date_from = customFrom
        params.date_to = customTo
      }

      const { data } = await apiClient.post('/ai/chat', {
        ...params,
        history,
      })

      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'bot', text: data.reply ?? 'Ошибка получения ответа.' }
        return next
      })
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'bot',
          text: 'Не удалось получить ответ. Проверьте настройки AI-интеграции и попробуйте ещё раз.',
        }
        return next
      })
    } finally {
      setBusy(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const periodLabel =
    period === 'custom' && customFrom && customTo
      ? `${customFrom} – ${customTo}`
      : {
          today: 'Сегодня',
          yesterday: 'Вчера',
          week: '7 дней',
          month: '30 дней',
          quarter: 'Квартал',
          year: 'Год',
          custom: '',
        }[period] ?? period

  return (
    <>
      {open && <div className="lb-ai-overlay" onClick={onClose} />}
      <div className={`lb-ai-drawer${open ? ' lb-open' : ''}`}>
        <div className="lb-ai-inner">
          <div className="lb-ai-header">
            <div className="lb-ai-avatar">
              <SparklesIcon style={{ width: 16, height: 16 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                AI-аналитик
                <span className="lb-ai-pulse" />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>
                Подключён к данным дашборда · {periodLabel}
              </div>
            </div>
            <button className="lb-icon-btn" onClick={onClose} title="Закрыть">
              <CloseIcon />
            </button>
          </div>

          <div className="lb-ai-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`lb-ai-msg lb-${m.role}`}>
                {m.role === 'bot' && <div className="lb-bot-name">Libboard · Claude</div>}
                {m.loading ? (
                  <div className="lb-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                )}
              </div>
            ))}

            {messages.length <= 1 && !busy && (
              <div className="lb-ai-suggest" style={{ marginTop: 18 }}>
                <div className="lb-ai-suggest-title">Попробуйте спросить</div>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)}>
                    <SparklesIcon style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lb-ai-input-area">
            <textarea
              ref={taRef}
              placeholder="Спросите про метрики, ресурсы, тренды…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={1}
            />
            <button
              className="lb-ai-send"
              disabled={!draft.trim() || busy}
              onClick={() => send()}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

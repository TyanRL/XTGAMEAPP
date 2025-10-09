import React, { useEffect, useMemo, useState } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { MessageInput } from './components/MessageInput'
import { getTelegram } from './lib/telegram'
import { api } from './lib/api'
import avatar from './assets/npc_avatar.png'

// Вытаскиваем npc_id из query (?npc=...)
function useQuery() {
  return useMemo(() => new URLSearchParams(window.location.search), [])
}

type Msg = { from: 'npc' | 'you'; text: string }

export default function App() {
  const tg = getTelegram()
  const query = useQuery()
  const npc_id = query.get('npc') || 'default'
  const initData = (window as any).Telegram?.WebApp?.initData || '' // сырой initData для подписи на бэке
  const user_id = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id as number | undefined

  const [sessionId, setSessionId] = useState<string>('')
  const [npcName, setNpcName] = useState<string>('NPC')
  const [messages, setMessages] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)

  // Инициализация WebApp UI
  useEffect(() => { tg.ready() }, [])

  // Старт диалога
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setBusy(true)
      try {
        const res = await api.start(npc_id, user_id, initData)
        if (!mounted) return
        setSessionId(res.session_id)
        setNpcName(res.npc_name || 'NPC')
        setMessages([{ from: 'npc', text: res.reply }])
      } catch (e) {
        setMessages([{ from: 'npc', text: '…не удаётся начать диалог. Попробуйте позже.' }])
      } finally {
        setBusy(false)
      }
    })()
    return () => { mounted = false }
  }, [npc_id])

  async function onSend(text: string) {
    setMessages((m) => [...m, { from: 'you', text }])
    if (!sessionId) return
    setBusy(true)
    try {
      const res = await api.message(sessionId, text, user_id, initData)
      setMessages((m) => [...m, { from: 'npc', text: res.reply }])
      if (res.done) {
        // по желанию — сообщить боту и закрыть
        try { (window as any).Telegram?.WebApp?.sendData?.('dialog_done') } catch {}
      }
    } catch (e) {
      setMessages((m) => [...m, { from: 'npc', text: 'Связь с каналом прервалась.' }])
    } finally {
      setBusy(false)
    }
  }

  async function onEnd() {
    try { if (sessionId) await api.end(sessionId, user_id, initData) } catch {}
    try { (window as any).Telegram?.WebApp?.sendData?.('dialog_finished') } catch {}
    try { tg.close() } catch {}
  }

  return (
    <div>
      <div className="header">
        <div className="avatar"><img src={avatar} alt="npc" width={40} height={40} /></div>
        <div>
          <div><strong>{npcName}</strong></div>
          <small className="dim">Мини‑приложение диалога</small>
        </div>
      </div>

      <ChatWindow messages={messages} />
      <MessageInput onSend={onSend} />

      <div className="footer">
        <small className="dim">{busy ? 'Генерация ответа…' : 'Готово'}</small>
        <button className="secondary" onClick={onEnd}>Завершить диалог</button>
      </div>
    </div>
  )
}
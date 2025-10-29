import React from 'react'
import ReactMarkdown from 'react-markdown'

type Msg = { from: 'npc' | 'you'; text: string }

export function ChatWindow({ messages, npcName }: { messages: Msg[]; npcName?: string }) {
  const npcLabel = (npcName || 'NPC').trim().split(/\s+/)[0]
  return (
    <div className="card chat">
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.from === 'npc' ? 'npc' : 'you'}`}>
          <strong>{m.from === 'npc' ? `${npcLabel}: ` : 'Вы: '}</strong>
          <ReactMarkdown>{m.text}</ReactMarkdown>
        </div>
      ))}
    </div>
  )
}
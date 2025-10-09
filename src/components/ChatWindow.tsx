import React from 'react'

type Msg = { from: 'npc' | 'you'; text: string }

export function ChatWindow({ messages }: { messages: Msg[] }) {
  return (
    <div className="card chat">
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.from === 'npc' ? 'npc' : 'you'}`}>
          <strong>{m.from === 'npc' ? 'NPC: ' : 'Вы: '}</strong>{m.text}
        </div>
      ))}
    </div>
  )
}
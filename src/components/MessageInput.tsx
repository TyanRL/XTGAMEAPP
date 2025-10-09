import React, { useState } from 'react'

export function MessageInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')

  function send() {
    const v = text.trim()
    if (!v) return
    onSend(v)
    setText('')
  }

  return (
    <div className="inputRow">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите вашу реплику..."
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />
      <button onClick={send}>Отправить</button>
    </div>
  )
}
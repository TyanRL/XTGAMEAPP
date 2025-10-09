# xtgameapp — Telegram Mini App (React + Vite) для Render

Мини‑репозиторий фронтенда мини‑приложения (Telegram Web App) для текстовых диалогов с NPC. Сайт — **статический** (Render Static Site). Бэкенд диалогов живёт в основном репозитории `xtgame` (FastAPI). Связь — через HTTP API (`VITE_API_BASE`).

---

## 1) Архитектура репозитория

```
xtgameapp/
├─ render.yaml                # (опционально) Blueprint для Render: Static Site
├─ package.json               # зависимости и скрипты
├─ vite.config.ts             # конфиг Vite
├─ index.html                 # HTML + подключение Telegram WebApp SDK
├─ .gitignore
├─ README.md
└─ src/
   ├─ main.tsx                # точка входа React
   ├─ App.tsx                 # основной экран диалога
   ├─ styles.css              # минимальные стили
   ├─ components/
   │  ├─ ChatWindow.tsx       # список сообщений
   │  └─ MessageInput.tsx     # поле ввода + отправка
   ├─ lib/
   │  ├─ api.ts               # HTTP‑клиент к FastAPI
   │  └─ telegram.ts          # безопасный доступ к Telegram.WebApp
   ├─ assets/
   │  └─ npc_avatar.png       # заглушка аватара
   └─ types/
      └─ telegram.d.ts        # типы Telegram WebApp SDK (минимальный d.ts)
```

**Ключевые идеи**
- UI и логика диалога живут на фронте; генерация реплик — на бэкенде (`xtgame`).
- Верификация `initData` делается **на бэке**. Фронт отправляет `X-Telegram-Init-Data` заголовком.
- Статический билд (`dist/`) деплоится на Render как Static Site. URL мини‑аппа отдаётся в `web_app.url` кнопки бота.

---

## 2) Переменные окружения

Для сборки указываем:

- `VITE_API_BASE` — базовый URL API бэкенда (например: `https://xt-dialogue-api.onrender.com/api/v1`).

Vite автоматически инлайнит переменные с префиксом `VITE_` в сборку. В коде доступно как `import.meta.env.VITE_API_BASE`.

---

## 3) Инструкции по деплою на Render (Static Site)

### Вариант A — через `render.yaml` (рекомендовано)

`render.yaml` в корне:

```yaml
services:
  - type: static
    name: xtgameapp
    buildCommand: npm ci && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_BASE
        value: https://xt-dialogue-api.onrender.com/api/v1
```

Дальше: **Render → New → Blueprint** → выбрать репозиторий → сервис создастся автоматически. При деплое соберётся Vite и опубликуется `dist/`.

### Вариант B — вручную (UI Render)
1) New → **Static Site** → подключить репозиторий.
2) Build Command: `npm ci && npm run build`
3) Publish Directory: `dist`
4) Add Environment Variable: `VITE_API_BASE=...`

---

## 4) Локальная разработка и тест

```bash
# установка
npm i
# запуск дев‑сервера (http://localhost:5173)
npm run dev
```

Бэкенд: запускаем локально FastAPI (например, `http://localhost:8000/api/v1`). Для теста в Telegram на устройстве используйте ngrok: пробросьте порт Vite и укажите HTTPS URL в `web_app.url` у кнопки бота.

> В обычном браузере `Telegram.WebApp` недоступен — код в `telegram.ts` безопасно мокирует отсутствие SDK. Для полноценного теста открывайте из Telegram.

---

## 5) Код (MVP)

### 5.1 package.json

```json
{
  "name": "xtgameapp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 5.2 vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
})
```

### 5.3 index.html

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>XT Mini App</title>
    <!-- Telegram WebApp SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.4 src/types/telegram.d.ts (минимум)

```ts
// Минимальные типы, чтобы не падала типизация при доступе к Telegram.WebApp
export {};

declare global {
  interface TelegramWebAppInitDataUnsafe {
    user?: { id: number; first_name?: string; last_name?: string; username?: string };
    query_id?: string;
    auth_date?: string;
    hash?: string;
  }
  interface TelegramWebApp {
    ready: () => void;
    close: () => void;
    sendData: (data: string) => void;
    initDataUnsafe?: TelegramWebAppInitDataUnsafe;
    colorScheme?: 'light' | 'dark';
    themeParams?: Record<string, string>;
  }
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}
```

### 5.5 src/lib/telegram.ts

```ts
export function getTelegram() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  // Фоллбек для локального браузера без Telegram
  return {
    ready: () => {},
    close: () => {},
    sendData: (_: string) => {},
    initDataUnsafe: undefined
  } as any;
}
```

### 5.6 src/lib/api.ts

```ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

async function req<T>(path: string, body: unknown, initData?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(initData ? { 'X-Telegram-Init-Data': initData } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export type StartResp = { reply: string; session_id: string; npc_name?: string; avatar_url?: string };
export type ContinueResp = { reply: string; done?: boolean };

export const api = {
  start: (npc_id: string, user_id?: number, initData?: string) =>
    req<StartResp>('/dialog/start', { npc_id, user_id }, initData),
  message: (session_id: string, text: string, user_id?: number, initData?: string) =>
    req<ContinueResp>('/dialog/continue', { session_id, text, user_id }, initData),
  end: (session_id: string, user_id?: number, initData?: string) =>
    req<{}>('/dialog/end', { session_id, user_id }, initData)
};
```

### 5.7 src/styles.css (минимум)

```css
:root { --bg:#0b0f1a; --panel:#131a2a; --npc:#1e2b4a; --you:#244025; --text:#e7eefc; }
*{ box-sizing: border-box }
body{ margin:0; background:var(--bg); color:var(--text); font:14px/1.4 system-ui, sans-serif }
#root{ max-width: 720px; margin:0 auto; padding:12px }
.header{ display:flex; align-items:center; gap:12px; margin-bottom:12px }
.avatar{ width:40px; height:40px; border-radius:50%; overflow:hidden; background:#0003 }
.card{ background:var(--panel); border-radius:12px; padding:12px }
.chat{ display:flex; flex-direction:column; gap:8px; max-height:60vh; overflow:auto }
.msg{ padding:8px 10px; border-radius:10px; width:fit-content; max-width: 90% }
.msg.npc{ background:var(--npc) }
.msg.you{ background:var(--you); margin-left:auto }
.inputRow{ display:flex; gap:8px; margin-top:10px }
input[type=text]{ flex:1; padding:10px 12px; border-radius:10px; border:none; outline:none; background:#1a2338; color:var(--text) }
button{ padding:10px 14px; border:none; border-radius:10px; background:#2b5eff; color:white; cursor:pointer }
button.secondary{ background:#3a445f }
.footer{ display:flex; justify-content:space-between; margin-top:10px }
small.dim{ opacity:.7 }
```

### 5.8 src/components/ChatWindow.tsx

```tsx
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
```

### 5.9 src/components/MessageInput.tsx

```tsx
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
```

### 5.10 src/main.tsx

```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)
```

### 5.11 src/App.tsx

```tsx
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
```

### 5.12 .gitignore

```gitignore
node_modules
.DS_Store
.dist
/dist
vite.config.ts.timestamp-*
```

### 5.13 README.md (кратко)

```md
# xtgameapp (Telegram Mini App)

React + Vite мини‑приложение для диалогов NPC.

## Быстрый старт

```bash
npm i
npm run dev
```

Укажите переменную окружения `VITE_API_BASE` (по умолчанию ожидается локальный FastAPI `http://localhost:8000/api/v1`).

## Деплой на Render
- Static Site, Build: `npm ci && npm run build`, Publish: `dist`
- ENV: `VITE_API_BASE=https://xt-dialogue-api.onrender.com/api/v1`

## Интеграция с ботом
Кнопка:
```python
InlineKeyboardButton(
  text="Поговорить",
  web_app={"url": "https://<your-app>.onrender.com?npc=ID"}
)
```

## Безопасность
Фронт передаёт `window.Telegram.WebApp.initData` в заголовке `X-Telegram-Init-Data`. Бэкенд должен верифицировать подпись по токену бота.
```

---

## 6) Контракты API (ожидания фронта)

- `POST /dialog/start` `{ npc_id, user_id? }` → `{ session_id, reply, npc_name?, avatar_url? }`
- `POST /dialog/continue` `{ session_id, text, user_id? }` → `{ reply, done? }`
- `POST /dialog/end` `{ session_id, user_id? }` → `{}`

Все POST сопровождаются заголовком `X-Telegram-Init-Data: <initData>`.

---

## 7) Чек‑лист готовности MVP

- [x] React + Vite скелет, сборка `dist/`
- [x] Telegram WebApp SDK подключён, `ready()/sendData()/close()`
- [x] UI: чат, ввод, аватар, завершение
- [x] Интеграция с API: start/continue/end, `VITE_API_BASE`
- [x] Render: Static Site (через `render.yaml` или UI), ENV настроены
- [x] Fallback на локальную разработку без Telegram

---

## 8) Что дальше (после MVP)

- Потоковые ответы (SSE/WebSocket) для эффекта «печатает…».
- Загрузка аватара NPC из `avatar_url` (с бэка) + костюмизация темы по `themeParams`.
- Кнопки быстрых ответов и предложений (подсказки с бэка).
- Телеметрия (согласованная) и A/B текстовых промптов.
- Локализация (i18n).


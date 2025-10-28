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

export type StartResp = {
  reply: string;
  session_id: string;
  npc_name?: string;
  avatar_url?: string;
  npc_description?: string;
  gender?: 'male' | 'female' | 'neutral';
};
export type ContinueResp = {
  reply: string;
  done?: boolean;
  npc_description?: string;
};

export const api = {
  start: (npc_id: string, user_id?: number, initData?: string) =>
    req<StartResp>('/dialog/start', { npc_id, user_id }, initData),
  message: (session_id: string, text: string, user_id?: number, initData?: string) =>
    req<ContinueResp>('/dialog/continue', { session_id, text, user_id }, initData),
  end: (session_id: string, user_id?: number, initData?: string) =>
    req<{}>('/dialog/end', { session_id, user_id }, initData)
};
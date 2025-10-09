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
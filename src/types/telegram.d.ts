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
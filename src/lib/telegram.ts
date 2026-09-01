import type { TelegramUser } from '../types';

type ThemeParams = Record<string, string>;

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme: 'light' | 'dark';
  themeParams: ThemeParams;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setParams: (params: Record<string, unknown>) => void;
    enable: () => void;
    disable: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  sendData: (data: string) => void;
  openTelegramLink: (url: string) => void;
  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
  disableVerticalSwipes?: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (typeof tg.disableVerticalSwipes === 'function') {
    tg.disableVerticalSwipes();
  }
  applyTheme();
  tg.onEvent('themeChanged', applyTheme);
}

function applyTheme() {
  if (!tg) return;
  const root = document.documentElement;
  const p = tg.themeParams;
  if (p.bg_color) root.style.setProperty('--bg', `#${p.bg_color}`);
}

export function haptic(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
  tg?.HapticFeedback?.impactOccurred(style);
}

export function hapticSuccess() {
  tg?.HapticFeedback?.notificationOccurred('success');
}

export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged();
}

export function getTelegramUser(): TelegramUser | null {
  return tg?.initDataUnsafe?.user ?? null;
}

export function getInitDataRaw(): string {
  return tg?.initData ?? '';
}

export function setMainButton(text: string, onClick: () => void, isVisible = true) {
  if (!tg) return () => {};
  if (!isVisible) {
    tg.MainButton.hide();
    return () => {};
  }
  tg.MainButton.setParams({ text, color: '#b9a6ff', text_color: '#171126' });
  tg.MainButton.show();
  tg.MainButton.enable();
  tg.MainButton.onClick(onClick);
  return () => {
    tg.MainButton.offClick(onClick);
    tg.MainButton.hide();
  };
}

export function setBackButton(onClick: () => void, isVisible = true) {
  if (!tg) return () => {};
  if (!isVisible) {
    tg.BackButton.hide();
    return () => {};
  }
  tg.BackButton.show();
  tg.BackButton.onClick(onClick);
  return () => {
    tg.BackButton.offClick(onClick);
    tg.BackButton.hide();
  };
}
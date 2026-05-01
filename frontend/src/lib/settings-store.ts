'use client';

import { create } from 'zustand';

interface SettingsState {
  currency: string;
  shopName: string;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'SYP',
  shopName: 'محل الأراكيل',

  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        set({
          currency: data.settings.currency || 'SYP',
          shopName: data.settings.shopName || 'محل الأراكيل',
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  },
}));

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    SYP: 'ل.س',
    IQD: 'د.ع',
    USD: '$',
    EUR: '€',
    SAR: 'ر.س',
    AED: 'د.إ',
    KWD: 'د.ك',
  };
  return symbols[currency] || currency;
};

export const formatCurrency = (value: number, currency?: string): string => {
  const curr = currency || useSettingsStore.getState().currency || 'SYP';
  const symbol = getCurrencySymbol(curr);
  return `${value.toLocaleString()} ${symbol}`;
};
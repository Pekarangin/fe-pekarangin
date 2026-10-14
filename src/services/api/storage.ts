import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';

let memoryToken: string | null = null;
let memoryWilayah: string | null = null;
let memoryOnboarded: boolean = false;
let memoryUser: User | null = null;
let isStorageInitialized: boolean = false;

export const initStorageAsync = async (): Promise<{
  token: string | null;
  onboarded: boolean;
  wilayah: string | null;
  user: User | null;
}> => {
  try {
    const [token, onboarded, wilayah, userStr] = await Promise.all([
      AsyncStorage.getItem('pekarangin_token'),
      AsyncStorage.getItem('pekarangin_onboarded'),
      AsyncStorage.getItem('pekarangin_wilayah'),
      AsyncStorage.getItem('pekarangin_user'),
    ]);

    if (token) memoryToken = token;
    if (onboarded === 'true') memoryOnboarded = true;
    if (wilayah) memoryWilayah = wilayah;
    if (userStr) {
      try {
        memoryUser = JSON.parse(userStr);
      } catch {}
    }
  } catch (err) {
    console.warn('Gagal memuat local storage:', err);
  } finally {
    isStorageInitialized = true;
  }

  return {
    token: memoryToken,
    onboarded: memoryOnboarded,
    wilayah: memoryWilayah,
    user: memoryUser,
  };
};

export const tokenStorage = {
  get: (): string | null => {
    return memoryToken;
  },
  set: (token: string | null): void => {
    memoryToken = token;
    if (token) {
      AsyncStorage.setItem('pekarangin_token', token).catch(console.warn);
    } else {
      AsyncStorage.removeItem('pekarangin_token').catch(console.warn);
    }
  },
  clear: (): void => {
    memoryToken = null;
    AsyncStorage.removeItem('pekarangin_token').catch(console.warn);
  },
};

export const userStorage = {
  get: (): User | null => {
    return memoryUser;
  },
  set: (user: User | null): void => {
    memoryUser = user;
    if (user) {
      AsyncStorage.setItem('pekarangin_user', JSON.stringify(user)).catch(console.warn);
    } else {
      AsyncStorage.removeItem('pekarangin_user').catch(console.warn);
    }
  },
  clear: (): void => {
    memoryUser = null;
    AsyncStorage.removeItem('pekarangin_user').catch(console.warn);
  },
};

export const profileStorage = {
  getWilayah: (): string | null => {
    return memoryWilayah;
  },
  setWilayah: (wilayah: string | null): void => {
    memoryWilayah = wilayah;
    if (wilayah) {
      AsyncStorage.setItem('pekarangin_wilayah', wilayah).catch(console.warn);
    } else {
      AsyncStorage.removeItem('pekarangin_wilayah').catch(console.warn);
    }
  },
  clear: (): void => {
    memoryWilayah = null;
    AsyncStorage.removeItem('pekarangin_wilayah').catch(console.warn);
  },
};

export const onboardingStorage = {
  get: (): boolean => {
    return memoryOnboarded;
  },
  set: (val: boolean): void => {
    memoryOnboarded = val;
    if (val) {
      AsyncStorage.setItem('pekarangin_onboarded', 'true').catch(console.warn);
    } else {
      AsyncStorage.removeItem('pekarangin_onboarded').catch(console.warn);
    }
  },
};

const memoryGridSnapshots: Record<string, number[]> = {};

export const lahanStorage = {
  getGridSnapshot: (lahanId: string): number[] | null => {
    return memoryGridSnapshots[lahanId] || null;
  },
  setGridSnapshot: (lahanId: string, snapshot: number[]): void => {
    memoryGridSnapshots[lahanId] = snapshot;
    AsyncStorage.setItem(`pekarangin_grid_${lahanId}`, JSON.stringify(snapshot)).catch(console.warn);
  },
};

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export interface StoredChatSession {
  savedAt: number;
  messages: ChatMessageItem[];
}

const memoryChatSessions: Record<string, StoredChatSession> = {};
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const chatStorage = {
  get: (userId?: string): ChatMessageItem[] => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    const now = Date.now();
    const mem = memoryChatSessions[key];
    if (mem) {
      if (now - mem.savedAt < ONE_DAY_MS) {
        return mem.messages;
      } else {
        delete memoryChatSessions[key];
        AsyncStorage.removeItem(key).catch(console.warn);
      }
    }
    return [];
  },
  set: (messages: ChatMessageItem[], userId?: string): void => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    const session: StoredChatSession = {
      savedAt: Date.now(),
      messages,
    };
    memoryChatSessions[key] = session;
    AsyncStorage.setItem(key, JSON.stringify(session)).catch(console.warn);
  },
  clear: (userId?: string): void => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    delete memoryChatSessions[key];
    AsyncStorage.removeItem(key).catch(console.warn);
  },
};

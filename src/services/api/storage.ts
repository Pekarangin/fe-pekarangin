// Simple token and profile storage
// In web/dev, uses memory + localStorage fallback if available
let memoryToken: string | null = null;
let memoryWilayah: string | null = null;
let memoryOnboarded: boolean = false;

export const tokenStorage = {
  get: (): string | null => {
    if (memoryToken) return memoryToken;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('pekarangin_token');
    }
    return null;
  },
  set: (token: string | null): void => {
    memoryToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem('pekarangin_token', token);
      } else {
        window.localStorage.removeItem('pekarangin_token');
      }
    }
  },
  clear: (): void => {
    memoryToken = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('pekarangin_token');
    }
  },
};

export const profileStorage = {
  getWilayah: (): string | null => {
    if (memoryWilayah) return memoryWilayah;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('pekarangin_wilayah');
    }
    return null;
  },
  setWilayah: (wilayah: string | null): void => {
    memoryWilayah = wilayah;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (wilayah) {
        window.localStorage.setItem('pekarangin_wilayah', wilayah);
      } else {
        window.localStorage.removeItem('pekarangin_wilayah');
      }
    }
  },
  clear: (): void => {
    memoryWilayah = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('pekarangin_wilayah');
    }
  },
};

export const onboardingStorage = {
  get: (): boolean => {
    if (memoryOnboarded) return true;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('pekarangin_onboarded') === 'true';
    }
    return false;
  },
  set: (val: boolean): void => {
    memoryOnboarded = val;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (val) {
        window.localStorage.setItem('pekarangin_onboarded', 'true');
      } else {
        window.localStorage.removeItem('pekarangin_onboarded');
      }
    }
  },
};

const memoryGridSnapshots: Record<string, number[]> = {};

export const lahanStorage = {
  getGridSnapshot: (lahanId: string): number[] | null => {
    if (memoryGridSnapshots[lahanId]) return memoryGridSnapshots[lahanId];
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(`pekarangin_grid_${lahanId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            memoryGridSnapshots[lahanId] = parsed;
            return parsed;
          }
        } catch {}
      }
    }
    return null;
  },
  setGridSnapshot: (lahanId: string, snapshot: number[]): void => {
    memoryGridSnapshots[lahanId] = snapshot;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`pekarangin_grid_${lahanId}`, JSON.stringify(snapshot));
    }
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
  savedAt: number; // timestamp in ms
  messages: ChatMessageItem[];
}

const memoryChatSessions: Record<string, StoredChatSession> = {};
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const chatStorage = {
  get: (userId?: string): ChatMessageItem[] => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    const now = Date.now();

    // 1. Check in-memory store
    const mem = memoryChatSessions[key];
    if (mem) {
      if (now - mem.savedAt < ONE_DAY_MS) {
        return mem.messages;
      } else {
        delete memoryChatSessions[key];
      }
    }

    // 2. Check localStorage store
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const parsed: StoredChatSession = JSON.parse(raw);
          if (parsed && typeof parsed.savedAt === 'number' && Array.isArray(parsed.messages)) {
            if (now - parsed.savedAt < ONE_DAY_MS) {
              memoryChatSessions[key] = parsed;
              return parsed.messages;
            } else {
              window.localStorage.removeItem(key);
            }
          }
        } catch {}
      }
    }

    return [];
  },

  set: (
    messages: ChatMessageItem[],
    userId?: string
  ): void => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    const session: StoredChatSession = {
      savedAt: Date.now(),
      messages,
    };
    memoryChatSessions[key] = session;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(session));
      } catch {}
    }
  },

  clear: (userId?: string): void => {
    const key = `pekarangin_chat_${userId || 'default'}`;
    delete memoryChatSessions[key];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};



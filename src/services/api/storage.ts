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


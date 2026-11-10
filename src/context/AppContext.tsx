import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Lahan, TanamanAktif, RekomendasiItem, UserStats, CatatanHarian, KesesuaianSinar, TingkatKesulitan, PaparanSinar } from '../types';
import {
  ReminderSchedule,
  DEFAULT_REMINDERS,
  scheduleDailyReminder,
  cancelReminderNotification,
  triggerTestAlarmNotification,
} from '../services/notifications';
import {
  authService,
  AuthUserData,
  UpdateProfilePayload,
  lahanService,
  trackingService,
  rekomendasiService,
  aiInsightService,
  tokenStorage,
  profileStorage,
  lahanStorage,
  activeLahanStorage,
  onboardingStorage,
  initStorageAsync,
  userStorage,
} from '../services/api';
import { getCropImage } from '../constants/cropImages';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  isAuthLoading: boolean;
  login: (email: string, password?: string, nama?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<AuthUserData>;
  logout: () => void;
  register: (nama: string, email: string, password?: string, wilayah?: string) => Promise<void>;
  updateUserProfile: (data: UpdateProfilePayload) => Promise<void>;
  fetchRemoteUserData: () => Promise<void>;

  
  // Lahan state
  lahans: Lahan[];
  activeLahan: Lahan | null;
  setActiveLahan: (lahan: Lahan) => void;
  saveLahan: (lahan: Omit<Lahan, 'lahan_id' | 'created_at'>) => Promise<Lahan>;
  createLahan: (lahan: Omit<Lahan, 'lahan_id' | 'created_at'>) => Promise<Lahan>;
  updateLahan: (id: string, lahan: Partial<Omit<Lahan, 'lahan_id' | 'created_at'>>) => Promise<Lahan>;
  deleteLahan: (id: string) => Promise<void>;
  
  // Tanaman aktif state
  activeCrops: TanamanAktif[];
  toggleChecklistSiram: (cropId: string) => void;
  toggleChecklistPupuk: (cropId: string) => void;
  updateCatatanHarian: (cropId: string, catatan: string) => Promise<void>;
  toggleAllSiram: (forceDone?: boolean) => void;
  toggleAllPupuk: (forceDone?: boolean) => void;
  addTanamanAktif: (komoditasId: string, komoditasNama: string, jumlah?: number, luasPerUnit?: number) => Promise<void>;
  recordPanen: (cropId: string, beratGram: number) => Promise<{ hematRp: number; tanamanNama: string }>;
  recordGagal: (cropId: string, alasan: string) => Promise<void>;
  
  // Rekomendasi state
  rekomendasiList: RekomendasiItem[];
  isLoadingRekomendasi: boolean;
  rekomendasiError: string | null;
  refreshRekomendasi: () => Promise<void>;
  
  // Stats
  stats: UserStats;
  catatanHistory: Record<string, CatatanHarian[]>;

  // Pengingat Siram & Alarm Schedules
  reminders: ReminderSchedule[];
  updateReminderTime: (id: string, hour: number, minute: number) => Promise<void>;
  toggleReminder: (id: string, forceEnabled?: boolean) => Promise<void>;
  addCustomReminder: (label: string, subtitle: string, hour: number, minute: number) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  triggerTestAlarm: (label?: string) => Promise<void>;

  // Global Page Tour State
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  tourStep: 1 | 2 | 3 | 4 | 5;
  setTourStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  startTour: () => void;
  skipTour: () => void;

  // AI Insight
  askAiInsight: (message: string, cropId?: string) => Promise<{ reply: string; konteks_tanaman?: any }>;
}



const EMPTY_STATS: UserStats = {
  total_panen_kg: 0,
  total_hemat_rp: 0,
  rth_aktif_m2: 0,
  kontribusi_lingkungan_persen: 0,
  streak_hari: 0,
};

export function formatScore(score: number): string {
  if (!score || isNaN(score)) return '0';
  return Math.round(score).toLocaleString('id-ID');
}

export function normalizeScore(score: number): number {
  if (!score || isNaN(score)) return 0;
  return Math.round(score);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STRICT INITIAL STATE: User must pass onboarding and authentication first
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => onboardingStorage.get());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const setIsOnboarded = useCallback((val: boolean) => {
    onboardingStorage.set(val);
    setIsOnboardedState(val);
  }, []);

  const [lahans, setLahans] = useState<Lahan[]>([]);
  const [activeLahan, setActiveLahan] = useState<Lahan | null>(null);
  const [activeCrops, setActiveCrops] = useState<TanamanAktif[]>([]);
  const [rekomendasiList, setRekomendasiList] = useState<RekomendasiItem[]>([]);
  const [isLoadingRekomendasi, setIsLoadingRekomendasi] = useState<boolean>(true);
  const [rekomendasiError, setRekomendasiError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [catatanHistory] = useState<Record<string, CatatanHarian[]>>({});
  const [reminders, setReminders] = useState<ReminderSchedule[]>(DEFAULT_REMINDERS);

  const fetchRemoteUserData = useCallback(async () => {
    try {
      const [remoteLahans, remoteCrops] = await Promise.allSettled([
        lahanService.getAll(),
        trackingService.getAll(),
      ]);

      let loadedLahans: Lahan[] = [];
      let loadedCrops: TanamanAktif[] = [];

      if (remoteLahans.status === 'fulfilled' && Array.isArray(remoteLahans.value)) {
        loadedLahans = remoteLahans.value;
        if (loadedLahans.length > 0) {
          const first = { ...loadedLahans[0] };
          if (!first.grid_snapshot || first.grid_snapshot.length === 0) {
            try {
              const detailed = await lahanService.getById(first.lahan_id);
              if (detailed && detailed.grid_snapshot && detailed.grid_snapshot.length > 0) {
                first.grid_snapshot = detailed.grid_snapshot;
                lahanStorage.setGridSnapshot(first.lahan_id, detailed.grid_snapshot);
              }
            } catch {
              const cached = lahanStorage.getGridSnapshot(first.lahan_id);
              if (cached) {
                first.grid_snapshot = cached;
              }
            }
          } else {
            lahanStorage.setGridSnapshot(first.lahan_id, first.grid_snapshot);
          }
          loadedLahans[0] = first;
        }
        setLahans(loadedLahans);
        const savedLahanId = activeLahanStorage.get();
        let targetLahan: Lahan | null = null;
        if (savedLahanId && loadedLahans.some(l => l.lahan_id === savedLahanId)) {
          targetLahan = loadedLahans.find(l => l.lahan_id === savedLahanId) || null;
        } else if (loadedLahans.length > 0) {
          targetLahan = loadedLahans[0];
        }

        setActiveLahan(targetLahan);
        if (targetLahan?.lahan_id) {
          activeLahanStorage.set(targetLahan.lahan_id);
        }
      } else {
        setLahans([]);
        setActiveLahan(null);
        activeLahanStorage.clear();
      }

      if (remoteCrops.status === 'fulfilled' && Array.isArray(remoteCrops.value)) {
        loadedCrops = remoteCrops.value.map(c => ({
          ...c,
          image_url: c.image_url || getCropImage(c.komoditas_nama),
        }));
        setActiveCrops(loadedCrops);
      } else {
        setActiveCrops([]);
      }

      // Compute dynamic stats from actual user data (realisasi panen dari database)
      const rthArea = loadedLahans.reduce((acc, l) => acc + (Number(l.luas_m2) || 0), 0);
      const totalPanenKg = loadedCrops.reduce((acc, c) => {
        if (c.status !== 'PANEN') return acc;
        const rp = c.realisasiPanen || c.realisasi_panen;
        const berat = rp?.berat_kg ?? (rp?.berat_panen_gram ? rp.berat_panen_gram / 1000 : undefined) ?? c.berat_panen_kg ?? 0;
        return acc + Number(berat);
      }, 0);

      const totalHemat = loadedCrops.reduce((acc, c) => {
        if (c.status !== 'PANEN') return acc;
        const rp = c.realisasiPanen || c.realisasi_panen;
        const hemat = rp?.nilai_ekonomi_hemat ?? rp?.estimasi_hemat_rp ?? c.penghematan_rp ?? 0;
        return acc + Number(hemat);
      }, 0);

      const hasDoneChecklist = loadedCrops.some(
        c => c.checklist_hari_ini?.siram_done || c.checklist_hari_ini?.pupuk_done
      );

      setStats({
        rth_aktif_m2: Number(rthArea.toFixed(2)),
        total_panen_kg: Number(totalPanenKg.toFixed(2)),
        total_hemat_rp: totalHemat,
        kontribusi_lingkungan_persen: rthArea > 0 ? Math.min(100, Math.round((rthArea / 20) * 100)) : 0,
        streak_hari: hasDoneChecklist ? 1 : 0,
      });
    } catch (e) {
      console.warn('Gagal sinkronisasi data remote:', e);
    }
  }, []);

  // Check active session and persisted state on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await initStorageAsync();
        if (!isMounted) return;

        if (stored.onboarded) {
          setIsOnboardedState(true);
        }

        if (stored.user && stored.token) {
          setUser(stored.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('initStorageAsync error:', err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }

      // Background verify & refresh if token exists
      const token = tokenStorage.get();
      if (token) {
        authService
          .getMe()
          .then(profile => {
            if (!isMounted) return;
            const savedWilayah = profile.wilayah || profileStorage.getWilayah() || '';
            if (profile.wilayah) {
              profileStorage.setWilayah(profile.wilayah);
            }
            const verifiedUser: User = {
              user_id: profile.user_id,
              nama: profile.nama,
              email: profile.email,
              wilayah: savedWilayah,
              avatar_url: profile.avatar_url || null,
              created_at: profile.created_at || new Date().toISOString(),
            };
            setUser(verifiedUser);
            userStorage.set(verifiedUser);
            setIsAuthenticated(true);
            setIsOnboardedState(true);
            fetchRemoteUserData();
          })
          .catch((err: any) => {
            if (!isMounted) return;
            if (err?.status === 401) {
              tokenStorage.clear();
              userStorage.clear();
              setUser(null);
              setIsAuthenticated(false);
            }
          });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [fetchRemoteUserData]);

const SUNLIGHT_MATRIX: Record<string, Record<string, number>> = {
  FULL_SUN:    { FULL_SUN: 1.0, PARTIAL_SUN: 0.6, SHADE: 0.2 },
  PARTIAL_SUN: { FULL_SUN: 0.8, PARTIAL_SUN: 1.0, SHADE: 0.6 },
  SHADE:       { FULL_SUN: 0.2, PARTIAL_SUN: 0.6, SHADE: 1.0 },
};

function getCropCategory(name: string): 'DAUN' | 'BUMBU' | 'BUAH' {
  const lower = name.toLowerCase();
  if (lower.includes('bawang') && !lower.includes('daun bawang')) return 'BUMBU';
  if (lower.includes('cabai') || lower.includes('cabe')) return 'BUMBU';
  if (
    lower.includes('bayam') ||
    lower.includes('kangkung') ||
    lower.includes('selada') ||
    lower.includes('sawi') ||
    lower.includes('kemangi') ||
    lower.includes('daun bawang')
  ) {
    return 'DAUN';
  }
  return 'BUAH';
}

function diversifyRecommendations(items: RekomendasiItem[], lahan?: Lahan | null): RekomendasiItem[] {
  if (!items || items.length <= 1) return items;

  const totalLuas = Number(lahan?.luas_m2) || 1000;

  const getRank = (item: RekomendasiItem) => {
    const isLuasMuat = totalLuas >= (item.luas_dibutuhkan_m2 || 0.25);
    if (item.kesesuaian_sinar === 'COCOK' && isLuasMuat) return 4;
    if (item.kesesuaian_sinar === 'KURANG_COCOK' && isLuasMuat) return 3;
    if (isLuasMuat) return 2;
    if (item.kesesuaian_sinar !== 'TIDAK_COCOK') return 1;
    return 0;
  };

  const sorted = [...items].sort((a, b) => {
    const rankDiff = getRank(b) - getRank(a);
    if (rankDiff !== 0) return rankDiff;
    return b.skor_prioritas - a.skor_prioritas;
  });

  const tier4 = sorted.filter(item => getRank(item) === 4);
  const tier3 = sorted.filter(item => getRank(item) === 3);
  const tier2 = sorted.filter(item => getRank(item) === 2);
  const tier1 = sorted.filter(item => getRank(item) === 1);
  const tier0 = sorted.filter(item => getRank(item) === 0);

  const diversifyTier = (tierItems: RekomendasiItem[]): RekomendasiItem[] => {
    if (tierItems.length <= 2) return tierItems;
    const tierResult: RekomendasiItem[] = [];
    const used = new Set<string>();

    // Tanaman skor tertinggi dalam tier tetap nomor 1 mutlak
    tierResult.push(tierItems[0]);
    used.add(tierItems[0].komoditas_id);
    const firstCat = getCropCategory(tierItems[0].nama);

    // Variasi kategori lain untuk tanaman urutan berikutnya
    const remainingCats: ('DAUN' | 'BUMBU' | 'BUAH')[] = (['DAUN', 'BUMBU', 'BUAH'] as const).filter(c => c !== firstCat);
    for (const cat of remainingCats) {
      const pick = tierItems.find(
        item => getCropCategory(item.nama) === cat && !used.has(item.komoditas_id)
      );
      if (pick) {
        tierResult.push(pick);
        used.add(pick.komoditas_id);
      }
    }

    // Masukkan sisa dalam tier sesuai skor
    for (const item of tierItems) {
      if (!used.has(item.komoditas_id)) {
        tierResult.push(item);
        used.add(item.komoditas_id);
      }
    }

    return tierResult;
  };

  return [
    ...diversifyTier(tier4),
    ...diversifyTier(tier3),
    ...diversifyTier(tier2),
    ...diversifyTier(tier1),
    ...tier0,
  ];
}

  const fetchRekomendasiByLahan = useCallback(
    async (targetLahan?: Lahan | null): Promise<RekomendasiItem[] | null> => {
      const lahanToUse = targetLahan !== undefined ? targetLahan : activeLahan;
      if (lahanToUse?.lahan_id && !lahanToUse.lahan_id.startsWith('lah-')) {
        const res = await rekomendasiService.getByLahanId(lahanToUse.lahan_id);
        if (res?.rekomendasi && res.rekomendasi.length > 0) {
          const mapped = res.rekomendasi.map(item => ({
            ...item,
            skor_prioritas: Math.round(item.skor_prioritas),
            image_url: item.image_url || getCropImage(item.nama),
          }));
          return diversifyRecommendations(mapped, lahanToUse);
        }
        return [];
      }

      const data = await rekomendasiService.getAllKomoditas();
      if (Array.isArray(data) && data.length > 0) {
        const detailedList = await Promise.allSettled(
          data.map(k => rekomendasiService.getKomoditasById(k.komoditas_id || (k as any).id))
        );

        const computedList: RekomendasiItem[] = data.map((k: any, idx: number) => {
          const detailSettled = detailedList[idx];
          const detail = detailSettled.status === 'fulfilled' ? detailSettled.value : null;
          const hargaPasar = detail?.harga_terkini?.harga_rp_per_kg || 25000;
          const konsumsiRt = Number(k.konsumsi_rt_kg_per_bulan || k.konsumsiRtKgPerBulan || 1);
          const estimasiHemat = Math.round(konsumsiRt * hargaPasar);

          const kebutuhanSinar = k.kebutuhan_sinar || k.kebutuhanSinar || 'FULL_SUN';
          const paparanLahan = lahanToUse?.paparan_sinar || 'FULL_SUN';
          const sunlightFactor = SUNLIGHT_MATRIX[kebutuhanSinar]?.[paparanLahan] ?? 0.8;
          const kesesuaianSinar: KesesuaianSinar =
            sunlightFactor >= 1.0 ? 'COCOK' : sunlightFactor >= 0.6 ? 'KURANG_COCOK' : 'TIDAK_COCOK';

          const luasMin = Number(k.luas_min_m2 || k.luasMinM2 || 0.25);
          const waktuPanen = k.waktu_panen_hari || k.waktuPanenHari || 45;
          const isMuat = (lahanToUse?.luas_m2 || 0) >= (luasMin || 0.25);
          const rawScore = (estimasiHemat / (luasMin || 0.25) / (waktuPanen || 45)) * sunlightFactor * (isMuat ? 1.0 : 0.2);
          const skorPrioritas = Math.round(rawScore);

          return {
            komoditas_id: k.komoditas_id || k.id,
            nama: k.nama,
            skor_prioritas: skorPrioritas,
            estimasi_hemat_rp_per_bulan: estimasiHemat,
            waktu_panen_hari: waktuPanen,
            luas_dibutuhkan_m2: luasMin,
            tingkat_kesulitan: (k.tingkat_kesulitan || k.tingkatKesulitan || 'MUDAH') as TingkatKesulitan,
            kebutuhan_sinar: (kebutuhanSinar || 'FULL_SUN') as PaparanSinar,
            kesesuaian_sinar: kesesuaianSinar,
            harga_pasar_per_kg: hargaPasar,
            konsumsi_rt_kg_per_bulan: konsumsiRt,
            image_url: k.image_url || detail?.image_url || '',
            panduan_singkat: k.panduan_singkat || detail?.panduan_singkat || 'Cocok ditanam di pekarangan rumah.',
            jadwal_siram_hari: k.jadwal_siram_hari || detail?.jadwal_siram_hari || 1,
            jadwal_pupuk_hari: k.jadwal_pupuk_hari || detail?.jadwal_pupuk_hari || 14,
            media_tanam: 'Pot / Polybag / Bedengan',
          };
        });

        return diversifyRecommendations(computedList, activeLahan);
      }

      return [];
    },
    [activeLahan]
  );

  const loadRekomendasiForLahan = useCallback(
    async (targetLahan?: Lahan | null): Promise<RekomendasiItem[] | null> => {
      setIsLoadingRekomendasi(true);
      setRekomendasiError(null);
      try {
        const result = await fetchRekomendasiByLahan(targetLahan);
        if (result && result.length > 0) {
          setRekomendasiList(result);
          setRekomendasiError(null);
        } else {
          setRekomendasiList([]);
        }
        return result;
      } catch (err: any) {
        console.warn('Gagal ambil rekomendasi:', err);
        setRekomendasiError(err?.message || 'Gagal memuat data dari server');
        return null;
      } finally {
        setIsLoadingRekomendasi(false);
      }
    },
    [fetchRekomendasiByLahan]
  );

  const refreshRekomendasi = useCallback(async () => {
    await loadRekomendasiForLahan(activeLahan);
  }, [activeLahan, loadRekomendasiForLahan]);

  // Auto-fetch remote recommendations when activeLahan changes
  useEffect(() => {
    let isMounted = true;
    fetchRekomendasiByLahan(activeLahan)
      .then(result => {
        if (!isMounted) return;
        if (result && result.length > 0) {
          setRekomendasiList(result);
          setRekomendasiError(null);
        } else {
          setRekomendasiList([]);
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setRekomendasiError(err?.message || 'Gagal memuat data rekomendasi');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRekomendasi(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [activeLahan, fetchRekomendasiByLahan]);

  const updateReminderTime = async (id: string, hour: number, minute: number) => {
    setReminders(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, hour, minute };
          if (updated.enabled) {
            scheduleDailyReminder(updated).then(notifId => {
              setReminders(curr => curr.map(item => item.id === id ? { ...item, notificationId: notifId } : item));
            });
          }
          return updated;
        }
        return r;
      })
    );
  };

  const toggleReminder = async (id: string, forceEnabled?: boolean) => {
    setReminders(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextEnabled = forceEnabled !== undefined ? forceEnabled : !r.enabled;
          const updated = { ...r, enabled: nextEnabled };
          if (nextEnabled) {
            scheduleDailyReminder(updated).then(notifId => {
              setReminders(curr => curr.map(item => item.id === id ? { ...item, notificationId: notifId } : item));
            });
          } else if (r.notificationId) {
            cancelReminderNotification(r.notificationId);
            updated.notificationId = null;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const addCustomReminder = async (label: string, subtitle: string, hour: number, minute: number) => {
    const newReminder: ReminderSchedule = {
      id: 'rem-' + Date.now(),
      label: label || 'Pengingat Siram',
      subtitle: subtitle || 'Jadwal siram harian',
      hour,
      minute,
      enabled: true,
    };
    const notifId = await scheduleDailyReminder(newReminder);
    newReminder.notificationId = notifId;
    setReminders(prev => [...prev, newReminder]);
  };

  const deleteReminder = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (target?.notificationId) {
      await cancelReminderNotification(target.notificationId);
    }
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const triggerTestAlarm = async (label?: string) => {
    await triggerTestAlarmNotification(label || 'Siram Pekarangan');
  };


  const login = async (email: string, password?: string, nama?: string) => {
    try {
      const data = await authService.login(email, password || 'password123');
      const savedWilayah = data.wilayah || profileStorage.getWilayah() || '';
      if (data.wilayah) {
        profileStorage.setWilayah(data.wilayah);
      }
      const loggedInUser: User = {
        user_id: data.user_id,
        nama: data.nama || nama || email.split('@')[0],
        email: data.email,
        wilayah: savedWilayah,
        avatar_url: data.avatar_url || null,
        created_at: new Date().toISOString(),
      };
      setUser(loggedInUser);
      userStorage.set(loggedInUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
      await fetchRemoteUserData();
    } catch (e: any) {
      if (e?.status && e.status >= 400 && e.status < 500) {
        throw e;
      }
      console.warn('API login error, fallback ke local state:', e);
      const fallbackUser: User = {
        user_id: 'usr-' + Date.now(),
        nama: nama || email.split('@')[0],
        email: email,
        wilayah: profileStorage.getWilayah() || '',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      userStorage.set(fallbackUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<AuthUserData> => {
    if (!idToken) {
      throw new Error('Google ID Token tidak ditemukan.');
    }
    const data = await authService.loginWithGoogle(idToken);
    const savedWilayah = data.wilayah || profileStorage.getWilayah() || '';
    if (data.wilayah) {
      profileStorage.setWilayah(data.wilayah);
    }
    const loggedInUser: User = {
      user_id: data.user_id,
      nama: data.nama,
      email: data.email,
      wilayah: savedWilayah,
      avatar_url: data.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    setUser(loggedInUser);
    userStorage.set(loggedInUser);
    setIsAuthenticated(true);
    setIsOnboarded(true);
    setLahans([]);
    setActiveLahan(null);
    setActiveCrops([]);
    setStats(EMPTY_STATS);
    await fetchRemoteUserData();
    return data;
  };

  const register = async (nama: string, email: string, password?: string, wilayah?: string) => {
    if (wilayah) {
      profileStorage.setWilayah(wilayah);
    }
    try {
      const data = await authService.register(nama, email, password || 'password123', wilayah);
      const savedWilayah = data.wilayah || wilayah || '';
      if (savedWilayah) {
        profileStorage.setWilayah(savedWilayah);
      }
      const registeredUser: User = {
        user_id: data.user_id,
        nama: data.nama,
        email: data.email,
        wilayah: savedWilayah,
        avatar_url: data.avatar_url || null,
        created_at: new Date().toISOString(),
      };
      setUser(registeredUser);
      userStorage.set(registeredUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
      await fetchRemoteUserData();
    } catch (e: any) {
      if (e?.status && e.status >= 400 && e.status < 500) {
        throw e;
      }
      console.warn('API register error, fallback ke local state:', e);
      const fallbackUser: User = {
        user_id: 'usr-' + Date.now(),
        nama: nama || 'Pengguna',
        email: email,
        wilayah: wilayah || '',
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      setUser(fallbackUser);
      userStorage.set(fallbackUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
    }
  };

  const logout = () => {
    authService.logout();
    userStorage.clear();
    profileStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setLahans([]);
    setActiveLahan(null);
    setActiveCrops([]);
    setStats(EMPTY_STATS);
  };

  const updateUserProfile = async (data: UpdateProfilePayload) => {
    const isEmailChanged =
      data.email && user?.email && data.email.toLowerCase().trim() !== user.email.toLowerCase().trim();

    const updated = await authService.updateProfile(data);
    const formattedWilayah =
      updated.wilayah ||
      data.wilayah ||
      [data.kelurahan, data.kecamatan, data.kota, data.provinsi].filter(Boolean).join(', ');

    if (formattedWilayah) {
      profileStorage.setWilayah(formattedWilayah);
    }

    if (isEmailChanged) {
      logout();
      return;
    }

    setUser(prev => {
      if (!prev) return prev;
      const newUser: User = {
        ...prev,
        nama: updated.nama || data.nama || prev.nama,
        email: updated.email || prev.email,
        wilayah: formattedWilayah || prev.wilayah,
      };
      userStorage.set(newUser);
      return newUser;
    });
  };

  const createLahan = async (newLahanData: Omit<Lahan, 'lahan_id' | 'created_at'>): Promise<Lahan> => {
    const createdLahan = await lahanService.create(newLahanData);

    setLahans(prev => [createdLahan, ...prev.filter(l => l.lahan_id !== createdLahan.lahan_id)]);
    setActiveLahan(createdLahan);
    if (createdLahan.lahan_id) {
      activeLahanStorage.set(createdLahan.lahan_id);
    }

    setStats(prev => ({
      ...prev,
      rth_aktif_m2: Number(createdLahan.luas_m2.toFixed(2)),
    }));

    if (createdLahan.grid_snapshot && createdLahan.grid_snapshot.length > 0) {
      lahanStorage.setGridSnapshot(createdLahan.lahan_id, createdLahan.grid_snapshot);
    }

    await loadRekomendasiForLahan(createdLahan);

    return createdLahan;
  };

  const updateLahan = async (id: string, updateData: Partial<Omit<Lahan, 'lahan_id' | 'created_at'>>): Promise<Lahan> => {
    const updatedLahan = await lahanService.update(id, updateData);

    setLahans(prev => prev.map(l => (l.lahan_id === id ? updatedLahan : l)));
    if (activeLahan?.lahan_id === id) {
      setActiveLahan(updatedLahan);
      if (updatedLahan.lahan_id) {
        activeLahanStorage.set(updatedLahan.lahan_id);
      }
      if (updatedLahan.luas_m2) {
        setStats(prev => ({
          ...prev,
          rth_aktif_m2: Number(updatedLahan.luas_m2.toFixed(2)),
        }));
      }
      await loadRekomendasiForLahan(updatedLahan);
    }

    if (updatedLahan.grid_snapshot && updatedLahan.grid_snapshot.length > 0) {
      lahanStorage.setGridSnapshot(updatedLahan.lahan_id, updatedLahan.grid_snapshot);
    }

    return updatedLahan;
  };

  const selectActiveLahan = useCallback((lahan: Lahan | null) => {
    setActiveLahan(lahan);
    if (lahan) {
      if (lahan.lahan_id) {
        activeLahanStorage.set(lahan.lahan_id);
      }
      if (lahan.luas_m2) {
        setStats(prev => ({
          ...prev,
          rth_aktif_m2: Number(lahan.luas_m2.toFixed(2)),
        }));
      }
      loadRekomendasiForLahan(lahan);
    } else {
      activeLahanStorage.clear();
      loadRekomendasiForLahan(null);
    }
  }, [loadRekomendasiForLahan]);

  const deleteLahan = async (id: string): Promise<void> => {
    try {
      if (!id.startsWith('lah-')) {
        await lahanService.delete(id);
      }
    } catch (e) {
      console.warn('API deleteLahan error, fallback ke local:', e);
    }

    const remainingLahans = lahans.filter(l => l.lahan_id !== id);
    const remainingCrops = activeCrops.filter(c => c.lahan_id !== id);
    setActiveCrops(remainingCrops);
    setLahans(remainingLahans);

    // Recalculate stats based on remaining lahans and crops
    const rthArea = remainingLahans.reduce((acc, l) => acc + (Number(l.luas_m2) || 0), 0);
    const totalPanenKg = remainingCrops.reduce((acc, c) => {
      if (c.status !== 'PANEN') return acc;
      const rp = c.realisasiPanen || c.realisasi_panen;
      const berat = rp?.berat_kg ?? (rp?.berat_panen_gram ? rp.berat_panen_gram / 1000 : undefined) ?? c.berat_panen_kg ?? 0;
      return acc + Number(berat);
    }, 0);

    const totalHemat = remainingCrops.reduce((acc, c) => {
      if (c.status !== 'PANEN') return acc;
      const rp = c.realisasiPanen || c.realisasi_panen;
      const hemat = rp?.nilai_ekonomi_hemat ?? rp?.estimasi_hemat_rp ?? c.penghematan_rp ?? 0;
      return acc + Number(hemat);
    }, 0);

    setStats(prev => ({
      ...prev,
      rth_aktif_m2: Number(rthArea.toFixed(2)),
      total_panen_kg: Number(totalPanenKg.toFixed(2)),
      total_hemat_rp: totalHemat,
      kontribusi_lingkungan_persen: rthArea > 0 ? Math.min(100, Math.round((rthArea / 20) * 100)) : 0,
    }));

    if (activeLahan?.lahan_id === id) {
      const nextActive = remainingLahans.length > 0 ? remainingLahans[0] : null;
      setActiveLahan(nextActive);
      if (nextActive?.lahan_id) {
        activeLahanStorage.set(nextActive.lahan_id);
      } else {
        activeLahanStorage.clear();
      }
      loadRekomendasiForLahan(nextActive);
    }
  };

  const saveLahan = async (newLahanData: Omit<Lahan, 'lahan_id' | 'created_at'>): Promise<Lahan> => {
    let createdLahan: Lahan;
    if (activeLahan && activeLahan.lahan_id && !activeLahan.lahan_id.startsWith('lah-')) {
      createdLahan = await lahanService.update(activeLahan.lahan_id, newLahanData);
    } else {
      createdLahan = await lahanService.create(newLahanData);
    }

    setLahans(prev => {
      const filtered = prev.filter(l => l.lahan_id !== createdLahan.lahan_id);
      return [createdLahan, ...filtered];
    });
    setActiveLahan(createdLahan);
    if (createdLahan.lahan_id) {
      activeLahanStorage.set(createdLahan.lahan_id);
    }

    // Sync RTH directly to the active lahan area
    setStats(prev => ({
      ...prev,
      rth_aktif_m2: Number(createdLahan.luas_m2.toFixed(2)),
    }));

    if (createdLahan.grid_snapshot && createdLahan.grid_snapshot.length > 0) {
      lahanStorage.setGridSnapshot(createdLahan.lahan_id, createdLahan.grid_snapshot);
    }

    // Fetch fresh crop recommendations tailored to this lahan
    await loadRekomendasiForLahan(createdLahan);

    return createdLahan;
  };

  const toggleChecklistSiram = (cropId: string) => {
    const today = new Date().toISOString().split('T')[0];
    let prevCrop: TanamanAktif | undefined;

    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          prevCrop = c;
          const current = c.checklist_hari_ini?.siram_done ?? false;
          const nextSiram = !current;
          const pupukDone = c.checklist_hari_ini?.pupuk_done ?? false;
          const catatan = c.checklist_hari_ini?.catatan ?? null;

          return {
            ...c,
            checklist_hari_ini: {
              siram_done: nextSiram,
              pupuk_done: pupukDone,
              catatan,
            },
          };
        }
        return c;
      })
    );

    if (prevCrop && !cropId.startsWith('crop-')) {
      const nextSiram = !(prevCrop.checklist_hari_ini?.siram_done ?? false);
      const pupukDone = prevCrop.checklist_hari_ini?.pupuk_done ?? false;
      const catatan = prevCrop.checklist_hari_ini?.catatan ?? undefined;

      trackingService
        .submitChecklist(cropId, {
          tanggal: today,
          siram_done: nextSiram,
          pupuk_done: pupukDone,
          catatan: catatan || undefined,
        })
        .catch(err => {
          console.warn('Checklist siram sync error, rollback:', err);
          setActiveCrops(prev =>
            prev.map(c => (c.tanaman_aktif_id === cropId ? prevCrop! : c))
          );
        });
    }
  };

  const toggleChecklistPupuk = (cropId: string) => {
    const today = new Date().toISOString().split('T')[0];
    let prevCrop: TanamanAktif | undefined;

    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          prevCrop = c;
          const current = c.checklist_hari_ini?.pupuk_done ?? false;
          const nextPupuk = !current;
          const siramDone = c.checklist_hari_ini?.siram_done ?? false;
          const catatan = c.checklist_hari_ini?.catatan ?? null;

          return {
            ...c,
            checklist_hari_ini: {
              siram_done: siramDone,
              pupuk_done: nextPupuk,
              catatan,
            },
          };
        }
        return c;
      })
    );

    if (prevCrop && !cropId.startsWith('crop-')) {
      const nextPupuk = !(prevCrop.checklist_hari_ini?.pupuk_done ?? false);
      const siramDone = prevCrop.checklist_hari_ini?.siram_done ?? false;
      const catatan = prevCrop.checklist_hari_ini?.catatan ?? undefined;

      trackingService
        .submitChecklist(cropId, {
          tanggal: today,
          siram_done: siramDone,
          pupuk_done: nextPupuk,
          catatan: catatan || undefined,
        })
        .catch(err => {
          console.warn('Checklist pupuk sync error, rollback:', err);
          setActiveCrops(prev =>
            prev.map(c => (c.tanaman_aktif_id === cropId ? prevCrop! : c))
          );
        });
    }
  };

  const updateCatatanHarian = async (cropId: string, catatan: string) => {
    const today = new Date().toISOString().split('T')[0];
    let prevCrop: TanamanAktif | undefined;

    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          prevCrop = c;
          const siramDone = c.checklist_hari_ini?.siram_done ?? false;
          const pupukDone = c.checklist_hari_ini?.pupuk_done ?? false;

          return {
            ...c,
            checklist_hari_ini: {
              siram_done: siramDone,
              pupuk_done: pupukDone,
              catatan: catatan.trim() || null,
            },
          };
        }
        return c;
      })
    );

    if (prevCrop && !cropId.startsWith('crop-')) {
      const siramDone = prevCrop.checklist_hari_ini?.siram_done ?? false;
      const pupukDone = prevCrop.checklist_hari_ini?.pupuk_done ?? false;

      try {
        await trackingService.submitChecklist(cropId, {
          tanggal: today,
          siram_done: siramDone,
          pupuk_done: pupukDone,
          catatan: catatan.trim() || null,
        });
      } catch (err) {
        console.warn('Update catatan harian sync error, rollback:', err);
        setActiveCrops(prev =>
          prev.map(c => (c.tanaman_aktif_id === cropId ? prevCrop! : c))
        );
        throw err;
      }
    }
  };

  const toggleAllSiram = (forceDone?: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    let previousCrops: TanamanAktif[] = [];
    let nextState = false;

    setActiveCrops(prev => {
      previousCrops = prev;
      const activeOnly = prev.filter(
        c => c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)
      );
      const allDone = activeOnly.length > 0 && activeOnly.every(c => c.checklist_hari_ini?.siram_done);
      nextState = forceDone !== undefined ? forceDone : !allDone;

      return prev.map(c => {
        if (c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)) {
          return {
            ...c,
            checklist_hari_ini: {
              siram_done: nextState,
              pupuk_done: c.checklist_hari_ini?.pupuk_done ?? false,
              catatan: c.checklist_hari_ini?.catatan ?? null,
            },
          };
        }
        return c;
      });
    });

    // Background sync to backend for active crops on current lahan
    const activeTargets = previousCrops.filter(
      c =>
        c.status === 'AKTIF' &&
        (!activeLahan || c.lahan_id === activeLahan.lahan_id) &&
        !c.tanaman_aktif_id.startsWith('crop-')
    );
    if (activeTargets.length > 0) {
      Promise.allSettled(
        activeTargets.map(c =>
          trackingService.submitChecklist(c.tanaman_aktif_id, {
            tanggal: today,
            siram_done: nextState,
            pupuk_done: c.checklist_hari_ini?.pupuk_done ?? false,
            catatan: c.checklist_hari_ini?.catatan || undefined,
          })
        )
      ).then(results => {
        const hasErrors = results.some(r => r.status === 'rejected');
        if (hasErrors) {
          console.warn('Sebagian / semua checklist siram gagal disimpan ke backend');
        }
      });
    }
  };

  const toggleAllPupuk = (forceDone?: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    let previousCrops: TanamanAktif[] = [];
    let nextState = false;

    setActiveCrops(prev => {
      previousCrops = prev;
      const activeOnly = prev.filter(
        c => c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)
      );
      const allDone = activeOnly.length > 0 && activeOnly.every(c => c.checklist_hari_ini?.pupuk_done);
      nextState = forceDone !== undefined ? forceDone : !allDone;

      return prev.map(c => {
        if (c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)) {
          return {
            ...c,
            checklist_hari_ini: {
              siram_done: c.checklist_hari_ini?.siram_done ?? false,
              pupuk_done: nextState,
              catatan: c.checklist_hari_ini?.catatan ?? null,
            },
          };
        }
        return c;
      });
    });

    // Background sync to backend for active crops on current lahan
    const activeTargets = previousCrops.filter(
      c =>
        c.status === 'AKTIF' &&
        (!activeLahan || c.lahan_id === activeLahan.lahan_id) &&
        !c.tanaman_aktif_id.startsWith('crop-')
    );
    if (activeTargets.length > 0) {
      Promise.allSettled(
        activeTargets.map(c =>
          trackingService.submitChecklist(c.tanaman_aktif_id, {
            tanggal: today,
            siram_done: c.checklist_hari_ini?.siram_done ?? false,
            pupuk_done: nextState,
            catatan: c.checklist_hari_ini?.catatan || undefined,
          })
        )
      ).then(results => {
        const hasErrors = results.some(r => r.status === 'rejected');
        if (hasErrors) {
          console.warn('Sebagian / semua checklist pupuk gagal disimpan ke backend');
        }
      });
    }
  };

  const addTanamanAktif = async (
    komoditasId: string,
    komoditasNama: string,
    jumlah: number = 1,
    luasPerUnit?: number
  ) => {
    if (!activeLahan || !activeLahan.lahan_id || activeLahan.lahan_id.startsWith('lah-')) {
      throw new Error('Belum ada pekarangan aktif yang tersimpan. Silakan simpan lahan terlebih dahulu sebelum menanam.');
    }

    const matched = rekomendasiList.find(r => r.komoditas_id === komoditasId);
    const count = Math.max(1, Math.floor(jumlah));
    const actualLuas = luasPerUnit || matched?.luas_dibutuhkan_m2 || 0.25;
    const todayStr = new Date().toISOString().split('T')[0];
    const newCrops: TanamanAktif[] = [];

    for (let i = 0; i < count; i++) {
      let created: any = null;
      try {
        created = await trackingService.create({
          lahan_id: activeLahan.lahan_id,
          komoditas_id: komoditasId,
          tanggal_tanam: todayStr,
        });
      } catch (err) {
        console.warn('Gagal panggil create tracking API, buat state tanaman:', err);
      }

      const cropId = created?.tanaman_aktif_id || `crop-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      const cropWaktuPanen = matched?.waktu_panen_hari || 30;
      const perkiraanDate = new Date(Date.now() + cropWaktuPanen * 86400000).toISOString().split('T')[0];

      const cropItem: TanamanAktif = {
        tanaman_aktif_id: cropId,
        user_id: created?.user_id || user?.user_id,
        lahan_id: created?.lahan_id || activeLahan.lahan_id,
        lahan_nama: activeLahan.nama_lahan,
        komoditas_id: created?.komoditas?.komoditas_id || komoditasId,
        komoditas_nama: created?.komoditas?.nama || komoditasNama,
        tanggal_tanam: created?.tanggal_tanam || todayStr,
        perkiraan_panen: created?.perkiraan_panen || perkiraanDate,
        status: created?.status || 'AKTIF',
        hari_ke: 1,
        persentase_hari: 5,
        luas_dibutuhkan_m2: actualLuas,
        fase: 'Bibit',
        image_url: matched?.image_url || getCropImage(komoditasNama),
        checklist_hari_ini: {
          siram_done: false,
          pupuk_done: false,
          catatan: null,
        },
      };
      newCrops.push(cropItem);
    }

    setActiveCrops(prev => [...newCrops, ...prev]);

    if (activeLahan) {
      setActiveLahan(prev => (prev ? { ...prev, jumlah_tanaman_aktif: (prev.jumlah_tanaman_aktif || 0) + count } : null));
    }

    // Refresh rekomendasi agar sisa luas lahan dan scoring terupdate
    await loadRekomendasiForLahan(activeLahan);
  };

  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setTourStep(1);
  }, []);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(1);
  }, []);

  const recordPanen = async (cropId: string, beratGram: number): Promise<{ hematRp: number; tanamanNama: string }> => {
    const targetCrop = activeCrops.find(c => c.tanaman_aktif_id === cropId);
    const matchedRec = rekomendasiList.find(r => r.komoditas_id === targetCrop?.komoditas_id);
    const hargaKg = matchedRec?.harga_pasar_per_kg || 40000;
    let hematRp = Math.round((beratGram / 1000) * hargaKg);
    const beratKg = Number((beratGram / 1000).toFixed(2));

    try {
      if (!cropId.startsWith('crop-')) {
        const panenRes = await trackingService.recordPanen(cropId, {
          tanggal_panen: new Date().toISOString().split('T')[0],
          berat_panen_gram: beratGram,
        });
        if (panenRes?.estimasi_hemat_rp) {
          hematRp = panenRes.estimasi_hemat_rp;
        }
      }
    } catch (e) {
      console.warn('API recordPanen error, fallback local:', e);
    }

    setActiveCrops(prev =>
      prev.map(c => (c.tanaman_aktif_id === cropId ? { ...c, status: 'PANEN' } : c))
    );

    setStats(prev => ({
      ...prev,
      total_panen_kg: Number((prev.total_panen_kg + beratKg).toFixed(2)),
      total_hemat_rp: prev.total_hemat_rp + hematRp,
      streak_hari: prev.streak_hari + 1,
    }));

    return {
      hematRp,
      tanamanNama: targetCrop?.komoditas_nama || 'Sayuran Pekarangan',
    };
  };

  const recordGagal = async (cropId: string, _alasan: string) => {
    try {
      if (!cropId.startsWith('crop-')) {
        await trackingService.markGagal(cropId);
      }
    } catch (e) {
      console.warn('API recordGagal error, fallback local:', e);
    }
    setActiveCrops(prev =>
      prev.map(c => (c.tanaman_aktif_id === cropId ? { ...c, status: 'GAGAL' } : c))
    );
  };

  const askAiInsight = async (message: string, cropId?: string) => {
    return aiInsightService.chat(message, cropId, user?.nama);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isOnboarded,
        setIsOnboarded,
        isAuthLoading,
        login,
        loginWithGoogle,
        logout,
        register,
        updateUserProfile,
        fetchRemoteUserData,
        lahans,
        activeLahan,
        setActiveLahan: selectActiveLahan,
        saveLahan,
        createLahan,
        updateLahan,
        deleteLahan,
        activeCrops,
        toggleChecklistSiram,
        toggleChecklistPupuk,
        updateCatatanHarian,
        toggleAllSiram,
        toggleAllPupuk,
        addTanamanAktif,
        recordPanen,
        recordGagal,
        rekomendasiList,
        isLoadingRekomendasi,
        rekomendasiError,
        refreshRekomendasi,
        stats,
        catatanHistory,
        reminders,
        updateReminderTime,
        toggleReminder,
        addCustomReminder,
        deleteReminder,
        triggerTestAlarm,
        isTourActive,
        setIsTourActive,
        tourStep,
        setTourStep,
        startTour,
        skipTour,
        askAiInsight,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

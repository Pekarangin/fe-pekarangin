import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Lahan, TanamanAktif, RekomendasiItem, UserStats, CatatanHarian, KesesuaianSinar, TingkatKesulitan } from '../types';
import {
  ReminderSchedule,
  DEFAULT_REMINDERS,
  scheduleDailyReminder,
  cancelReminderNotification,
  triggerTestAlarmNotification,
} from '../services/notifications';
import {
  authService,
  lahanService,
  trackingService,
  rekomendasiService,
  aiInsightService,
  tokenStorage,
  profileStorage,
  lahanStorage,
  onboardingStorage,
} from '../services/api';
import { getCropImage } from '../constants/cropImages';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  login: (email: string, password?: string, nama?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  register: (nama: string, email: string, password?: string, wilayah?: string) => Promise<void>;
  fetchRemoteUserData: () => Promise<void>;

  
  // Lahan state
  lahans: Lahan[];
  activeLahan: Lahan | null;
  setActiveLahan: (lahan: Lahan) => void;
  saveLahan: (lahan: Omit<Lahan, 'lahan_id' | 'created_at'>) => Promise<Lahan>;
  
  // Tanaman aktif state
  activeCrops: TanamanAktif[];
  toggleChecklistSiram: (cropId: string) => void;
  toggleChecklistPupuk: (cropId: string) => void;
  toggleAllSiram: (forceDone?: boolean) => void;
  toggleAllPupuk: (forceDone?: boolean) => void;
  addTanamanAktif: (komoditasId: string, komoditasNama: string) => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STRICT INITIAL STATE: User must pass onboarding and authentication first
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => onboardingStorage.get());

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
        setActiveLahan(loadedLahans.length > 0 ? loadedLahans[0] : null);
      } else {
        setLahans([]);
        setActiveLahan(null);
      }

      if (remoteCrops.status === 'fulfilled' && Array.isArray(remoteCrops.value)) {
        loadedCrops = remoteCrops.value;
        setActiveCrops(loadedCrops);
      } else {
        setActiveCrops([]);
      }

      // Compute dynamic stats from actual user data
      const rthArea = loadedLahans.reduce((acc, l) => acc + (Number(l.luas_m2) || 0), 0);
      const totalPanenKg = loadedCrops
        .filter(c => c.status === 'PANEN')
        .reduce((acc) => acc + 0.35, 0);
      const totalHemat = loadedCrops
        .filter(c => c.status === 'PANEN')
        .reduce((acc) => acc + 15000, 0);

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

  // Check active session via GET /auth/me on mount
  useEffect(() => {
    const token = tokenStorage.get();
    if (token) {
      authService
        .getMe()
        .then(profile => {
          setUser({
            user_id: profile.user_id,
            nama: profile.nama,
            email: profile.email,
            wilayah: profileStorage.getWilayah() || '',
            avatar_url: profile.avatar_url || null,
            created_at: profile.created_at || new Date().toISOString(),
          });
          setIsAuthenticated(true);
          fetchRemoteUserData();
        })
        .catch(() => {
          tokenStorage.clear();
        });
    }
  }, [fetchRemoteUserData]);

  const fetchRekomendasiData = useCallback(async (): Promise<RekomendasiItem[] | null> => {
    if (activeLahan?.lahan_id && !activeLahan.lahan_id.startsWith('lah-')) {
      const res = await rekomendasiService.getByLahanId(activeLahan.lahan_id);
      if (res?.rekomendasi && res.rekomendasi.length > 0) {
        return res.rekomendasi.map(item => ({
          ...item,
          image_url: item.image_url || getCropImage(item.nama),
        }));
      }
      return null;
    }
    const data = await rekomendasiService.getAllKomoditas();
    if (Array.isArray(data) && data.length > 0) {
      const detailedList = await Promise.allSettled(
        data.map(k => rekomendasiService.getKomoditasById(k.komoditas_id || (k as any).id))
      );

      return data.map((k: any, idx: number) => {
        const detailSettled = detailedList[idx];
        const detail = detailSettled.status === 'fulfilled' ? detailSettled.value : null;
        const hargaPasar = detail?.harga_terkini?.harga_rp_per_kg || 25000;
        const konsumsiRt = Number(k.konsumsi_rt_kg_per_bulan || k.konsumsiRtKgPerBulan || 1);
        const estimasiHemat = Math.round(konsumsiRt * hargaPasar);

        return {
          komoditas_id: k.komoditas_id || k.id,
          nama: k.nama,
          skor_prioritas: Number(Math.max(3.5, 5 - idx * 0.1).toFixed(1)),
          estimasi_hemat_rp_per_bulan: estimasiHemat,
          waktu_panen_hari: k.waktu_panen_hari || k.waktuPanenHari || 45,
          luas_dibutuhkan_m2: Number(k.luas_min_m2 || k.luasMinM2 || 0.25),
          tingkat_kesulitan: (k.tingkat_kesulitan || k.tingkatKesulitan || 'MUDAH') as TingkatKesulitan,
          kesesuaian_sinar: 'COCOK' as KesesuaianSinar,
          harga_pasar_per_kg: hargaPasar,
          konsumsi_rt_kg_per_bulan: konsumsiRt,
          image_url: k.image_url || detail?.image_url || '',
          panduan_singkat: k.panduan_singkat || detail?.panduan_singkat || 'Cocok ditanam di pekarangan rumah.',
          jadwal_siram_hari: k.jadwal_siram_hari || detail?.jadwal_siram_hari || 1,
          jadwal_pupuk_hari: k.jadwal_pupuk_hari || detail?.jadwal_pupuk_hari || 14,
          media_tanam: 'Pot / Polybag / Bedengan',
        };
      });
    }
    return null;
  }, [activeLahan]);

  const refreshRekomendasi = useCallback(async () => {
    setIsLoadingRekomendasi(true);
    setRekomendasiError(null);
    try {
      const result = await fetchRekomendasiData();
      if (result && result.length > 0) {
        setRekomendasiList(result);
        setRekomendasiError(null);
      } else {
        setRekomendasiList([]);
      }
    } catch (err: any) {
      console.warn('Gagal ambil rekomendasi dari BE:', err);
      setRekomendasiError(err?.message || 'Gagal memuat data dari server');
    } finally {
      setIsLoadingRekomendasi(false);
    }
  }, [fetchRekomendasiData]);

  // Auto-fetch remote recommendations when activeLahan changes, or load public commodities catalog
  useEffect(() => {
    let isMounted = true;
    fetchRekomendasiData()
      .then(result => {
        if (isMounted) {
          if (result && result.length > 0) {
            setRekomendasiList(result);
            setRekomendasiError(null);
          } else {
            setRekomendasiList([]);
          }
        }
      })
      .catch((err: any) => {
        console.warn('Gagal sinkron rekomendasi awal:', err);
        if (isMounted) {
          setRekomendasiError(err?.message || 'Gagal memuat data dari server');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRekomendasi(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [fetchRekomendasiData]);

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
      const savedWilayah = profileStorage.getWilayah() || '';
      setUser({
        user_id: data.user_id,
        nama: data.nama || nama || email.split('@')[0],
        email: data.email,
        wilayah: savedWilayah,
        avatar_url: data.avatar_url || null,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
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
      setUser({
        user_id: 'usr-' + Date.now(),
        nama: nama || email.split('@')[0],
        email: email,
        wilayah: profileStorage.getWilayah() || '',
        avatar_url: null,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    if (!idToken) {
      throw new Error('Google ID Token tidak ditemukan.');
    }
    const data = await authService.loginWithGoogle(idToken);
    setUser({
      user_id: data.user_id,
      nama: data.nama,
      email: data.email,
      wilayah: profileStorage.getWilayah() || '',
      avatar_url: data.avatar_url || null,
      created_at: new Date().toISOString(),
    });
    setIsAuthenticated(true);
    setLahans([]);
    setActiveLahan(null);
    setActiveCrops([]);
    setStats(EMPTY_STATS);
    await fetchRemoteUserData();
  };

  const register = async (nama: string, email: string, password?: string, wilayah?: string) => {
    if (wilayah) {
      profileStorage.setWilayah(wilayah);
    }
    try {
      const data = await authService.register(nama, email, password || 'password123');
      setUser({
        user_id: data.user_id,
        nama: data.nama,
        email: data.email,
        wilayah: wilayah || '',
        avatar_url: data.avatar_url || null,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
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
      setUser({
        user_id: 'usr-' + Date.now(),
        nama: nama || 'Pengguna',
        email: email,
        wilayah: wilayah || '',
        avatar_url: null,
        created_at: new Date().toISOString(),
      });
      setIsAuthenticated(true);
      setLahans([]);
      setActiveLahan(null);
      setActiveCrops([]);
      setStats(EMPTY_STATS);
    }
  };

  const logout = () => {
    authService.logout();
    profileStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    setLahans([]);
    setActiveLahan(null);
    setActiveCrops([]);
    setStats(EMPTY_STATS);
  };

  const saveLahan = async (newLahanData: Omit<Lahan, 'lahan_id' | 'created_at'>): Promise<Lahan> => {
    let createdLahan: Lahan;
    try {
      if (activeLahan && activeLahan.lahan_id && !activeLahan.lahan_id.startsWith('lah-')) {
        createdLahan = await lahanService.update(activeLahan.lahan_id, newLahanData);
      } else {
        createdLahan = await lahanService.create(newLahanData);
      }
    } catch (e) {
      console.warn('API saveLahan error, fallback ke local:', e);
      const activeCount = activeCrops.filter(c => c.status === 'AKTIF').length;
      createdLahan = {
        ...newLahanData,
        lahan_id: activeLahan?.lahan_id || 'lah-' + Date.now(),
        created_at: activeLahan?.created_at || new Date().toISOString(),
        jumlah_tanaman_aktif: activeCount,
      };
    }

    setLahans(prev => {
      const filtered = prev.filter(l => l.lahan_id !== createdLahan.lahan_id);
      return [createdLahan, ...filtered];
    });
    setActiveLahan(createdLahan);

    // Sync RTH directly to the active lahan area
    setStats(prev => ({
      ...prev,
      rth_aktif_m2: Number(createdLahan.luas_m2.toFixed(2)),
    }));

    if (createdLahan.grid_snapshot && createdLahan.grid_snapshot.length > 0) {
      lahanStorage.setGridSnapshot(createdLahan.lahan_id, createdLahan.grid_snapshot);
    }

    // Fetch fresh crop recommendations tailored to this lahan
    if (createdLahan.lahan_id && !createdLahan.lahan_id.startsWith('lah-')) {
      rekomendasiService
        .getByLahanId(createdLahan.lahan_id)
        .then(res => {
          if (res?.rekomendasi && res.rekomendasi.length > 0) {
            const mapped = res.rekomendasi.map(item => ({
              ...item,
              image_url: item.image_url || getCropImage(item.nama),
            }));
            setRekomendasiList(mapped);
          }
        })
        .catch(err => console.warn('Gagal ambil rekomendasi baru:', err));
    }

    return createdLahan;
  };

  const toggleChecklistSiram = (cropId: string) => {
    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          const current = c.checklist_hari_ini?.siram_done ?? false;
          const nextSiram = !current;
          const pupukDone = c.checklist_hari_ini?.pupuk_done ?? false;
          const catatan = c.checklist_hari_ini?.catatan ?? null;

          if (!cropId.startsWith('crop-')) {
            trackingService
              .submitChecklist(cropId, {
                tanggal: new Date().toISOString().split('T')[0],
                siram_done: nextSiram,
                pupuk_done: pupukDone,
                catatan: catatan || undefined,
              })
              .catch(err => console.warn('Checklist siram sync error:', err));
          }

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
  };

  const toggleChecklistPupuk = (cropId: string) => {
    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          const current = c.checklist_hari_ini?.pupuk_done ?? false;
          const nextPupuk = !current;
          const siramDone = c.checklist_hari_ini?.siram_done ?? false;
          const catatan = c.checklist_hari_ini?.catatan ?? null;

          if (!cropId.startsWith('crop-')) {
            trackingService
              .submitChecklist(cropId, {
                tanggal: new Date().toISOString().split('T')[0],
                siram_done: siramDone,
                pupuk_done: nextPupuk,
                catatan: catatan || undefined,
              })
              .catch(err => console.warn('Checklist pupuk sync error:', err));
          }

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
  };

  const toggleAllSiram = (forceDone?: boolean) => {
    setActiveCrops(prev => {
      const activeOnly = prev.filter(c => c.status === 'AKTIF');
      const allDone = activeOnly.length > 0 && activeOnly.every(c => c.checklist_hari_ini?.siram_done);
      const nextState = forceDone !== undefined ? forceDone : !allDone;

      return prev.map(c => {
        if (c.status === 'AKTIF') {
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
  };

  const toggleAllPupuk = (forceDone?: boolean) => {
    setActiveCrops(prev => {
      const activeOnly = prev.filter(c => c.status === 'AKTIF');
      const allDone = activeOnly.length > 0 && activeOnly.every(c => c.checklist_hari_ini?.pupuk_done);
      const nextState = forceDone !== undefined ? forceDone : !allDone;

      return prev.map(c => {
        if (c.status === 'AKTIF') {
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
  };

  const addTanamanAktif = async (komoditasId: string, komoditasNama: string) => {
    const matched = rekomendasiList.find(r => r.komoditas_id === komoditasId);
    let newCrop: TanamanAktif;

    try {
      if (activeLahan?.lahan_id && !activeLahan.lahan_id.startsWith('lah-')) {
        const created = await trackingService.create({
          lahan_id: activeLahan.lahan_id,
          komoditas_id: komoditasId,
          tanggal_tanam: new Date().toISOString().split('T')[0],
        });
        newCrop = {
          tanaman_aktif_id: created.tanaman_aktif_id,
          user_id: created.user_id,
          lahan_id: created.lahan_id,
          lahan_nama: activeLahan.nama_lahan,
          komoditas_id: created.komoditas?.komoditas_id || komoditasId,
          komoditas_nama: created.komoditas?.nama || komoditasNama,
          tanggal_tanam: created.tanggal_tanam,
          perkiraan_panen: created.perkiraan_panen,
          status: created.status,
          hari_ke: 1,
          persentase_hari: 5,
          fase: 'Bibit',
          image_url: matched?.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
          checklist_hari_ini: {
            siram_done: false,
            pupuk_done: false,
            catatan: null,
          },
        };
      } else {
        throw new Error('Lahan lokal');
      }
    } catch (e) {
      console.warn('API addTanamanAktif error, fallback local:', e);
      newCrop = {
        tanaman_aktif_id: 'crop-' + Date.now(),
        user_id: user?.user_id || 'usr-1',
        lahan_id: activeLahan?.lahan_id || 'lah-1',
        lahan_nama: activeLahan?.nama_lahan || 'Pekarangan Utama',
        komoditas_id: komoditasId,
        komoditas_nama: komoditasNama,
        tanggal_tanam: new Date().toISOString().split('T')[0],
        perkiraan_panen: new Date(Date.now() + (matched?.waktu_panen_hari || 45) * 86400000).toISOString().split('T')[0],
        status: 'AKTIF',
        hari_ke: 1,
        persentase_hari: 5,
        fase: 'Bibit',
        image_url: matched?.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
        checklist_hari_ini: {
          siram_done: false,
          pupuk_done: false,
          catatan: null,
        },
      };
    }

    setActiveCrops(prev => [newCrop, ...prev]);

    if (activeLahan) {
      setActiveLahan(prev => (prev ? { ...prev, jumlah_tanaman_aktif: (prev.jumlah_tanaman_aktif || 0) + 1 } : null));
    }
  };

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
    return aiInsightService.chat(message, cropId);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isOnboarded,
        setIsOnboarded,
        login,
        loginWithGoogle,
        logout,
        register,
        fetchRemoteUserData,
        lahans,
        activeLahan,
        setActiveLahan,
        saveLahan,
        activeCrops,
        toggleChecklistSiram,
        toggleChecklistPupuk,
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

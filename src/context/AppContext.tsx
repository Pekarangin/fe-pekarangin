import React, { createContext, useContext, useState } from 'react';
import { User, Lahan, TanamanAktif, RekomendasiItem, UserStats, CatatanHarian } from '../types';
import {
  ReminderSchedule,
  DEFAULT_REMINDERS,
  scheduleDailyReminder,
  cancelReminderNotification,
  triggerTestAlarmNotification,
} from '../services/notifications';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  login: (email: string, nama?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (nama: string, email: string, wilayah: string) => Promise<void>;
  
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
}

const DEFAULT_USER_PROFILE: User = {
  user_id: 'usr-1',
  nama: 'Alex Smith',
  email: 'alex.smith@example.com',
  wilayah: 'Jakarta Selatan',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  created_at: '2026-08-01T00:00:00Z',
};

const INITIAL_GRID_SNAPSHOT = [
  3, 8, 10, 12, 15,
  17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30,
  35, 36, 37, 38,
  43, 44, 51, 52
];

const INITIAL_LAHAN: Lahan = {
  lahan_id: 'lah-1',
  user_id: 'usr-1',
  nama_lahan: 'Pekarangan Utama',
  luas_m2: 6.75,
  grid_snapshot: INITIAL_GRID_SNAPSHOT,
  paparan_sinar: 'FULL_SUN',
  sumber_paparan: 'AI_VISION',
  jumlah_tanaman_aktif: 2,
};

const INITIAL_CROPS: TanamanAktif[] = [
  {
    tanaman_aktif_id: 'crop-1',
    user_id: 'usr-1',
    lahan_id: 'lah-1',
    lahan_nama: 'Pekarangan Utama',
    komoditas_id: 'kom-1',
    komoditas_nama: 'Cabai rawit',
    tanggal_tanam: '2026-08-01',
    perkiraan_panen: '2026-09-16',
    status: 'AKTIF',
    hari_ke: 15,
    persentase_hari: 75,
    fase: 'Panen',
    image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600',
    checklist_hari_ini: {
      siram_done: true,
      pupuk_done: false,
      catatan: 'Kondisi tanaman sehat',
    },
  },
  {
    tanaman_aktif_id: 'crop-2',
    user_id: 'usr-1',
    lahan_id: 'lah-1',
    lahan_nama: 'Pekarangan Utama',
    komoditas_id: 'kom-8',
    komoditas_nama: 'Sawi hijau',
    tanggal_tanam: '2026-08-10',
    perkiraan_panen: '2026-09-10',
    status: 'AKTIF',
    hari_ke: 10,
    persentase_hari: 40,
    fase: 'Vegetatif',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    checklist_hari_ini: {
      siram_done: true,
      pupuk_done: false,
      catatan: null,
    },
  },
];

const INITIAL_REKOMENDASI: RekomendasiItem[] = [
  {
    komoditas_id: 'kom-1',
    nama: 'Cabai Rawit',
    skor_prioritas: 4.8,
    estimasi_hemat_rp_per_bulan: 45000,
    waktu_panen_hari: 75,
    luas_dibutuhkan_m2: 0.16,
    tingkat_kesulitan: 'MUDAH',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 52000,
    konsumsi_rt_kg_per_bulan: 0.8,
    image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Tanam di area terpapar sinar penuh >6 jam. Gunakan pot/polybag 30cm dengan campuran tanah subur & kompos 2:1.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 14,
    media_tanam: 'Polybag / Pot 30cm / Tanah Bedengan',
  },
  {
    komoditas_id: 'kom-8',
    nama: 'Sawi Hijau',
    skor_prioritas: 4.2,
    estimasi_hemat_rp_per_bulan: 35000,
    waktu_panen_hari: 30,
    luas_dibutuhkan_m2: 0.25,
    tingkat_kesulitan: 'MUDAH',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 14000,
    konsumsi_rt_kg_per_bulan: 2.5,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Pertumbuhan sangat cepat. Siram rutin setiap pagi & sore. Sangat cocok ditanam bertingkat (vertikultur).',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 7,
    media_tanam: 'Tray Semai, Pot Persegi, Hidroponik Sederhana',
  },
  {
    komoditas_id: 'kom-4',
    nama: 'Tomat Cherry',
    skor_prioritas: 3.9,
    estimasi_hemat_rp_per_bulan: 40000,
    waktu_panen_hari: 60,
    luas_dibutuhkan_m2: 0.35,
    tingkat_kesulitan: 'SEDANG',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 28000,
    konsumsi_rt_kg_per_bulan: 1.5,
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Pasang ajir/penyangga bambu saat tanaman mencapai 20cm. Berikan pupuk kalium saat mulai berbunga.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 10,
    media_tanam: 'Pot Besar 35cm / Polybag',
  },
  {
    komoditas_id: 'kom-5',
    nama: 'Bayam Hijau',
    skor_prioritas: 3.6,
    estimasi_hemat_rp_per_bulan: 20000,
    waktu_panen_hari: 25,
    luas_dibutuhkan_m2: 0.25,
    tingkat_kesulitan: 'MUDAH',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 10000,
    konsumsi_rt_kg_per_bulan: 2.0,
    image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Tabur benih merata. Jaga kelembapan tanah agar kecambah cepat tumbuh. Panen cabut umur 25 hari.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 7,
    media_tanam: 'Bedengan / Polybag Lebar',
  },
  {
    komoditas_id: 'kom-6',
    nama: 'Kangkung Darat',
    skor_prioritas: 3.5,
    estimasi_hemat_rp_per_bulan: 18000,
    waktu_panen_hari: 25,
    luas_dibutuhkan_m2: 0.25,
    tingkat_kesulitan: 'MUDAH',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 12000,
    konsumsi_rt_kg_per_bulan: 1.5,
    image_url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Sangat tangguh dan tahan cuaca panas. Bisa dipanen potong batang agar bertunas kembali hingga 3x panen.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 7,
    media_tanam: 'Pot, Baskom Bekas, Bedengan',
  },
  {
    komoditas_id: 'kom-3',
    nama: 'Bawang Merah',
    skor_prioritas: 3.4,
    estimasi_hemat_rp_per_bulan: 32000,
    waktu_panen_hari: 65,
    luas_dibutuhkan_m2: 0.25,
    tingkat_kesulitan: 'SEDANG',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 40000,
    konsumsi_rt_kg_per_bulan: 1.0,
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Potong 1/3 ujung umbi sebelum tanam untuk percepat tunas. Hindari genangan air berlebih.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 14,
    media_tanam: 'Polybag Tanah Gembur Berpasir',
  },
  {
    komoditas_id: 'kom-14',
    nama: 'Kemangi',
    skor_prioritas: 3.2,
    estimasi_hemat_rp_per_bulan: 15000,
    waktu_panen_hari: 35,
    luas_dibutuhkan_m2: 0.2,
    tingkat_kesulitan: 'MUDAH',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 18000,
    konsumsi_rt_kg_per_bulan: 0.6,
    image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Petik pucuk daun secara berkala agar tanaman semakin rimbun dan tidak cepat berbunga tua.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 14,
    media_tanam: 'Pot Kecil / Pekarangan Sudut',
  },
  {
    komoditas_id: 'kom-10',
    nama: 'Terong Ungu',
    skor_prioritas: 3.0,
    estimasi_hemat_rp_per_bulan: 25000,
    waktu_panen_hari: 80,
    luas_dibutuhkan_m2: 0.5,
    tingkat_kesulitan: 'SEDANG',
    kesesuaian_sinar: 'COCOK',
    harga_pasar_per_kg: 15000,
    konsumsi_rt_kg_per_bulan: 1.5,
    image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
    panduan_singkat: 'Butuh media tanah yang dalam dan kaya pupuk kandang. Lindungi dari hama kutu kebul.',
    jadwal_siram_hari: 1,
    jadwal_pupuk_hari: 14,
    media_tanam: 'Polybag Besar 40cm / Tanah Terbuka',
  }
];

const INITIAL_STATS: UserStats = {
  total_panen_kg: 24,
  total_hemat_rp: 125000,
  rth_aktif_m2: 6.75,
  kontribusi_lingkungan_persen: 15,
  streak_hari: 5,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // STRICT INITIAL STATE: User must pass onboarding and authentication first
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  const [lahans, setLahans] = useState<Lahan[]>([INITIAL_LAHAN]);
  const [activeLahan, setActiveLahan] = useState<Lahan | null>(INITIAL_LAHAN);
  const [activeCrops, setActiveCrops] = useState<TanamanAktif[]>(INITIAL_CROPS);
  const [rekomendasiList] = useState<RekomendasiItem[]>(INITIAL_REKOMENDASI);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [catatanHistory] = useState<Record<string, CatatanHarian[]>>({});
  const [reminders, setReminders] = useState<ReminderSchedule[]>(DEFAULT_REMINDERS);

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



  const login = async (email: string, nama?: string) => {
    setUser({
      user_id: 'usr-' + Date.now(),
      nama: nama || (email.includes('alex') ? 'Alex Smith' : email.split('@')[0]),
      email: email,
      wilayah: 'Jakarta Selatan',
      avatar_url: DEFAULT_USER_PROFILE.avatar_url,
      created_at: new Date().toISOString(),
    });
    setIsAuthenticated(true);
  };

  const loginWithGoogle = async () => {
    setUser(DEFAULT_USER_PROFILE);
    setIsAuthenticated(true);
  };

  const register = async (nama: string, email: string, wilayah: string) => {
    setUser({
      user_id: 'usr-' + Date.now(),
      nama: nama || 'Alex Smith',
      email: email,
      wilayah: wilayah || 'Jakarta Selatan',
      avatar_url: DEFAULT_USER_PROFILE.avatar_url,
      created_at: new Date().toISOString(),
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const saveLahan = async (newLahanData: Omit<Lahan, 'lahan_id' | 'created_at'>): Promise<Lahan> => {
    const activeCount = activeCrops.filter(c => c.status === 'AKTIF').length;
    const createdLahan: Lahan = {
      ...newLahanData,
      lahan_id: activeLahan?.lahan_id || 'lah-' + Date.now(),
      created_at: activeLahan?.created_at || new Date().toISOString(),
      jumlah_tanaman_aktif: activeCount,
    };

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

    return createdLahan;
  };

  const toggleChecklistSiram = (cropId: string) => {
    setActiveCrops(prev =>
      prev.map(c => {
        if (c.tanaman_aktif_id === cropId) {
          const current = c.checklist_hari_ini?.siram_done ?? false;
          return {
            ...c,
            checklist_hari_ini: {
              siram_done: !current,
              pupuk_done: c.checklist_hari_ini?.pupuk_done ?? false,
              catatan: c.checklist_hari_ini?.catatan ?? null,
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
          return {
            ...c,
            checklist_hari_ini: {
              siram_done: c.checklist_hari_ini?.siram_done ?? false,
              pupuk_done: !current,
              catatan: c.checklist_hari_ini?.catatan ?? null,
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
    const newCrop: TanamanAktif = {
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

    setActiveCrops(prev => [newCrop, ...prev]);

    if (activeLahan) {
      setActiveLahan(prev => (prev ? { ...prev, jumlah_tanaman_aktif: (prev.jumlah_tanaman_aktif || 0) + 1 } : null));
    }
  };

  const recordPanen = async (cropId: string, beratGram: number): Promise<{ hematRp: number; tanamanNama: string }> => {
    const targetCrop = activeCrops.find(c => c.tanaman_aktif_id === cropId);
    const matchedRec = rekomendasiList.find(r => r.komoditas_id === targetCrop?.komoditas_id);
    const hargaKg = matchedRec?.harga_pasar_per_kg || 40000;
    const hematRp = Math.round((beratGram / 1000) * hargaKg);
    const beratKg = Number((beratGram / 1000).toFixed(2));

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
    setActiveCrops(prev =>
      prev.map(c => (c.tanaman_aktif_id === cropId ? { ...c, status: 'GAGAL' } : c))
    );
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
        stats,
        catatanHistory,
        reminders,
        updateReminderTime,
        toggleReminder,
        addCustomReminder,
        deleteReminder,
        triggerTestAlarm,
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

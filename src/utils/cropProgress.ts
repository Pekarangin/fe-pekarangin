import { TanamanAktif } from '../types';

export interface CropGrowthInfo {
  currentDay: number;
  totalDays: number;
  progressPercent: number;
  fase: string;
  kondisiText: string;
  sisaHari: number;
  isReadyToHarvest: boolean;
  milestoneActive: {
    bibit: boolean;
    vegetatif: boolean;
    bunga: boolean;
    panen: boolean;
  };
}

/**
 * Menghitung progres panen dan kondisi pertumbuhan tanaman secara dinamis
 * berdasarkan tanggal tanam, perkiraan panen, hari_ke, serta checklist harian.
 */
export function calculateCropGrowth(crop?: TanamanAktif | null): CropGrowthInfo {
  if (!crop) {
    return {
      currentDay: 1,
      totalDays: 30,
      progressPercent: 5,
      fase: 'Bibit',
      kondisiText: 'Baru Ditanam',
      sisaHari: 29,
      isReadyToHarvest: false,
      milestoneActive: {
        bibit: true,
        vegetatif: false,
        bunga: false,
        panen: false,
      },
    };
  }

  // Hitung total hari estimasi panen
  let totalDays = 30;
  if (crop.tanggal_tanam && crop.perkiraan_panen) {
    const tTanam = new Date(crop.tanggal_tanam).getTime();
    const tPanen = new Date(crop.perkiraan_panen).getTime();
    const diff = Math.round((tPanen - tTanam) / (1000 * 60 * 60 * 24));
    if (diff > 0) {
      totalDays = diff;
    }
  }

  // Hitung hari berjalan (hari ke-)
  let currentDay = crop.hari_ke || 1;
  if (crop.tanggal_tanam) {
    const tTanam = new Date(crop.tanggal_tanam).getTime();
    const now = new Date().getTime();
    const elapsed = Math.floor((now - tTanam) / (1000 * 60 * 60 * 24)) + 1;
    if (elapsed > 0) {
      currentDay = Math.max(crop.hari_ke || 1, elapsed);
    }
  }

  // Hitung persentase progres panen sesuai status dan waktu
  let progressPercent = 5;
  if (crop.status === 'PANEN') {
    progressPercent = 100;
  } else if (crop.status === 'GAGAL') {
    progressPercent = 0;
  } else {
    const calculatedPct = Math.round((currentDay / totalDays) * 100);
    progressPercent = Math.min(100, Math.max(5, calculatedPct));
  }

  // Tentukan fase pertumbuhan tanaman
  let fase = 'Bibit';
  if (crop.status === 'PANEN') {
    fase = 'Selesai Panen';
  } else if (crop.status === 'GAGAL') {
    fase = 'Gagal Tanam';
  } else if (progressPercent >= 90 || currentDay >= totalDays) {
    fase = 'Siap Panen';
  } else if (progressPercent >= 60) {
    fase = 'Pembungaan';
  } else if (progressPercent >= 25) {
    fase = 'Vegetatif';
  } else {
    fase = 'Bibit';
  }

  const sisaHari = Math.max(0, totalDays - currentDay);
  const isReadyToHarvest = progressPercent >= 90 || currentDay >= totalDays || crop.status === 'PANEN';

  // Tentukan kondisi aktual tanaman berdasarkan perawatan
  const siramDone = crop.checklist_hari_ini?.siram_done ?? false;
  const pupukDone = crop.checklist_hari_ini?.pupuk_done ?? false;

  let kondisiText = 'Perlu Disiram 💧';
  if (crop.status === 'PANEN') {
    kondisiText = 'Telah Dipanen 🎉';
  } else if (crop.status === 'GAGAL') {
    kondisiText = 'Siklus Ditutup';
  } else if (isReadyToHarvest) {
    kondisiText = 'Waktunya Panen! 🧺';
  } else if (siramDone && pupukDone) {
    kondisiText = 'Kondisi Optimal 🌿✨';
  } else if (siramDone) {
    kondisiText = 'Cukup Air 💧';
  } else if (pupukDone) {
    kondisiText = 'Ternutrisi Pupuk 🌿';
  }

  return {
    currentDay,
    totalDays,
    progressPercent,
    fase,
    kondisiText,
    sisaHari,
    isReadyToHarvest,
    milestoneActive: {
      bibit: progressPercent >= 5,
      vegetatif: progressPercent >= 25,
      bunga: progressPercent >= 60,
      panen: progressPercent >= 90,
    },
  };
}

export interface GroupedCrop {
  group_id: string;
  komoditas_id: string;
  komoditas_nama: string;
  image_url?: string;
  tanggal_tanam: string;
  perkiraan_panen: string;
  lahan_id: string;
  lahan_nama: string;
  fase: string;
  hari_ke: number;
  count: number;
  luas_m2: number;
  crop_ids: string[];
  items: TanamanAktif[];
  checklist_hari_ini?: {
    siram_done: boolean;
    pupuk_done: boolean;
    catatan?: string | null;
  };
  growth: CropGrowthInfo;
}

/**
 * Mengelompokkan tanaman aktif di frontend berdasarkan:
 * - Komoditas yang sama
 * - Tanggal tanam yang sama
 * - Lahan yang sama
 */
export function groupActiveCrops(crops: TanamanAktif[]): GroupedCrop[] {
  const groupsMap = new Map<string, GroupedCrop>();

  for (const crop of crops) {
    if (crop.status !== 'AKTIF') continue;

    const komoditasKey = crop.komoditas_id || crop.komoditas_nama || 'unknown';
    const tanggalKey = (crop.tanggal_tanam || '').split('T')[0] || 'nodate';
    const lahanKey = crop.lahan_id || 'nolahan';
    const key = `${lahanKey}_${komoditasKey}_${tanggalKey}`;

    if (!groupsMap.has(key)) {
      const growth = calculateCropGrowth(crop);
      groupsMap.set(key, {
        group_id: key,
        komoditas_id: crop.komoditas_id,
        komoditas_nama: crop.komoditas_nama,
        image_url: crop.image_url,
        tanggal_tanam: crop.tanggal_tanam,
        perkiraan_panen: crop.perkiraan_panen,
        lahan_id: crop.lahan_id,
        lahan_nama: crop.lahan_nama,
        fase: growth.fase,
        hari_ke: growth.currentDay,
        count: 1,
        luas_m2: Number(crop.luas_dibutuhkan_m2 || 0.25),
        crop_ids: [crop.tanaman_aktif_id],
        items: [crop],
        checklist_hari_ini: crop.checklist_hari_ini,
        growth,
      });
    } else {
      const g = groupsMap.get(key)!;
      g.count += 1;
      g.luas_m2 = Number((g.luas_m2 + Number(crop.luas_dibutuhkan_m2 || 0.25)).toFixed(2));
      g.crop_ids.push(crop.tanaman_aktif_id);
      g.items.push(crop);
    }
  }

  return Array.from(groupsMap.values());
}

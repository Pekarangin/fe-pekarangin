export type PaparanSinar = 'FULL_SUN' | 'PARTIAL_SUN' | 'SHADE';
export type SumberPaparan = 'MANUAL' | 'AI_VISION';
export type KesesuaianSinar = 'COCOK' | 'KURANG_COCOK' | 'TIDAK_COCOK';
export type TingkatKesulitan = 'MUDAH' | 'SEDANG' | 'SULIT';
export type StatusTanaman = 'AKTIF' | 'PANEN' | 'GAGAL';

export interface User {
  user_id: string;
  nama: string;
  email: string;
  avatar_url?: string | null;
  wilayah?: string;
  created_at?: string;
}

export interface Lahan {
  lahan_id: string;
  user_id?: string;
  nama_lahan: string;
  luas_m2: number;
  grid_snapshot: number[]; // Array 0..63 for 8x8 grid
  paparan_sinar: PaparanSinar;
  sumber_paparan: SumberPaparan;
  foto_url?: string | null;
  jumlah_tanaman_aktif?: number;
  created_at?: string;
}

export interface Komoditas {
  komoditas_id: string;
  nama: string;
  kebutuhan_sinar: PaparanSinar;
  luas_min_m2: number;
  luas_optimal_m2: number;
  waktu_panen_hari: number;
  konsumsi_rt_kg_per_bulan: number;
  tingkat_kesulitan: TingkatKesulitan;
  jadwal_siram_hari: number;
  jadwal_pupuk_hari: number;
  panduan_singkat: string;
  image_url?: string;
}

export interface RekomendasiItem {
  komoditas_id: string;
  nama: string;
  skor_prioritas: number;
  estimasi_hemat_rp_per_bulan: number;
  waktu_panen_hari: number;
  luas_dibutuhkan_m2: number;
  tingkat_kesulitan: TingkatKesulitan;
  kesesuaian_sinar: KesesuaianSinar;
  harga_pasar_per_kg: number;
  konsumsi_rt_kg_per_bulan: number;
  image_url?: string;
  panduan_singkat?: string;
  jadwal_siram_hari?: number;
  jadwal_pupuk_hari?: number;
  media_tanam?: string;
}

export interface TanamanAktif {
  tanaman_aktif_id: string;
  user_id?: string;
  lahan_id: string;
  lahan_nama: string;
  komoditas_id: string;
  komoditas_nama: string;
  tanggal_tanam: string;
  perkiraan_panen: string;
  status: StatusTanaman;
  hari_ke: number;
  persentase_hari?: number;
  fase?: string;
  image_url?: string;
  checklist_hari_ini?: {
    siram_done: boolean;
    pupuk_done: boolean;
    catatan?: string | null;
  };
}

export interface CatatanHarian {
  catatan_id: string;
  tanaman_id: string;
  tanggal: string;
  siram_done: boolean;
  pupuk_done: boolean;
  catatan?: string | null;
}

export interface RealisasiPanen {
  realisasi_id: string;
  tanaman_aktif_id: string;
  tanggal_panen: string;
  berat_panen_gram: number;
  estimasi_hemat_rp: number;
  status: 'PANEN';
}

export interface UserStats {
  total_panen_kg: number;
  total_hemat_rp: number;
  rth_aktif_m2: number;
  kontribusi_lingkungan_persen: number;
  streak_hari: number;
}

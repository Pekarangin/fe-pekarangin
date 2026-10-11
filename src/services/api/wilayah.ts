export interface WilayahItem {
  id: string;
  name: string;
}

const WILAYAH_BASE_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

export const wilayahService = {
  getProvinces: async (): Promise<WilayahItem[]> => {
    const res = await fetch(`${WILAYAH_BASE_URL}/provinces.json`);
    if (!res.ok) throw new Error('Gagal memuat daftar provinsi');
    return res.json();
  },

  getRegencies: async (provinceId: string): Promise<WilayahItem[]> => {
    const res = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceId}.json`);
    if (!res.ok) throw new Error('Gagal memuat kabupaten/kota');
    return res.json();
  },

  getDistricts: async (regencyId: string): Promise<WilayahItem[]> => {
    const res = await fetch(`${WILAYAH_BASE_URL}/districts/${regencyId}.json`);
    if (!res.ok) throw new Error('Gagal memuat kecamatan');
    return res.json();
  },

  getVillages: async (districtId: string): Promise<WilayahItem[]> => {
    const res = await fetch(`${WILAYAH_BASE_URL}/villages/${districtId}.json`);
    if (!res.ok) throw new Error('Gagal memuat kelurahan');
    return res.json();
  },
};

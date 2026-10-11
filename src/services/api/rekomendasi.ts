import { request } from './client';
import { Komoditas, RekomendasiItem } from '../../types';

export interface RekomendasiResponse {
  lahan_id: string;
  lahan_nama: string;
  lahan_luas_m2: number;
  lahan_paparan_sinar: string;
  harga_update_terakhir: string;
  rekomendasi: RekomendasiItem[];
}

export interface KomoditasDetail extends Komoditas {
  harga_terkini?: {
    harga_rp_per_kg: number;
    sumber: string;
    tanggal_update: string;
    wilayah: string;
  };
}

export const rekomendasiService = {
  getByLahanId: (lahanId: string): Promise<RekomendasiResponse> => {
    return request<RekomendasiResponse>(`/lahan/${lahanId}/rekomendasi`, {
      method: 'GET',
    });
  },

  getAllKomoditas: (): Promise<Komoditas[]> => {
    return request<Komoditas[]>('/komoditas', {
      method: 'GET',
    });
  },

  getKomoditasById: (id: string): Promise<KomoditasDetail> => {
    return request<KomoditasDetail>(`/komoditas/${id}`, {
      method: 'GET',
    });
  },
};

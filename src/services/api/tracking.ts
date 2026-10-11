import { request } from './client';
import { CatatanHarian, RealisasiPanen, StatusTanaman, TanamanAktif } from '../../types';

export interface CreateTanamanAktifPayload {
  lahan_id: string;
  komoditas_id: string;
  tanggal_tanam: string;
}

export interface SubmitChecklistPayload {
  tanggal: string;
  siram_done: boolean;
  pupuk_done: boolean;
  catatan?: string | null;
}

export interface RecordPanenPayload {
  tanggal_panen: string;
  berat_panen_gram: number;
}

export interface CreateTanamanAktifResponse {
  tanaman_aktif_id: string;
  user_id: string;
  lahan_id: string;
  komoditas: {
    komoditas_id: string;
    nama: string;
    waktu_panen_hari: number;
    jadwal_siram_hari: number;
    jadwal_pupuk_hari: number;
  };
  tanggal_tanam: string;
  perkiraan_panen: string;
  status: StatusTanaman;
}

export const trackingService = {
  getAll: (params?: { status?: StatusTanaman; lahan_id?: string }): Promise<TanamanAktif[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.lahan_id) searchParams.append('lahan_id', params.lahan_id);

    const query = searchParams.toString();
    return request<TanamanAktif[]>(`/tanaman-aktif${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  },

  getById: (id: string): Promise<TanamanAktif> => {
    return request<TanamanAktif>(`/tanaman-aktif/${id}`, {
      method: 'GET',
    });
  },

  create: (payload: CreateTanamanAktifPayload): Promise<CreateTanamanAktifResponse> => {
    return request<CreateTanamanAktifResponse>('/tanaman-aktif', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  submitChecklist: (
    cropId: string,
    payload: SubmitChecklistPayload
  ): Promise<CatatanHarian> => {
    return request<CatatanHarian>(`/tanaman-aktif/${cropId}/checklist`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getChecklistHistory: (
    cropId: string,
    params?: { dari?: string; sampai?: string }
  ): Promise<CatatanHarian[]> => {
    const searchParams = new URLSearchParams();
    if (params?.dari) searchParams.append('dari', params.dari);
    if (params?.sampai) searchParams.append('sampai', params.sampai);

    const query = searchParams.toString();
    return request<CatatanHarian[]>(
      `/tanaman-aktif/${cropId}/checklist${query ? `?${query}` : ''}`,
      { method: 'GET' }
    );
  },

  recordPanen: (
    cropId: string,
    payload: RecordPanenPayload
  ): Promise<RealisasiPanen> => {
    return request<RealisasiPanen>(`/tanaman-aktif/${cropId}/panen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  markGagal: (
    cropId: string
  ): Promise<{ tanaman_aktif_id: string; status: 'GAGAL'; message: string }> => {
    return request<{ tanaman_aktif_id: string; status: 'GAGAL'; message: string }>(
      `/tanaman-aktif/${cropId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'GAGAL' }),
      }
    );
  },
};

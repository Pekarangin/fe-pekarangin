import { Platform } from 'react-native';
import { request } from './client';
import { Lahan, PaparanSinar, SumberPaparan } from '../../types';

export interface CreateLahanPayload {
  nama_lahan: string;
  grid_snapshot: number[];
  luas_m2: number;
  paparan_sinar: PaparanSinar;
  sumber_paparan: SumberPaparan;
}

export interface AnalisisCahayaResult {
  paparan_sinar: PaparanSinar;
  confidence: number;
  catatan: string;
}

export const lahanService = {
  getAll: (): Promise<Lahan[]> => {
    return request<Lahan[]>('/lahan', {
      method: 'GET',
    });
  },

  getById: (id: string): Promise<Lahan> => {
    return request<Lahan>(`/lahan/${id}`, {
      method: 'GET',
    });
  },

  create: (payload: CreateLahanPayload): Promise<Lahan> => {
    return request<Lahan>('/lahan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: (id: string, payload: Partial<CreateLahanPayload>): Promise<Lahan> => {
    return request<Lahan>(`/lahan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: (id: string): Promise<{ message?: string }> => {
    return request<{ message?: string }>(`/lahan/${id}`, {
      method: 'DELETE',
    });
  },

  analyzeLight: async (imageUri: string, mimeType: string = 'image/jpeg'): Promise<AnalisisCahayaResult> => {
    const formData = new FormData();

    if (Platform.OS === 'web' || imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
      const blobRes = await fetch(imageUri);
      const blob = await blobRes.blob();
      formData.append('foto', blob, 'photo.jpg');
    } else {
      formData.append('foto', {
        uri: imageUri,
        name: 'photo.jpg',
        type: mimeType || 'image/jpeg',
      } as any);
    }

    return request<AnalisisCahayaResult>('/lahan/analisis-cahaya', {
      method: 'POST',
      body: formData,
    });
  },
};

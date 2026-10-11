import { request } from './client';

export interface ChatResponse {
  reply: string;
  konteks_tanaman?: {
    nama: string;
    hari_ke: number;
    status: string;
  };
}

export const aiInsightService = {
  chat: (message: string, tanaman_aktif_id?: string): Promise<ChatResponse> => {
    return request<ChatResponse>('/ai-insight/chat', {
      method: 'POST',
      body: JSON.stringify({ message, tanaman_aktif_id }),
    });
  },
};

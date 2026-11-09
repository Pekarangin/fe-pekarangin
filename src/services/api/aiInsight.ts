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
  chat: async (message: string, tanaman_aktif_id?: string, userName?: string): Promise<ChatResponse> => {
    const trimmedName = userName?.trim();
    const systemContext = trimmedName
      ? `[Konteks Pengguna: Nama saya "${trimmedName}"].\n\n`
      : '';
    const fullMessage = `${systemContext}${message}`;

    const res = await request<ChatResponse>('/ai-insight/chat', {
      method: 'POST',
      body: JSON.stringify({ message: fullMessage, tanaman_aktif_id }),
    });

    return res;
  },
};


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
    // Provide user name in prompt context so backend LLM greets the user correctly
    const trimmedName = userName?.trim();
    const systemContext = trimmedName
      ? `[Konteks Pengguna: Nama saya "${trimmedName}". Jangan panggil Mas Budi, sapa dan panggil saya selalu dengan nama "${trimmedName}"].\n\n`
      : '';
    const fullMessage = `${systemContext}${message}`;

    const res = await request<ChatResponse>('/ai-insight/chat', {
      method: 'POST',
      body: JSON.stringify({ message: fullMessage, tanaman_aktif_id }),
    });

    // Sanitize any hardcoded "Budi" leaked by backend system prompt
    if (res?.reply && trimmedName) {
      res.reply = res.reply
        .replace(/Mas Budi/gi, trimmedName)
        .replace(/Pak Budi/gi, trimmedName)
        .replace(/\bBudi\b/g, trimmedName);
    }

    return res;
  },
};


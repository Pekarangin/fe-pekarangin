export interface WilayahItem {
  id: string;
  name: string;
}

// Gunakan HTTPS direct domain untuk hindari redirect 301 ke http:// yang diblokir Android/iOS ATS
const PRIMARY_WILAYAH_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const SECONDARY_WILAYAH_URL = 'https://emsifa.github.io/api-wilayah-indonesia/api';

// Fallback data lokal jika koneksi offline/gagal
const LOCAL_FALLBACKS: Record<string, WilayahItem[]> = {
  'provinces.json': [
    { id: '31', name: 'DKI JAKARTA' },
    { id: '32', name: 'JAWA BARAT' },
    { id: '33', name: 'JAWA TENGAH' },
    { id: '34', name: 'DI YOGYAKARTA' },
    { id: '35', name: 'JAWA TIMUR' },
    { id: '36', name: 'BANTEN' },
    { id: '51', name: 'BALI' },
  ],
  'regencies/34.json': [
    { id: '3401', name: 'KABUPATEN KULON PROGO' },
    { id: '3402', name: 'KABUPATEN BANTUL' },
    { id: '3403', name: 'KABUPATEN GUNUNG KIDUL' },
    { id: '3404', name: 'KABUPATEN SLEMAN' },
    { id: '3471', name: 'KOTA YOGYAKARTA' },
  ],
  'regencies/33.json': [
    { id: '3375', name: 'KOTA PEKALONGAN' },
    { id: '3374', name: 'KOTA SEMARANG' },
    { id: '3372', name: 'KOTA SURAKARTA' },
    { id: '3302', name: 'KABUPATEN BANYUMAS' },
  ],
};

async function fetchWilayah(path: string): Promise<WilayahItem[]> {
  const sources = [
    `${PRIMARY_WILAYAH_URL}/${path}`,
    `${SECONDARY_WILAYAH_URL}/${path}`,
  ];

  let lastError: any;
  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Gunakan fallback lokal jika tersedia
  if (LOCAL_FALLBACKS[path]) {
    return LOCAL_FALLBACKS[path];
  }

  throw lastError || new Error(`Gagal memuat data wilayah: ${path}`);
}

export const wilayahService = {
  getProvinces: (): Promise<WilayahItem[]> => {
    return fetchWilayah('provinces.json');
  },

  getRegencies: (provinceId: string): Promise<WilayahItem[]> => {
    return fetchWilayah(`regencies/${provinceId}.json`);
  },

  getDistricts: (regencyId: string): Promise<WilayahItem[]> => {
    return fetchWilayah(`districts/${regencyId}.json`);
  },

  getVillages: (districtId: string): Promise<WilayahItem[]> => {
    return fetchWilayah(`villages/${districtId}.json`);
  },
};

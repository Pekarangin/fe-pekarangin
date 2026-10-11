// ============================================================
// src/services/weather.ts — Real-time Weather Service (Open-Meteo)
// Sesuai lokasi real user (wilayah terdaftar / geocoding)
// ============================================================

export interface RealWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  conditionText: string;
  isDay: boolean;
  locationName: string;
  advisoryText: string;
  badgeLabel: string;
}

// Koordinat fallback default: D.I. Yogyakarta (Pusat Pilot Pekarang.in)
const DEFAULT_COORDS = {
  lat: -7.7956,
  lon: 110.3695,
  name: 'Yogyakarta',
};

function mapWeatherCode(code: number): string {
  switch (code) {
    case 0:
      return 'Cerah';
    case 1:
      return 'Sebagian Cerah';
    case 2:
      return 'Cerah Berawan';
    case 3:
      return 'Berawan Mendung';
    case 45:
    case 48:
      return 'Berkabut';
    case 51:
    case 53:
    case 55:
      return 'Gerimis';
    case 61:
    case 63:
    case 65:
      return 'Hujan';
    case 80:
    case 81:
    case 82:
      return 'Hujan Lokal';
    case 95:
    case 96:
    case 99:
      return 'Hujan Badai Petir';
    default:
      return 'Cerah Berawan';
  }
}

function generateAdvisory(
  temp: number,
  code: number,
  hasActiveCrops: boolean
): { advisoryText: string; badgeLabel: string } {
  const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);

  if (isRain) {
    return {
      advisoryText:
        'Hujan terpantau di lokasi Anda. Tunda penyiraman manual untuk cegah tanah terlalu becek.',
      badgeLabel: 'Hujan Terpantau',
    };
  }

  if (temp >= 33) {
    return {
      advisoryText:
        'Suhu sangat terik (>33°C). Siram ekstra pada sore hari atau pasang paranet penahan panas.',
      badgeLabel: 'Terik Ekstrem',
    };
  }

  if (temp >= 30) {
    return {
      advisoryText: hasActiveCrops
        ? 'Suhu hangat optimal. Pastikan media tanam tetap lembap dengan penyiraman teratur.'
        : 'Suhu ideal untuk memulai penyemaian benih sayuran di pekarangan Anda.',
      badgeLabel: 'Hangat Produktif',
    };
  }

  if (temp >= 24) {
    return {
      advisoryText:
        'Suhu sejuk nyaman. Sangat ramah untuk pertumbuhan tunas muda dan daun sayuran hijau.',
      badgeLabel: 'Kondisi Prima',
    };
  }

  return {
    advisoryText:
      'Suhu relatif dingin. Kurangi debit air siram agar akar tanaman tidak membusuk.',
    badgeLabel: 'Sejuk Dingin',
  };
}

function cleanLocationQuery(rawWilayah?: string | null): string[] {
  if (!rawWilayah || !rawWilayah.trim()) return ['Yogyakarta'];

  const parts = rawWilayah
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  const clean = (s: string) =>
    s
      .replace(
        /^(kabupaten|kab\.|kota|kecamatan|kec\.|kelurahan|kel\.|desa|d\.i\.|daerah istimewa)\s+/gi,
        ''
      )
      .trim();

  const candidates: string[] = [];

  // Prioritas: nama Kabupaten/Kota (biasanya bagian paling belakang pada format "Kelurahan, Kecamatan, Kota")
  if (parts.length > 0) {
    candidates.push(clean(parts[parts.length - 1]));
  }
  if (parts.length > 1) {
    candidates.push(clean(parts[parts.length - 2]));
  }
  if (parts.length > 2) {
    candidates.push(clean(parts[0]));
  }

  return candidates.filter(c => c.length >= 2);
}

export async function fetchLiveWeather(
  rawWilayah?: string | null,
  hasActiveCrops = false
): Promise<RealWeather> {
  let targetLat = DEFAULT_COORDS.lat;
  let targetLon = DEFAULT_COORDS.lon;
  let resolvedName = DEFAULT_COORDS.name;

  const candidates = cleanLocationQuery(rawWilayah);

  // 1. Coba geocoding lokasi wilayah pengguna secara akurat
  for (const query of candidates) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=1&language=id&format=json`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const first = geoData.results[0];
          targetLat = first.latitude;
          targetLon = first.longitude;
          resolvedName = first.name || query;
          break;
        }
      }
    } catch {
      // Abaikan dan coba kandidat berikutnya / fallback
    }
  }

  // 2. Fetch suhu & kondisi cuaca real-time dari stasiun Open-Meteo
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,is_day&timezone=auto`;
    const res = await fetch(weatherUrl);

    if (!res.ok) {
      throw new Error(`Weather fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const temperature = Math.round(current.temperature_2m ?? 30);
    const apparentTemperature = Math.round(
      current.apparent_temperature ?? temperature
    );
    const humidity = Math.round(current.relative_humidity_2m ?? 70);
    const weatherCode = current.weather_code ?? 0;
    const isDay = current.is_day === 1;
    const conditionText = mapWeatherCode(weatherCode);

    const { advisoryText, badgeLabel } = generateAdvisory(
      temperature,
      weatherCode,
      hasActiveCrops
    );

    return {
      temperature,
      apparentTemperature,
      humidity,
      weatherCode,
      conditionText,
      isDay,
      locationName: resolvedName,
      advisoryText,
      badgeLabel,
    };
  } catch (err) {
    console.warn('Gagal ambil data cuaca real-time, gunakan estimasi aman:', err);
    return {
      temperature: 30,
      apparentTemperature: 32,
      humidity: 72,
      weatherCode: 2,
      conditionText: 'Cerah Berawan',
      isDay: true,
      locationName: resolvedName,
      advisoryText: 'Suhu stabil optimal untuk tanaman pekarangan mandiri.',
      badgeLabel: 'Optimal',
    };
  }
}

# 📱 Pekarang.in — Frontend Mobile Client
> **Aplikasi Smart Urban Farming Berbasis React Native & Expo**  
> *Kompetisi Multimedia and Game Event (MAGE) 12 — Institut Teknologi Sepuluh Nopember (ITS)*

[![Expo](https://img.shields.io/badge/Expo-v57.0-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![NativeWind](https://img.shields.io/badge/Tailwind-NativeWind%20v4-38B2AC?logo=tailwindcss&logoColor=white)](https://nativewind.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📖 Ringkasan

**`fe-pekarangin`** adalah aplikasi mobile client dari ekosistem Pekarang.in. Dibangun menggunakan **Expo SDK 57**, **React Native**, **Expo Router**, dan **NativeWind (Tailwind CSS)** untuk menghadirkan pengalaman antarmuka yang responsif, modern, dan ramah pengguna di berbagai ukuran layar smartphone.

### 🌟 Fitur Utama:
1. **Interactive 8×8 Garden Grid & Manual Sync:**
   - Pemetaan pekarangan dengan grid 64 sel interaktif atau input angka desimal manual.
   - Sinkronisasi dua arah otomatis dengan algoritma penempatan sel konsentris terpusat di titik tengah `(3.5, 3.5)`.
2. **Cascading Wilayah Picker Nasional:**
   - Pemilihan hierarki wilayah Indonesia (Provinsi $\rightarrow$ Kota/Kabupaten $\rightarrow$ Kecamatan $\rightarrow$ Kelurahan) berbasis API Kemendagri dengan pencarian instan.
3. **Live Weather & Geocoding:**
   - Menampilkan kondisi suhu, cuaca, kelembapan, serta saran perawatan tanaman real-time via Open-Meteo berdasarkan lokasi pekarangan user.
4. **AI Vision & Camera Integration:**
   - Ambil foto atau upload gambar pekarangan untuk deteksi intensitas sinar matahari via Gemini AI Vision.
5. **Crop Recommendation & Dynamic Warnings:**
   - Katalog 15 komoditas pangan dengan estimasi penghematan ekonomi belanja dapur dan penjelasan kesesuaian agronomis.
6. **Cultivation Tracking & Daily Care Checklist:**
   - Manajemen siklus tanam, log penyiraman/pemupukan harian persisten, catatan pertumbuhan, dan pencatatan panen aktual.
7. **AI Farming Assistant Chat:**
   - Chatbot konsultasi budidaya dan hama interaktif.

---

## 📁 Struktur Direktori

```text
fe-pekarangin/
├── src/
│   ├── app/                    # File-based routing (Expo Router)
│   │   ├── (auth)/             # Login, Register, Google OAuth
│   │   ├── (tabs)/             # Tab navigasi: Beranda, Rekomendasi, Chatbot, Tracking, Profil, Lahan
│   │   ├── wizard-setup.tsx    # Onboarding pembuatan lahan & tanaman pertama
│   │   └── _layout.tsx         # Root layout & providers
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # WilayahPickerModal, Badge, Button, Card, Input
│   │   └── ...
│   ├── constants/              # Asset komoditas, warna tema
│   ├── context/                # AppContext (State global, offline storage sync)
│   ├── services/               # API clients (auth, lahan, rekomendasi, tracking, weather)
│   ├── types/                  # TypeScript interface definitions
│   └── utils/                  # Helper grid radial & formatting
├── assets/                     # Gambar tanaman, ikon, logo
├── app.json                    # Konfigurasi Expo & permissions
├── tailwind.config.js          # Tema styling NativeWind
└── package.json
```

---

## 🚀 Panduan Menjalankan Frontend

### 1. Prasyarat
- Node.js **v20 LTS** atau lebih baru
- NPM atau Yarn
- Aplikasi **Expo Go** pada ponsel (Play Store / App Store) jika ingin menguji di handphone fisik.

### 2. Instalasi Dependensi
```bash
cd fe-pekarangin
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file template:
```bash
cp .env.example .env
```

Buka file `.env` dan atur URL backend:
```env
# Jika menggunakan browser atau emulator:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Jika menggunakan HP fisik (Expo Go):
# Ganti dengan alamat IP lokal Wi-Fi komputer Anda (misal 192.168.1.10):
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000/api/v1
```

### 4. Menjalankan Aplikasi
```bash
npx expo start
```

Pilihan membuka aplikasi dari terminal:
- Tekan **`w`** untuk membuka langsung di **Web Browser**.
- Scan **QR Code** di layar menggunakan kamera iPhone atau aplikasi **Expo Go** di Android.
- Tekan **`a`** untuk membuka di **Android Emulator** (memerlukan Android Studio).
- Tekan **`i`** untuk membuka di **iOS Simulator** (memerlukan Xcode di macOS).

---

## 🧪 Pemeriksaan Kualitas Kode (Lint & Type Check)

```bash
# Type check TypeScript:
npx tsc --noEmit

# Linting ESLint:
npx eslint src/
```

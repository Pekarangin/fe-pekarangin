import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Sun,
  Sprout,
  ArrowRight,
  Clock,
  Banknote,
  Leaf,
  Check,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { PaparanSinar, RekomendasiItem } from '../types';
import { getCropImageSource } from '../constants/cropImages';
import { rekomendasiService } from '../services/api';

const QUICK_SIZES = [
  { label: 'Mikro (2 m²)', luas: 2, desc: 'Polybag / Sudut Rumah' },
  { label: 'Sedang (6 m²)', luas: 6, desc: 'Pekarangan Depan' },
  { label: 'Luas (12 m²)', luas: 12, desc: 'Halaman Belakang' },
];

const SUN_OPTIONS: { id: PaparanSinar; title: string; sub: string; tag: string }[] = [
  {
    id: 'FULL_SUN',
    title: 'Sinar Penuh (> 6 Jam)',
    sub: 'Terpapar matahari langsung sepanjang hari',
    tag: 'Cocok: Cabai, Tomat, Terong',
  },
  {
    id: 'PARTIAL_SUN',
    title: 'Sinar Parsial (3 – 6 Jam)',
    sub: 'Tersinari pagi hari atau tersaring kanopi',
    tag: 'Cocok: Sawi, Kangkung, Bayam',
  },
  {
    id: 'SHADE',
    title: 'Area Teduh (< 3 Jam)',
    sub: 'Bawah atap, teras, atau sela tembok',
    tag: 'Cocok: Kemangi, Seledri, Daun Bawang',
  },
];

export default function SetupWizardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, saveLahan, addTanamanAktif } = useApp();

  // Wizard Step: 1 = Input Lahan & Sinar, 2 = Rekomendasi Top 3 & Pilih Tanaman
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [namaLahan, setNamaLahan] = useState('Pekarangan Utama');
  const [luasM2, setLuasM2] = useState<number>(6);
  const [customLuas, setCustomLuas] = useState('6');
  const [paparanSinar, setPaparanSinar] = useState<PaparanSinar>('FULL_SUN');

  // Loading & Recommendations State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topRecommendations, setTopRecommendations] = useState<RekomendasiItem[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<RekomendasiItem | null>(null);

  // Handle Step 1 Completion -> Save Lahan & Fetch Top 3
  const handleProceedToStep2 = async () => {
    const finalLuas = Number(customLuas) || luasM2 || 4;
    if (finalLuas <= 0) {
      Alert.alert('Perhatian', 'Harap masukkan luas lahan yang valid');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Simpan Lahan
      const created = await saveLahan({
        nama_lahan: namaLahan.trim() || 'Pekarangan Rumah',
        luas_m2: finalLuas,
        paparan_sinar: paparanSinar,
        sumber_paparan: 'MANUAL',
        grid_snapshot: [1, 1, 1, 1],
      });

      // 2. Ambil rekomendasi komoditas tailored
      let recs: RekomendasiItem[] = [];
      try {
        if (created.lahan_id && !created.lahan_id.startsWith('lah-')) {
          const res = await rekomendasiService.getByLahanId(created.lahan_id);
          if (res?.rekomendasi && res.rekomendasi.length > 0) {
            recs = res.rekomendasi;
          }
        }
      } catch (err) {
        console.warn('Gagal ambil rekomendasi via lahan_id:', err);
      }

      // Fallback jika API rekomendasi belum ada
      if (recs.length === 0) {
        recs = [
          {
            komoditas_id: 'kom-1',
            nama: 'Cabai Rawit',
            skor_prioritas: 4.8,
            estimasi_hemat_rp_per_bulan: 45000,
            waktu_panen_hari: 75,
            luas_dibutuhkan_m2: 0.16,
            tingkat_kesulitan: 'MUDAH',
            kesesuaian_sinar: 'COCOK',
            harga_pasar_per_kg: 52000,
            konsumsi_rt_kg_per_bulan: 0.8,
            image_url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600',
            panduan_singkat: 'Siram 1x sehari di pagi hari. Butuh sinar penuh agar buah lebat.',
            jadwal_siram_hari: 1,
            jadwal_pupuk_hari: 14,
            media_tanam: 'Polybag 30cm',
          },
          {
            komoditas_id: 'kom-8',
            nama: 'Sawi Hijau',
            skor_prioritas: 4.5,
            estimasi_hemat_rp_per_bulan: 35000,
            waktu_panen_hari: 30,
            luas_dibutuhkan_m2: 0.25,
            tingkat_kesulitan: 'MUDAH',
            kesesuaian_sinar: 'COCOK',
            harga_pasar_per_kg: 14000,
            konsumsi_rt_kg_per_bulan: 2.5,
            image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
            panduan_singkat: 'Tumbuh cepat dalam 30 hari. Sangat cocok untuk pemula.',
            jadwal_siram_hari: 1,
            jadwal_pupuk_hari: 7,
            media_tanam: 'Pot / Polybag',
          },
          {
            komoditas_id: 'kom-4',
            nama: 'Tomat Cherry',
            skor_prioritas: 4.2,
            estimasi_hemat_rp_per_bulan: 40000,
            waktu_panen_hari: 60,
            luas_dibutuhkan_m2: 0.35,
            tingkat_kesulitan: 'SEDANG',
            kesesuaian_sinar: 'COCOK',
            harga_pasar_per_kg: 28000,
            konsumsi_rt_kg_per_bulan: 1.5,
            image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
            panduan_singkat: 'Gunakan ajir bambu untuk menopang cabang saat berbuah lebat.',
            jadwal_siram_hari: 1,
            jadwal_pupuk_hari: 10,
            media_tanam: 'Pot 35cm',
          },
        ];
      }

      setTopRecommendations(recs.slice(0, 3));
      setSelectedCrop(recs[0]);
      setCurrentStep(2);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Gagal Menyimpan Lahan', e?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2 Completion -> Plant Crop & Jump to Dashboard
  const handleStartPlanting = async () => {
    if (!selectedCrop) return;

    setIsSubmitting(true);
    try {
      await addTanamanAktif(selectedCrop.komoditas_id, selectedCrop.nama);
      // Pindah ke dashboard beranda dengan trigger mode tutorial visual
      router.replace('/(tabs)?welcome=true');
    } catch (e: any) {
      console.error(e);
      // Jika error, tetap arahkan ke dashboard
      router.replace('/(tabs)?welcome=true');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F8F5]" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="bg-white border-b border-gray-200/80 px-5 py-4 flex-row items-center justify-between shadow-2xs">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-xl bg-[#124E2A] items-center justify-center mr-3 shadow-xs">
            <Sprout size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-base font-black text-gray-900 tracking-tight">
              Setup Pekarangan Pertama
            </Text>
            <Text className="text-xs font-semibold text-emerald-800">
              Langkah {currentStep} dari 2 • {currentStep === 1 ? 'Kondisi Lahan' : 'Rekomendasi AI'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className={`w-6 h-2 rounded-full mr-1.5 ${currentStep === 1 ? 'bg-[#124E2A]' : 'bg-emerald-300'}`} />
          <View className={`w-6 h-2 rounded-full ${currentStep === 2 ? 'bg-[#124E2A]' : 'bg-gray-200'}`} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 px-5 pt-4"
      >
        {currentStep === 1 ? (
          /* STEP A: UKURAN LAHAN & PAPARAN SINAR */
          <View>
            {/* Banner Guide */}
            <View className="bg-emerald-900 rounded-3xl p-5 mb-5 shadow-sm">
              <View className="flex-row items-center mb-2">
                <Sparkles size={16} color="#4ADE80" />
                <Text className="text-xs font-black text-emerald-200 ml-1.5 uppercase tracking-wider">
                  Panduan Setup Mandiri
                </Text>
              </View>
              <Text className="text-lg font-black text-white leading-snug">
                Halo {user?.nama || 'Sobat Pekarang'}! Mari siapkan pekarangan pertama Anda.
              </Text>
              <Text className="text-xs text-emerald-100/90 mt-1.5 leading-relaxed">
                Kecerdasan AI Pekarang akan menghitung komoditas sayur paling menguntungkan sesuai luas dan paparan sinar pekarangan Anda.
              </Text>
            </View>

            {/* Nama Lahan Input */}
            <View className="bg-white rounded-3xl p-5 mb-4 border border-gray-100 shadow-2xs">
              <Text className="text-xs font-bold text-gray-700 mb-2">
                NAMA PEKARANGAN / LAHAN
              </Text>
              <TextInput
                value={namaLahan}
                onChangeText={setNamaLahan}
                placeholder="Contoh: Pekarangan Rumah, Teras Samping"
                className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 font-semibold"
              />
            </View>

            {/* Pilihan Luas Lahan */}
            <View className="bg-white rounded-3xl p-5 mb-4 border border-gray-100 shadow-2xs">
              <Text className="text-xs font-bold text-gray-700 mb-1">
                ESTIMASI LUAS PEKARANGAN (M²)
              </Text>
              <Text className="text-[11px] text-gray-500 mb-3">
                Pilih ukuran cepat atau ketik luas pekarangan Anda
              </Text>

              {/* Quick Size Chips */}
              <View className="flex-row mb-3" style={{ gap: 8 }}>
                {QUICK_SIZES.map(item => {
                  const isSelected = luasM2 === item.luas;
                  return (
                    <TouchableOpacity
                      key={item.luas}
                      onPress={() => {
                        setLuasM2(item.luas);
                        setCustomLuas(item.luas.toString());
                      }}
                      className={`flex-1 p-3 rounded-2xl border ${
                        isSelected
                          ? 'bg-emerald-50 border-[#124E2A]'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-[#124E2A]' : 'text-gray-800'
                        }`}
                      >
                        {item.label}
                      </Text>
                      <Text className="text-[10px] text-gray-500 mt-0.5">
                        {item.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Input Custom Luas */}
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
                <Text className="text-xs font-bold text-gray-600 mr-2">
                  Luas Kustom:
                </Text>
                <TextInput
                  value={customLuas}
                  onChangeText={val => {
                    setCustomLuas(val);
                    setLuasM2(Number(val) || 0);
                  }}
                  keyboardType="numeric"
                  placeholder="4"
                  className="flex-1 text-sm font-black text-[#124E2A] py-0"
                />
                <Text className="text-xs font-bold text-gray-500">m²</Text>
              </View>
            </View>

            {/* Pilihan Paparan Sinar Matahari */}
            <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-2xs">
              <View className="flex-row items-center mb-1">
                <Sun size={16} color="#D97706" />
                <Text className="text-xs font-bold text-gray-700 ml-1.5">
                  PAPARAN SINAR MATAHARI
                </Text>
              </View>
              <Text className="text-[11px] text-gray-500 mb-3">
                Berapa jam area pekarangan Anda terkena sinar matahari langsung?
              </Text>

              <View style={{ gap: 10 }}>
                {SUN_OPTIONS.map(opt => {
                  const isSelected = paparanSinar === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setPaparanSinar(opt.id)}
                      className={`p-4 rounded-2xl border flex-row items-start ${
                        isSelected
                          ? 'bg-emerald-50 border-[#124E2A]'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <View className="mt-0.5 mr-3">
                        <View
                          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? 'border-[#124E2A] bg-[#124E2A]'
                              : 'border-gray-400 bg-white'
                          }`}
                        >
                          {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-xs font-black ${
                            isSelected ? 'text-[#124E2A]' : 'text-gray-900'
                          }`}
                        >
                          {opt.title}
                        </Text>
                        <Text className="text-[11px] text-gray-600 mt-0.5 leading-tight">
                          {opt.sub}
                        </Text>
                        <View className="mt-1.5 self-start bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                          <Text className="text-[10px] font-bold text-emerald-800">
                            {opt.tag}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              onPress={handleProceedToStep2}
              disabled={isSubmitting}
              activeOpacity={0.85}
              className="w-full bg-[#124E2A] py-4 rounded-2xl items-center justify-center flex-row shadow-sm shadow-[#124E2A]/30 mb-8"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-sm font-black text-white mr-2">
                    Lanjut: Rekomendasi Top 3 AI
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP B: INSTAN REKOMENDASI TOP 3 KOMODITAS */
          <View>
            {/* Banner Step B */}
            <View className="bg-emerald-900 rounded-3xl p-5 mb-5 shadow-sm">
              <View className="flex-row items-center mb-1.5">
                <Sparkles size={16} color="#4ADE80" />
                <Text className="text-xs font-black text-emerald-200 ml-1.5 uppercase tracking-wider">
                  Analisis Cerdas Berhasil
                </Text>
              </View>
              <Text className="text-lg font-black text-white leading-snug">
                Top 3 Komoditas Terbaik untuk Pekarangan Anda
              </Text>
              <Text className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                Dipilih khusus untuk luas {customLuas} m² & paparan {paparanSinar === 'FULL_SUN' ? 'sinar penuh' : paparanSinar === 'PARTIAL_SUN' ? 'sinar parsial' : 'area teduh'}.
              </Text>
            </View>

            <Text className="text-xs font-black text-gray-800 uppercase tracking-wide mb-3">
              Pilih 1 Tanaman Pertama Anda:
            </Text>

            {/* Top 3 Crop Cards */}
            <View style={{ gap: 14 }} className="mb-6">
              {topRecommendations.map((crop, idx) => {
                const isSelected = selectedCrop?.komoditas_id === crop.komoditas_id;
                const isTop1 = idx === 0;

                return (
                  <TouchableOpacity
                    key={crop.komoditas_id}
                    onPress={() => setSelectedCrop(crop)}
                    activeOpacity={0.9}
                    className={`bg-white rounded-3xl overflow-hidden border ${
                      isSelected
                        ? 'border-[#124E2A] border-2 shadow-md shadow-[#124E2A]/15'
                        : 'border-gray-200 shadow-2xs'
                    }`}
                  >
                    <View className="relative h-36 w-full bg-gray-100">
                      <Image
                        source={getCropImageSource(crop.nama, crop.image_url)}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      {isTop1 && (
                        <View className="absolute top-3 left-3 bg-[#124E2A] px-3 py-1 rounded-full flex-row items-center shadow-xs">
                          <Sparkles size={12} color="#FEF08A" />
                          <Text className="text-[11px] font-black text-white ml-1">
                            Pilihan Utama AI
                          </Text>
                        </View>
                      )}
                      <View className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 rounded-full">
                        <Text className="text-[11px] font-bold text-white">
                          Skor {crop.skor_prioritas} / 5.0
                        </Text>
                      </View>
                    </View>

                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-base font-black text-gray-900">
                          {crop.nama}
                        </Text>
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            isSelected
                              ? 'border-[#124E2A] bg-[#124E2A]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between bg-emerald-50/60 p-2.5 rounded-2xl mb-3">
                        <View className="flex-row items-center">
                          <Banknote size={14} color="#166534" />
                          <Text className="text-xs font-bold text-emerald-900 ml-1.5">
                            Hemat Rp {crop.estimasi_hemat_rp_per_bulan?.toLocaleString('id-ID')}/bln
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Clock size={13} color="#166534" />
                          <Text className="text-xs font-bold text-emerald-800 ml-1">
                            Panen {crop.waktu_panen_hari} hari
                          </Text>
                        </View>
                      </View>

                      <Text className="text-[11px] text-gray-500 leading-relaxed mb-1">
                        {crop.panduan_singkat}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Button: Start Planting */}
            <TouchableOpacity
              onPress={handleStartPlanting}
              disabled={isSubmitting || !selectedCrop}
              activeOpacity={0.85}
              className="w-full bg-[#124E2A] py-4 rounded-2xl items-center justify-center flex-row shadow-sm shadow-[#124E2A]/30 mb-8"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Leaf size={18} color="#FFFFFF" />
                  <Text className="text-sm font-black text-white ml-2">
                    Mulai Tanam {selectedCrop?.nama || ''} & Buka Dashboard
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

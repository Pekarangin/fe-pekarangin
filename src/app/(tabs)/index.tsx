import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Leaf,
  Trees,
  Droplets,
  Sprout,
  Circle,
  ChevronRight,
  Sparkles,
  Sun,
  Plus,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { getCropImageSource } from '../../constants/cropImages';
import { fetchLiveWeather, RealWeather } from '../../services/weather';

export default function DashboardHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    stats,
    activeCrops,
    activeLahan,
    toggleAllSiram,
    toggleAllPupuk,
  } = useApp();

  const [weather, setWeather] = useState<RealWeather | null>(null);

  const activeOnlyCrops = activeCrops.filter(c => c.status === 'AKTIF');
  const isSiramDone =
    activeOnlyCrops.length > 0 &&
    activeOnlyCrops.every(c => c.checklist_hari_ini?.siram_done);
  const isPupukDone =
    activeOnlyCrops.length > 0 &&
    activeOnlyCrops.every(c => c.checklist_hari_ini?.pupuk_done);

  // Ambil cuaca real-time berdasarkan lokasi/wilayah user
  useEffect(() => {
    let isMounted = true;
    fetchLiveWeather(user?.wilayah, activeOnlyCrops.length > 0)
      .then(data => {
        if (isMounted) setWeather(data);
      })
      .catch(err => {
        console.warn('Gagal ambil data cuaca:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.wilayah, activeOnlyCrops.length]);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const activeRth = activeLahan?.luas_m2 || stats.rth_aktif_m2;

  const handleToggleSiram = () => {
    if (activeOnlyCrops.length === 0) {
      router.push('/(tabs)/rekomendasi');
      return;
    }
    toggleAllSiram(!isSiramDone);
  };

  const handleTogglePupuk = () => {
    if (activeOnlyCrops.length === 0) {
      router.push('/(tabs)/rekomendasi');
      return;
    }
    toggleAllPupuk(!isPupukDone);
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 16),
      }}
      className="flex-1 bg-[#F6F8F6]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="px-5 pt-1"
      >
        {/* Top Bar: Location & User Profile Avatar */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-2xs max-w-[70%]">
            <View className="w-5 h-5 rounded-full bg-emerald-100 items-center justify-center mr-1.5">
              <MapPin size={12} color="#166534" />
            </View>
            <View>
              <Text className="text-[11px] font-bold text-gray-800" numberOfLines={1}>
                {user?.wilayah || weather?.locationName || 'Lokasi Pekarangan'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }} className="flex-row items-center">
            {/* Real Weather Mini Pill */}
            {weather && (
              <View className="flex-row items-center bg-amber-50/90 border border-amber-200/90 px-2.5 py-1.5 rounded-full">
                <Sun size={12} color="#D97706" />
                <Text className="text-[11px] font-black text-amber-900 ml-1">
                  {weather.temperature}°C
                </Text>
              </View>
            )}

            {/* Profile Avatar Thumbnail */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
              className="w-9 h-9 rounded-full bg-emerald-800 border-2 border-white items-center justify-center shadow-xs overflow-hidden"
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-xs font-black text-white">
                  {user?.nama ? user.nama.charAt(0).toUpperCase() : 'P'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Section */}
        <View className="mb-4">
          <Text className="text-[26px] font-black text-gray-900 tracking-tight">
            Halo, {user?.nama ? user.nama.split(' ')[0] : 'Sobat'} 🌱
          </Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            Pekarangan pangan mandiri Anda siap dipantau hari ini.
          </Text>
        </View>

        {/* Hero Green Stats Card (Modern Deep Emerald) */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.94}
          className="bg-[#124E2A] rounded-3xl p-5 mb-5 shadow-lg shadow-[#124E2A]/25 border border-emerald-700/40 relative overflow-hidden"
        >
          {/* Subtle Decorative Circle Pattern */}
          <View className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
          <View className="absolute right-10 -bottom-16 w-36 h-36 rounded-full bg-emerald-400/10 pointer-events-none" />

          {/* Hero Header */}
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <View className="flex-row items-center mb-1">
                <Text className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  Total Hemat Belanja
                </Text>
                <View className="bg-emerald-500/25 px-2 py-0.5 rounded-full ml-2 border border-emerald-400/30">
                  <Text className="text-[10px] font-extrabold text-emerald-100">
                    Akumulasi Panen
                  </Text>
                </View>
              </View>
              <Text className="text-[34px] font-black text-white tracking-tight">
                {formatRupiah(stats.total_hemat_rp)}
              </Text>
            </View>

            <View className="w-12 h-12 rounded-2xl bg-white/15 items-center justify-center border border-white/20 shadow-inner">
              <Leaf size={24} color="#A7F3D0" fill="#A7F3D0" />
            </View>
          </View>

          {/* Hero Divider */}
          <View className="h-[1px] bg-white/15 my-3.5" />

          {/* 3-Pill Micro Stats Row */}
          <View className="flex-row items-center justify-between">
            {/* RTH Lahan */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lahan')}
              className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-2.5 mr-2 items-center"
            >
              <View className="flex-row items-center mb-0.5">
                <Trees size={13} color="#6EE7B7" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1">
                  Luas RTH
                </Text>
              </View>
              <Text className="text-xs font-black text-white">
                {activeRth || 0} m²
              </Text>
            </TouchableOpacity>

            {/* Total Panen */}
            <View className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-2.5 mr-2 items-center">
              <View className="flex-row items-center mb-0.5">
                <Sprout size={13} color="#FDE047" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1">
                  Hasil Panen
                </Text>
              </View>
              <Text className="text-xs font-black text-white">
                {stats.total_panen_kg} kg
              </Text>
            </View>

            {/* Tanaman Aktif */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tracking')}
              className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-2.5 items-center"
            >
              <View className="flex-row items-center mb-0.5">
                <Sparkles size={13} color="#93C5FD" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1">
                  Tanaman
                </Text>
              </View>
              <Text className="text-xs font-black text-white">
                {activeOnlyCrops.length} Aktif
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Ambient Climate & Solar Advisory Card (Live Real-Time Weather) */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/lahan')}
          activeOpacity={0.88}
          className="bg-amber-50/90 border border-amber-200 rounded-3xl p-4 mb-5 flex-row items-center justify-between shadow-2xs"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-2xl bg-amber-500 items-center justify-center mr-3 shadow-xs">
              <Sun size={20} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-xs font-black text-amber-950">
                  {weather ? `${weather.temperature}°C ${weather.conditionText}` : 'Memuat Cuaca Real-Time...'}
                </Text>
                <View className="bg-amber-200/90 px-1.5 py-0.5 rounded-md ml-2">
                  <Text className="text-[9px] font-extrabold text-amber-900">
                    {weather?.badgeLabel || 'Real-Time'}
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-amber-900/80 font-medium mt-0.5 leading-snug">
                {weather?.advisoryText || 'Memantau iklim dan suhu terkini di pekarangan Anda.'}
              </Text>
              {weather && (
                <Text className="text-[10px] text-amber-800/70 font-semibold mt-1">
                  📍 {weather.locationName} • Kelembapan {weather.humidity}%
                </Text>
              )}
            </View>
          </View>
          <ChevronRight size={16} color="#D97706" />
        </TouchableOpacity>

        {/* Quick Stepper Guide: Alur Panduan Pintar */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-5">
          <View className="flex-row items-center justify-between mb-3.5">
            <View>
              <Text className="text-sm font-black text-gray-900">
                Alur Panduan Pekarangan
              </Text>
              <Text className="text-[11px] font-medium text-gray-500">
                Langkah terpadu panen mandiri berkelanjutan
              </Text>
            </View>
            <Badge label="Smart Loop" variant="success" size="sm" />
          </View>

          <View style={{ gap: 12 }}>
            {/* Step 1: Lahan */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lahan')}
              className="flex-row items-center justify-between p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-emerald-600 items-center justify-center mr-3">
                  <Text className="text-xs font-black text-white">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">Sketsa & Cek Sinar Lahan</Text>
                  <Text className="text-[11px] text-emerald-800 font-medium">
                    {activeLahan ? `${activeLahan.nama_lahan} (${activeRth} m²)` : 'Belum Ada Lahan (Mulai Sketsa)'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#166534" />
            </TouchableOpacity>

            {/* Step 2: Rekomendasi */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rekomendasi')}
              className="flex-row items-center justify-between p-4 rounded-2xl bg-amber-50/50 border border-amber-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-amber-500 items-center justify-center mr-3">
                  <Text className="text-xs font-black text-white">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">Pilih Rekomendasi Komoditas</Text>
                  <Text className="text-[11px] text-gray-500 font-medium">
                    Prioritas ranking AI hemat biaya tertinggi
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D97706" />
            </TouchableOpacity>

            {/* Step 3: Rawat & Panen */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tracking')}
              className="flex-row items-center justify-between p-4 rounded-2xl bg-sky-50/50 border border-sky-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-sky-600 items-center justify-center mr-3">
                  <Text className="text-xs font-black text-white">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">Rawat Harian & Catat Panen</Text>
                  <Text className="text-[11px] text-gray-500 font-medium">
                    Checklist siram, pupuk & realisasi hemat
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#0284C7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Tugas Hari Ini (Interactive Checklist) */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-lg font-black text-gray-900 tracking-tight">
                Tugas Hari Ini
              </Text>
              <Text className="text-[11px] font-medium text-gray-500">
                Aktivitas rutin perawatan pekarangan Anda
              </Text>
            </View>
            {activeOnlyCrops.length > 0 && (
              <View className="bg-emerald-100 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-black text-emerald-900">
                  {(isSiramDone ? 1 : 0) + (isPupukDone ? 1 : 0)}/2 Selesai
                </Text>
              </View>
            )}
          </View>

          {activeOnlyCrops.length === 0 ? (
            <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
              <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center mb-2.5">
                <Droplets size={24} color="#166534" />
              </View>
              <Text className="text-sm font-black text-gray-900 text-center">
                Belum Ada Tugas Perawatan
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1 mb-4 leading-relaxed px-4">
                Jadwal siram dan pemupukan otomatis aktif setelah Anda menambahkan tanaman aktif dari tab rekomendasi.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/rekomendasi')}
                activeOpacity={0.85}
                className="bg-[#124E2A] px-5 py-2.5 rounded-2xl flex-row items-center shadow-xs"
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-white ml-1.5">
                  Tanam Komoditas Sekarang
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 14 }} className="flex-row">
              {/* Task Card 1: Siram Tanaman */}
              <TouchableOpacity
                onPress={handleToggleSiram}
                activeOpacity={0.82}
                className={`flex-1 p-4 rounded-3xl border transition-all ${
                  isSiramDone
                    ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-10 h-10 rounded-2xl bg-orange-100 items-center justify-center">
                    <Droplets size={20} color="#EA580C" />
                  </View>
                  {isSiramDone ? (
                    <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <Circle size={22} color="#D1D5DB" strokeWidth={2} />
                  )}
                </View>

                <Text className="text-sm font-black text-gray-900">
                  Siram Tanaman
                </Text>
                <Text className="text-xs font-semibold text-gray-500 mt-1">
                  {isSiramDone ? 'Sudah disiram ✅' : 'Pagi / Sore'}
                </Text>
              </TouchableOpacity>

              {/* Task Card 2: Beri Pupuk */}
              <TouchableOpacity
                onPress={handleTogglePupuk}
                activeOpacity={0.82}
                className={`flex-1 p-4 rounded-3xl border transition-all ${
                  isPupukDone
                    ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                    : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-10 h-10 rounded-2xl bg-pink-100 items-center justify-center">
                    <Sprout size={20} color="#DB2777" />
                  </View>
                  {isPupukDone ? (
                    <View className="w-6 h-6 rounded-full bg-emerald-600 items-center justify-center">
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <Circle size={22} color="#D1D5DB" strokeWidth={2} />
                  )}
                </View>

                <Text className="text-sm font-black text-gray-900">
                  Beri Pupuk
                </Text>
                <Text className="text-xs font-semibold text-gray-500 mt-1">
                  {isPupukDone ? 'Sudah dipupuk ✅' : 'Sesuai Siklus'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section: Tanaman Saya (Showcase Cards) */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-lg font-black text-gray-900 tracking-tight">
                Tanaman Saya
              </Text>
              <Text className="text-[11px] font-medium text-gray-500">
                Komoditas aktif di pekarangan Anda
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tracking')}
              className="flex-row items-center bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs"
            >
              <Text className="text-xs font-bold text-emerald-800 mr-1">
                Semua ({activeOnlyCrops.length})
              </Text>
              <ChevronRight size={13} color="#166534" />
            </TouchableOpacity>
          </View>

          {/* Plant Cards Grid or Empty State */}
          {activeOnlyCrops.length === 0 ? (
            <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm items-center">
              <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center mb-2.5">
                <Sprout size={24} color="#166534" />
              </View>
              <Text className="text-sm font-black text-gray-900 text-center">
                Belum Ada Tanaman Aktif
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1 mb-4 px-4 leading-relaxed">
                Pilih tanaman dari daftar rekomendasi cerdas sesuai sinar matahari lahan Anda.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/rekomendasi')}
                className="flex-row items-center bg-[#124E2A] px-5 py-2.5 rounded-2xl shadow-xs"
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-white ml-1.5">
                  Pilih Tanaman Rekomendasi
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 14 }} className="flex-row">
              {activeOnlyCrops.slice(0, 2).map((crop) => (
                <TouchableOpacity
                  key={crop.tanaman_aktif_id}
                  onPress={() => router.push('/(tabs)/tracking')}
                  activeOpacity={0.9}
                  className="flex-1 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs"
                >
                  {/* Photo Banner with Badges */}
                  <View className="relative h-32 w-full bg-gray-100">
                    <Image
                      source={getCropImageSource(crop.komoditas_nama, crop.image_url)}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {crop.persentase_hari && crop.persentase_hari >= 70 ? (
                      <View className="absolute top-2.5 right-2.5 bg-amber-500 px-2.5 py-0.5 rounded-full shadow-xs">
                        <Text className="text-[10px] font-black text-white">
                          Siap Panen
                        </Text>
                      </View>
                    ) : (
                      <View className="absolute top-2.5 right-2.5 bg-black/50 px-2.5 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-white">
                          Hari ke-{crop.hari_ke}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Card Details */}
                  <View className="p-4">
                    <Text className="text-base font-black text-gray-900 capitalize" numberOfLines={1}>
                      {crop.komoditas_nama}
                    </Text>

                    {/* Progress Stats */}
                    <View className="flex-row justify-between items-center mt-2 mb-1">
                      <Text className="text-xs font-semibold text-gray-500">
                        {crop.fase || 'Vegetatif'}
                      </Text>
                      <Text className="text-xs font-black text-[#124E2A]">
                        {crop.persentase_hari || 50}%
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                      <View
                        style={{ width: `${crop.persentase_hari || 50}%` }}
                        className="h-full bg-[#124E2A] rounded-full"
                      />
                    </View>

                    <View className="mt-3 flex-row items-center justify-between pt-2 border-t border-gray-100">
                      <Text className="text-[11px] font-bold text-gray-400">
                        Pekarangan
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-xs font-extrabold text-[#124E2A] mr-0.5">
                          Rawat
                        </Text>
                        <ArrowRight size={12} color="#124E2A" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

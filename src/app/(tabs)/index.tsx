import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Leaf,
  Trees,
  Droplets,
  Sprout,
  ChevronRight,
  Sparkles,
  Sun,
  Plus,
  ArrowRight,
  Check,
  ChevronDown,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { getCropImageSource } from '../../constants/cropImages';
import { fetchLiveWeather, RealWeather } from '../../services/weather';
import { PaparanSinar, Lahan } from '../../types';
import { WilayahPickerModal } from '../../components/ui/WilayahPickerModal';
import { DeleteLahanModal } from '../../components/ui/DeleteLahanModal';
import { calculateCropGrowth, groupActiveCrops } from '../../utils/cropProgress';

export default function DashboardHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const {
    user,
    stats,
    lahans,
    activeCrops,
    activeLahan,
    setActiveLahan,
    deleteLahan,
    updateUserProfile,
    toggleChecklistSiram,
    toggleChecklistPupuk,
    toggleAllSiram,
    toggleAllPupuk,
    startTour,
  } = useApp();

  const [weather, setWeather] = useState<RealWeather | null>(null);
  const [isLahanModalOpen, setIsLahanModalOpen] = useState(false);
  const [wilayahModalVisible, setWilayahModalVisible] = useState(false);
  const [lahanToDelete, setLahanToDelete] = useState<Lahan | null>(null);
  const [isDeletingLahan, setIsDeletingLahan] = useState(false);

  const handleConfirmDelete = async () => {
    if (!lahanToDelete) return;
    try {
      setIsDeletingLahan(true);
      await deleteLahan(lahanToDelete.lahan_id);
      setLahanToDelete(null);
      setIsLahanModalOpen(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Gagal Menghapus', err?.message || 'Terjadi kesalahan saat menghapus pekarangan.');
    } finally {
      setIsDeletingLahan(false);
    }
  };

  const handleSelectWilayah = async (formattedWilayah: string) => {
    try {
      await updateUserProfile({ wilayah: formattedWilayah });
    } catch (err) {
      console.warn('Gagal perbarui lokasi wilayah:', err);
    }
  };

  useEffect(() => {
    if (welcome === 'true') {
      startTour();
    }
  }, [welcome, startTour]);

  const formatPaparanSinar = (sinar?: PaparanSinar) => {
    switch (sinar) {
      case 'FULL_SUN':
        return 'Sinar Penuh';
      case 'PARTIAL_SUN':
        return 'Sinar Sebagian';
      case 'SHADE':
        return 'Teduh';
      default:
        return 'Sinar Penuh';
    }
  };

  const activeOnlyCrops = activeCrops.filter(
    c => c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)
  );

  const allSiramDone =
    activeOnlyCrops.length > 0 && activeOnlyCrops.every(c => c.checklist_hari_ini?.siram_done);
  const allPupukDone =
    activeOnlyCrops.length > 0 && activeOnlyCrops.every(c => c.checklist_hari_ini?.pupuk_done);

  const totalTasks = activeOnlyCrops.length > 0 ? 2 : 0;
  const completedTasks = (allSiramDone ? 1 : 0) + (allPupukDone ? 1 : 0);
  const allTasksDone = totalTasks > 0 && completedTasks === totalTasks;

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
          <TouchableOpacity
            onPress={() => setWilayahModalVisible(true)}
            activeOpacity={0.7}
            style={{ flex: 1, marginRight: 10 }}
            className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-2xs"
          >
            <View
              style={{ flexShrink: 0 }}
              className="w-5 h-5 rounded-full bg-emerald-100 items-center justify-center mr-1.5"
            >
              <MapPin size={12} color="#166534" />
            </View>
            <Text
              style={{ flex: 1 }}
              className="text-[11px] font-bold text-gray-800"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.wilayah || weather?.locationName || 'Pilih Lokasi Pekarangan'}
            </Text>
            <ChevronRight size={12} color="#9CA3AF" style={{ marginLeft: 3, flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={{ gap: 8, flexShrink: 0 }} className="flex-row items-center">
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

        {/* Greeting Section with Interactive Feature Tour Button */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-[26px] font-black text-gray-900 tracking-tight">
              Halo, {user?.nama ? user.nama.split(' ')[0] : 'Sobat'} 🌱
            </Text>
            <Text className="text-xs font-semibold text-gray-500 mt-0.5">
              Pekarangan pangan mandiri Anda siap dipantau hari ini.
            </Text>
          </View>

          {/* Quick Trigger: Interactive Feature Tour */}
          <TouchableOpacity
            onPress={startTour}
            activeOpacity={0.8}
            className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-300 shadow-2xs"
          >
            <Sparkles size={13} color="#15803D" />
            <Text className="text-[11px] font-black text-emerald-800 ml-1">
              Tur Fitur
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pekarangan Header / Switcher Card */}
        <View className="mb-5">
          {activeLahan ? (
            <View className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-sm shadow-emerald-950/5">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setIsLahanModalOpen(true)}
                  activeOpacity={0.8}
                  className="flex-row items-center flex-1 mr-3"
                >
                  <View className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center mr-3 flex-shrink-0">
                    <Trees size={20} color="#166534" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center">
                      <Text
                        numberOfLines={1}
                        className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex-shrink-0"
                      >
                        Pekarangan Aktif
                      </Text>
                      {lahans.length > 1 && (
                        <View className="bg-emerald-100 px-1.5 py-0.5 rounded-full ml-1.5 flex-shrink-0">
                          <Text className="text-[9px] font-bold text-emerald-800">
                            {lahans.length} Lahan
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center mt-0.5">
                      <Text
                        style={{ flexShrink: 1 }}
                        className="text-sm font-black text-gray-900 mr-1"
                        numberOfLines={1}
                      >
                        🌱 {activeLahan.nama_lahan}
                      </Text>
                      <ChevronDown size={14} color="#6B7280" style={{ flexShrink: 0 }} />
                    </View>
                    <Text className="text-[11px] font-medium text-gray-500 mt-0.5" numberOfLines={1}>
                      {activeLahan.luas_m2} m² • {formatPaparanSinar(activeLahan.paparan_sinar)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/lahan')}
                  activeOpacity={0.8}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 items-center justify-center flex-shrink-0"
                >
                  <Text className="text-xs font-bold text-[#166534]">
                    Ubah
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/wizard-setup' as any)}
              activeOpacity={0.9}
              className="bg-emerald-900 rounded-3xl p-5 border border-emerald-700/60 shadow-md shadow-emerald-950/20 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <Sparkles size={14} color="#4ADE80" />
                  <Text className="text-xs font-black text-emerald-200 ml-1.5 uppercase tracking-wide">
                    Setup Pekarangan Pertama
                  </Text>
                </View>
                <Text className="text-base font-black text-white">
                  Mulai Sketsa Lahan & Tentukan Sinar
                </Text>
                <Text className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                  Tentukan ukuran pekarangan dan sinar matahari untuk mengaktifkan rekomendasi AI dan checklist harian.
                </Text>
              </View>
              <View className="w-10 h-10 rounded-2xl bg-emerald-500 items-center justify-center shadow-xs">
                <Plus size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
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
            <View className="flex-1 mr-2">
              <View className="flex-row flex-wrap items-center gap-1.5 mb-1">
                <Text className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">
                  Total Hemat Belanja
                </Text>
                <View className="bg-emerald-500/25 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <Text className="text-[9px] font-extrabold text-emerald-100">
                    Akumulasi Panen
                  </Text>
                </View>
              </View>
              <Text className="text-[32px] font-black text-white tracking-tight" numberOfLines={1}>
                {formatRupiah(stats.total_hemat_rp)}
              </Text>
            </View>

            <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center border border-white/20 shadow-inner">
              <Leaf size={22} color="#A7F3D0" fill="#A7F3D0" />
            </View>
          </View>

          {/* Hero Divider */}
          <View className="h-[1px] bg-white/15 my-3" />

          {/* 3-Pill Micro Stats Row */}
          <View className="flex-row items-center justify-between gap-2">
            {/* RTH Lahan */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lahan')}
              className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-1.5 items-center justify-center min-w-0"
            >
              <View className="flex-row items-center mb-0.5">
                <Trees size={12} color="#6EE7B7" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1" numberOfLines={1}>
                  Lahan RTH
                </Text>
              </View>
              <Text className="text-xs font-black text-white" numberOfLines={1}>
                {activeLahan ? `${activeLahan.luas_m2} m²` : `${stats.rth_aktif_m2 || 0} m²`}
              </Text>
            </TouchableOpacity>

            {/* Total Panen */}
            <View className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-1.5 items-center justify-center min-w-0">
              <View className="flex-row items-center mb-0.5">
                <Sprout size={12} color="#FDE047" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1" numberOfLines={1}>
                  Panen
                </Text>
              </View>
              <Text className="text-xs font-black text-white" numberOfLines={1}>
                {stats.total_panen_kg} kg
              </Text>
            </View>

            {/* Tanaman Aktif */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tracking')}
              className="flex-1 bg-black/15 border border-white/10 rounded-2xl py-2 px-1.5 items-center justify-center min-w-0"
            >
              <View className="flex-row items-center mb-0.5">
                <Sparkles size={12} color="#93C5FD" />
                <Text className="text-[10px] font-bold text-emerald-200 ml-1" numberOfLines={1}>
                  Tanaman
                </Text>
              </View>
              <Text className="text-xs font-black text-white" numberOfLines={1}>
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
            <View className="flex-1 mr-2">
              <Text className="text-sm font-black text-gray-900">
                Alur Panduan Pekarangan
              </Text>
              <Text className="text-[11px] font-medium text-gray-500 mt-0.5" numberOfLines={1}>
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
                    {activeLahan ? `${activeLahan.nama_lahan} (${activeLahan.luas_m2} m²)` : 'Belum Ada Lahan (Mulai Sketsa)'}
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

        {/* Section: Tugas Hari Ini (Perawatan Pekarangan Serentak) */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center flex-wrap gap-2">
                <Text className="text-lg font-black text-gray-900 tracking-tight">
                  Tugas Hari Ini
                </Text>
                {activeOnlyCrops.length > 0 && (
                  <View
                    className={`px-2.5 py-0.5 rounded-full ${
                      allTasksDone
                        ? 'bg-emerald-100 border border-emerald-200'
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black ${
                        allTasksDone ? 'text-emerald-900' : 'text-gray-600'
                      }`}
                    >
                      {allTasksDone ? 'Semua Tuntas ✨' : `${completedTasks}/${totalTasks} Selesai`}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-[11px] font-medium text-gray-500 mt-0.5">
                {activeOnlyCrops.length > 1
                  ? `Perawatan serentak untuk ${activeOnlyCrops.length} tanaman pekarangan`
                  : 'Aktivitas rutin perawatan pekarangan Anda'}
              </Text>
            </View>
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
            <View className="bg-white rounded-3xl p-4 border border-emerald-100/60 shadow-xs mb-2.5">
              {/* Pekarangan Info Row */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 mr-2 min-w-0">
                  <View className="w-10 h-10 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 items-center justify-center mr-3 flex-shrink-0">
                    <Droplets size={20} color="#166534" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-black text-gray-900" numberOfLines={1}>
                      {activeLahan ? activeLahan.nama_lahan : 'Pekarangan Anda'}
                    </Text>
                    <Text className="text-[11px] font-semibold text-gray-500 mt-0.5" numberOfLines={1}>
                      {activeOnlyCrops.length > 1
                        ? `${activeOnlyCrops.length} Tanaman • Siram & rawat sekaligus`
                        : `${activeOnlyCrops[0]?.komoditas_nama} • Rawat harian`}
                    </Text>
                  </View>
                </View>

                {/* Status Pill */}
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    allTasksDone
                      ? 'bg-emerald-100'
                      : completedTasks > 0
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-black ${
                      allTasksDone
                        ? 'text-emerald-900'
                        : completedTasks > 0
                        ? 'text-amber-800'
                        : 'text-gray-500'
                    }`}
                  >
                    {allTasksDone ? 'Tuntas ✨' : `${completedTasks}/2 Selesai`}
                  </Text>
                </View>
              </View>

              {/* Action Checklist Tiles (Siram & Pupuk serentak) */}
              <View className="flex-row gap-2">
                {/* Siram Button */}
                <TouchableOpacity
                  onPress={() => toggleAllSiram()}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-3 rounded-2xl border flex-row items-center justify-between ${
                    allSiramDone
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <View
                      className={`w-4 h-4 rounded-md items-center justify-center mr-1.5 ${
                        allSiramDone ? 'bg-[#166534]' : 'border border-gray-400 bg-white'
                      }`}
                    >
                      {allSiramDone && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      numberOfLines={1}
                      className={`text-xs ${
                        allSiramDone ? 'text-emerald-900 font-black' : 'text-gray-800 font-bold'
                      }`}
                    >
                      {allSiramDone
                        ? (activeOnlyCrops.length > 1 ? 'Semua Disiram' : 'Sudah Disiram')
                        : (activeOnlyCrops.length > 1 ? 'Siram Semua' : 'Siram')}
                    </Text>
                  </View>
                  <Text className="text-xs">💧</Text>
                </TouchableOpacity>

                {/* Pupuk Button */}
                <TouchableOpacity
                  onPress={() => toggleAllPupuk()}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-3 rounded-2xl border flex-row items-center justify-between ${
                    allPupukDone
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <View
                      className={`w-4 h-4 rounded-md items-center justify-center mr-1.5 ${
                        allPupukDone ? 'bg-[#166534]' : 'border border-gray-400 bg-white'
                      }`}
                    >
                      {allPupukDone && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      numberOfLines={1}
                      className={`text-xs ${
                        allPupukDone ? 'text-emerald-900 font-black' : 'text-gray-800 font-bold'
                      }`}
                    >
                      {allPupukDone
                        ? (activeOnlyCrops.length > 1 ? 'Semua Dipupuk' : 'Sudah Dipupuk')
                        : (activeOnlyCrops.length > 1 ? 'Pupuk Semua' : 'Pupuk')}
                    </Text>
                  </View>
                  <Text className="text-xs">🌿</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Section: Tanaman Saya (Showcase Card) */}
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
                {activeOnlyCrops.length > 1
                  ? `Semua (${activeOnlyCrops.length})`
                  : 'Detail Tracking'}
              </Text>
              <ChevronRight size={13} color="#166534" />
            </TouchableOpacity>
          </View>

          {/* Plant Card or Empty State */}
          {(() => {
            const groupedCrops = groupActiveCrops(activeOnlyCrops);

            if (groupedCrops.length === 0) {
              return (
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
              );
            }

            const featured = groupedCrops[0];
            const growth = featured.growth;

            return (
              <TouchableOpacity
                key={featured.group_id}
                onPress={() => router.push('/(tabs)/tracking')}
                activeOpacity={0.9}
                className="bg-white rounded-3xl overflow-hidden border border-emerald-100/60 shadow-xs"
              >
                {/* Photo Banner with Badges */}
                <View className="relative h-40 w-full bg-gray-100">
                  <Image
                    source={getCropImageSource(featured.komoditas_nama, featured.image_url)}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                    <Text className="text-[11px] font-bold text-white">
                      Hari ke-{growth.currentDay}
                    </Text>
                  </View>
                  <View className="absolute top-3 right-3 bg-emerald-700 px-2.5 py-1 rounded-full">
                    <Text className="text-[11px] font-bold text-white">
                      {growth.fase}
                    </Text>
                  </View>
                </View>

                {/* Card Details */}
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center flex-1 mr-2 flex-wrap gap-1.5">
                      <Text className="text-base font-black text-gray-900 capitalize" numberOfLines={1}>
                        {featured.komoditas_nama}
                      </Text>
                      {featured.count > 1 && (
                        <View className="bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Text className="text-[10px] font-black text-emerald-800">
                            {featured.count} Tanaman ({featured.luas_m2} m²)
                          </Text>
                        </View>
                      )}
                    </View>

                    {groupedCrops.length > 1 && (
                      <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-gray-600">
                          +{groupedCrops.length - 1} Jenis Lainnya
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Harvest Progress Stats */}
                  <View className="flex-row justify-between items-center mt-2 mb-1.5">
                    <View className="flex-row items-center">
                      <Text className="text-[11px] font-semibold text-gray-500 mr-2">
                        Progres Panen
                      </Text>
                      <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-800">
                          {growth.kondisiText}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-[#124E2A]">
                      {growth.progressPercent}%
                    </Text>
                  </View>

                  {/* Harvest Progress Bar */}
                  <View className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <View
                      style={{ width: `${growth.progressPercent}%` }}
                      className="h-full rounded-full bg-[#124E2A]"
                    />
                  </View>

                  <View className="mt-3.5 flex-row items-center justify-between pt-2.5 border-t border-gray-100">
                    <Text className="text-xs font-bold text-gray-500">
                      {growth.sisaHari > 0 ? `Estimasi panen ~${growth.sisaHari} hari lagi` : 'Tanaman siap panen! 🧺'}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs font-black text-[#124E2A] mr-1">
                        Buka Tracking
                      </Text>
                      <ArrowRight size={13} color="#124E2A" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })()}
        </View>
      </ScrollView>

      {/* Pekarangan Switcher Bottom Sheet Modal */}
      <Modal
        visible={isLahanModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLahanModalOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1"
            onPress={() => setIsLahanModalOpen(false)}
          />
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <View className="flex-row items-center flex-1 mr-2 min-w-0">
                <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-2.5 flex-shrink-0">
                  <Trees size={16} color="#1C7430" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-black text-gray-900" numberOfLines={1}>
                    Pilih Pekarangan
                  </Text>
                  <Text className="text-[11px] font-medium text-gray-500" numberOfLines={1}>
                    Kelola dan tinjau pekarangan aktif Anda
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsLahanModalOpen(false)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center flex-shrink-0"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* List Lahans */}
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {lahans.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-xs font-semibold text-gray-400">
                    Belum ada pekarangan terdaftar
                  </Text>
                </View>
              ) : (
                <View className="space-y-2.5">
                  {lahans.map(lahan => {
                    const isActive = activeLahan?.lahan_id === lahan.lahan_id;
                    const countInThisLahan = activeCrops.filter(
                      c => c.lahan_id === lahan.lahan_id && c.status === 'AKTIF'
                    ).length;
                    const isUnused = countInThisLahan === 0;

                    return (
                      <View
                        key={lahan.lahan_id}
                        className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-500'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setActiveLahan(lahan);
                            setIsLahanModalOpen(false);
                          }}
                          activeOpacity={0.7}
                          className="flex-1 mr-2"
                        >
                          <View className="flex-row items-center">
                            <Text className="text-sm font-black text-gray-900" numberOfLines={1}>
                              🌱 {lahan.nama_lahan}
                            </Text>
                            {isActive && (
                              <View className="bg-[#1C7430] px-2 py-0.5 rounded-full ml-2">
                                <Text className="text-[9px] font-bold text-white">
                                  Aktif
                                </Text>
                              </View>
                            )}
                            {isUnused && (
                              <View className="bg-gray-200 px-2 py-0.5 rounded-full ml-1.5">
                                <Text className="text-[9px] font-bold text-gray-600">
                                  Kosong
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs text-gray-500 mt-0.5 font-medium">
                            {lahan.luas_m2} m² • {formatPaparanSinar(lahan.paparan_sinar)} • {isUnused ? 'Belum Digunakan' : `${countInThisLahan} Tanaman Dirawat`}
                          </Text>
                        </TouchableOpacity>

                        <View className="flex-row items-center">
                          {isActive && (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveLahan(lahan);
                                setIsLahanModalOpen(false);
                              }}
                              className="mr-1"
                            >
                              <CheckCircle2 size={18} color="#1C7430" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => setLahanToDelete(lahan)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            activeOpacity={0.7}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 items-center justify-center border border-red-200 ml-2 flex-row"
                          >
                            <Trash2 size={12} color="#DC2626" />
                            <Text className="text-[10px] font-bold text-red-600 ml-1">
                              Hapus
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Action Button */}
            <TouchableOpacity
              onPress={() => {
                setIsLahanModalOpen(false);
                router.push('/(tabs)/lahan');
              }}
              activeOpacity={0.85}
              className="w-full bg-[#1C7430] py-3 rounded-2xl items-center justify-center flex-row shadow-sm shadow-[#1C7430]/20"
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-xs font-black text-white ml-1.5">
                Tambah / Kelola Pekarangan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Konfirmasi Hapus Pekarangan (Card) */}
      <DeleteLahanModal
        visible={Boolean(lahanToDelete)}
        lahan={lahanToDelete}
        cropCount={
          lahanToDelete
            ? activeCrops.filter(
                c => c.lahan_id === lahanToDelete.lahan_id && c.status === 'AKTIF'
              ).length
            : 0
        }
        isDeleting={isDeletingLahan}
        onClose={() => setLahanToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal: Ubah Lokasi Wilayah Pekarangan */}
      <WilayahPickerModal
        visible={wilayahModalVisible}
        onClose={() => setWilayahModalVisible(false)}
        onSelectWilayah={handleSelectWilayah}
      />
    </View>
  );
}

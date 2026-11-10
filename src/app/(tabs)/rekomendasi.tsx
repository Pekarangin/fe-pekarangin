import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Calendar,
  Banknote,
  Maximize2,
  Plus,
  Minus,
  CheckCircle2,
  TrendingUp,
  Sun,
  ChevronRight,
  ChevronDown,
  Droplets,
  Sprout,
  Trees,
  X,
  BookOpen,
  WifiOff,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react-native';
import { useApp, formatScore } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RekomendasiItem } from '../../types';
import { getCropImageSource } from '../../constants/cropImages';
import { DeleteLahanModal } from '../../components/ui/DeleteLahanModal';

export default function RekomendasiTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    lahans,
    activeLahan,
    setActiveLahan,
    rekomendasiList,
    addTanamanAktif,
    activeCrops,
    isLoadingRekomendasi,
    rekomendasiError,
    refreshRekomendasi,
    deleteLahan,
  } = useApp();

  const [lahanToDelete, setLahanToDelete] = useState<any | null>(null);
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
      const errMsg = err?.message || 'Terjadi kesalahan saat menghapus pekarangan.';
      if (Platform.OS === 'web') {
        window.alert(`Gagal Menghapus: ${errMsg}`);
      } else {
        Alert.alert('Gagal Menghapus', errMsg);
      }
    } finally {
      setIsDeletingLahan(false);
    }
  };

  const [isLahanModalOpen, setIsLahanModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MUDAH' | 'SEDANG'>('ALL');
  const [plantingId, setPlantingId] = useState<string | null>(null);
  const [plantedSuccessId, setPlantedSuccessId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<RekomendasiItem | null>(null);
  const [showNoLahanModal, setShowNoLahanModal] = useState(false);
  const [showLahanPenuhModal, setShowLahanPenuhModal] = useState(false);
  const [warningLahanModalItem, setWarningLahanModalItem] = useState<RekomendasiItem | null>(null);
  const [plantQuantityModalItem, setPlantQuantityModalItem] = useState<RekomendasiItem | null>(null);
  const [plantQuantity, setPlantQuantity] = useState<number>(1);

  // Perhitungan luas lahan yang digunakan oleh tanaman yang sedang dirawat
  const activeCropsInLahan = activeCrops.filter(
    c => c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)
  );
  const usedAreaM2 = activeCropsInLahan.reduce(
    (sum, c) => sum + (c.luas_dibutuhkan_m2 || 0.25),
    0
  );
  const totalAreaM2 = Number(activeLahan?.luas_m2) || 0;
  const remainingAreaM2 = Math.max(0, Number((totalAreaM2 - usedAreaM2).toFixed(2)));
  const capacityPercent = totalAreaM2 > 0 ? Math.min(100, Math.round((usedAreaM2 / totalAreaM2) * 100)) : 0;

  const filteredList = rekomendasiList.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.tingkat_kesulitan === selectedCategory;
  });

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const formatSunlightName = (val?: string) => {
    switch (val) {
      case 'FULL_SUN':
        return 'Sinar Penuh';
      case 'PARTIAL_SUN':
        return 'Sinar Parsial';
      case 'SHADE':
        return 'Teduh';
      default:
        return val || '-';
    }
  };

  const getTanamanKebutuhanSinar = (item?: RekomendasiItem | null): string => {
    if (item?.kebutuhan_sinar) return item.kebutuhan_sinar;
    const name = item?.nama?.toLowerCase() || '';
    if (
      name.includes('bayam') ||
      name.includes('kangkung') ||
      name.includes('sawi') ||
      name.includes('selada') ||
      name.includes('kemangi') ||
      name.includes('daun bawang') ||
      name.includes('seledri') ||
      name.includes('jahe') ||
      name.includes('kunyit')
    ) {
      return 'PARTIAL_SUN';
    }
    if (name.includes('mint')) {
      return 'SHADE';
    }
    return 'FULL_SUN';
  };

  const getUnsuitabilityReasons = (item: RekomendasiItem) => {
    if (!activeLahan) return [];
    const reasons: { title: string; detail: string; isDanger: boolean }[] = [];
    const cropSinar = getTanamanKebutuhanSinar(item);
    const lahanSinar = activeLahan.paparan_sinar;
    const luasMin = Number(item.luas_dibutuhkan_m2) || 0.25;
    const totalLuas = Number(activeLahan.luas_m2) || 0;

    // 1. Alasan Cahaya (Hanya jika tidak cocok atau kurang cocok)
    if (item.kesesuaian_sinar === 'TIDAK_COCOK' || (lahanSinar === 'SHADE' && cropSinar === 'FULL_SUN')) {
      if (lahanSinar === 'SHADE' && cropSinar === 'FULL_SUN') {
        reasons.push({
          title: 'Kekurangan Cahaya (Teduh)',
          detail: `Pekarangan teduh (<3 jam sinar/hari), sedangkan ${item.nama} butuh sinar penuh (>6 jam/hari).`,
          isDanger: true,
        });
      } else if (lahanSinar === 'FULL_SUN' && cropSinar === 'SHADE') {
        reasons.push({
          title: 'Cahaya Terlalu Terik',
          detail: `Pekarangan sangat terik (>6 jam sinar/hari), sedangkan daun ${item.nama} mudah terbakar panas.`,
          isDanger: true,
        });
      } else {
        reasons.push({
          title: 'Paparan Sinar Tidak Cocok',
          detail: `Kebutuhan ${item.nama} (${formatSunlightName(cropSinar)}) tidak cocok dengan profil pekarangan Anda (${formatSunlightName(lahanSinar)}).`,
          isDanger: true,
        });
      }
    } else if (item.kesesuaian_sinar === 'KURANG_COCOK' && cropSinar !== lahanSinar) {
      if (lahanSinar === 'PARTIAL_SUN' && cropSinar === 'FULL_SUN') {
        reasons.push({
          title: 'Intensitas Sinar Kurang Maksimal',
          detail: `Pekarangan terpapar 3-6 jam sinar. Tanaman ${item.nama} tetap tumbuh namun hasil panen lebih maksimal di >6 jam sinar.`,
          isDanger: false,
        });
      } else if (lahanSinar === 'SHADE' && cropSinar === 'PARTIAL_SUN') {
        reasons.push({
          title: 'Pekarangan Kurang Sinar',
          detail: `Lahan terlalu teduh (<3 jam). ${item.nama} membutuhkan minimal sinar matahari pagi/parsial (3-6 jam).`,
          isDanger: false,
        });
      } else {
        reasons.push({
          title: 'Sinar Matahari Belum Optimal',
          detail: `Kondisi sinar ${formatSunlightName(lahanSinar)} menghasilkan pertumbuhan lebih lambat dibanding ${formatSunlightName(cropSinar)}.`,
          isDanger: false,
        });
      }
    }

    // 2. Alasan Luas Lahan Fisik
    if (totalLuas < luasMin) {
      reasons.push({
        title: 'Ukuran Pekarangan Terlalu Sempit',
        detail: `Total luas pekarangan (${totalLuas} m²) lebih kecil dari syarat ruang tumbuh ${item.nama} (${luasMin} m² per polybag/lubang).`,
        isDanger: true,
      });
    }

    return reasons;
  };

  const isLahanKurang = (item: RekomendasiItem) => {
    if (!activeLahan) return false;
    return getUnsuitabilityReasons(item).length > 0;
  };

  const handleOpenPlantModal = (item: RekomendasiItem) => {
    if (!activeLahan) {
      setShowNoLahanModal(true);
      return;
    }
    if (remainingAreaM2 <= 0) {
      setShowLahanPenuhModal(true);
      return;
    }

    const luasPerTanaman = Number(item.luas_dibutuhkan_m2) || 0.25;
    const maxFitting = Math.floor(remainingAreaM2 / luasPerTanaman);
    setPlantQuantity(maxFitting > 0 ? 1 : 1);
    setPlantQuantityModalItem(item);
  };

  const handlePlant = (item: RekomendasiItem, force: boolean = false) => {
    if (!activeLahan) {
      setShowNoLahanModal(true);
      return;
    }
    if (remainingAreaM2 <= 0) {
      setShowLahanPenuhModal(true);
      return;
    }

    if (!force && isLahanKurang(item)) {
      setWarningLahanModalItem(item);
      return;
    }

    handleOpenPlantModal(item);
  };

  const handleConfirmPlantQuantity = async () => {
    if (!plantQuantityModalItem || !activeLahan) return;
    const item = plantQuantityModalItem;
    const luasPerTanaman = Number(item.luas_dibutuhkan_m2) || 0.25;
    const requiredArea = plantQuantity * luasPerTanaman;

    if (requiredArea > remainingAreaM2) {
      Alert.alert(
        'Kapasitas Lahan Kurang',
        `Jumlah ${plantQuantity} tanaman membutuhkan luas ${requiredArea.toFixed(2)} m², sedangkan sisa lahan yang tersedia hanya ${remainingAreaM2.toFixed(2)} m². Kurangi jumlah tanaman.`,
        [{ text: 'Perbaiki' }]
      );
      return;
    }

    setPlantingId(item.komoditas_id);
    try {
      await addTanamanAktif(item.komoditas_id, item.nama, plantQuantity, luasPerTanaman);
      setPlantedSuccessId(item.komoditas_id);
      setPlantQuantityModalItem(null);
      if (selectedDetailItem?.komoditas_id === item.komoditas_id) {
        setSelectedDetailItem(null);
      }
      if (warningLahanModalItem?.komoditas_id === item.komoditas_id) {
        setWarningLahanModalItem(null);
      }
      setTimeout(() => {
        setPlantedSuccessId(null);
      }, 3000);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Gagal Menanam', e?.message || 'Terjadi kesalahan saat memulai penanaman.');
    } finally {
      setPlantingId(null);
    }
  };

  const isAlreadyPlanted = (komoditasId: string) => {
    return activeCrops.some(
      c =>
        c.komoditas_id === komoditasId &&
        c.status === 'AKTIF' &&
        (!activeLahan || c.lahan_id === activeLahan.lahan_id)
    );
  };

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 16),
      }}
      className="flex-1 bg-[#F8FAF8]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="px-5 pt-1"
        refreshControl={
          <RefreshControl
            refreshing={isLoadingRekomendasi}
            onRefresh={refreshRekomendasi}
            colors={['#1C7430']}
            tintColor="#1C7430"
          />
        }
      >
        {/* Screen Header */}
        <View className="flex-row items-center mb-4">
          <Sparkles size={20} color="#1C7430" />
          <Text className="text-sm font-bold text-[#1C7430] ml-2">
            Rekomendasi Tanaman
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-2xl font-black text-gray-900 tracking-tight">
            Pilihan Tanaman Terbaik
          </Text>
          <Text className="text-sm font-medium text-gray-500 mt-1">
            Daftar komoditas paling menguntungkan sesuai luas dan paparan sinar lahan Anda.
          </Text>
        </View>

        {/* Lahan Context Pill with Switcher */}
        <View className="bg-[#E8F5E9] border border-green-200/80 px-4 py-3 rounded-2xl mb-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setIsLahanModalOpen(true)}
            activeOpacity={0.7}
            className="flex-row items-center flex-1 mr-2"
          >
            <Sun size={16} color="#1C7430" />
            <View className="ml-2 flex-1">
              <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Lahan Aktif
              </Text>
              <Text className="text-xs font-black text-gray-900" numberOfLines={1}>
                {activeLahan
                  ? `${activeLahan.nama_lahan} (${activeLahan.luas_m2} m² • ${
                      activeLahan.paparan_sinar === 'FULL_SUN'
                        ? 'Sinar Penuh'
                        : activeLahan.paparan_sinar === 'PARTIAL_SUN'
                        ? 'Sinar Parsial'
                        : 'Teduh'
                    })`
                  : 'Belum Ada Lahan Terdaftar'}
              </Text>
            </View>
            <ChevronDown size={14} color="#1C7430" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/lahan')}
            activeOpacity={0.8}
            className="px-3 py-1.5 bg-[#1C7430] rounded-xl"
          >
            <Text className="text-[11px] font-bold text-white">
              {activeLahan ? 'Ubah' : 'Buat Lahan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lahan Capacity & Usage Indicator Banner */}
        {activeLahan && (
          <View className="bg-white border border-emerald-100/90 rounded-2xl p-3.5 mb-4 shadow-2xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1 mr-2 min-w-0">
                <Trees size={15} color="#166534" />
                <Text className="text-xs font-black text-gray-900 ml-1.5" numberOfLines={1}>
                  Kapasitas Pekarangan
                </Text>
              </View>
              <View className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 flex-shrink-0">
                <Text className="text-[10px] font-extrabold text-emerald-800">
                  {activeCropsInLahan.length} Tanaman
                </Text>
              </View>
            </View>

            {/* Progress track */}
            <View className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <View
                style={{ width: `${capacityPercent}%` }}
                className={`h-full rounded-full ${
                  remainingAreaM2 <= 0
                    ? 'bg-red-600'
                    : capacityPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-[#1C7430]'
                }`}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-semibold text-gray-600">
                Terpakai: <Text className="font-black text-gray-900">{usedAreaM2.toFixed(2)}</Text> / {totalAreaM2} m²
              </Text>
              <View
                className={`px-2 py-0.5 rounded-md flex-shrink-0 ${
                  remainingAreaM2 <= 0
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    remainingAreaM2 <= 0 ? 'text-red-700' : 'text-emerald-800'
                  }`}
                >
                  {remainingAreaM2 <= 0
                    ? 'Kapasitas Penuh ⚠️'
                    : `Sisa ${remainingAreaM2.toFixed(2)} m² (${capacityPercent}%)`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!activeLahan && (
          <View className="bg-amber-50 border border-amber-200/70 p-3.5 rounded-2xl mb-4 flex-row items-start">
            <Sparkles size={16} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
            <View className="flex-1">
              <Text className="text-xs font-bold text-amber-900">
                Menampilkan Katalog Komoditas API
              </Text>
              <Text className="text-[11px] text-amber-800 mt-0.5 leading-tight">
                Buat sketsa lahan di tab Lahan agar AI Pekarang dapat menghitung ranking prioritas & estimasi hemat khusus kondisi pekarangan Anda.
              </Text>
            </View>
          </View>
        )}

        {rekomendasiError && filteredList.length > 0 && (
          <View className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <AlertCircle size={16} color="#D97706" />
              <Text className="text-xs text-amber-800 ml-2 flex-1" numberOfLines={2}>
                Koneksi server terganggu. Menampilkan data tersimpan.
              </Text>
            </View>
            <TouchableOpacity onPress={refreshRekomendasi} className="px-2.5 py-1 bg-amber-600 rounded-lg">
              <Text className="text-[11px] font-bold text-white">Muat Ulang</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5 -mx-1"
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-full mr-2 border ${
              selectedCategory === 'ALL'
                ? 'bg-[#1C7430] border-[#1C7430]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedCategory === 'ALL' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Semua Tanaman
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedCategory('MUDAH')}
            className={`px-4 py-2 rounded-full mr-2 border ${
              selectedCategory === 'MUDAH'
                ? 'bg-[#1C7430] border-[#1C7430]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedCategory === 'MUDAH' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Tingkat: Mudah / Pemula
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedCategory('SEDANG')}
            className={`px-4 py-2 rounded-full mr-2 border ${
              selectedCategory === 'SEDANG'
                ? 'bg-[#1C7430] border-[#1C7430]'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedCategory === 'SEDANG' ? 'text-white' : 'text-gray-600'
              }`}
            >
              Tingkat: Menengah
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recommendations List */}
        {isLoadingRekomendasi && filteredList.length === 0 ? (
          <View className="py-16 items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-xs px-6 my-2">
            <View className="w-14 h-14 rounded-2xl bg-green-50 items-center justify-center mb-4">
              <ActivityIndicator size="small" color="#1C7430" />
            </View>
            <Text className="text-base font-bold text-gray-900 text-center">
              Menghitung Rekomendasi...
            </Text>
            <Text className="text-xs text-gray-500 mt-1.5 text-center leading-relaxed max-w-xs">
              Menganalisis kecocokan tanaman dengan luas pekarangan dan harga pasar terkini.
            </Text>
          </View>
        ) : rekomendasiError && filteredList.length === 0 ? (
          <View className="py-14 px-6 items-center justify-center bg-white rounded-3xl border border-red-100 shadow-xs my-2">
            <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
              <WifiOff size={28} color="#DC2626" />
            </View>
            <Text className="text-base font-black text-gray-900 text-center">
              Gagal Memuat Rekomendasi
            </Text>
            <Text className="text-xs text-gray-500 mt-2 text-center leading-relaxed max-w-xs">
              Tidak dapat terhubung ke server backend. Periksa koneksi internet Anda atau coba muat ulang data.
            </Text>
            <TouchableOpacity
              onPress={refreshRekomendasi}
              activeOpacity={0.85}
              className="mt-6 flex-row items-center bg-[#1C7430] px-5 py-3 rounded-2xl shadow-sm shadow-[#1C7430]/25"
            >
              <RefreshCw size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-2">
                Coba Muat Ulang
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredList.length === 0 ? (
          <View className="py-14 px-6 items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-xs my-2">
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
              <Sprout size={28} color="#1C7430" />
            </View>
            <Text className="text-base font-black text-gray-900 text-center">
              {selectedCategory !== 'ALL'
                ? 'Tidak Ada Tanaman di Kategori Ini'
                : 'Belum Ada Rekomendasi Tersedia'}
            </Text>
            <Text className="text-xs text-gray-500 mt-2 text-center leading-relaxed max-w-xs">
              {selectedCategory !== 'ALL'
                ? 'Coba pilih kategori filter lain untuk melihat komoditas tanaman.'
                : 'Belum ada data tanaman yang cocok dengan profil lahan Anda saat ini.'}
            </Text>
            {selectedCategory !== 'ALL' ? (
              <TouchableOpacity
                onPress={() => setSelectedCategory('ALL')}
                activeOpacity={0.85}
                className="mt-5 bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl"
              >
                <Text className="text-xs font-bold text-[#1C7430]">
                  Tampilkan Semua Tanaman
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={refreshRekomendasi}
                activeOpacity={0.85}
                className="mt-5 flex-row items-center bg-[#1C7430] px-4 py-2.5 rounded-xl"
              >
                <RefreshCw size={14} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white ml-2">
                  Segarkan Data
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="space-y-4">
          {filteredList.map((item, index) => {
            const alreadyPlanted = isAlreadyPlanted(item.komoditas_id);
            const isJustPlanted = plantedSuccessId === item.komoditas_id;
            const isTopPick = index === 0 && selectedCategory === 'ALL' && getUnsuitabilityReasons(item).length === 0;

            return (
              <View
                key={item.komoditas_id}
                className={`bg-white rounded-3xl overflow-hidden border shadow-sm shadow-black/5 ${
                  isTopPick
                    ? 'border-[#1C7430] border-2 shadow-md shadow-[#1C7430]/15'
                    : 'border-gray-100'
                }`}
              >
                {/* Photo Banner with Tap to View Details */}
                <TouchableOpacity
                  onPress={() => setSelectedDetailItem(item)}
                  activeOpacity={0.9}
                  className="relative h-44 w-full bg-gray-100"
                >
                  <Image
                    source={getCropImageSource(item.nama, item.image_url)}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {/* Top Badges Header */}
                  <View className="absolute top-3 left-3 right-3 flex-row items-center justify-between">
                    {isTopPick ? (
                      <View className="bg-[#1C7430] px-2.5 py-1 rounded-full flex-row items-center shadow-md">
                        <Sparkles size={12} color="#FEF08A" />
                        <Text className="text-[10px] font-black text-white ml-1 tracking-wide">
                          Pilihan Utama AI
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center">
                        <TrendingUp size={11} color="#4ADE80" />
                        <Text className="text-[10px] font-bold text-white ml-1">
                          Skor: {formatScore(item.skor_prioritas)}
                        </Text>
                      </View>
                    )}

                    {/* Kesesuaian Sinar Badge */}
                    <Badge
                      label={
                        item.kesesuaian_sinar === 'COCOK'
                          ? 'Sangat Cocok'
                          : item.kesesuaian_sinar === 'KURANG_COCOK'
                          ? 'Kurang Cocok'
                          : 'Tidak Cocok'
                      }
                      variant={
                        item.kesesuaian_sinar === 'COCOK'
                          ? 'success'
                          : item.kesesuaian_sinar === 'KURANG_COCOK'
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    />
                  </View>
                </TouchableOpacity>

                {/* Content Section */}
                <View className="p-5">
                  {/* Title & Difficulty Badge */}
                  <View className="flex-row items-center justify-between mb-3">
                    <TouchableOpacity
                      onPress={() => setSelectedDetailItem(item)}
                      className="flex-1 mr-2"
                    >
                      <Text className="text-xl font-black text-gray-900">
                        {item.nama}
                      </Text>
                    </TouchableOpacity>
                    <Badge
                      label={`Tingkat: ${
                        item.tingkat_kesulitan === 'MUDAH' ? 'Mudah' : 'Sedang'
                      }`}
                      variant="neutral"
                      size="sm"
                    />
                  </View>

                  {/* Detailed Unsuitability Reason Card if any */}
                  {activeLahan && (
                    (() => {
                      const reasons = getUnsuitabilityReasons(item);
                      if (reasons.length === 0) return null;

                      return (
                        <TouchableOpacity
                          onPress={() => setWarningLahanModalItem(item)}
                          activeOpacity={0.85}
                          className="mb-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl p-3 shadow-2xs"
                        >
                          <View className="flex-row items-center justify-between mb-1.5 pb-1 border-b border-amber-200/70">
                            <View className="flex-row items-center flex-1 mr-2">
                              <AlertTriangle size={14} color="#B45309" />
                              <Text className="text-xs font-black text-amber-950 ml-1.5">
                                Alasan Tanaman Tidak Ideal
                              </Text>
                            </View>
                            <View className="bg-amber-200/80 px-2 py-0.5 rounded-full">
                              <Text className="text-[9px] font-black text-amber-900 uppercase">
                                {reasons.some(r => r.isDanger) ? 'Tidak Cocok' : 'Perlu Penyesuaian'}
                              </Text>
                            </View>
                          </View>

                          <View className="space-y-1.5">
                            {reasons.map((r, rIdx) => (
                              <View key={rIdx} className="flex-row items-start mb-1">
                                <Text className="text-[12px] text-amber-700 mr-1.5 font-bold leading-tight">•</Text>
                                <View className="flex-1">
                                  <Text className="text-[11px] font-extrabold text-amber-900 leading-tight">
                                    {r.title}
                                  </Text>
                                  <Text className="text-[11px] font-medium text-amber-800/90 mt-0.5 leading-snug">
                                    {r.detail}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>

                          <View className="flex-row items-center justify-end mt-1 pt-1 border-t border-amber-200/50">
                            <Text className="text-[10px] font-bold text-amber-800 mr-0.5">
                              Lihat detail panduan & opsi tanam
                            </Text>
                            <ChevronRight size={12} color="#92400E" />
                          </View>
                        </TouchableOpacity>
                      );
                    })()
                  )}

                  {/* Info Meta Grid */}
                  <View className="space-y-2.5 mb-4 bg-[#F9FAFB] p-3.5 rounded-2xl border border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Calendar size={14} color="#4B5563" />
                        <Text className="text-xs font-semibold text-gray-600 ml-1.5" numberOfLines={1}>
                          Waktu Panen
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900 text-right">
                        {item.waktu_panen_hari} Hari
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-shrink-0 mr-2">
                        <Banknote size={14} color="#166534" />
                        <Text className="text-xs font-semibold text-gray-600 ml-1.5">
                          Estimasi Hemat
                        </Text>
                      </View>
                      <Text
                        className="text-xs font-extrabold text-[#1C7430] text-right flex-shrink-1"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {formatRupiah(item.estimasi_hemat_rp_per_bulan)}/bln
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Maximize2 size={14} color="#4B5563" />
                        <Text className="text-xs font-semibold text-gray-600 ml-1.5" numberOfLines={1}>
                          Kebutuhan Ruang
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900 text-right">
                        {item.luas_dibutuhkan_m2 < 0.25 ? '40×40 cm' : `${item.luas_dibutuhkan_m2} m²`}
                      </Text>
                    </View>
                  </View>

                  {/* Buttons: Panduan Detail & + Tanam */}
                  <View className="flex-row items-center mt-1 gap-2.5">
                    <TouchableOpacity
                      onPress={() => setSelectedDetailItem(item)}
                      activeOpacity={0.8}
                      className="bg-green-50 border border-green-200 px-3.5 py-3 rounded-2xl items-center justify-center flex-row"
                    >
                      <BookOpen size={15} color="#1C7430" />
                      <Text className="text-xs font-bold text-[#1C7430] ml-1">
                        Panduan
                      </Text>
                    </TouchableOpacity>

                    <View className="flex-1">
                      {alreadyPlanted || isJustPlanted ? (
                        <View className="flex-row items-center justify-between bg-emerald-50 border border-emerald-200 py-2 px-2.5 rounded-2xl">
                          <TouchableOpacity
                            onPress={() => router.push('/(tabs)/tracking')}
                            className="flex-row items-center flex-1 mr-1.5"
                          >
                            <CheckCircle2 size={14} color="#1C7430" />
                            <Text className="text-[11px] font-bold text-[#1C7430] ml-1" numberOfLines={1}>
                              {activeCropsInLahan.filter(c => c.komoditas_id === item.komoditas_id).length} Ditanam
                            </Text>
                          </TouchableOpacity>
                          {remainingAreaM2 <= 0 ? (
                            <TouchableOpacity
                              onPress={() => setShowLahanPenuhModal(true)}
                              activeOpacity={0.8}
                              className="bg-red-50 border border-red-200 px-2 py-1 rounded-xl"
                            >
                              <Text className="text-[10px] font-extrabold text-red-600">Lahan Penuh</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handlePlant(item)}
                              className="bg-[#1C7430] px-2.5 py-1.5 rounded-xl flex-row items-center shadow-2xs"
                            >
                              <Plus size={11} color="#FFFFFF" strokeWidth={3} />
                              <Text className="text-[10px] font-black text-white ml-0.5">Tambah</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : !activeLahan ? (
                        <TouchableOpacity
                          onPress={() => setShowNoLahanModal(true)}
                          activeOpacity={0.85}
                          className="w-full flex-row items-center justify-center bg-amber-50 border border-amber-300 py-3 px-2.5 rounded-2xl"
                        >
                          <AlertCircle size={14} color="#D97706" />
                          <Text className="text-xs font-bold text-amber-900 ml-1" numberOfLines={1}>
                            Buat Lahan Dahulu
                          </Text>
                        </TouchableOpacity>
                      ) : remainingAreaM2 <= 0 ? (
                        <TouchableOpacity
                          onPress={() => setShowLahanPenuhModal(true)}
                          activeOpacity={0.85}
                          className="w-full flex-row items-center justify-center bg-red-50 border border-red-300 py-3 px-3 rounded-2xl"
                        >
                          <AlertCircle size={15} color="#DC2626" />
                          <Text className="text-xs font-black text-red-700 ml-1.5" numberOfLines={1}>
                            Lahan Penuh ⚠️
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handlePlant(item)}
                          disabled={plantingId === item.komoditas_id}
                          activeOpacity={0.85}
                          className="w-full flex-row items-center justify-center bg-[#1C7430] py-3 px-3 rounded-2xl shadow-sm shadow-[#1C7430]/30"
                        >
                          {plantingId === item.komoditas_id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                              <Text className="text-xs font-black text-white ml-1" numberOfLines={1}>
                                Tanam
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        )}

        {/* Modal Detail Komoditas & Panduan Tanam */}
        <Modal
          visible={!!selectedDetailItem}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedDetailItem(null)}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-white rounded-t-[32px] max-h-[88%] p-6">
              <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#1C7430" />
                  <Text className="text-base font-extrabold text-gray-900 ml-2">
                    Panduan Budidaya
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDetailItem(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
                >
                  <X size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {selectedDetailItem && (
                  <View>
                    {/* Plant Title & Image Card */}
                    <View className="flex-row items-center mb-4 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                      <Image
                        source={getCropImageSource(selectedDetailItem.nama, selectedDetailItem.image_url)}
                        className="w-16 h-16 rounded-2xl mr-3.5 bg-gray-200"
                        resizeMode="cover"
                      />
                      <View className="flex-1 min-w-0">
                        <Text className="text-lg font-black text-gray-900 capitalize" numberOfLines={1}>
                          {selectedDetailItem.nama}
                        </Text>
                        <Text className="text-xs font-semibold text-[#1C7430] mt-0.5">
                          Skor Prioritas: {formatScore(selectedDetailItem.skor_prioritas)}
                        </Text>
                        <Text className="text-[11px] text-gray-500 mt-0.5">
                          Tingkat: {selectedDetailItem.tingkat_kesulitan === 'MUDAH' ? 'Mudah (Cocok untuk Pemula)' : 'Menengah'}
                        </Text>
                      </View>
                    </View>

                    {/* Warning Badge in Modal if Ada Alasan Kurang Ideal */}
                    {(() => {
                      if (!activeLahan) return null;
                      const reasons = getUnsuitabilityReasons(selectedDetailItem);
                      if (reasons.length === 0) return null;
                      const firstReason = reasons[0];
                      const isDanger = reasons.some(r => r.isDanger);
                      return (
                        <TouchableOpacity
                          onPress={() => setWarningLahanModalItem(selectedDetailItem)}
                          activeOpacity={0.8}
                          className={`p-3.5 rounded-2xl mb-4 flex-row items-center justify-between border ${
                            isDanger
                              ? 'bg-red-50/90 border-red-200'
                              : 'bg-amber-50 border-amber-300'
                          }`}
                        >
                          <View className="flex-row items-center flex-1 mr-2 min-w-0">
                            <AlertTriangle
                              size={16}
                              color={isDanger ? '#DC2626' : '#B45309'}
                              style={{ marginRight: 8, flexShrink: 0 }}
                            />
                            <View className="flex-1 min-w-0">
                              <Text
                                className={`text-xs font-bold ${
                                  isDanger ? 'text-red-950' : 'text-amber-950'
                                }`}
                                numberOfLines={1}
                              >
                                {firstReason.title}
                              </Text>
                              <Text
                                className={`text-[11px] ${
                                  isDanger ? 'text-red-800/90' : 'text-amber-800/90'
                                } mt-0.5`}
                                numberOfLines={1}
                              >
                                {firstReason.detail}
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={14} color={isDanger ? '#DC2626' : '#B45309'} />
                        </TouchableOpacity>
                      );
                    })()}

                    {/* Panduan Singkat Box */}
                    <View className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl mb-4">
                      <Text className="text-xs font-bold text-emerald-900 mb-1">
                        🌱 Cara Menanam & Perawatan:
                      </Text>
                      <Text className="text-xs text-emerald-800 leading-relaxed">
                        {selectedDetailItem.panduan_singkat || 'Tanam pada media yang gembur dan kaya bahan organik. Siram rutin setiap hari dan pantau pertumbuhan tunas baru.'}
                      </Text>
                    </View>

                    {/* Specification Grid */}
                    <View className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-100 space-y-3 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Droplets size={16} color="#0284C7" />
                          <Text className="text-xs font-semibold text-gray-700 ml-2">Jadwal Siram</Text>
                        </View>
                        <Text className="text-xs font-bold text-gray-900">Setiap {selectedDetailItem.jadwal_siram_hari || 1} Hari (Pagi / Sore)</Text>
                      </View>

                      <View className="flex-row items-center justify-between border-t border-gray-100 pt-2.5">
                        <View className="flex-row items-center">
                          <Sprout size={16} color="#166534" />
                          <Text className="text-xs font-semibold text-gray-700 ml-2">Jadwal Pemupukan</Text>
                        </View>
                        <Text className="text-xs font-bold text-gray-900">Setiap {selectedDetailItem.jadwal_pupuk_hari || 14} Hari Sekali</Text>
                      </View>

                      {/* Rekomendasi Media Tanam - Spacious Custom Row */}
                      <View className="border-t border-gray-100 pt-2.5">
                        <View className="flex-row items-center mb-1.5">
                          <Maximize2 size={16} color="#4B5563" />
                          <Text className="text-xs font-semibold text-gray-700 ml-2">Rekomendasi Media</Text>
                        </View>
                        <View className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-3 py-2 mt-0.5">
                          <Text className="text-xs font-bold text-emerald-950 leading-relaxed">
                            {selectedDetailItem.media_tanam || 'Polybag / Pot 25-30cm / Vertikultur'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between border-t border-gray-100 pt-2.5">
                        <View className="flex-row items-center">
                          <Banknote size={16} color="#15803D" />
                          <Text className="text-xs font-semibold text-gray-700 ml-2">Harga Pasar</Text>
                        </View>
                        <Text className="text-xs font-bold text-[#1C7430]">{formatRupiah(selectedDetailItem.harga_pasar_per_kg)} / kg</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal CTA */}
              {selectedDetailItem && (
                !activeLahan ? (
                  <Button
                    title="Buat Lahan Dahulu untuk Menanam"
                    variant="outline"
                    onPress={() => {
                      setSelectedDetailItem(null);
                      setShowNoLahanModal(true);
                    }}
                    size="lg"
                    className="w-full border-amber-400 bg-amber-50"
                    icon={<AlertCircle size={18} color="#D97706" />}
                  />
                ) : remainingAreaM2 <= 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDetailItem(null);
                      setShowLahanPenuhModal(true);
                    }}
                    activeOpacity={0.85}
                    className="w-full flex-row items-center justify-center border-2 border-red-200 bg-red-50 py-4 px-6 rounded-2xl"
                  >
                    <AlertTriangle size={18} color="#DC2626" />
                    <Text className="text-base font-black text-red-700 ml-2">
                      Kapasitas Lahan Penuh
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Button
                    title="Tanam di Pekarangan Saya"
                    onPress={() => handlePlant(selectedDetailItem)}
                    loading={plantingId === selectedDetailItem.komoditas_id}
                    size="lg"
                    className="w-full shadow-md"
                    icon={<Plus size={18} color="#FFFFFF" strokeWidth={2.5} />}
                  />
                )
              )}
            </View>
          </View>
        </Modal>

        {/* Modal Peringatan Belum Ada Lahan */}
        <Modal
          visible={showNoLahanModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNoLahanModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center border border-gray-100 shadow-xl">
              <View className="w-16 h-16 rounded-2xl bg-amber-100 items-center justify-center mb-3.5 border border-amber-200">
                <AlertCircle size={32} color="#D97706" />
              </View>

              <View className="bg-amber-100/90 px-3 py-1 rounded-full mb-2">
                <Text className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                  Lahan Belum Tersedia
                </Text>
              </View>

              <Text className="text-lg font-black text-gray-900 text-center mb-1.5">
                Belum Ada Lahan Pekarangan
              </Text>

              <Text className="text-xs text-gray-500 text-center leading-relaxed mb-6 px-1">
                Anda perlu membuat atau menentukan ukuran lahan di tab Lahan terlebih dahulu agar AI dapat menghitung kebutuhan ruang dan jadwal perawatan tanaman Anda.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setShowNoLahanModal(false);
                  router.push('/(tabs)/lahan');
                }}
                activeOpacity={0.85}
                className="w-full bg-[#1C7430] py-3.5 rounded-2xl items-center justify-center shadow-xs mb-2.5"
              >
                <Text className="text-xs font-black text-white">
                  Buat Lahan Sekarang 🌱
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowNoLahanModal(false)}
                activeOpacity={0.7}
                className="py-2 px-4"
              >
                <Text className="text-xs font-semibold text-gray-500">
                  Nanti Saja
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Peringatan Kapasitas Pekarangan Penuh */}
        <Modal
          visible={showLahanPenuhModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLahanPenuhModal(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center border border-gray-100 shadow-xl">
              <View className="w-16 h-16 rounded-2xl bg-red-100 items-center justify-center mb-3.5 border border-red-200">
                <AlertTriangle size={32} color="#DC2626" />
              </View>

              <View className="bg-red-100/90 px-3 py-1 rounded-full mb-2">
                <Text className="text-[10px] font-black text-red-900 uppercase tracking-wider">
                  Kapasitas Penuh (100%)
                </Text>
              </View>

              <Text className="text-lg font-black text-gray-900 text-center mb-1.5">
                Tidak Bisa Menambah Tanaman Lagi
              </Text>

              <Text className="text-xs text-gray-500 text-center leading-relaxed mb-4 px-1">
                Kapasitas lahan pekarangan Anda sudah terisi penuh ({usedAreaM2.toFixed(2)}/{activeLahan?.luas_m2 || 0} m²). Panen atau selesaikan tanaman aktif terlebih dahulu, atau buat pekarangan baru.
              </Text>

              {/* Status Pemakaian Ringkas */}
              <View className="w-full bg-gray-50 rounded-2xl p-3 border border-gray-200/80 mb-5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[11px] text-gray-600 font-semibold">Pekarangan Aktif:</Text>
                  <Text className="text-[11px] text-gray-900 font-bold" numberOfLines={1}>
                    {activeLahan?.nama_lahan}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[11px] text-gray-600 font-semibold">Luas Terpakai:</Text>
                  <Text className="text-[11px] text-red-600 font-black">
                    {usedAreaM2.toFixed(2)} m² / {activeLahan?.luas_m2 || 0} m² (100%)
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] text-gray-600 font-semibold">Tanaman Dirawat:</Text>
                  <Text className="text-[11px] text-emerald-800 font-bold">
                    {activeCropsInLahan.length} Tanaman
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setShowLahanPenuhModal(false);
                  router.push('/(tabs)/tracking');
                }}
                activeOpacity={0.85}
                className="w-full bg-[#1C7430] py-3.5 rounded-2xl items-center justify-center shadow-xs mb-2.5"
              >
                <Text className="text-xs font-black text-white">
                  Pantau / Panen Tanaman (Tracking) 🌿
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowLahanPenuhModal(false);
                  router.push('/(tabs)/lahan');
                }}
                activeOpacity={0.85}
                className="w-full bg-emerald-50 border border-emerald-300 py-3 rounded-2xl items-center justify-center mb-2"
              >
                <Text className="text-xs font-bold text-emerald-900">
                  Tambah / Kelola Pekarangan 🏡
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowLahanPenuhModal(false)}
                activeOpacity={0.7}
                className="py-1 px-4"
              >
                <Text className="text-xs font-semibold text-gray-400">
                  Tutup
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Peringatan Kondisi Lahan Kurang dari Kriteria */}
        <Modal
          visible={!!warningLahanModalItem}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setWarningLahanModalItem(null)}
        >
          {(() => {
            if (!warningLahanModalItem) return null;
            const modalReasons = getUnsuitabilityReasons(warningLahanModalItem);
            const isDanger = modalReasons.some(r => r.isDanger);

            const modalTitle = isDanger
              ? `Tanaman ${warningLahanModalItem.nama} Tidak Cocok`
              : `Tanaman ${warningLahanModalItem.nama} Kurang Optimal`;

            const badgeText = isDanger ? 'Kondisi Tidak Cocok' : 'Perlu Penyesuaian';

            return (
              <View className="flex-1 bg-black/60 justify-center items-center px-6">
                <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center border border-gray-100 shadow-xl">
                  <View className="w-16 h-16 rounded-2xl bg-amber-100 items-center justify-center mb-3.5 border border-amber-200">
                    <AlertTriangle size={32} color="#D97706" />
                  </View>

                  <View className="bg-amber-100/90 px-3 py-1 rounded-full mb-2">
                    <Text className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                      {badgeText}
                    </Text>
                  </View>

                  <Text className="text-lg font-black text-gray-900 text-center mb-1.5">
                    {modalTitle}
                  </Text>

                  <Text className="text-xs text-gray-500 text-center leading-relaxed mb-4 px-1">
                    Berikut adalah alasan teknis mengapa kondisi pekarangan saat ini belum ideal untuk menanam komoditas ini:
                  </Text>

                  {/* Detail Kriteria & Alasan Gamblang */}
                  <View className="w-full bg-amber-50/80 rounded-2xl p-3.5 mb-5 border border-amber-200/70">
                    <Text className="text-[10px] font-black text-amber-950 uppercase tracking-wider mb-2">
                      Faktor Analisis Lahan:
                    </Text>
                    {modalReasons.map((r, rIdx) => (
                      <View key={rIdx} className="mb-2 pb-2 border-b border-amber-200/50 last:border-b-0">
                        <Text className="text-xs font-black text-amber-950">
                          {r.title}
                        </Text>
                        <Text className="text-[11px] font-medium text-amber-900/90 mt-0.5 leading-snug">
                          {r.detail}
                        </Text>
                      </View>
                    ))}

                    {warningLahanModalItem?.panduan_singkat ? (
                      <Text className="text-[10px] font-medium text-amber-900/80 mt-1 italic leading-tight">
                        Tips: {`"${warningLahanModalItem.panduan_singkat}"`}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (warningLahanModalItem) {
                        handlePlant(warningLahanModalItem, true);
                      }
                    }}
                    disabled={plantingId === warningLahanModalItem?.komoditas_id}
                    activeOpacity={0.85}
                    className="w-full bg-[#1C7430] py-3.5 rounded-2xl items-center justify-center shadow-xs mb-2.5"
                  >
                    {plantingId === warningLahanModalItem?.komoditas_id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs font-black text-white">
                        Saya Paham, Tetap Tanam 🌱
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setWarningLahanModalItem(null)}
                    activeOpacity={0.7}
                    className="py-2 px-4"
                  >
                    <Text className="text-xs font-semibold text-gray-500">
                      Pilih Tanaman Lain
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </Modal>

        {/* Modal Atur Jumlah Tanaman */}
        <Modal
          visible={Boolean(plantQuantityModalItem)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPlantQuantityModalItem(null)}
        >
          <View className="flex-1 bg-black/65 justify-end">
            <View
              style={{
                maxHeight: '88%',
                paddingBottom: Math.max(insets.bottom, 20),
              }}
              className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl"
            >
              {plantQuantityModalItem && (() => {
                const item = plantQuantityModalItem;
                const luasPerUnit = Number(item.luas_dibutuhkan_m2) || 0.25;
                const maxFit = Math.floor(remainingAreaM2 / luasPerUnit);
                const totalReqArea = Number((plantQuantity * luasPerUnit).toFixed(2));
                const sisaAfter = Math.max(0, Number((remainingAreaM2 - totalReqArea).toFixed(2)));
                const isOverCapacity = totalReqArea > remainingAreaM2;
                const totalMonthlySaving = plantQuantity * (item.estimasi_hemat_rp_per_bulan || 0);

                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header Modal */}
                    <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-4">
                      <View className="flex-row items-center">
                        <View className="w-9 h-9 rounded-2xl bg-emerald-100 items-center justify-center mr-2.5">
                          <Sprout size={18} color="#166534" />
                        </View>
                        <View>
                          <Text className="text-base font-black text-gray-900">
                            Atur Jumlah Tanaman
                          </Text>
                          <Text className="text-[11px] font-medium text-gray-500">
                            Sesuaikan dengan kapasitas pekarangan Anda
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setPlantQuantityModalItem(null)}
                        activeOpacity={0.7}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <X size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    {/* Commodity Card Preview */}
                    <View className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 mb-4 flex-row items-center">
                      <View className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-emerald-100 mr-3.5 flex-shrink-0">
                        <Image
                          source={getCropImageSource(item.nama, item.image_url)}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-base font-black text-gray-900" numberOfLines={1}>
                          {item.nama}
                        </Text>
                        <Text className="text-xs font-semibold text-emerald-800 mt-0.5">
                          Kebutuhan: {luasPerUnit} m² / tanaman
                        </Text>
                        <Text className="text-[11px] font-medium text-gray-500 mt-0.5">
                          Panen dalam ±{item.waktu_panen_hari} hari
                        </Text>
                      </View>
                    </View>

                    {/* Lahan Real Capacity Status */}
                    <View className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 mb-4">
                      <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Status Lahan: {activeLahan?.nama_lahan}
                      </Text>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs text-gray-600">Total Luas Lahan:</Text>
                        <Text className="text-xs font-bold text-gray-900">{totalAreaM2} m²</Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs text-gray-600">Terpakai (Tanaman Dirawat):</Text>
                        <Text className="text-xs font-bold text-amber-800">{usedAreaM2.toFixed(2)} m² ({activeCropsInLahan.length} tanaman)</Text>
                      </View>
                      <View className="flex-row items-center justify-between pt-1.5 border-t border-gray-200">
                        <Text className="text-xs font-extrabold text-emerald-900">Sisa Lahan Tersedia:</Text>
                        <Text className="text-xs font-black text-emerald-800">{remainingAreaM2.toFixed(2)} m²</Text>
                      </View>
                    </View>

                    {/* Quantity Stepper Selector */}
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-bold text-gray-800">
                          Jumlah Bibit / Polybag
                        </Text>
                        <Text className="text-[11px] font-semibold text-emerald-800">
                          Maksimal muat: {maxFit > 0 ? `${maxFit} Tanaman` : 'Lahan Penuh'}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between bg-[#F8FAF8] border border-gray-200 rounded-2xl p-2">
                        <TouchableOpacity
                          onPress={() => setPlantQuantity(prev => Math.max(1, prev - 1))}
                          disabled={plantQuantity <= 1}
                          className={`w-12 h-12 rounded-xl items-center justify-center ${
                            plantQuantity <= 1 ? 'bg-gray-200' : 'bg-emerald-100'
                          }`}
                        >
                          <Minus size={20} color={plantQuantity <= 1 ? '#9CA3AF' : '#166534'} />
                        </TouchableOpacity>

                        <View className="items-center justify-center px-4">
                          <Text className="text-2xl font-black text-gray-900">
                            {plantQuantity}
                          </Text>
                          <Text className="text-[10px] font-bold text-gray-400">
                            Tanaman
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            setPlantQuantity(prev => prev + 1);
                          }}
                          className="w-12 h-12 rounded-xl bg-[#1C7430] items-center justify-center shadow-xs"
                        >
                          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Fill Button if space permits */}
                      {maxFit > 1 && plantQuantity !== maxFit && (
                        <TouchableOpacity
                          onPress={() => setPlantQuantity(maxFit)}
                          className="mt-2 py-1.5 px-3 bg-emerald-50 rounded-xl border border-emerald-200 self-center flex-row items-center"
                        >
                          <Sparkles size={12} color="#166534" />
                          <Text className="text-[11px] font-black text-emerald-800 ml-1">
                            Penuhi Sisa Lahan ({maxFit} Tanaman)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Calculation Summary Box */}
                    <View className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 mb-4">
                      <Text className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-2">
                        Kalkulasi Kebutuhan Lahan
                      </Text>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs text-gray-600">Total Luas Dibutuhkan:</Text>
                        <Text className={`text-xs font-black ${isOverCapacity ? 'text-red-600' : 'text-gray-900'}`}>
                          {totalReqArea} m² ({plantQuantity} × {luasPerUnit} m²)
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className="text-xs text-gray-600">Sisa Lahan Setelah Ditanam:</Text>
                        <Text className={`text-xs font-black ${isOverCapacity ? 'text-red-600' : 'text-emerald-800'}`}>
                          {sisaAfter} m²
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between pt-1.5 border-t border-emerald-100">
                        <Text className="text-xs font-bold text-gray-700">Potensi Hemat Belanja:</Text>
                        <Text className="text-xs font-black text-[#1C7430]">
                          {formatRupiah(totalMonthlySaving)} / bulan
                        </Text>
                      </View>
                    </View>

                    {/* Warning if over capacity */}
                    {isOverCapacity && (
                      <View className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 flex-row items-start">
                        <AlertCircle size={16} color="#DC2626" style={{ marginTop: 2, marginRight: 8 }} />
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-red-900">
                            Melebihi Kapasitas Lahan!
                          </Text>
                          <Text className="text-[11px] text-red-700 mt-0.5">
                            Sisa lahan ({remainingAreaM2.toFixed(2)} m²) hanya cukup untuk maksimal {maxFit} tanaman. Kurangi jumlah tanaman.
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className="flex-row items-center gap-2.5 mt-1">
                      <TouchableOpacity
                        onPress={() => setPlantQuantityModalItem(null)}
                        activeOpacity={0.8}
                        className="flex-1 py-3.5 rounded-2xl border border-gray-300 bg-gray-50 items-center justify-center"
                      >
                        <Text className="text-xs font-bold text-gray-700">
                          Batal
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleConfirmPlantQuantity}
                        disabled={isOverCapacity || plantQuantity <= 0 || plantingId === item.komoditas_id}
                        activeOpacity={0.85}
                        className={`flex-2 py-3.5 px-4 rounded-2xl items-center justify-center shadow-xs flex-row ${
                          isOverCapacity || plantQuantity <= 0
                            ? 'bg-gray-300'
                            : 'bg-[#1C7430]'
                        }`}
                      >
                        {plantingId === item.komoditas_id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-xs font-black text-white ml-1.5">
                              Tanam {plantQuantity} {item.nama}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>

        {/* Modal Switch Lahan */}
        <Modal
          visible={isLahanModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLahanModalOpen(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-end sm:justify-center p-4">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <View className="flex-row items-center flex-1 mr-2 min-w-0">
                  <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-2.5 flex-shrink-0">
                    <Trees size={16} color="#1C7430" />
                  </View>
                  <Text className="text-base font-black text-gray-900" numberOfLines={1}>
                    Pilih Pekarangan
                  </Text>
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

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-72 mb-4">
                {lahans.length === 0 ? (
                  <View className="py-6 items-center">
                    <Text className="text-xs font-semibold text-gray-400">
                      Belum ada pekarangan terdaftar
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
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
                              {lahan.luas_m2} m² • {isUnused ? 'Belum Digunakan' : `${countInThisLahan} Tanaman Dirawat`}
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

        {/* Modal Konfirmasi Hapus Lahan Custom Card */}
        <DeleteLahanModal
          visible={!!lahanToDelete}
          lahan={lahanToDelete}
          activeCrops={activeCrops}
          isDeleting={isDeletingLahan}
          onClose={() => setLahanToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      </ScrollView>
    </View>
  );
}

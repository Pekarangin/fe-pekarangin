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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Calendar,
  Banknote,
  Maximize2,
  Plus,
  CheckCircle2,
  TrendingUp,
  Sun,
  ChevronRight,
  Droplets,
  Sprout,
  X,
  BookOpen,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RekomendasiItem } from '../../types';
import { getCropImageSource } from '../../constants/cropImages';

export default function RekomendasiTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeLahan,
    rekomendasiList,
    addTanamanAktif,
    activeCrops,
    isLoadingRekomendasi,
    rekomendasiError,
    refreshRekomendasi,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MUDAH' | 'SEDANG'>('ALL');
  const [plantingId, setPlantingId] = useState<string | null>(null);
  const [plantedSuccessId, setPlantedSuccessId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<RekomendasiItem | null>(null);
  const [showNoLahanModal, setShowNoLahanModal] = useState(false);

  const filteredList = rekomendasiList.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.tingkat_kesulitan === selectedCategory;
  });

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handlePlant = async (item: RekomendasiItem) => {
    if (!activeLahan) {
      setShowNoLahanModal(true);
      return;
    }
    setPlantingId(item.komoditas_id);
    try {
      await addTanamanAktif(item.komoditas_id, item.nama);
      setPlantedSuccessId(item.komoditas_id);
      if (selectedDetailItem?.komoditas_id === item.komoditas_id) {
        setSelectedDetailItem(null);
      }
      setTimeout(() => {
        setPlantedSuccessId(null);
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setPlantingId(null);
    }
  };

  const isAlreadyPlanted = (komoditasId: string) => {
    return activeCrops.some(
      c => c.komoditas_id === komoditasId && c.status === 'AKTIF'
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
        className="px-5 pt-2"
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

        {/* Lahan Context Pill */}
        <View className="flex-row items-center justify-between bg-[#E8F5E9] border border-green-200/80 px-4 py-3 rounded-2xl mb-3">
          <View className="flex-row items-center flex-1 mr-2">
            <Sun size={16} color="#1C7430" />
            <Text className="text-xs font-bold text-[#1C7430] ml-2" numberOfLines={1}>
              {activeLahan ? `Lahan: ${activeLahan.nama_lahan} (${activeLahan.luas_m2} m² • ${activeLahan.paparan_sinar === 'FULL_SUN' ? 'Sinar Penuh' : activeLahan.paparan_sinar === 'PARTIAL_SUN' ? 'Sinar Parsial' : 'Teduh'})` : 'Belum Ada Lahan Terdaftar'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/lahan')}
            className="flex-row items-center px-2.5 py-1 bg-[#1C7430] rounded-xl"
          >
            <Text className="text-xs font-bold text-white">
              {activeLahan ? 'Ubah' : 'Buat Lahan'}
            </Text>
          </TouchableOpacity>
        </View>

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
            const isTopPick = index === 0 && selectedCategory === 'ALL';

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
                  {/* Top Pick Ribbon */}
                  {isTopPick && (
                    <View className="absolute top-3 left-3 bg-[#1C7430] px-3 py-1 rounded-full flex-row items-center shadow-md">
                      <Sparkles size={13} color="#FEF08A" />
                      <Text className="text-[11px] font-black text-white ml-1.5 tracking-wide">
                        Pilihan Utama AI Pekarang
                      </Text>
                    </View>
                  )}

                  {!isTopPick && (
                    <View className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex-row items-center">
                      <TrendingUp size={12} color="#4ADE80" />
                      <Text className="text-[11px] font-bold text-white ml-1">
                        Skor: {item.skor_prioritas}
                      </Text>
                    </View>
                  )}

                  {/* Kesesuaian Sinar Badge */}
                  <View className="absolute top-3 right-3">
                    <Badge
                      label={
                        item.kesesuaian_sinar === 'COCOK'
                          ? 'Sangat Cocok'
                          : 'Cukup Cocok'
                      }
                      variant={item.kesesuaian_sinar === 'COCOK' ? 'success' : 'warning'}
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

                  {/* Info Meta Grid */}
                  <View className="space-y-2 mb-4 bg-[#F9FAFB] p-3.5 rounded-2xl border border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Calendar size={15} color="#4B5563" />
                        <Text className="text-xs font-semibold text-gray-600 ml-2">
                          Waktu Panen
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900">
                        {item.waktu_panen_hari} Hari
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Banknote size={15} color="#166534" />
                        <Text className="text-xs font-semibold text-gray-600 ml-2">
                          Estimasi Hemat
                        </Text>
                      </View>
                      <Text className="text-xs font-extrabold text-[#1C7430]">
                        {formatRupiah(item.estimasi_hemat_rp_per_bulan)} / bln
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Maximize2 size={15} color="#4B5563" />
                        <Text className="text-xs font-semibold text-gray-600 ml-2">
                          Kebutuhan Ruang
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-gray-900">
                        {item.luas_dibutuhkan_m2 < 0.25 ? '40×40 cm (Polybag)' : `${item.luas_dibutuhkan_m2} m²`}
                      </Text>
                    </View>
                  </View>

                  {/* Buttons: Panduan Detail & + Tanam Ini */}
                  <View className="flex-row items-center mt-1" style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedDetailItem(item)}
                      className="bg-green-50 border border-green-200 px-4 py-3.5 rounded-2xl items-center justify-center flex-row"
                    >
                      <BookOpen size={16} color="#1C7430" />
                      <Text className="text-xs font-bold text-[#1C7430] ml-1.5">
                        Panduan
                      </Text>
                    </TouchableOpacity>

                    <View className="flex-1">
                      {alreadyPlanted || isJustPlanted ? (
                        <View className="flex-row items-center justify-between bg-green-50 border border-green-200 py-3.5 px-3.5 rounded-2xl">
                          <View className="flex-row items-center flex-1 mr-2">
                            <CheckCircle2 size={16} color="#1C7430" />
                            <Text className="text-xs font-bold text-[#1C7430] ml-1.5" numberOfLines={1}>
                              Sedang Ditanam
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => router.push('/(tabs)/tracking')}
                            className="bg-[#1C7430] p-1.5 rounded-lg"
                          >
                            <ChevronRight size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : !activeLahan ? (
                        <TouchableOpacity
                          onPress={() => setShowNoLahanModal(true)}
                          activeOpacity={0.85}
                          className="w-full flex-row items-center justify-center bg-amber-50 border border-amber-300 py-3.5 px-3 rounded-2xl"
                        >
                          <AlertCircle size={15} color="#D97706" />
                          <Text className="text-xs font-bold text-amber-900 ml-1.5" numberOfLines={1}>
                            Buat Lahan Dahulu
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handlePlant(item)}
                          disabled={plantingId === item.komoditas_id}
                          activeOpacity={0.85}
                          className="w-full flex-row items-center justify-center bg-[#1C7430] py-3.5 px-4 rounded-2xl shadow-sm shadow-[#1C7430]/30"
                        >
                          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                          <Text className="text-sm font-bold text-white ml-1.5">
                            Tanam Ini
                          </Text>
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
            <View className="bg-white rounded-t-3xl max-h-[85%] p-6">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#1C7430" />
                  <Text className="text-base font-extrabold text-gray-900 ml-2">
                    Panduan Budidaya
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedDetailItem(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
                {selectedDetailItem && (
                  <View>
                    {/* Plant Title & Image */}
                    <View className="flex-row items-center mb-4">
                      <Image
                        source={getCropImageSource(selectedDetailItem.nama, selectedDetailItem.image_url)}
                        className="w-16 h-16 rounded-2xl mr-3.5 bg-gray-100"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text className="text-xl font-black text-gray-900">
                          {selectedDetailItem.nama}
                        </Text>
                        <Text className="text-xs font-semibold text-[#1C7430] mt-0.5">
                          Skor Prioritas: {selectedDetailItem.skor_prioritas} / 5.0
                        </Text>
                        <Text className="text-[11px] text-gray-500 mt-0.5">
                          Tingkat: {selectedDetailItem.tingkat_kesulitan === 'MUDAH' ? 'Mudah (Cocok untuk Pemula)' : 'Menengah'}
                        </Text>
                      </View>
                    </View>

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

                      <View className="flex-row items-center justify-between border-t border-gray-100 pt-2.5">
                        <View className="flex-row items-center">
                          <Maximize2 size={16} color="#4B5563" />
                          <Text className="text-xs font-semibold text-gray-700 ml-2">Rekomendasi Media</Text>
                        </View>
                        <Text className="text-xs font-bold text-gray-900">{selectedDetailItem.media_tanam || 'Polybag / Pot 30cm'}</Text>
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
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Leaf,
  Plus,
  Scale,
  X,
  Check,
  Flame,
  AlertTriangle,
  Trophy,
  Sprout,
  ChevronDown,
  Sun,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { getCropImageSource } from '../../constants/cropImages';
import { DeleteLahanModal } from '../../components/ui/DeleteLahanModal';

export default function TrackingTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeCrops,
    activeLahan,
    lahans,
    setActiveLahan,
    deleteLahan,
    toggleChecklistSiram,
    toggleChecklistPupuk,
    recordPanen,
    recordGagal,
    stats,
    fetchRemoteUserData,
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLahanModalOpen, setIsLahanModalOpen] = useState(false);
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

  useEffect(() => {
    fetchRemoteUserData().catch(err => console.warn('Sync tracking data error:', err));
  }, [fetchRemoteUserData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchRemoteUserData();
    } catch (err) {
      console.warn('Refresh tracking error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRemoteUserData]);

  // Panen input modal
  const [panenModalVisible, setPanenModalVisible] = useState(false);
  const [selectedCropForPanen, setSelectedCropForPanen] = useState<string | null>(null);
  const [beratGram, setBeratGram] = useState('350');
  const [savingPanen, setSavingPanen] = useState(false);

  // Panen celebration modal
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    tanamanNama: string;
    beratGram: number;
    hematRp: number;
  } | null>(null);

  // Gagal cycle modal
  const [gagalModalVisible, setGagalModalVisible] = useState(false);
  const [selectedCropForGagal, setSelectedCropForGagal] = useState<string | null>(null);
  const [alasanGagal, setAlasanGagal] = useState('Diserang Hama / Kutu');

  const activeOnly = activeCrops.filter(
    c => c.status === 'AKTIF' && (!activeLahan || c.lahan_id === activeLahan.lahan_id)
  );

  const handleOpenPanenModal = (cropId: string) => {
    setSelectedCropForPanen(cropId);
    setBeratGram('350');
    setPanenModalVisible(true);
  };

  const handleConfirmPanen = async () => {
    if (!selectedCropForPanen) return;
    setSavingPanen(true);
    try {
      const g = parseInt(beratGram || '100', 10);
      const res = await recordPanen(selectedCropForPanen, g);
      setPanenModalVisible(false);
      setCelebrationData({
        tanamanNama: res.tanamanNama,
        beratGram: g,
        hematRp: res.hematRp,
      });
      setCelebrationVisible(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPanen(false);
    }
  };

  const handleOpenGagalModal = (cropId: string) => {
    setSelectedCropForGagal(cropId);
    setGagalModalVisible(true);
  };

  const handleConfirmGagal = async () => {
    if (!selectedCropForGagal) return;
    try {
      await recordGagal(selectedCropForGagal, alasanGagal);
      setGagalModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
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
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#1C7430']}
            tintColor="#1C7430"
          />
        }
      >
        {/* Header Title */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Leaf size={20} color="#1C7430" />
            <Text className="text-sm font-bold text-[#1C7430] ml-2">
              Tracking Pekarangan
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/rekomendasi')}
            className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full border border-green-200"
          >
            <Plus size={14} color="#1C7430" />
            <Text className="text-xs font-bold text-[#1C7430] ml-1">
              Tambah
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4">
          <Text className="text-2xl font-black text-gray-900 tracking-tight">
            Pantau Kebun Anda
          </Text>
          <Text className="text-sm font-medium text-gray-500 mt-1">
            Catat perawatan harian dan realisasi hasil panen pekarangan Anda.
          </Text>
        </View>

        {/* Lahan Switcher Pill */}
        <View className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => setIsLahanModalOpen(true)}
            activeOpacity={0.8}
            className="flex-row items-center flex-1 mr-2"
          >
            <Sun size={16} color="#1C7430" />
            <View className="ml-2 flex-1">
              <View className="flex-row items-center">
                <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Lahan Aktif
                </Text>
              </View>
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

        {/* Streak Motivation Banner (Hanya muncul jika ada tanaman aktif) */}
        {activeOnly.length > 0 && (
          <View className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-3.5 mb-5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#EA580C] items-center justify-center mr-3">
                <Flame size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-black text-[#9A3412]">
                  Streak {stats.streak_hari} Hari Merawat Rutin! 🔥
                </Text>
                <Text className="text-[11px] font-medium text-[#C2410C] mt-0.5">
                  Konsistensi Anda menjaga pertumbuhan tanaman tetap optimal.
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeOnly.length === 0 ? (
          <View className="bg-white rounded-3xl p-6 items-center border border-gray-100 shadow-sm mt-1">
            <View className="w-20 h-20 rounded-3xl bg-[#F0FDF4] items-center justify-center mb-4 border border-green-100 shadow-xs">
              <Sprout size={38} color="#1C7430" />
            </View>

            <View className="bg-emerald-50 px-3 py-1 rounded-full mb-2 border border-emerald-100">
              <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                {!activeLahan ? 'Lahan Belum Tersedia' : `Pekarangan ${activeLahan.nama_lahan}`}
              </Text>
            </View>

            <Text className="text-xl font-black text-gray-900 text-center mb-1.5">
              {!activeLahan
                ? 'Belum Ada Lahan Terdaftar'
                : `Belum Ada Tanaman di ${activeLahan.nama_lahan}`}
            </Text>

            <Text className="text-xs text-gray-500 text-center leading-relaxed mb-5 px-3">
              {!activeLahan
                ? 'Buat sketsa pekarangan Anda terlebih dahulu agar AI dapat menghitung kebutuhan ruang dan jadwal perawatan tanaman.'
                : `Pilih komoditas sayuran dari daftar rekomendasi AI untuk ditanam di ${activeLahan.nama_lahan} (${activeLahan.luas_m2} m²).`}
            </Text>

            {/* Feature Mini Cards */}
            <View className="w-full bg-[#F9FAFB] rounded-2xl p-3.5 mb-5 border border-gray-100">
              <View className="flex-row items-center mb-2">
                <Text className="text-base mr-2.5">📅</Text>
                <Text className="text-xs font-semibold text-gray-700 flex-1">
                  Jadwal checklist siram & pemupukan harian
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Text className="text-base mr-2.5">🌱</Text>
                <Text className="text-xs font-semibold text-gray-700 flex-1">
                  Pantau 4 fase pertumbuhan (Bibit ➔ Panen)
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base mr-2.5">💰</Text>
                <Text className="text-xs font-semibold text-gray-700 flex-1">
                  Catat hasil panen & hitung uang yang dihemat
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push(!activeLahan ? '/(tabs)/lahan' : '/(tabs)/rekomendasi')}
              activeOpacity={0.85}
              className="w-full bg-[#1C7430] py-3.5 rounded-2xl items-center justify-center shadow-xs"
            >
              <Text className="text-xs font-black text-white">
                {!activeLahan
                  ? 'Buat Lahan Sekarang 🌱'
                  : `Tanam Sayuran di ${activeLahan.nama_lahan} 🌱`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {activeOnly.map(crop => {
              const siramDone = crop.checklist_hari_ini?.siram_done ?? false;
              const pupukDone = crop.checklist_hari_ini?.pupuk_done ?? false;
              const careDoneCount = (siramDone ? 1 : 0) + (pupukDone ? 1 : 0);
              const growthPercent = (() => {
                if (crop.persentase_hari !== undefined && crop.persentase_hari !== null && crop.persentase_hari > 0) {
                  return crop.persentase_hari;
                }
                if (crop.tanggal_tanam && crop.perkiraan_panen) {
                  const tanam = new Date(crop.tanggal_tanam).getTime();
                  const panen = new Date(crop.perkiraan_panen).getTime();
                  const now = new Date().getTime();
                  const total = panen - tanam;
                  if (total > 0) {
                    return Math.min(100, Math.max(1, Math.round(((now - tanam) / total) * 100)));
                  }
                }
                return Math.min(100, Math.max(1, Math.round((crop.hari_ke / 30) * 100)));
              })();

              return (
                <View
                  key={crop.tanaman_aktif_id}
                  className="bg-white rounded-3xl p-5 border border-emerald-100/60 shadow-sm shadow-emerald-950/5 mb-4"
                >
                  {/* Top Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1 mr-2 min-w-0">
                      <View className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-200/60 mr-3 flex-shrink-0">
                        <Image
                          source={getCropImageSource(crop.komoditas_nama, crop.image_url)}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-base font-black text-gray-900 capitalize" numberOfLines={1}>
                          {crop.komoditas_nama}
                        </Text>
                        <View className="flex-row items-center mt-1 flex-wrap gap-1.5">
                          <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                            <Text className="text-[10px] font-bold text-emerald-800">
                              {crop.fase || 'Vegetatif'}
                            </Text>
                          </View>
                          <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                            <Text className="text-[10px] font-bold text-gray-600">
                              {crop.luas_dibutuhkan_m2 || 0.25} m²
                            </Text>
                          </View>
                          <Text className="text-xs font-semibold text-gray-400">
                            Hari ke-{crop.hari_ke}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="items-end flex-shrink-0">
                      <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
                        <Text className="text-[10px] font-black text-emerald-800">
                          Aktif
                        </Text>
                      </View>
                      <Text className="text-[10px] font-medium text-gray-400">
                        Panen ~{formatShortDate(crop.perkiraan_panen)}
                      </Text>
                    </View>
                  </View>

                  {/* Growth Progress Bar */}
                  <View className="bg-[#F9FAFB] rounded-2xl p-3.5 mb-4 border border-gray-100">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-xs font-bold text-gray-600">
                        Fase Pertumbuhan
                      </Text>
                      <Text className="text-xs font-black text-[#1C7430]">
                        {growthPercent}%
                      </Text>
                    </View>

                    {/* Progress track */}
                    <View className="w-full h-2 rounded-full bg-gray-200 overflow-hidden mb-2.5">
                      <View
                        style={{ width: `${growthPercent}%` }}
                        className="h-full bg-[#1C7430] rounded-full"
                      />
                    </View>

                    {/* Milestones */}
                    <View className="flex-row justify-between items-center px-0.5">
                      <Text className={`text-[10px] font-bold ${crop.hari_ke >= 1 ? 'text-[#1C7430]' : 'text-gray-400'}`}>
                        🌱 Bibit
                      </Text>
                      <Text className={`text-[10px] font-bold ${crop.hari_ke >= 10 ? 'text-[#1C7430]' : 'text-gray-400'}`}>
                        🌿 Vegetatif
                      </Text>
                      <Text className={`text-[10px] font-bold ${crop.hari_ke >= 25 ? 'text-[#1C7430]' : 'text-gray-400'}`}>
                        🌸 Bunga
                      </Text>
                      <Text className={`text-[10px] font-bold ${crop.hari_ke >= 40 ? 'text-[#EA580C]' : 'text-gray-400'}`}>
                        🧺 Panen
                      </Text>
                    </View>
                  </View>

                  {/* Daily Care Checklist Tiles */}
                  <View className="mb-4">
                    <View className="flex-row items-center justify-between mb-2.5">
                      <Text className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        Checklist Perawatan Hari Ini
                      </Text>
                      <Text className={`text-[11px] font-extrabold ${careDoneCount === 2 ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {careDoneCount === 2 ? 'Tuntas ✨' : `${careDoneCount}/2 Selesai`}
                      </Text>
                    </View>

                    <View className="space-y-2">
                      {/* Siram Tile */}
                      <TouchableOpacity
                        onPress={() => toggleChecklistSiram(crop.tanaman_aktif_id)}
                        activeOpacity={0.8}
                        className={`flex-row items-center p-3 rounded-2xl border ${
                          siramDone
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <View
                          className={`w-6 h-6 rounded-lg items-center justify-center mr-3 ${
                            siramDone ? 'bg-[#1C7430]' : 'border-2 border-gray-300'
                          }`}
                        >
                          {siramDone && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${
                              siramDone ? 'text-emerald-900 font-black' : 'text-gray-800 font-bold'
                            }`}
                          >
                            {siramDone ? 'Sudah Disiram (Pagi / Sore)' : 'Siram Tanaman (Pagi / Sore)'}
                          </Text>
                        </View>
                        <Text className="text-base">💧</Text>
                      </TouchableOpacity>

                      {/* Pupuk Tile */}
                      <TouchableOpacity
                        onPress={() => toggleChecklistPupuk(crop.tanaman_aktif_id)}
                        activeOpacity={0.8}
                        className={`flex-row items-center p-3 rounded-2xl border ${
                          pupukDone
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <View
                          className={`w-6 h-6 rounded-lg items-center justify-center mr-3 ${
                            pupukDone ? 'bg-[#1C7430]' : 'border-2 border-gray-300'
                          }`}
                        >
                          {pupukDone && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${
                              pupukDone ? 'text-emerald-900 font-black' : 'text-gray-800 font-bold'
                            }`}
                          >
                            {pupukDone ? 'Sudah Diberi Pupuk' : 'Beri Pupuk (Sesuai Siklus)'}
                          </Text>
                        </View>
                        <Text className="text-base">🌿</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Actions Footer: Tandai Gagal & Catat Panen */}
                  <View className="pt-3 border-t border-gray-100 flex-row justify-between items-center">
                    <TouchableOpacity
                      onPress={() => handleOpenGagalModal(crop.tanaman_aktif_id)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-2 px-2.5 rounded-xl"
                    >
                      <AlertTriangle size={13} color="#9CA3AF" />
                      <Text className="text-xs font-semibold text-gray-400 ml-1.5">
                        Tutup / Gagal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenPanenModal(crop.tanaman_aktif_id)}
                      activeOpacity={0.85}
                      className="flex-row items-center bg-[#1C7430] px-4 py-2.5 rounded-2xl shadow-xs"
                    >
                      <Scale size={14} color="#FFFFFF" />
                      <Text className="text-xs font-black text-white ml-1.5">
                        Catat Panen
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Realisasi Panen Input Modal */}
        <Modal
          visible={panenModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPanenModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-2xl">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Scale size={18} color="#1C7430" />
                  <Text className="text-lg font-extrabold text-gray-900 ml-1.5">
                    Realisasi Panen
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPanenModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-gray-500 mb-4 leading-relaxed">
                Timbang hasil petikan Anda dan masukkan berat aktual untuk menghitung akumulasi hemat belanja dapur.
              </Text>

              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Berat Panen Aktual (Gram)
                </Text>
                <View className="flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 py-3">
                  <TextInput
                    keyboardType="numeric"
                    value={beratGram}
                    onChangeText={setBeratGram}
                    className="flex-1 text-base font-bold text-gray-900"
                  />
                  <Text className="text-sm font-bold text-gray-500">gram</Text>
                </View>
              </View>

              <View className="bg-[#E8F5E9] p-3.5 rounded-2xl mb-5">
                <Text className="text-xs font-semibold text-green-900">
                  Estimasi Penghematan Dihitung:
                </Text>
                <Text className="text-lg font-black text-[#1C7430] mt-0.5">
                  Rp {(Math.round((parseInt(beratGram || '0', 10) / 1000) * 52000)).toLocaleString('id-ID')}
                </Text>
              </View>

              <Button
                title="Simpan Hasil Panen"
                onPress={handleConfirmPanen}
                loading={savingPanen}
                size="md"
                className="w-full"
              />
            </View>
          </View>
        </Modal>

        {/* Celebration Panen Modal */}
        <Modal
          visible={celebrationVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCelebrationVisible(false)}
        >
          <View className="flex-1 bg-black/65 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-7 w-full max-w-sm items-center border border-gray-100 shadow-2xl">
              {/* Confetti Trophy Avatar */}
              <View className="w-20 h-20 rounded-full bg-[#FEF3C7] items-center justify-center border-4 border-amber-200 shadow-sm mb-4">
                <Trophy size={40} color="#D97706" />
              </View>

              <Text className="text-2xl font-black text-gray-900 text-center tracking-tight">
                Panen Berhasil! 🎉
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1 mb-5">
                Kerja keras Anda merawat pekarangan terbayar manis!
              </Text>

              {celebrationData && (
                <View className="w-full bg-[#F0FDF4] border border-green-200 rounded-2xl p-4 mb-6">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-semibold text-gray-600">Komoditas:</Text>
                    <Text className="text-xs font-extrabold text-gray-900">{celebrationData.tanamanNama}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-semibold text-gray-600">Hasil Timbang:</Text>
                    <Text className="text-xs font-extrabold text-gray-900">{celebrationData.beratGram} gram</Text>
                  </View>
                  <View className="h-[1px] bg-green-200/80 my-1.5" />
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-green-900">Total Hemat Dapur:</Text>
                    <Text className="text-base font-black text-[#1C7430]">
                      Rp {celebrationData.hematRp.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              )}

              <Button
                title="Lanjut Rawat Kebun"
                onPress={() => setCelebrationVisible(false)}
                size="md"
                className="w-full mb-2"
              />

              <TouchableOpacity
                onPress={() => {
                  setCelebrationVisible(false);
                  router.push('/(tabs)/profile');
                }}
                className="py-2"
              >
                <Text className="text-xs font-bold text-[#1C7430] underline">
                  Lihat Total Statistik di Profil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Tutup Siklus Gagal */}
        <Modal
          visible={gagalModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setGagalModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-2xl">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <AlertTriangle size={18} color="#DC2626" />
                  <Text className="text-base font-extrabold text-gray-900 ml-2">
                    Tutup Siklus Tanam
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setGagalModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-gray-500 mb-4 leading-relaxed">
                Tandai siklus tanam yang layu atau diserang hama untuk evaluasi rekomendasi berikutnya.
              </Text>

              <Text className="text-xs font-bold text-gray-700 mb-2">
                Pilih Alasan Kendala:
              </Text>

              {['Diserang Hama / Kutu', 'Kekurangan Air / Terlalu Kering', 'Busuk Batang / Jamur', 'Media Tanam Kurang Cocok'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setAlasanGagal(item)}
                  className={`p-3 rounded-xl border mb-2 flex-row items-center justify-between ${
                    alasanGagal === item ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-xs ${alasanGagal === item ? 'font-bold text-red-900' : 'font-medium text-gray-700'}`}>
                    {item}
                  </Text>
                  {alasanGagal === item && <Check size={14} color="#DC2626" />}
                </TouchableOpacity>
              ))}

              <View className="mt-4 flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setGagalModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 items-center justify-center mr-2"
                >
                  <Text className="text-xs font-semibold text-gray-700">Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmGagal}
                  className="flex-1 py-3 rounded-xl bg-red-600 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-white">Konfirmasi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Switcher Lahan */}
        <Modal
          visible={isLahanModalOpen}
          transparent
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
              <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <View className="flex-1 mr-2 min-w-0">
                  <Text className="text-lg font-black text-gray-900" numberOfLines={1}>
                    Pilih Pekarangan
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    Filter tanaman aktif berdasarkan pekarangan Anda
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsLahanModalOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center flex-shrink-0"
                >
                  <X size={16} color="#4B5563" />
                </TouchableOpacity>
              </View>

              <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
                {lahans.length === 0 ? (
                  <View className="py-6 items-center">
                    <Text className="text-xs text-gray-400">
                      Belum ada pekarangan terdaftar
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-2.5">
                    {lahans.map(lahan => {
                      const isActive = activeLahan?.lahan_id === lahan.lahan_id;
                      const cropCount = activeCrops.filter(
                        c => c.status === 'AKTIF' && c.lahan_id === lahan.lahan_id
                      ).length;
                      return (
                        <View
                          key={lahan.lahan_id}
                          className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                            isActive
                              ? 'bg-emerald-50 border-emerald-500'
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
                            </View>
                            <Text className="text-xs text-gray-500 mt-0.5 font-medium">
                              {lahan.luas_m2} m² •{' '}
                              {lahan.paparan_sinar === 'FULL_SUN'
                                ? 'Sinar Penuh'
                                : lahan.paparan_sinar === 'PARTIAL_SUN'
                                ? 'Sinar Parsial'
                                : 'Teduh'}{' '}
                              • {cropCount} Tanaman
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

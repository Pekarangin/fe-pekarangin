import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
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
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function TrackingTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeCrops,
    toggleChecklistSiram,
    toggleChecklistPupuk,
    recordPanen,
    recordGagal,
    stats,
  } = useApp();

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

  const [kondisiChecklist, setKondisiChecklist] = useState<Record<string, boolean>>({});

  const toggleKondisi = (cropId: string) => {
    setKondisiChecklist(prev => ({
      ...prev,
      [cropId]: !prev[cropId],
    }));
  };

  const activeOnly = activeCrops.filter(c => c.status === 'AKTIF');

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

  const getCropEmoji = (nama: string) => {
    const lower = nama.toLowerCase();
    if (lower.includes('cabai')) return '🌶️';
    if (lower.includes('sawi') || lower.includes('bayam') || lower.includes('selada')) return '🥬';
    if (lower.includes('tomat')) return '🍅';
    if (lower.includes('bawang')) return '🧅';
    if (lower.includes('terong')) return '🍆';
    if (lower.includes('kemangi') || lower.includes('kangkung')) return '🌿';
    return '🌱';
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

        {/* Streak Motivation Banner */}
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

        {activeOnly.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center justify-center border border-gray-100 shadow-sm mt-2">
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-4">
              <Leaf size={32} color="#1C7430" />
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center">
              Belum Ada Tanaman Aktif
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1 mb-5 leading-relaxed">
              Pilih komoditas yang paling cocok dari rekomendasi kami untuk mulai menanam di pekarangan Anda.
            </Text>
            <Button
              title="Lihat Rekomendasi Tanaman"
              onPress={() => router.push('/(tabs)/rekomendasi')}
              size="md"
            />
          </View>
        ) : (
          <View className="space-y-4">
            {activeOnly.map(crop => {
              const siramDone = crop.checklist_hari_ini?.siram_done ?? false;
              const pupukDone = crop.checklist_hari_ini?.pupuk_done ?? false;
              const kondisiDone = kondisiChecklist[crop.tanaman_aktif_id] ?? false;

              return (
                <View
                  key={crop.tanaman_aktif_id}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5"
                >
                  {/* Crop Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-2xl bg-[#F0FDF4] items-center justify-center border border-green-100 mr-3">
                        <Text className="text-2xl">
                          {getCropEmoji(crop.komoditas_nama)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-lg font-black text-gray-900 capitalize">
                          {crop.komoditas_nama}
                        </Text>
                        <Text className="text-xs font-medium text-gray-400 mt-0.5">
                          Tanam: {crop.tanggal_tanam}
                        </Text>
                      </View>
                    </View>

                    <Badge label="Aktif" variant="success" size="sm" />
                  </View>

                  {/* Visual Growth Stepper */}
                  <View className="mb-4 bg-[#F9FAFB] p-3.5 rounded-2xl border border-gray-100">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-xs font-extrabold text-gray-900">
                        Fase: <Text className="text-[#1C7430]">{crop.fase || 'Vegetatif'}</Text>
                      </Text>
                      <Text className="text-xs font-bold text-gray-500">
                        Hari ke-{crop.hari_ke} (Panen ~{crop.perkiraan_panen})
                      </Text>
                    </View>

                    {/* 4-Stage Connector Stepper */}
                    <View className="flex-row items-center justify-between px-1">
                      {/* Step 1 */}
                      <View className="items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                          crop.hari_ke >= 1 ? 'bg-[#1C7430] shadow-xs' : 'bg-gray-200'
                        }`}>
                          <Text className="text-xs">🌱</Text>
                        </View>
                        <Text className={`text-[10px] mt-1 font-bold ${
                          crop.hari_ke >= 1 ? 'text-[#1C7430]' : 'text-gray-400'
                        }`}>
                          Bibit
                        </Text>
                      </View>

                      <View className={`flex-1 h-1 mx-1 rounded-full ${
                        crop.hari_ke >= 10 ? 'bg-[#1C7430]' : 'bg-gray-200'
                      }`} />

                      {/* Step 2 */}
                      <View className="items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                          crop.hari_ke >= 10 ? 'bg-[#1C7430] shadow-xs' : 'bg-gray-200'
                        }`}>
                          <Text className="text-xs">🌿</Text>
                        </View>
                        <Text className={`text-[10px] mt-1 font-bold ${
                          crop.hari_ke >= 10 ? 'text-[#1C7430]' : 'text-gray-400'
                        }`}>
                          Vegetatif
                        </Text>
                      </View>

                      <View className={`flex-1 h-1 mx-1 rounded-full ${
                        crop.hari_ke >= 30 ? 'bg-[#1C7430]' : 'bg-gray-200'
                      }`} />

                      {/* Step 3 */}
                      <View className="items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                          crop.hari_ke >= 30 ? 'bg-[#1C7430] shadow-xs' : 'bg-gray-200'
                        }`}>
                          <Text className="text-xs">🌸</Text>
                        </View>
                        <Text className={`text-[10px] mt-1 font-bold ${
                          crop.hari_ke >= 30 ? 'text-[#1C7430]' : 'text-gray-400'
                        }`}>
                          Bunga
                        </Text>
                      </View>

                      <View className={`flex-1 h-1 mx-1 rounded-full ${
                        crop.hari_ke >= 50 ? 'bg-[#1C7430]' : 'bg-gray-200'
                      }`} />

                      {/* Step 4 */}
                      <View className="items-center">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                          crop.hari_ke >= 50 ? 'bg-[#EA580C] shadow-xs' : 'bg-gray-200'
                        }`}>
                          <Text className="text-xs">🌶️</Text>
                        </View>
                        <Text className={`text-[10px] mt-1 font-bold ${
                          crop.hari_ke >= 50 ? 'text-[#EA580C]' : 'text-gray-400'
                        }`}>
                          Panen
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Checklist Section */}
                  <View className="pt-2">
                    <Text className="text-xs font-bold text-gray-900 mb-2.5">
                      Checklist Perawatan Hari Ini:
                    </Text>

                    {/* Siram Checklist */}
                    <TouchableOpacity
                      onPress={() => toggleChecklistSiram(crop.tanaman_aktif_id)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-1.5"
                    >
                      {siramDone ? (
                        <View className="w-5 h-5 rounded-md bg-[#1C7430] items-center justify-center mr-2.5">
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View className="w-5 h-5 rounded-md border-2 border-gray-300 mr-2.5" />
                      )}
                      <Text
                        className={`text-sm ${
                          siramDone
                            ? 'text-gray-400 line-through font-medium'
                            : 'text-gray-800 font-semibold'
                        }`}
                      >
                        Siram pagi / sore
                      </Text>
                    </TouchableOpacity>

                    {/* Cek Kondisi Tanaman Checklist */}
                    <TouchableOpacity
                      onPress={() => toggleKondisi(crop.tanaman_aktif_id)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-1.5"
                    >
                      {kondisiDone ? (
                        <View className="w-5 h-5 rounded-md bg-[#1C7430] items-center justify-center mr-2.5">
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View className="w-5 h-5 rounded-md border-2 border-gray-300 mr-2.5" />
                      )}
                      <Text
                        className={`text-sm ${
                          kondisiDone
                            ? 'text-gray-400 line-through font-medium'
                            : 'text-gray-800 font-semibold'
                        }`}
                      >
                        Cek kelembapan tanah & hama
                      </Text>
                    </TouchableOpacity>

                    {/* Pupuk Checklist */}
                    <TouchableOpacity
                      onPress={() => toggleChecklistPupuk(crop.tanaman_aktif_id)}
                      activeOpacity={0.7}
                      className="flex-row items-center py-1.5"
                    >
                      {pupukDone ? (
                        <View className="w-5 h-5 rounded-md bg-[#1C7430] items-center justify-center mr-2.5">
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View className="w-5 h-5 rounded-md border-2 border-gray-300 mr-2.5" />
                      )}
                      <Text
                        className={`text-sm ${
                          pupukDone
                            ? 'text-gray-400 line-through font-medium'
                            : 'text-gray-800 font-semibold'
                        }`}
                      >
                        Beri pupuk (sesuai siklus)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions Footer: Tandai Gagal & Catat Panen */}
                  <View className="mt-4 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                    <TouchableOpacity
                      onPress={() => handleOpenGagalModal(crop.tanaman_aktif_id)}
                      className="flex-row items-center px-3 py-2 rounded-xl"
                    >
                      <AlertTriangle size={13} color="#9CA3AF" />
                      <Text className="text-[11px] font-semibold text-gray-500 ml-1">
                        Tutup / Gagal
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenPanenModal(crop.tanaman_aktif_id)}
                      className="flex-row items-center bg-[#1C7430] px-4 py-2.5 rounded-xl shadow-xs"
                    >
                      <Scale size={14} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white ml-1.5">
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
                  className="flex-1 py-3 rounded-xl bg-gray-100 items-center justify-center"
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
      </ScrollView>
    </View>
  );
}

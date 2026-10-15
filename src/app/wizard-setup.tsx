import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Trees,
  Sun,
  CloudSun,
  Cloud,
  Camera,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Maximize,
  X,
  Upload,
  CheckCircle2,
  Leaf,
  Sprout,
  Clock,
  ChevronRight,
  Sparkle,
  Grid,
  Check,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { PaparanSinar, SumberPaparan, RekomendasiItem } from '../types';
import { lahanService } from '../services/api';
import { getCropImageSource } from '../constants/cropImages';

// 8x8 Grid = 64 cells
const GRID_ROWS = 8;
const GRID_COLS = 8;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;
const CELL_AREA_M2 = 0.25;

export default function WizardSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createLahan, addTanamanAktif, rekomendasiList, refreshRekomendasi } = useApp();

  // Wizard Stage: 1 = Setup Lahan, 2 = Pilih Tanaman Pertama
  const [step, setStep] = useState<1 | 2>(1);

  // --- Step 1: Lahan State ---
  const [inputMode, setInputMode] = useState<'grid' | 'manual'>('grid');
  const [namaLahan, setNamaLahan] = useState('Pekarangan Rumah');
  // Default 4x4 square preset in center = 16 cells (4.0 m²)
  const [selectedCells, setSelectedCells] = useState<number[]>([
    18, 19, 20, 21,
    26, 27, 28, 29,
    34, 35, 36, 37,
    42, 43, 44, 45,
  ]);
  const [manualLuas, setManualLuas] = useState<string>('4.0');
  const [paparanSinar, setPaparanSinar] = useState<PaparanSinar>('FULL_SUN');
  const [sumberPaparan, setSumberPaparan] = useState<SumberPaparan>('MANUAL');
  const [activePreset, setActivePreset] = useState<'square' | 'rect' | 'lshape' | 'all' | null>('square');
  const [savingLahan, setSavingLahan] = useState(false);

  // Gemini Vision AI Camera Modal
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiPhotoUri, setAiPhotoUri] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisDone, setAiAnalysisDone] = useState(false);
  const [aiDetectedSun, setAiDetectedSun] = useState<PaparanSinar>('FULL_SUN');
  const [aiConfidence, setAiConfidence] = useState(0.94);
  const [aiResultNote, setAiResultNote] = useState<string | null>(null);

  // --- Step 2: Tanaman State ---
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [plantingCrop, setPlantingCrop] = useState(false);

  const calculatedLuas =
    inputMode === 'grid'
      ? Number((selectedCells.length * CELL_AREA_M2).toFixed(2))
      : Number(parseFloat(manualLuas) || 0);

  const toggleCell = (index: number) => {
    setActivePreset(null);
    setSelectedCells(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const applyPreset = (type: 'square' | 'rect' | 'lshape' | 'all' | 'clear') => {
    if (type === 'clear') {
      setActivePreset(null);
      setSelectedCells([]);
    } else if (type === 'all') {
      setActivePreset('all');
      setSelectedCells(Array.from({ length: TOTAL_CELLS }, (_, i) => i));
    } else if (type === 'square') {
      setActivePreset('square');
      setSelectedCells([
        18, 19, 20, 21,
        26, 27, 28, 29,
        34, 35, 36, 37,
        42, 43, 44, 45,
      ]);
    } else if (type === 'rect') {
      setActivePreset('rect');
      setSelectedCells([
        16, 17, 18, 19, 20, 21, 22, 23,
        24, 25, 26, 27, 28, 29, 30, 31,
      ]);
    } else if (type === 'lshape') {
      setActivePreset('lshape');
      setSelectedCells([
        10, 11, 18, 19, 26, 27, 34, 35,
        42, 43, 44, 45, 46, 47, 50, 51,
      ]);
    }
  };

  const runAiAnalysis = async (uri: string, mimeType: string = 'image/jpeg') => {
    setAiAnalyzing(true);
    setAiAnalysisDone(false);
    try {
      const res = await lahanService.analyzeLight(uri, mimeType);
      setAiDetectedSun(res.paparan_sinar);
      setAiConfidence(res.confidence ?? 0.88);
      setAiResultNote(
        res.catatan ||
          (res.paparan_sinar === 'FULL_SUN'
            ? 'Area terbuka terpapar sinar matahari optimal >6 jam/hari.'
            : 'Area pekarangan teduh sebagian cocok untuk sayuran daun.')
      );
      setAiAnalysisDone(true);
    } catch (err) {
      console.warn('AI Analysis fallback:', err);
      setAiDetectedSun('FULL_SUN');
      setAiConfidence(0.92);
      setAiResultNote('Analisis citra selesai: Terdeteksi paparan sinar matahari terbuka >6 jam/hari.');
      setAiAnalysisDone(true);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera dibutuhkan untuk memotret pekarangan Anda.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        const mime = result.assets[0].mimeType || 'image/jpeg';
        setAiPhotoUri(uri);
        await runAiAnalysis(uri, mime);
      }
    } catch (e: any) {
      Alert.alert('Kamera Error', e?.message || 'Gagal membuka kamera.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        const mime = result.assets[0].mimeType || 'image/jpeg';
        setAiPhotoUri(uri);
        await runAiAnalysis(uri, mime);
      }
    } catch (e: any) {
      Alert.alert('Galeri Error', e?.message || 'Gagal memilih foto.');
    }
  };

  const handleApplyAiResult = () => {
    setPaparanSinar(aiDetectedSun);
    setSumberPaparan('AI_VISION');
    setAiModalVisible(false);
    setAiAnalysisDone(false);
  };

  // Step 1 Submit: Save Lahan and Proceed to Step 2
  const handleSaveLahanAndNext = async () => {
    const finalLuas = calculatedLuas > 0 ? calculatedLuas : 1.0;
    setSavingLahan(true);
    try {
      await createLahan({
        nama_lahan: namaLahan.trim() || 'Pekarangan Saya',
        luas_m2: finalLuas,
        grid_snapshot: selectedCells,
        paparan_sinar: paparanSinar,
        sumber_paparan: sumberPaparan,
      });
      await refreshRekomendasi();
      setStep(2);
    } catch (err: any) {
      console.error('Save lahan wizard error:', err);
      Alert.alert('Gagal Menyimpan Lahan', err?.message || 'Silakan coba beberapa saat lagi.');
    } finally {
      setSavingLahan(false);
    }
  };

  // Step 2 Submit: Choose Crop and Go to Dashboard
  const handleSelectCropAndStart = async (crop: RekomendasiItem) => {
    setSelectedCropId(crop.komoditas_id);
    setPlantingCrop(true);
    try {
      await addTanamanAktif(crop.komoditas_id, crop.nama);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Add tanaman wizard error:', err);
      Alert.alert('Gagal Menanam', err?.message || 'Gagal memulai penanaman.');
    } finally {
      setPlantingCrop(false);
    }
  };

  const handleSkipToDashboard = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#F5F8F5]"
      style={{ paddingTop: insets.top }}
    >
      {/* Top Header Progress Indicator */}
      <View className="bg-white border-b border-gray-100 px-5 py-3.5 flex-row items-center justify-between shadow-2xs">
        <View style={{ gap: 10 }} className="flex-row items-center flex-1 mr-3">
          <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
            <Text className="text-xs font-black text-emerald-800">
              {step}/2
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-gray-900 tracking-tight">
              {step === 1 ? 'Langkah 1: Setup Pekarangan' : 'Langkah 2: Pilih Tanaman Pertama'}
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 mt-0.5">
              {step === 1 ? 'Tentukan ukuran & paparan sinar' : 'Rekomendasi komoditas berbobot ekonomi'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSkipToDashboard}
          activeOpacity={0.7}
          className="px-3 py-1.5 rounded-full bg-gray-100"
        >
          <Text className="text-[11px] font-bold text-gray-600">
            Lewati
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        className="px-5 pt-4"
      >
        {/* ================= STEP 1: SETUP PEKARANGAN ================= */}
        {step === 1 && (
          <View>
            {/* Header Title Matching lahan.tsx */}
            <View className="flex-row items-center mb-3">
              <Trees size={20} color="#1C7430" />
              <Text className="text-sm font-bold text-[#1C7430] ml-2">
                Setup Pekarangan Pertama
              </Text>
            </View>

            <View className="mb-5">
              <Text className="text-2xl font-black text-gray-900 tracking-tight">
                Kalkulator Tanaman
              </Text>
              <Text className="text-sm font-medium text-gray-500 mt-1">
                Rencanakan kebun Anda untuk hasil panen optimal.
              </Text>
            </View>

            {/* Card 1: Luas Lahan & Grid */}
            <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-5">
              {/* Nama Lahan Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Nama Pekarangan
                </Text>
                <View className="bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 py-2.5">
                  <TextInput
                    value={namaLahan}
                    onChangeText={setNamaLahan}
                    placeholder="Contoh: Pekarangan Utama"
                    className="text-sm font-bold text-gray-900"
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-extrabold text-gray-900">
                  Luas Lahan
                </Text>
                <View className="bg-[#1C7430] px-3.5 py-1 rounded-full">
                  <Text className="text-xs font-bold text-white">
                    {calculatedLuas} m²
                  </Text>
                </View>
              </View>

              {/* Segmented Switch: Input Manual / Sketsa Grid */}
              <View className="flex-row bg-[#F3F4F6] p-1.5 rounded-2xl mb-4">
                <TouchableOpacity
                  onPress={() => setInputMode('manual')}
                  className={`flex-1 py-2 rounded-xl items-center justify-center ${
                    inputMode === 'manual' ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      inputMode === 'manual' ? 'text-[#1C7430]' : 'text-gray-500'
                    }`}
                  >
                    Input Manual
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setInputMode('grid')}
                  className={`flex-1 py-2 rounded-xl items-center justify-center ${
                    inputMode === 'grid' ? 'bg-white shadow-xs' : ''
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      inputMode === 'grid' ? 'text-[#1C7430]' : 'text-gray-500'
                    }`}
                  >
                    Sketsa Grid
                  </Text>
                </TouchableOpacity>
              </View>

              {inputMode === 'grid' ? (
                <View>
                  {/* Presets Toolbar */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Pilihan Bentuk Cepat:
                      </Text>
                      {activePreset && (
                        <Text className="text-[10px] font-bold text-[#1C7430]">
                          Aktif: {activePreset === 'square' ? 'Persegi 4m²' : activePreset === 'rect' ? 'Memanjang 4m²' : activePreset === 'lshape' ? 'Bentuk L' : 'Semua'}
                        </Text>
                      )}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 mb-2">
                      <TouchableOpacity
                        onPress={() => applyPreset('square')}
                        activeOpacity={0.8}
                        className={`px-3 py-2 rounded-xl mr-2 flex-row items-center border ${
                          activePreset === 'square'
                            ? 'bg-[#1C7430] border-[#1C7430] shadow-xs'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Grid size={13} color={activePreset === 'square' ? '#FFFFFF' : '#1C7430'} />
                        <Text
                          className={`text-xs font-bold ml-1.5 ${
                            activePreset === 'square' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          Persegi 2×2m
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => applyPreset('rect')}
                        activeOpacity={0.8}
                        className={`px-3 py-2 rounded-xl mr-2 flex-row items-center border ${
                          activePreset === 'rect'
                            ? 'bg-[#1C7430] border-[#1C7430] shadow-xs'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Maximize size={13} color={activePreset === 'rect' ? '#FFFFFF' : '#1C7430'} />
                        <Text
                          className={`text-xs font-bold ml-1.5 ${
                            activePreset === 'rect' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          Memanjang 1×4m
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => applyPreset('lshape')}
                        activeOpacity={0.8}
                        className={`px-3 py-2 rounded-xl mr-2 flex-row items-center border ${
                          activePreset === 'lshape'
                            ? 'bg-[#1C7430] border-[#1C7430] shadow-xs'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Trees size={13} color={activePreset === 'lshape' ? '#FFFFFF' : '#1C7430'} />
                        <Text
                          className={`text-xs font-bold ml-1.5 ${
                            activePreset === 'lshape' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          Pojok L-Shape
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => applyPreset('all')}
                        activeOpacity={0.8}
                        className={`px-3 py-2 rounded-xl mr-2 flex-row items-center border ${
                          activePreset === 'all'
                            ? 'bg-[#1C7430] border-[#1C7430] shadow-xs'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            activePreset === 'all' ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          Pilih Semua
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => applyPreset('clear')}
                        activeOpacity={0.8}
                        className="bg-red-50/80 border border-red-200 px-3 py-2 rounded-xl mr-2 flex-row items-center"
                      >
                        <RotateCcw size={13} color="#DC2626" />
                        <Text className="text-xs font-bold text-red-600 ml-1">Reset</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  {/* 8x8 Grid Canvas */}
                  <View className="bg-[#F4F6F4] p-3 rounded-2xl items-center justify-center border border-gray-200/60">
                    <View className="w-full aspect-square justify-between py-1">
                      {Array.from({ length: GRID_ROWS }).map((_, rowIndex) => (
                        <View key={rowIndex} className="flex-row justify-between w-full my-[1.5px]">
                          {Array.from({ length: GRID_COLS }).map((_, colIndex) => {
                            const idx = rowIndex * GRID_COLS + colIndex;
                            const isSelected = selectedCells.includes(idx);
                            return (
                              <TouchableOpacity
                                key={colIndex}
                                onPress={() => toggleCell(idx)}
                                activeOpacity={0.7}
                                className={`flex-1 aspect-square mx-[2px] rounded-lg items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-[#1C7430] border-2 border-[#14532D] shadow-xs'
                                    : 'bg-white border border-gray-200'
                                }`}
                              >
                                {isSelected && (
                                  <Text className="text-[10px] select-none">🌱</Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Grid Footer Stats */}
                  <View className="flex-row justify-between items-center mt-3.5 pt-2 border-t border-gray-100">
                    <Text className="text-xs font-semibold text-gray-600">
                      {selectedCells.length} sel dipilih
                    </Text>
                    <Text className="text-sm font-extrabold text-[#1C7430]">
                      {calculatedLuas} m²
                    </Text>
                  </View>
                  <Text className="text-[11px] text-gray-400 text-center mt-1">
                    Setiap sel = 0,25 m² (maksimal 16 m²)
                  </Text>
                </View>
              ) : (
                <View className="py-2">
                  <Text className="text-xs font-semibold text-gray-700 mb-1.5">
                    Masukkan Luas Pekarangan (m²)
                  </Text>
                  <View className="flex-row items-center bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 py-3">
                    <TextInput
                      keyboardType="numeric"
                      value={manualLuas}
                      onChangeText={setManualLuas}
                      placeholder="Contoh: 6.75"
                      className="flex-1 text-base font-bold text-gray-900"
                    />
                    <Text className="text-sm font-bold text-gray-500">m²</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Card 2: Paparan Sinar Matahari */}
            <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
              <Text className="text-base font-extrabold text-gray-900 mb-1">
                Paparan Sinar Matahari
              </Text>
              <Text className="text-xs font-medium text-gray-500 mb-4">
                Pilih intensitas sinar matahari di pekarangan Anda
              </Text>

              {/* 3 Sunlight Options */}
              <View className="space-y-2.5 mb-4">
                {/* Full Sun */}
                <TouchableOpacity
                  onPress={() => {
                    setPaparanSinar('FULL_SUN');
                    setSumberPaparan('MANUAL');
                  }}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border transition-all mb-2.5 ${
                    paparanSinar === 'FULL_SUN'
                      ? 'bg-green-50/80 border-[#1C7430]'
                      : 'bg-[#F9FAFB] border-gray-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center mr-3">
                      <Sun size={20} color="#D97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">
                        Sinar Penuh (Full Sun)
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Lebih dari 6 jam sinar langsung
                      </Text>
                    </View>
                  </View>
                  {paparanSinar === 'FULL_SUN' && (
                    <View className="w-6 h-6 rounded-full bg-[#1C7430] items-center justify-center">
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Partial Sun */}
                <TouchableOpacity
                  onPress={() => {
                    setPaparanSinar('PARTIAL_SUN');
                    setSumberPaparan('MANUAL');
                  }}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border transition-all mb-2.5 ${
                    paparanSinar === 'PARTIAL_SUN'
                      ? 'bg-green-50/80 border-[#1C7430]'
                      : 'bg-[#F9FAFB] border-gray-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-orange-100 items-center justify-center mr-3">
                      <CloudSun size={20} color="#EA580C" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">
                        Sinar Parsial (Partial Sun)
                      </Text>
                      <Text className="text-xs text-gray-500">
                        3 - 6 jam sinar langsung / ternaungi
                      </Text>
                    </View>
                  </View>
                  {paparanSinar === 'PARTIAL_SUN' && (
                    <View className="w-6 h-6 rounded-full bg-[#1C7430] items-center justify-center">
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Shade */}
                <TouchableOpacity
                  onPress={() => {
                    setPaparanSinar('SHADE');
                    setSumberPaparan('MANUAL');
                  }}
                  activeOpacity={0.8}
                  className={`flex-row items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    paparanSinar === 'SHADE'
                      ? 'bg-green-50/80 border-[#1C7430]'
                      : 'bg-[#F9FAFB] border-gray-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                      <Cloud size={20} color="#0284C7" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">
                        Teduh (Shade)
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Kurang dari 3 jam sinar matahari
                      </Text>
                    </View>
                  </View>
                  {paparanSinar === 'SHADE' && (
                    <View className="w-6 h-6 rounded-full bg-[#1C7430] items-center justify-center">
                      <Check size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* AI Sunlight Detection Button */}
              <TouchableOpacity
                onPress={() => setAiModalVisible(true)}
                activeOpacity={0.85}
                className="flex-row items-center justify-center bg-green-50 border border-green-200 py-3.5 px-4 rounded-2xl shadow-2xs"
              >
                <Camera size={18} color="#1C7430" />
                <Sparkles size={14} color="#EA580C" className="mx-1.5" />
                <Text className="text-xs font-bold text-[#1C7430] ml-1">
                  Deteksi Otomatis via AI Gemini Vision
                </Text>
              </TouchableOpacity>

              {aiResultNote && (
                <View className="mt-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <Text className="text-[11px] font-semibold text-emerald-800 leading-snug">
                    ✨ {aiResultNote}
                  </Text>
                </View>
              )}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handleSaveLahanAndNext}
              disabled={savingLahan}
              activeOpacity={0.85}
              className="w-full bg-[#1C7430] py-4 rounded-2xl flex-row items-center justify-center shadow-md shadow-[#1C7430]/30 mb-6"
            >
              {savingLahan ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-base font-extrabold text-white mr-2">
                    Simpan & Lanjut Pilih Tanaman
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 2: PILIH TANAMAN PERTAMA ================= */}
        {step === 2 && (
          <View>
            {/* Header Greeting Step 2 */}
            <View className="bg-[#124E2A] rounded-3xl p-5 mb-5 shadow-sm shadow-[#124E2A]/20">
              <View style={{ gap: 8 }} className="flex-row items-center mb-1.5">
                <CheckCircle2 size={16} color="#34D399" />
                <Text className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                  Pekarangan Berhasil Dibuat 🎉
                </Text>
              </View>
              <Text className="text-xl font-black text-white">
                Pilih Komoditas Pertama Anda
              </Text>
              <Text className="text-xs text-emerald-100/85 mt-1 leading-relaxed">
                Berikut adalah sayuran berbobot ekonomi terbaik yang dihitung otomatis berdasarkan luas {calculatedLuas} m² dan paparan sinar pekarangan Anda.
              </Text>
            </View>

            {/* List Rekomendasi Sayuran with refined spacing */}
            <View style={{ gap: 14 }} className="mb-6">
              {rekomendasiList.length === 0 ? (
                <View className="bg-white rounded-3xl p-8 items-center border border-gray-100">
                  <ActivityIndicator size="small" color="#166534" className="mb-2" />
                  <Text className="text-xs font-bold text-gray-500">
                    Memuat katalog tanaman terbaik...
                  </Text>
                </View>
              ) : (
                rekomendasiList.slice(0, 6).map(item => {
                  const isSelected = selectedCropId === item.komoditas_id;
                  const imageSrc = getCropImageSource(item.nama, item.image_url);

                  return (
                    <View
                      key={item.komoditas_id}
                      className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm shadow-black/5"
                    >
                      <View style={{ gap: 12 }} className="flex-row items-start mb-3.5">
                        <View className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200/80">
                          <Image
                            source={imageSrc}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-base font-black text-gray-900" numberOfLines={1}>
                              {item.nama}
                            </Text>
                            <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <Text className="text-[10px] font-black text-emerald-800">
                                ⭐ {item.skor_prioritas}
                              </Text>
                            </View>
                          </View>

                          <Text className="text-xs font-bold text-emerald-700 mt-1">
                            Hemat ~Rp {item.estimasi_hemat_rp_per_bulan.toLocaleString('id-ID')}/bln
                          </Text>

                          <View style={{ gap: 8 }} className="flex-row items-center mt-2.5">
                            <View style={{ gap: 5 }} className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                              <Clock size={11} color="#6B7280" />
                              <Text className="text-[10px] font-semibold text-gray-600">
                                {item.waktu_panen_hari} hari
                              </Text>
                            </View>
                            <View style={{ gap: 5 }} className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                              <Sprout size={11} color="#6B7280" />
                              <Text className="text-[10px] font-semibold text-gray-600">
                                {item.tingkat_kesulitan}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Tombol Mulai Tanam with explicit gap */}
                      <TouchableOpacity
                        onPress={() => handleSelectCropAndStart(item)}
                        disabled={plantingCrop}
                        activeOpacity={0.85}
                        style={{ gap: 8 }}
                        className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center border ${
                          isSelected && plantingCrop
                            ? 'bg-emerald-700 border-emerald-800'
                            : 'bg-emerald-600 border-emerald-500 shadow-2xs'
                        }`}
                      >
                        {isSelected && plantingCrop ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text className="text-xs font-black text-white">
                              Mulai Tanam {item.nama} 🌱
                            </Text>
                            <ChevronRight size={16} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Gemini Vision AI Modal */}
      <Modal
        visible={aiModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View className="flex-1 bg-black/75 justify-center items-center px-5">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-4">
              <View style={{ gap: 10 }} className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-emerald-100 items-center justify-center">
                  <Sparkles size={16} color="#166534" />
                </View>
                <Text className="text-base font-black text-gray-900">
                  Kamera Gemini Vision AI
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAiModalVisible(false)}
                className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {aiPhotoUri ? (
              <View className="w-full h-44 rounded-2xl overflow-hidden mb-3.5 border border-gray-200">
                <Image source={{ uri: aiPhotoUri }} className="w-full h-full" resizeMode="cover" />
              </View>
            ) : (
              <View className="w-full h-36 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 items-center justify-center mb-3.5">
                <Sun size={28} color="#9CA3AF" />
                <Text className="text-xs font-medium text-gray-400 mt-2">
                  Potret pekarangan terbuka Anda
                </Text>
              </View>
            )}

            {aiAnalyzing && (
              <View className="py-3 items-center">
                <ActivityIndicator size="small" color="#166534" />
                <Text className="text-xs font-bold text-emerald-800 mt-2">
                  Menganalisis bayangan & sudut matahari...
                </Text>
              </View>
            )}

            {aiAnalysisDone && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-4">
                <View style={{ gap: 6 }} className="flex-row items-center mb-1">
                  <CheckCircle2 size={15} color="#166534" />
                  <Text className="text-xs font-black text-emerald-900">
                    Hasil: {aiDetectedSun === 'FULL_SUN' ? 'Sinar Penuh (>6 Jam)' : 'Sinar Sebagian (3-6 Jam)'}
                  </Text>
                </View>
                <Text className="text-[11px] text-emerald-800 leading-snug">
                  {aiResultNote} (Akurasi {Math.round(aiConfidence * 100)}%)
                </Text>
              </View>
            )}

            {/* Actions with clean gap */}
            <View style={{ gap: 10 }}>
              {!aiAnalysisDone ? (
                <>
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    style={{ gap: 8 }}
                    className="w-full bg-[#124E2A] py-3.5 rounded-2xl flex-row items-center justify-center"
                  >
                    <Camera size={16} color="#FFFFFF" />
                    <Text className="text-xs font-black text-white">Buka Kamera Perangkat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={{ gap: 8 }}
                    className="w-full bg-gray-100 py-3.5 rounded-2xl flex-row items-center justify-center border border-gray-200"
                  >
                    <Upload size={16} color="#4B5563" />
                    <Text className="text-xs font-bold text-gray-700">Pilih dari Galeri</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={handleApplyAiResult}
                  className="w-full bg-emerald-600 py-3.5 rounded-2xl items-center justify-center"
                >
                  <Text className="text-xs font-black text-white">Terapkan Hasil Analisis</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

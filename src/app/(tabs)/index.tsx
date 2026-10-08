import React from 'react';
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
  CheckCircle2,
  Circle,
  ChevronRight,
  Flame,
  Sparkles,
  Grid,
  Sun,
  Plus,
  ArrowRight,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';

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
    reminders,
  } = useApp();

  const activeOnlyCrops = activeCrops.filter(c => c.status === 'AKTIF');
  const isSiramDone =
    activeOnlyCrops.length > 0 &&
    activeOnlyCrops.every(c => c.checklist_hari_ini?.siram_done);
  const isPupukDone =
    activeOnlyCrops.length > 0 &&
    activeOnlyCrops.every(c => c.checklist_hari_ini?.pupuk_done);

  const activeReminderList = reminders.filter(r => r.enabled);
  const nextReminder = activeReminderList[0] || reminders[0];
  const nextReminderTimeStr = nextReminder
    ? `${String(nextReminder.hour).padStart(2, '0')}:${String(nextReminder.minute).padStart(2, '0')} WIB`
    : '16:30 WIB';

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
      className="flex-1 bg-[#F8FAF8]"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="px-5 pt-2"
      >
        {/* Top Bar Location & Streak Pill */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mr-2">
              <MapPin size={18} color="#1C7430" />
            </View>
            <View>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Lokasi Pilot
              </Text>
              <Text className="text-xs font-bold text-gray-900">
                {user?.wilayah || 'Jakarta Selatan'}
              </Text>
            </View>
          </View>

          {/* Streak Pill */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/tracking')}
            activeOpacity={0.8}
            className="flex-row items-center bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1 rounded-full"
          >
            <Flame size={14} color="#EA580C" fill="#EA580C" />
            <Text className="text-xs font-black text-[#EA580C] ml-1">
              {stats.streak_hari} Hari
            </Text>
          </TouchableOpacity>
        </View>

        {/* Greeting Banner */}
        <View className="mb-5">
          <Text className="text-2xl font-black text-gray-900 tracking-tight">
            Selamat Pagi, {user?.nama?.split(' ')[0] || 'Alex'} 👋
          </Text>
          <Text className="text-xs font-medium text-gray-500 mt-1">
            Pantau dan rawat pekarangan mandiri Anda hari ini.
          </Text>
        </View>

        {/* Hero Green Stats Card (RTH & Hemat Belanja) */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.92}
          className="bg-[#1C7430] rounded-3xl p-6 shadow-md shadow-[#1C7430]/30 mb-6"
        >
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-xs font-semibold text-green-100 uppercase tracking-wider">
                Total Hemat Belanja
              </Text>
              <Text className="text-3xl font-black text-white mt-1 tracking-tight">
                {formatRupiah(stats.total_hemat_rp)}
              </Text>
            </View>

            <View className="w-11 h-11 rounded-2xl bg-white/15 items-center justify-center border border-white/20">
              <Leaf size={22} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-white/20 my-4" />

          {/* Card Footer: RTH Aktif & Total Panen */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lahan')}
              className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-xl"
            >
              <Trees size={16} color="#A7F3D0" />
              <Text className="text-xs font-semibold text-green-100 ml-1.5">
                RTH Pekarangan: <Text className="font-bold text-white">{activeRth} m²</Text>
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-green-100">
                Panen: <Text className="font-black text-white">{stats.total_panen_kg} kg</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weather & Solar UV Widget */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.88}
          className="bg-[#FFFBEB] border border-[#FDE68A] rounded-3xl p-4 mb-6 flex-row items-center justify-between shadow-2xs"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-10 h-10 rounded-2xl bg-[#F59E0B] items-center justify-center mr-3 shadow-xs">
              <Sun size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-xs font-black text-[#92400E]">
                  31°C Cerah Berawan
                </Text>
                <View className="bg-amber-200 px-1.5 py-0.5 rounded-md ml-2">
                  <Text className="text-[9px] font-extrabold text-[#78350F]">
                    UV Tinggi
                  </Text>
                </View>
              </View>
              <Text className="text-[11px] text-[#B45309] font-medium mt-0.5 leading-snug">
                Suhu hangat. Alarm siram aktif: <Text className="font-bold text-[#92400E]">{nextReminder?.label || 'Siram'} ({nextReminderTimeStr}) 🔔</Text>
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#D97706" />
        </TouchableOpacity>

        {/* Quick Stepper Guide Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-extrabold text-gray-900">
              Alur Panduan Pekarangan
            </Text>
            <Badge label="Smart Loop" variant="success" size="sm" />
          </View>

          <View className="space-y-2.5">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lahan')}
              className="flex-row items-center justify-between p-3 rounded-2xl bg-green-50/60 border border-green-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-green-100 items-center justify-center mr-2.5">
                  <Grid size={16} color="#1C7430" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">1. Sketsa & Cek Sinar Lahan</Text>
                  <Text className="text-[11px] text-gray-500">
                    {activeLahan?.nama_lahan || 'Pekarangan Utama'} ({activeRth} m²)
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#1C7430" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rekomendasi')}
              className="flex-row items-center justify-between p-3 rounded-2xl bg-[#F9FAFB] border border-gray-100"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-amber-100 items-center justify-center mr-2.5">
                  <Sparkles size={16} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-gray-900">2. Pilih Rekomendasi Tanaman</Text>
                  <Text className="text-[11px] text-gray-500">Prioritas tanaman hemat biaya tertinggi</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Tugas Hari Ini */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-extrabold text-gray-900">
              Tugas Hari Ini
            </Text>
            <Text className="text-xs font-bold text-[#1C7430]">
              {(isSiramDone ? 1 : 0) + (isPupukDone ? 1 : 0)}/2 Selesai
            </Text>
          </View>

          <View className="flex-row space-x-3">
            {/* Task Card 1: Siram Tanaman */}
            <TouchableOpacity
              onPress={handleToggleSiram}
              activeOpacity={0.8}
              className={`flex-1 p-4 rounded-2xl border transition-all ${
                isSiramDone
                  ? 'bg-green-50/80 border-green-300 shadow-2xs'
                  : 'bg-white border-gray-100 shadow-xs'
              }`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 rounded-full bg-[#FFEDD5] items-center justify-center">
                  <Droplets size={20} color="#EA580C" />
                </View>
                {isSiramDone ? (
                  <CheckCircle2 size={22} color="#1C7430" fill="#DCFCE7" />
                ) : (
                  <Circle size={22} color="#D1D5DB" />
                )}
              </View>

              <Text className="text-sm font-bold text-gray-900">
                Siram Tanaman
              </Text>
              <Text className="text-xs font-medium text-gray-500 mt-0.5">
                {isSiramDone ? 'Sudah disiram ✅' : 'Pagi / Sore'}
              </Text>
            </TouchableOpacity>

            {/* Task Card 2: Beri Pupuk */}
            <TouchableOpacity
              onPress={handleTogglePupuk}
              activeOpacity={0.8}
              className={`flex-1 p-4 rounded-2xl border transition-all ${
                isPupukDone
                  ? 'bg-green-50/80 border-green-300 shadow-2xs'
                  : 'bg-white border-gray-100 shadow-xs'
              }`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 rounded-full bg-[#FCE7F3] items-center justify-center">
                  <Sprout size={20} color="#DB2777" />
                </View>
                {isPupukDone ? (
                  <CheckCircle2 size={22} color="#1C7430" fill="#DCFCE7" />
                ) : (
                  <Circle size={22} color="#D1D5DB" />
                )}
              </View>

              <Text className="text-sm font-bold text-gray-900">
                Beri Pupuk
              </Text>
              <Text className="text-xs font-medium text-gray-500 mt-0.5">
                {isPupukDone ? 'Sudah dipupuk ✅' : 'Sesuai Siklus'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Tanaman Saya */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-lg font-extrabold text-gray-900">
              Tanaman Saya
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tracking')}
              className="flex-row items-center"
            >
              <Text className="text-xs font-bold text-[#1C7430] mr-1">
                Lihat Semua ({activeOnlyCrops.length})
              </Text>
              <ChevronRight size={14} color="#1C7430" />
            </TouchableOpacity>
          </View>

          {/* Plant Cards Grid or Empty State */}
          {activeOnlyCrops.length === 0 ? (
            <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm items-center">
              <View className="w-12 h-12 rounded-2xl bg-green-50 items-center justify-center mb-2.5">
                <Sprout size={24} color="#1C7430" />
              </View>
              <Text className="text-sm font-bold text-gray-900 text-center">
                Belum Ada Tanaman Aktif
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-1 mb-4">
                Pilih tanaman dari rekomendasi untuk mulai berkebun di pekarangan Anda.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/rekomendasi')}
                className="flex-row items-center bg-[#1C7430] px-4 py-2.5 rounded-xl shadow-xs"
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-xs font-bold text-white ml-1.5">
                  Tanam Sekarang
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row space-x-3">
              {activeOnlyCrops.slice(0, 2).map((crop) => (
                <TouchableOpacity
                  key={crop.tanaman_aktif_id}
                  onPress={() => router.push('/(tabs)/tracking')}
                  activeOpacity={0.9}
                  className="flex-1 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs"
                >
                  {/* Image Banner */}
                  <View className="relative h-32 w-full bg-gray-100">
                    <Image
                      source={{ uri: crop.image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    {crop.persentase_hari && crop.persentase_hari >= 70 && (
                      <View className="absolute top-2.5 right-2.5">
                        <Badge label="Siap Panen" variant="outline" size="sm" />
                      </View>
                    )}
                  </View>

                  {/* Card Details */}
                  <View className="p-4">
                    <Text className="text-base font-extrabold text-gray-900 capitalize">
                      {crop.komoditas_nama}
                    </Text>

                    {/* Progress Stats */}
                    <View className="flex-row justify-between items-center mt-2.5 mb-1.5">
                      <Text className="text-xs font-semibold text-gray-500">
                        {crop.fase || 'Vegetatif'}
                      </Text>
                      <Text className="text-xs font-bold text-[#1C7430]">
                        {crop.persentase_hari || 50}%
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
                      <View
                        style={{ width: `${crop.persentase_hari || 50}%` }}
                        className="h-full bg-[#1C7430] rounded-full"
                      />
                    </View>

                    <View className="mt-2.5 flex-row items-center justify-between">
                      <Text className="text-[10px] text-gray-400 font-medium">
                        Hari ke-{crop.hari_ke}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-[10px] font-bold text-[#1C7430] mr-0.5">
                          Rawat
                        </Text>
                        <ArrowRight size={10} color="#1C7430" />
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

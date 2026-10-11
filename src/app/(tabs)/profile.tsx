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
  User as UserIcon,
  Sprout,
  PiggyBank,
  Trees,
  HeartHandshake,
  LogOut,
  MapPin,
  Mail,
  Leaf,
  Award,
  CheckCircle2,
  Lock,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    stats,
    logout,
    lahans,
    activeCrops,
  } = useApp();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const activeOnlyCrops = activeCrops.filter(c => c.status === 'AKTIF');

  const formattedJoinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Oktober 2026';

  const ACHIEVEMENTS = [
    {
      id: 1,
      icon: '🥇',
      title: 'Panen Perdana',
      desc: 'Berhasil panen pertama kali',
      unlocked: stats.total_panen_kg > 0,
      badgeColor: 'bg-amber-100 border-amber-300 text-amber-900',
    },
    {
      id: 2,
      icon: '💰',
      title: 'Hemat Rp 100k',
      desc: `Total hemat: Rp ${(stats.total_hemat_rp / 1000).toFixed(0)}k`,
      unlocked: stats.total_hemat_rp >= 100000,
      badgeColor: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    },
    {
      id: 3,
      icon: '🌿',
      title: 'Pejuang RTH',
      desc: `${stats.rth_aktif_m2}m² pekarangan hijau`,
      unlocked: stats.rth_aktif_m2 >= 5,
      badgeColor: 'bg-green-100 border-green-300 text-green-900',
    },
    {
      id: 4,
      icon: '🌶️',
      title: 'Master Cabai',
      desc: 'Panen >500g cabai pekarangan',
      unlocked: false,
      progressText: '0g / 500g',
      badgeColor: 'bg-gray-100 border-gray-200 text-gray-500',
    },
  ];

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
        {/* Screen Header */}
        <View className="flex-row items-center mb-5">
          <UserIcon size={20} color="#1C7430" />
          <Text className="text-sm font-bold text-[#1C7430] ml-2">
            Profil Anda
          </Text>
        </View>

        {/* User Identity Section */}
        <View className="items-center mb-6">
          <View className="relative mb-3">
            <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md shadow-black/10 bg-green-100 items-center justify-center">
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl font-black text-[#1C7430]">
                  {user?.nama ? user.nama.charAt(0).toUpperCase() : 'P'}
                </Text>
              )}
            </View>
          </View>

          <Text className="text-2xl font-black text-gray-900 tracking-tight text-center">
            {user?.nama || 'Pengguna Pekarang.in'}
          </Text>
          <Text className="text-xs font-semibold text-gray-500 mt-0.5">
            {user?.email || 'email@pekarang.in'}
          </Text>

          {/* Badges Row */}
          <View className="mt-2.5 flex-row items-center">
            <View className="flex-row items-center bg-[#1C7430] px-3.5 py-1.5 rounded-full shadow-xs">
              <Leaf size={13} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-1.5 tracking-wide">
                Urban Farmer
              </Text>
            </View>
          </View>
        </View>

        {/* 3-Column Compact Metric Grid */}
        <View className="flex-row gap-2 mb-6">
          {/* Col 1: Total Panen */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center mb-1.5">
              <Sprout size={18} color="#166534" />
            </View>
            <Text className="text-base font-black text-gray-900">
              {stats.total_panen_kg} kg
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 mt-0.5 text-center">
              Total Panen
            </Text>
          </View>

          {/* Col 2: Hemat Belanja */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center mb-1.5">
              <PiggyBank size={18} color="#166534" />
            </View>
            <Text className="text-base font-black text-gray-900">
              Rp {(stats.total_hemat_rp / 1000).toFixed(0)}k
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 mt-0.5 text-center">
              Hemat Belanja
            </Text>
          </View>

          {/* Col 3: RTH Aktif */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center mb-1.5">
              <Trees size={18} color="#166534" />
            </View>
            <Text className="text-base font-black text-gray-900">
              {stats.rth_aktif_m2} m²
            </Text>
            <Text className="text-[10px] font-semibold text-gray-400 mt-0.5 text-center">
              RTH Aktif
            </Text>
          </View>
        </View>

        {/* Section: Detail Informasi Akun Terperinci */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <View>
              <Text className="text-sm font-black text-gray-900">
                Detail Informasi Akun
              </Text>
              <Text className="text-[11px] font-medium text-gray-400 mt-0.5">
                Data identitas & kredensial terdaftar
              </Text>
            </View>
            <View className="bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <Text className="text-[10px] font-bold text-emerald-800">
                Terverifikasi
              </Text>
            </View>
          </View>

          <View style={{ gap: 14 }}>
            {/* Nama Lengkap */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-2.5 border border-gray-100">
                  <UserIcon size={14} color="#4B5563" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Nama Lengkap
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900 max-w-[55%] text-right" numberOfLines={1}>
                {user?.nama || '-'}
              </Text>
            </View>

            {/* Email */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-2.5 border border-gray-100">
                  <Mail size={14} color="#4B5563" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Alamat Email
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900 max-w-[55%] text-right" numberOfLines={1}>
                {user?.email || '-'}
              </Text>
            </View>

            {/* Wilayah / Lokasi */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-2.5 border border-gray-100">
                  <MapPin size={14} color="#4B5563" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Wilayah Pekarangan
                </Text>
              </View>
              <Text className="text-xs font-bold text-emerald-800 max-w-[55%] text-right" numberOfLines={2}>
                {user?.wilayah || 'Belum diatur (D.I. Yogyakarta)'}
              </Text>
            </View>

            {/* Tanggal Bergabung */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-2.5 border border-gray-100">
                  <Calendar size={14} color="#4B5563" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Anggota Sejak
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900">
                {formattedJoinDate}
              </Text>
            </View>


            {/* Status Pekarangan */}
            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-emerald-50 items-center justify-center mr-2.5 border border-emerald-100">
                  <Layers size={14} color="#166534" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Kelola Pekarangan
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900">
                {lahans.length} Lahan • {activeOnlyCrops.length} Tanaman Aktif
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Pencapaian & Lencana */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center">
              <Award size={18} color="#1C7430" />
              <Text className="text-sm font-extrabold text-gray-900 ml-2">
                Pencapaian Pekarangan
              </Text>
            </View>
            <Text className="text-xs font-bold text-[#1C7430]">
              {ACHIEVEMENTS.filter(a => a.unlocked).length}/{ACHIEVEMENTS.length} Terbuka
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {ACHIEVEMENTS.map(item => (
              <View
                key={item.id}
                style={{ width: '48%' }}
                className={`p-3.5 rounded-2xl border mb-3 ${
                  item.unlocked
                    ? 'bg-green-50/50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-2xl">{item.icon}</Text>
                  {item.unlocked ? (
                    <CheckCircle2 size={16} color="#166534" />
                  ) : (
                    <Lock size={14} color="#9CA3AF" />
                  )}
                </View>
                <Text className="text-xs font-bold text-gray-900">
                  {item.title}
                </Text>
                <Text className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  {item.desc}
                </Text>
                {item.progressText && (
                  <View className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <View className="w-[70%] h-full bg-[#1C7430] rounded-full" />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Environmental Impact Banner (Orange Card) */}
        <View className="bg-[#FFEDD5] border border-[#FED7AA] rounded-3xl p-4 mb-6 flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-[#EA580C] items-center justify-center mr-3 shadow-xs">
            <HeartHandshake size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-extrabold text-[#9A3412]">
              Kontribusi Lingkungan
            </Text>
            <Text className="text-[11px] font-medium text-[#C2410C] mt-0.5 leading-snug">
              Anda menyumbang {stats.kontribusi_lingkungan_persen}% dari target RTH mandiri komunitas perkotaan.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          className="flex-row items-center justify-center bg-red-50 border border-red-200 py-3.5 px-4 rounded-2xl"
        >
          <LogOut size={16} color="#DC2626" />
          <Text className="text-xs font-bold text-red-600 ml-2">
            Keluar dari Akun
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

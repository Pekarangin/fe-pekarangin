import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
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
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Plus,
  Trash2,
  X,
  Circle,
  ExternalLink,
  Edit3,
  Phone,
  Save,
  Search,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { PaparanSinar } from '../../types';
import { wilayahService, WilayahItem } from '../../services/api';

type WilayahLevel = 'PROVINSI' | 'KOTA' | 'KECAMATAN' | 'KELURAHAN';

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const formatRupiah = (num: number) => {
    return 'Rp ' + (num || 0).toLocaleString('id-ID');
  };
  const {
    user,
    stats,
    logout,
    lahans,
    activeLahan,
    setActiveLahan,
    deleteLahan,
    activeCrops,
    startTour,
    updateUserProfile,
  } = useApp();

  const [isKelolaModalOpen, setIsKelolaModalOpen] = useState(false);

  // Edit Profile States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editNama, setEditNama] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editWilayah, setEditWilayah] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Wilayah Picker States in Edit Profile
  const [wilayahModalVisible, setWilayahModalVisible] = useState(false);
  const [wilayahLevel, setWilayahLevel] = useState<WilayahLevel>('KOTA');
  const [loadingWilayah, setLoadingWilayah] = useState(false);
  const [wilayahSearch, setWilayahSearch] = useState('');
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<WilayahItem>({
    id: '34',
    name: 'D.I. YOGYAKARTA',
  });
  const [selectedRegency, setSelectedRegency] = useState<WilayahItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<WilayahItem | null>(null);

  const handleOpenEditProfile = () => {
    setEditNama(user?.nama || '');
    setEditNoHp(user?.no_hp || '');
    setEditWilayah(user?.wilayah || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editNama.trim()) {
      Alert.alert('Nama Wajib Diisi', 'Silakan masukkan nama lengkap Anda.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile({
        nama: editNama.trim(),
        no_hp: editNoHp.trim(),
        wilayah: editWilayah.trim(),
      });
      setIsEditProfileOpen(false);
      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Gagal Memperbarui Profil', e?.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openWilayahPicker = async () => {
    setWilayahModalVisible(true);
    setWilayahSearch('');
    if (regencies.length === 0) {
      setLoadingWilayah(true);
      try {
        const data = await wilayahService.getRegencies(selectedProvince.id);
        setRegencies(data);
        setWilayahLevel('KOTA');
      } catch (err) {
        console.warn('Gagal ambil data kota:', err);
      } finally {
        setLoadingWilayah(false);
      }
    }
  };

  const handleSelectProvince = async (prov: WilayahItem) => {
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setWilayahSearch('');
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getRegencies(prov.id);
      setRegencies(data);
      setWilayahLevel('KOTA');
    } catch (err) {
      console.warn('Gagal ambil kabupaten:', err);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectRegency = async (reg: WilayahItem) => {
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setWilayahSearch('');
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getDistricts(reg.id);
      setDistricts(data);
      setWilayahLevel('KECAMATAN');
    } catch (err) {
      console.warn('Gagal ambil kecamatan:', err);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectDistrict = async (dist: WilayahItem) => {
    setSelectedDistrict(dist);
    setWilayahSearch('');
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getVillages(dist.id);
      setVillages(data);
      setWilayahLevel('KELURAHAN');
    } catch (err) {
      console.warn('Gagal ambil kelurahan:', err);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectVillage = (village: WilayahItem) => {
    const formatted = `${toTitleCase(village.name)}, ${toTitleCase(selectedDistrict?.name || '')}, ${toTitleCase(selectedRegency?.name || '')}`;
    setEditWilayah(formatted);
    setWilayahModalVisible(false);
  };

  const handleBackLevel = async () => {
    setWilayahSearch('');
    if (wilayahLevel === 'KELURAHAN') {
      setWilayahLevel('KECAMATAN');
    } else if (wilayahLevel === 'KECAMATAN') {
      setWilayahLevel('KOTA');
    } else if (wilayahLevel === 'KOTA') {
      if (provinces.length === 0) {
        setLoadingWilayah(true);
        try {
          const list = await wilayahService.getProvinces();
          setProvinces(list);
        } catch (err) {
          console.warn('Gagal ambil provinsi:', err);
        } finally {
          setLoadingWilayah(false);
        }
      }
      setWilayahLevel('PROVINSI');
    }
  };

  const currentWilayahList = () => {
    let list: WilayahItem[] = [];
    if (wilayahLevel === 'PROVINSI') list = provinces;
    else if (wilayahLevel === 'KOTA') list = regencies;
    else if (wilayahLevel === 'KECAMATAN') list = districts;
    else if (wilayahLevel === 'KELURAHAN') list = villages;

    if (!wilayahSearch.trim()) return list;
    return list.filter(item =>
      item.name.toLowerCase().includes(wilayahSearch.toLowerCase())
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteLahan = (id: string, nama: string) => {
    Alert.alert(
      'Hapus Pekarangan',
      `Apakah Anda yakin ingin menghapus "${nama}"? Data tanaman terkait juga akan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteLahan(id);
          },
        },
      ]
    );
  };

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

  const activeOnlyCrops = activeCrops.filter(c => c.status === 'AKTIF');

  const formattedJoinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Oktober 2026';

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

          {/* Badges & Edit Profile Row */}
          <View className="mt-2.5 flex-row items-center gap-2">
            <View className="flex-row items-center bg-[#1C7430] px-3.5 py-1.5 rounded-full shadow-xs">
              <Leaf size={13} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-1.5 tracking-wide">
                Urban Farmer
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleOpenEditProfile}
              activeOpacity={0.8}
              className="flex-row items-center bg-white border border-emerald-300 px-3.5 py-1.5 rounded-full shadow-2xs"
            >
              <Edit3 size={12} color="#166534" />
              <Text className="text-xs font-bold text-[#166534] ml-1.5">
                Edit Profil
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3-Column Compact Metric Grid */}
        <View className="flex-row gap-2 mb-6">
          {/* Col 1: Total Panen */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mb-1.5">
              <Sprout size={16} color="#166534" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Panen
            </Text>
            <Text className="text-base font-black text-gray-900 mt-0.5">
              {stats.total_panen_kg} kg
            </Text>
          </View>

          {/* Col 2: Total Hemat */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mb-1.5">
              <PiggyBank size={16} color="#166534" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Hemat
            </Text>
            <Text
              className="text-sm font-black text-gray-900 mt-0.5"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatRupiah(stats.total_hemat_rp)}
            </Text>
          </View>

          {/* Col 3: RTH Aktif */}
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-100 shadow-sm shadow-black/5 items-center justify-center">
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mb-1.5">
              <Trees size={16} color="#166534" />
            </View>
            <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              RTH Aktif
            </Text>
            <Text className="text-base font-black text-gray-900 mt-0.5">
              {stats.rth_aktif_m2} m²
            </Text>
          </View>
        </View>

        {/* Section: Menu Aksi Utama (Kelola Pekarangan & Tur Fitur) */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <Text className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
            Menu Utama
          </Text>

          <View style={{ gap: 10 }}>
            {/* Kelola Pekarangan Saya */}
            <TouchableOpacity
              onPress={() => setIsKelolaModalOpen(true)}
              activeOpacity={0.8}
              className="flex-row items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-emerald-100 items-center justify-center mr-3 border border-emerald-200">
                  <Trees size={18} color="#166534" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-gray-900">
                    Kelola Pekarangan Saya
                  </Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    {lahans.length} Lahan terdaftar • {activeLahan ? activeLahan.nama_lahan : 'Belum ada'} aktif
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#6B7280" />
            </TouchableOpacity>

            {/* Tur Fitur & Panduan */}
            <TouchableOpacity
              onPress={startTour}
              activeOpacity={0.8}
              className="flex-row items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-emerald-200/80 items-center justify-center mr-3 border border-emerald-300">
                  <Sparkles size={18} color="#166534" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-emerald-950">
                    Tur Fitur & Panduan
                  </Text>
                  <Text className="text-[10px] text-emerald-800/80 mt-0.5">
                    Pelajari 5 pilar mandiri pangan Pekarang.in
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#166534" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Details Card */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Informasi Akun
            </Text>
            <TouchableOpacity
              onPress={handleOpenEditProfile}
              className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200"
            >
              <Edit3 size={11} color="#166534" />
              <Text className="text-[10px] font-bold text-emerald-800 ml-1">
                Ubah
              </Text>
            </TouchableOpacity>
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

            {/* Nomor WhatsApp */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center mr-2.5 border border-gray-100">
                  <Phone size={14} color="#4B5563" />
                </View>
                <Text className="text-xs font-medium text-gray-500">
                  Nomor WhatsApp
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900 max-w-[55%] text-right" numberOfLines={1}>
                {user?.no_hp || 'Belum diisi'}
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

      {/* Modal: Kelola Pekarangan Saya */}
      <Modal
        visible={isKelolaModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsKelolaModalOpen(false)}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View
            style={{
              maxHeight: '88%',
              paddingBottom: Math.max(insets.bottom, 20),
            }}
            className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-emerald-100 items-center justify-center mr-3">
                  <Trees size={20} color="#166534" />
                </View>
                <View>
                  <Text className="text-base font-black text-gray-900">
                    Kelola Semua Pekarangan
                  </Text>
                  <Text className="text-[11px] font-medium text-gray-500">
                    Atur luas, sinar, dan ganti pekarangan aktif
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsKelolaModalOpen(false)}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* List of Lahans with Actions */}
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-96 mb-4">
              {lahans.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-xs font-semibold text-gray-400">
                    Belum ada pekarangan terdaftar
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {lahans.map(lahan => {
                    const isActive = activeLahan?.lahan_id === lahan.lahan_id;
                    return (
                      <View
                        key={lahan.lahan_id}
                        className={`p-4 rounded-2xl border ${
                          isActive
                            ? 'bg-emerald-50/70 border-emerald-400'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-1 mr-2">
                            <View className="flex-row items-center">
                              <Text className="text-sm font-black text-gray-900" numberOfLines={1}>
                                🌱 {lahan.nama_lahan}
                              </Text>
                              {isActive && (
                                <View className="bg-emerald-600 px-2 py-0.5 rounded-full ml-2">
                                  <Text className="text-[9px] font-bold text-white">
                                    Aktif
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-xs text-gray-500 mt-1 font-medium">
                              {lahan.luas_m2} m² • {formatPaparanSinar(lahan.paparan_sinar)}
                            </Text>
                          </View>

                          {/* Quick delete button */}
                          <TouchableOpacity
                            onPress={() => handleDeleteLahan(lahan.lahan_id, lahan.nama_lahan)}
                            activeOpacity={0.7}
                            className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 items-center justify-center"
                          >
                            <Trash2 size={14} color="#DC2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Action buttons inside card */}
                        <View className="flex-row gap-2 pt-2 border-t border-gray-200/60 mt-1">
                          {!isActive && (
                            <TouchableOpacity
                              onPress={() => {
                                setActiveLahan(lahan);
                              }}
                              activeOpacity={0.8}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 items-center justify-center"
                            >
                              <Text className="text-[11px] font-bold text-white">
                                Jadikan Aktif
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              setActiveLahan(lahan);
                              setIsKelolaModalOpen(false);
                              router.push('/(tabs)/lahan');
                            }}
                            activeOpacity={0.8}
                            className="flex-1 py-2 px-3 rounded-xl bg-white border border-gray-300 items-center justify-center"
                          >
                            <Text className="text-[11px] font-bold text-gray-700">
                              Ubah Lahan
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Bottom Add Button */}
            <TouchableOpacity
              onPress={() => {
                setIsKelolaModalOpen(false);
                router.push('/wizard-setup' as any);
              }}
              activeOpacity={0.85}
              style={{ gap: 8 }}
              className="w-full bg-[#124E2A] py-3.5 rounded-2xl flex-row items-center justify-center shadow-xs"
            >
              <Plus size={18} color="#FFFFFF" />
              <Text className="text-xs font-black text-white">
                Tambah Pekarangan Baru
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Edit Profil Pengguna */}
      <Modal
        visible={isEditProfileOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditProfileOpen(false)}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View
            style={{
              maxHeight: '90%',
              paddingBottom: Math.max(insets.bottom, 20),
            }}
            className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-2xl bg-emerald-100 items-center justify-center mr-2.5">
                  <Edit3 size={18} color="#166534" />
                </View>
                <View>
                  <Text className="text-base font-black text-gray-900">
                    Edit Profil Pengguna
                  </Text>
                  <Text className="text-[11px] font-medium text-gray-500">
                    Perbarui data diri & lokasi domisili Anda
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Nama Lengkap */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Nama Lengkap <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5">
                  <UserIcon size={16} color="#6B7280" />
                  <TextInput
                    value={editNama}
                    onChangeText={setEditNama}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-2.5 text-xs text-gray-900 font-semibold"
                  />
                </View>
              </View>

              {/* Nomor WhatsApp */}
              <View className="mb-3.5">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Nomor WhatsApp
                </Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5">
                  <Phone size={16} color="#6B7280" />
                  <TextInput
                    value={editNoHp}
                    onChangeText={setEditNoHp}
                    placeholder="Contoh: 08123456789"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="flex-1 ml-2.5 text-xs text-gray-900 font-semibold"
                  />
                </View>
              </View>

              {/* Domisili / Wilayah */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-700 mb-1.5">
                  Wilayah / Domisili Pekarangan
                </Text>
                <View className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <View className="flex-row items-start mb-2">
                    <MapPin size={16} color="#166534" style={{ marginTop: 2 }} />
                    <Text className="flex-1 ml-2 text-xs font-bold text-emerald-950">
                      {editWilayah || 'Belum diatur'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={openWilayahPicker}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-center bg-emerald-50 border border-emerald-200 py-2 rounded-xl mt-1"
                  >
                    <Search size={13} color="#166534" />
                    <Text className="text-xs font-bold text-[#166534] ml-1.5">
                      Pilih dari Daftar Wilayah Indonesia
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => setIsEditProfileOpen(false)}
                  disabled={savingProfile}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 border border-gray-200 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-gray-700">
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 py-3 rounded-2xl bg-[#124E2A] flex-row items-center justify-center shadow-xs"
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={15} color="#FFFFFF" />
                      <Text className="text-xs font-black text-white ml-1.5">
                        Simpan Perubahan
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Wilayah Picker Cascading */}
      <Modal
        visible={wilayahModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setWilayahModalVisible(false)}
      >
        <View className="flex-1 bg-black/65 justify-end">
          <View
            style={{
              maxHeight: '88%',
              paddingBottom: Math.max(insets.bottom, 20),
            }}
            className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl"
          >
            {/* Header with Back if not top level */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <View className="flex-row items-center flex-1">
                {wilayahLevel !== 'PROVINSI' && (
                  <TouchableOpacity
                    onPress={handleBackLevel}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2"
                  >
                    <ArrowLeft size={16} color="#374151" />
                  </TouchableOpacity>
                )}
                <View className="flex-1">
                  <Text className="text-base font-black text-gray-900">
                    Pilih {wilayahLevel === 'PROVINSI' ? 'Provinsi' : wilayahLevel === 'KOTA' ? 'Kota / Kabupaten' : wilayahLevel === 'KECAMATAN' ? 'Kecamatan' : 'Kelurahan / Desa'}
                  </Text>
                  <Text className="text-[10px] text-gray-500" numberOfLines={1}>
                    {wilayahLevel === 'PROVINSI' ? 'Langkah 1/4' : wilayahLevel === 'KOTA' ? `Provinsi: ${toTitleCase(selectedProvince.name)}` : wilayahLevel === 'KECAMATAN' ? `Kota: ${toTitleCase(selectedRegency?.name || '')}` : `Kecamatan: ${toTitleCase(selectedDistrict?.name || '')}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setWilayahModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center ml-2"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 mb-3">
              <Search size={15} color="#9CA3AF" />
              <TextInput
                value={wilayahSearch}
                onChangeText={setWilayahSearch}
                placeholder="Cari wilayah..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-xs text-gray-900"
              />
            </View>

            {/* List */}
            {loadingWilayah ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="small" color="#166534" />
                <Text className="text-xs text-gray-500 mt-2 font-medium">
                  Memuat data wilayah...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
                {currentWilayahList().length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Text className="text-xs text-gray-500">
                      Tidak ada wilayah ditemukan
                    </Text>
                  </View>
                ) : (
                  currentWilayahList().map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        if (wilayahLevel === 'PROVINSI') handleSelectProvince(item);
                        else if (wilayahLevel === 'KOTA') handleSelectRegency(item);
                        else if (wilayahLevel === 'KECAMATAN') handleSelectDistrict(item);
                        else if (wilayahLevel === 'KELURAHAN') handleSelectVillage(item);
                      }}
                      className="py-3 px-3.5 border-b border-gray-100 flex-row items-center justify-between"
                    >
                      <Text className="text-xs font-semibold text-gray-800">
                        {toTitleCase(item.name)}
                      </Text>
                      <ChevronRight size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

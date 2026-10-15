import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Lock,
  ChevronDown,
  Search,
  ChevronRight,
  ArrowLeft,
  X,
  Building2,
  Check,
  Compass,
  Landmark,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { GoogleIcon } from '../../components/ui/GoogleIcon';
import { wilayahService, WilayahItem } from '../../services/api';

WebBrowser.maybeCompleteAuthSession();

type WilayahLevel = 'PROVINSI' | 'KOTA' | 'KECAMATAN' | 'KELURAHAN';

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, loginWithGoogle } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [wilayah, setWilayah] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const [, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId || 'unconfigured-client-id.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      const idToken = googleResponse.params.id_token;
      loginWithGoogle(idToken)
        .then(() => {
          router.replace('/wizard-setup' as any);
        })
        .catch((err: any) => {
          const msg = err?.message || 'Registrasi dengan akun Google gagal di server.';
          setErrorMsg(msg);
          Alert.alert('Gagal Google', msg);
        });
    } else if (googleResponse?.type === 'error') {
      const msg = googleResponse.error?.message || 'Otorisasi Google dibatalkan.';
      Alert.alert('Google Sign-In Error', msg);
    }
  }, [googleResponse, loginWithGoogle, router]);

  // Wilayah Picker Modal States
  const [wilayahModalVisible, setWilayahModalVisible] = useState(false);
  const [wilayahLevel, setWilayahLevel] = useState<WilayahLevel>('KOTA');
  const [loadingWilayah, setLoadingWilayah] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  // Default DIY (code 34)
  const [selectedProvince, setSelectedProvince] = useState<WilayahItem>({
    id: '34',
    name: 'D.I. YOGYAKARTA',
  });
  const [selectedRegency, setSelectedRegency] = useState<WilayahItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<WilayahItem | null>(null);
  const [wilayahError, setWilayahError] = useState<string | null>(null);

  const retryCurrentLevel = async () => {
    setWilayahError(null);
    setLoadingWilayah(true);
    try {
      if (wilayahLevel === 'PROVINSI') {
        const list = await wilayahService.getProvinces();
        setProvinces(list);
      } else if (wilayahLevel === 'KOTA') {
        const data = await wilayahService.getRegencies(selectedProvince.id);
        setRegencies(data);
      } else if (wilayahLevel === 'KECAMATAN' && selectedRegency) {
        const data = await wilayahService.getDistricts(selectedRegency.id);
        setDistricts(data);
      } else if (wilayahLevel === 'KELURAHAN' && selectedDistrict) {
        const data = await wilayahService.getVillages(selectedDistrict.id);
        setVillages(data);
      }
    } catch (err: any) {
      console.warn('Gagal retry wilayah:', err);
      setWilayahError('Gagal memuat data wilayah. Silakan periksa koneksi internet.');
    } finally {
      setLoadingWilayah(false);
    }
  };

  const openWilayahPicker = async () => {
    setWilayahModalVisible(true);
    setSearchQuery('');
    setWilayahError(null);
    if (regencies.length === 0) {
      setLoadingWilayah(true);
      try {
        const data = await wilayahService.getRegencies(selectedProvince.id);
        setRegencies(data);
        setWilayahLevel('KOTA');
      } catch (err: any) {
        console.warn('Gagal load regencies DIY:', err);
        setWilayahError('Gagal memuat data kota/kabupaten. Silakan coba lagi.');
      } finally {
        setLoadingWilayah(false);
      }
    }
  };

  const handleSelectProvince = async (prov: WilayahItem) => {
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSearchQuery('');
    setWilayahError(null);
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getRegencies(prov.id);
      setRegencies(data);
      setWilayahLevel('KOTA');
    } catch (err) {
      console.warn('Gagal ambil kabupaten:', err);
      setWilayahError('Gagal mengambil daftar kota/kabupaten.');
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectRegency = async (reg: WilayahItem) => {
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setSearchQuery('');
    setWilayahError(null);
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getDistricts(reg.id);
      setDistricts(data);
      setWilayahLevel('KECAMATAN');
    } catch (err) {
      console.warn('Gagal ambil kecamatan:', err);
      setWilayahError('Gagal mengambil daftar kecamatan.');
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectDistrict = async (dist: WilayahItem) => {
    setSelectedDistrict(dist);
    setSearchQuery('');
    setWilayahError(null);
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getVillages(dist.id);
      setVillages(data);
      setWilayahLevel('KELURAHAN');
    } catch (err) {
      console.warn('Gagal ambil kelurahan:', err);
      setWilayahError('Gagal mengambil daftar kelurahan/desa.');
    } finally {
      setLoadingWilayah(false);
    }
  };

  const handleSelectVillage = (village: WilayahItem) => {
    const formatted = `${toTitleCase(village.name)}, ${toTitleCase(selectedDistrict?.name || '')}, ${toTitleCase(selectedRegency?.name || '')}`;
    setWilayah(formatted);
    setWilayahModalVisible(false);
  };

  const handleBackLevel = async () => {
    setSearchQuery('');
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
        } catch (e) {
          console.warn('Gagal load provinces:', e);
        } finally {
          setLoadingWilayah(false);
        }
      }
      setWilayahLevel('PROVINSI');
    }
  };

  const handleJumpToLevel = async (level: WilayahLevel) => {
    setSearchQuery('');
    if (level === 'PROVINSI') {
      if (provinces.length === 0) {
        setLoadingWilayah(true);
        try {
          const list = await wilayahService.getProvinces();
          setProvinces(list);
        } catch (e) {
          console.warn('Gagal load provinces:', e);
        } finally {
          setLoadingWilayah(false);
        }
      }
      setWilayahLevel('PROVINSI');
    } else if (level === 'KOTA') {
      if (selectedProvince) {
        setWilayahLevel('KOTA');
      }
    } else if (level === 'KECAMATAN') {
      if (selectedRegency) {
        setWilayahLevel('KECAMATAN');
      }
    }
  };

  const QUICK_PILOTS = [
    {
      name: 'Kota Pekalongan',
      badge: 'Pilot Utama',
      prov: { id: '33', name: 'JAWA TENGAH' },
      reg: { id: '3375', name: 'KOTA PEKALONGAN' },
    },
    {
      name: 'Kota Yogyakarta',
      badge: 'DIY',
      prov: { id: '34', name: 'D.I. YOGYAKARTA' },
      reg: { id: '3471', name: 'KOTA YOGYAKARTA' },
    },
    {
      name: 'Kab. Sleman',
      badge: 'DIY',
      prov: { id: '34', name: 'D.I. YOGYAKARTA' },
      reg: { id: '3404', name: 'KABUPATEN SLEMAN' },
    },
  ];

  const handleSelectQuickPilot = async (pilot: (typeof QUICK_PILOTS)[number]) => {
    setSelectedProvince(pilot.prov);
    setSelectedRegency(pilot.reg);
    setSelectedDistrict(null);
    setSearchQuery('');
    setLoadingWilayah(true);
    try {
      const data = await wilayahService.getDistricts(pilot.reg.id);
      setDistricts(data);
      setWilayahLevel('KECAMATAN');
    } catch (err) {
      console.warn('Gagal ambil kecamatan pilot:', err);
    } finally {
      setLoadingWilayah(false);
    }
  };

  const currentList = useMemo(() => {
    let list: WilayahItem[] = [];
    if (wilayahLevel === 'PROVINSI') list = provinces;
    else if (wilayahLevel === 'KOTA') list = regencies;
    else if (wilayahLevel === 'KECAMATAN') list = districts;
    else if (wilayahLevel === 'KELURAHAN') list = villages;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => item.name.toLowerCase().includes(q));
  }, [wilayahLevel, provinces, regencies, districts, villages, searchQuery]);

  const handleRegister = async () => {
    setErrorMsg('');
    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Format email tidak valid');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter');
      return;
    }

    setLoading(true);
    try {
      await register(nama.trim(), email.trim().toLowerCase(), password, wilayah);
      router.replace('/wizard-setup' as any);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Gagal mendaftar. Silakan coba kembali.';
      setErrorMsg(msg);
      Alert.alert('Gagal Mendaftar', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');
    if (!googleClientId) {
      Alert.alert(
        'Google Client ID Belum Dikonfigurasi',
        'Fitur daftar dengan Google memerlukan Google OAuth Client ID resmi dari Google Cloud Console.\n\nHarap daftarkan EXPO_PUBLIC_GOOGLE_CLIENT_ID di file .env dan cocokkan dengan GOOGLE_CLIENT_ID di backend server agar token dapat diverifikasi.',
        [{ text: 'Tutup' }]
      );
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'Gagal membuka Google Sign-In.';
      setErrorMsg(msg);
      Alert.alert('Google Sign-In Error', msg);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAF8]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + (isKeyboardVisible ? 280 : 40),
          }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Elastic top spacer to center vertically when keyboard is hidden */}
          {!isKeyboardVisible && <View className="flex-1" />}

          {/* Header Logo & Subtitle */}
          <View className="items-center mb-6">
            <Logo
              size="md"
              subText="Mari mulai menanam bersama komunitas"
            />
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm shadow-black/5 border border-gray-100">
            {/* Segmented Switch: Masuk / Daftar */}
            <View className="flex-row bg-[#F3F4F6] p-1.5 rounded-2xl mb-6">
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="flex-1 py-2.5 rounded-xl items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-gray-500">Masuk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-2.5 rounded-xl bg-white shadow-xs items-center justify-center"
                activeOpacity={0.9}
              >
                <Text className="text-sm font-bold text-[#1C7430]">Daftar</Text>
              </TouchableOpacity>
            </View>

            {errorMsg ? (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4">
                <Text className="text-xs text-red-600 font-semibold text-center">{errorMsg}</Text>
              </View>
            ) : null}

            {/* Nama Lengkap */}
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={nama}
              onChangeText={setNama}
              leftIcon={<UserIcon size={18} color="#6B7280" />}
            />

            {/* Email */}
            <Input
              label="Email"
              placeholder="contoh@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color="#6B7280" />}
            />

            {/* Kelurahan / Wilayah Picker Card */}
            <View className="mb-4">
              <Text className="text-sm font-bold text-gray-800 mb-1.5">
                Kelurahan / Wilayah Pekarangan
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={openWilayahPicker}
                className="w-full"
              >
                {wilayah ? (
                  <View className="flex-row items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl shadow-2xs">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-emerald-600 items-center justify-center mr-3 shadow-xs">
                        <MapPin size={20} color="#FFFFFF" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-0.5">
                          <Text className="text-[10px] font-black tracking-wider text-emerald-800 uppercase bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                            Wilayah Terpilih
                          </Text>
                        </View>
                        <Text
                          className="text-sm font-black text-gray-900"
                          numberOfLines={1}
                        >
                          Kel. {wilayah.split(',')[0]}
                        </Text>
                        <Text
                          className="text-xs font-medium text-gray-600 mt-0.5"
                          numberOfLines={1}
                        >
                          {wilayah.split(',').slice(1).join(',')}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-white border border-emerald-200 px-3 py-1.5 rounded-xl flex-row items-center shadow-2xs">
                      <Text className="text-xs font-bold text-[#1C7430] mr-1">
                        Ubah
                      </Text>
                      <ChevronRight size={14} color="#1C7430" />
                    </View>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between p-3.5 bg-white border border-gray-200 rounded-2xl shadow-2xs">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-3">
                        <MapPin size={20} color="#1C7430" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">
                          Pilih Kelurahan / Wilayah
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          Sesuai Kemendagri untuk data cuaca & pasar
                        </Text>
                      </View>
                    </View>
                    <View className="bg-emerald-50 px-3 py-1.5 rounded-xl flex-row items-center border border-emerald-200">
                      <Text className="text-xs font-bold text-[#1C7430] mr-1">
                        Pilih
                      </Text>
                      <ChevronDown size={14} color="#1C7430" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Kata Sandi */}
            <Input
              label="Kata Sandi"
              placeholder="Minimal 8 karakter"
              isPassword
              value={password}
              onChangeText={setPassword}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
              leftIcon={<Lock size={18} color="#6B7280" />}
            />

            {/* Primary Submit Button */}
            <Button
              title="Daftar Sekarang"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              className="w-full mt-2 mb-6"
            />

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="px-3 text-xs text-gray-400 font-medium">
                Atau daftar dengan
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Google OAuth Button */}
            <Button
              title="Google"
              variant="google"
              onPress={handleGoogleRegister}
              size="md"
              className="w-full"
              icon={<GoogleIcon size={20} />}
            />
          </View>

          {/* Elastic bottom spacer to center vertically when keyboard is hidden */}
          {!isKeyboardVisible && <View className="flex-1" />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Wilayah Selection Modal Sheet */}
      <Modal
        visible={wilayahModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWilayahModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ maxHeight: '88%' }}
            className="bg-white rounded-t-3xl pt-3 pb-8 px-5 flex-1 shadow-2xl"
          >
            {/* Drag Pill Handle */}
            <View className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center flex-1 pr-2">
                {wilayahLevel !== 'PROVINSI' && (
                  <TouchableOpacity
                    onPress={handleBackLevel}
                    className="mr-2.5 p-2 rounded-xl bg-gray-100 active:bg-gray-200"
                  >
                    <ArrowLeft size={18} color="#374151" />
                  </TouchableOpacity>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-lg font-black text-gray-900">
                      Pilih {wilayahLevel === 'PROVINSI'
                        ? 'Provinsi'
                        : wilayahLevel === 'KOTA'
                        ? 'Kota / Kabupaten'
                        : wilayahLevel === 'KECAMATAN'
                        ? 'Kecamatan'
                        : 'Kelurahan / Desa'}
                    </Text>
                    <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-black text-[#1C7430]">
                        {wilayahLevel === 'PROVINSI'
                          ? '1 / 4'
                          : wilayahLevel === 'KOTA'
                          ? '2 / 4'
                          : wilayahLevel === 'KECAMATAN'
                          ? '3 / 4'
                          : '4 / 4'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    Data resmi Kemendagri Republik Indonesia
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setWilayahModalVisible(false)}
                className="p-2 rounded-xl bg-gray-100 active:bg-gray-200"
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Step Progress Pills */}
            <View
              className="flex-row items-center py-2.5 border-b border-gray-100 -mx-5 px-5 bg-gray-50/70"
              style={{ gap: 6 }}
            >
              {[
                { key: 'PROVINSI', label: '1. Prov' },
                { key: 'KOTA', label: '2. Kota' },
                { key: 'KECAMATAN', label: '3. Kec' },
                { key: 'KELURAHAN', label: '4. Kel' },
              ].map((step, idx) => {
                const currentIdx =
                  wilayahLevel === 'PROVINSI'
                    ? 0
                    : wilayahLevel === 'KOTA'
                    ? 1
                    : wilayahLevel === 'KECAMATAN'
                    ? 2
                    : 3;
                const isCurrent = step.key === wilayahLevel;
                const isPast = idx < currentIdx;

                return (
                  <TouchableOpacity
                    key={step.key}
                    disabled={!isPast}
                    onPress={() => handleJumpToLevel(step.key as WilayahLevel)}
                    className={`flex-1 flex-row items-center justify-center py-1.5 px-1 rounded-xl border ${
                      isCurrent
                        ? 'bg-emerald-600 border-emerald-600'
                        : isPast
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 opacity-60'
                    }`}
                  >
                    {isPast && (
                      <Check
                        size={11}
                        color="#15803D"
                        strokeWidth={3}
                        style={{ marginRight: 2 }}
                      />
                    )}
                    <Text
                      className={`text-[11px] font-bold ${
                        isCurrent
                          ? 'text-white'
                          : isPast
                          ? 'text-emerald-800'
                          : 'text-gray-400'
                      }`}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Active Hierarchy Path Badge */}
            {(selectedProvince || selectedRegency || selectedDistrict) && (
              <View className="flex-row items-center py-2 px-3 bg-emerald-50/50 rounded-xl mt-2.5 border border-emerald-100">
                <MapPin size={13} color="#166534" />
                <Text
                  className="text-xs font-semibold text-emerald-900 ml-1.5 flex-1"
                  numberOfLines={1}
                >
                  {toTitleCase(selectedProvince.name)}
                  {selectedRegency ? ` › ${toTitleCase(selectedRegency.name)}` : ''}
                  {selectedDistrict ? ` › ${toTitleCase(selectedDistrict.name)}` : ''}
                </Text>
              </View>
            )}

            {/* Quick Pilot Shortcuts (Visible on Prov / Kota Step) */}
            {(wilayahLevel === 'PROVINSI' || wilayahLevel === 'KOTA') && (
              <View className="mt-2.5">
                <Text className="text-[11px] font-bold text-gray-500 mb-1.5">
                  PILIHAN CEPAT WILAYAH PILOT
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  <View className="flex-row" style={{ gap: 8 }}>
                    {QUICK_PILOTS.map(pilot => (
                      <TouchableOpacity
                        key={pilot.reg.id}
                        onPress={() => handleSelectQuickPilot(pilot)}
                        className="flex-row items-center bg-white border border-emerald-300 px-3 py-1.5 rounded-full shadow-2xs"
                      >
                        <Sparkles size={12} color="#166534" />
                        <Text className="text-xs font-bold text-emerald-900 ml-1.5">
                          {pilot.name}
                        </Text>
                        <View className="bg-emerald-100 px-1.5 py-0.5 rounded-md ml-1.5">
                          <Text className="text-[9px] font-extrabold text-emerald-800">
                            {pilot.badge}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Search Input Bar */}
            <View className="my-2.5">
              <View className="flex-row items-center bg-gray-100 rounded-2xl px-3.5 py-2.5 border border-gray-200">
                <Search size={16} color="#6B7280" />
                <TextInput
                  placeholder={`Cari nama ${
                    wilayahLevel === 'PROVINSI'
                      ? 'provinsi'
                      : wilayahLevel === 'KOTA'
                      ? 'kota/kabupaten'
                      : wilayahLevel === 'KECAMATAN'
                      ? 'kecamatan'
                      : 'kelurahan'
                  }...`}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-2 text-sm text-gray-900 py-0"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    className="p-1 bg-gray-200 rounded-full"
                  >
                    <X size={12} color="#4B5563" />
                  </TouchableOpacity>
                ) : (
                  <View className="bg-gray-200/80 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-gray-600">
                      {currentList.length}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* List Content */}
            {loadingWilayah ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#1C7430" />
                <Text className="text-xs font-semibold text-gray-600 mt-2.5">
                  Memuat data wilayah...
                </Text>
              </View>
            ) : (
              <FlatList
                data={currentList}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  wilayahError ? (
                    <View className="items-center py-12 px-4">
                      <View className="w-12 h-12 rounded-2xl bg-red-50 items-center justify-center mb-3">
                        <AlertCircle size={24} color="#DC2626" />
                      </View>
                      <Text className="text-sm font-bold text-gray-800 text-center">
                        Gagal Memuat Data Wilayah
                      </Text>
                      <Text className="text-xs text-gray-500 text-center mt-1 max-w-xs">
                        {wilayahError}
                      </Text>
                      <TouchableOpacity
                        onPress={retryCurrentLevel}
                        className="mt-4 bg-[#1C7430] px-4 py-2.5 rounded-xl shadow-xs"
                      >
                        <Text className="text-xs font-bold text-white">
                          Coba Muat Ulang
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="items-center py-12 px-4">
                      <View className="w-12 h-12 rounded-2xl bg-gray-100 items-center justify-center mb-3">
                        <Search size={24} color="#9CA3AF" />
                      </View>
                      <Text className="text-sm font-bold text-gray-800">
                        Wilayah tidak ditemukan
                      </Text>
                      <Text className="text-xs text-gray-500 text-center mt-1">
                        Coba periksa ejaan atau hapus filter pencarian.
                      </Text>
                      {searchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setSearchQuery('')}
                          className="mt-3 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl"
                        >
                          <Text className="text-xs font-bold text-[#1C7430]">
                            Reset Pencarian
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                }
                renderItem={({ item }) => {
                  const IconComponent =
                    wilayahLevel === 'PROVINSI'
                      ? Landmark
                      : wilayahLevel === 'KOTA'
                      ? Building2
                      : wilayahLevel === 'KECAMATAN'
                      ? Compass
                      : MapPin;

                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (wilayahLevel === 'PROVINSI') handleSelectProvince(item);
                        else if (wilayahLevel === 'KOTA') handleSelectRegency(item);
                        else if (wilayahLevel === 'KECAMATAN') handleSelectDistrict(item);
                        else if (wilayahLevel === 'KELURAHAN') handleSelectVillage(item);
                      }}
                      className="flex-row items-center justify-between py-3 px-3 my-0.5 rounded-2xl bg-white border border-gray-100 active:bg-emerald-50 active:border-emerald-200"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1 pr-2">
                        <View className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-3">
                          <IconComponent size={16} color="#166534" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-gray-800">
                            {toTitleCase(item.name)}
                          </Text>
                          <Text className="text-[10px] font-semibold text-gray-400 mt-0.5">
                            Kode: {item.id}
                          </Text>
                        </View>
                      </View>
                      <View className="w-7 h-7 rounded-lg bg-gray-50 items-center justify-center">
                        <ChevronRight size={14} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

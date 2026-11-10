import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Search, ArrowLeft, ChevronRight, Check } from 'lucide-react-native';
import { wilayahService, WilayahItem } from '../../services/api';

type WilayahLevel = 'PROVINSI' | 'KOTA' | 'KECAMATAN' | 'KELURAHAN';

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

interface WilayahPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectWilayah: (fullWilayahString: string) => void;
}

export function WilayahPickerModal({
  visible,
  onClose,
  onSelectWilayah,
}: WilayahPickerModalProps) {
  const [level, setLevel] = useState<WilayahLevel>('PROVINSI');
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<WilayahItem | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<WilayahItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<WilayahItem | null>(null);

  // Load provinces on open if not loaded yet
  useEffect(() => {
    if (!visible) return;
    let isSubscribed = true;
    if (provinces.length === 0) {
      Promise.resolve()
        .then(() => {
          if (!isSubscribed) return;
          setLoading(true);
          return wilayahService.getProvinces();
        })
        .then(data => {
          if (isSubscribed && data) setProvinces(data);
        })
        .catch(err => console.warn('Gagal ambil data provinsi:', err))
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [visible, provinces.length]);

  const handleClose = () => {
    setSearch('');
    setLevel('PROVINSI');
    setSelectedProvince(null);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    onClose();
  };

  const handleSelectProvince = async (prov: WilayahItem) => {
    setSelectedProvince(prov);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSearch('');
    setLoading(true);
    try {
      const data = await wilayahService.getRegencies(prov.id);
      setRegencies(data);
      setLevel('KOTA');
    } catch (err) {
      console.warn('Gagal ambil kabupaten/kota:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegency = async (reg: WilayahItem) => {
    setSelectedRegency(reg);
    setSelectedDistrict(null);
    setSearch('');
    setLoading(true);
    try {
      const data = await wilayahService.getDistricts(reg.id);
      setDistricts(data);
      setLevel('KECAMATAN');
    } catch (err) {
      console.warn('Gagal ambil kecamatan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDistrict = async (dist: WilayahItem) => {
    setSelectedDistrict(dist);
    setSearch('');
    setLoading(true);
    try {
      const data = await wilayahService.getVillages(dist.id);
      setVillages(data);
      setLevel('KELURAHAN');
    } catch (err) {
      console.warn('Gagal ambil kelurahan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVillage = (village: WilayahItem) => {
    const formatted = `${toTitleCase(village.name)}, ${toTitleCase(selectedDistrict?.name || '')}, ${toTitleCase(selectedRegency?.name || '')}`;
    onSelectWilayah(formatted);
    handleClose();
  };

  const handleBackLevel = async () => {
    setSearch('');
    if (level === 'KELURAHAN') {
      setLevel('KECAMATAN');
    } else if (level === 'KECAMATAN') {
      setLevel('KOTA');
    } else if (level === 'KOTA') {
      setLevel('PROVINSI');
    }
  };

  const currentList = () => {
    let list: WilayahItem[] = [];
    if (level === 'PROVINSI') list = provinces;
    else if (level === 'KOTA') list = regencies;
    else if (level === 'KECAMATAN') list = districts;
    else if (level === 'KELURAHAN') list = villages;

    if (!search.trim()) return list;
    return list.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const searchPlaceholder =
    level === 'PROVINSI'
      ? 'Cari nama provinsi...'
      : level === 'KOTA'
      ? 'Cari kota atau kabupaten...'
      : level === 'KECAMATAN'
      ? 'Cari nama kecamatan...'
      : 'Cari kelurahan atau desa...';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/65 justify-end">
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleClose}
          className="flex-1"
        />
        <View className="bg-white rounded-t-[36px] w-full p-6 shadow-2xl max-h-[85%]">
          {/* Header with Back button if deeper than level 1 */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <View className="flex-row items-center flex-1">
              {level !== 'PROVINSI' && (
                <TouchableOpacity
                  onPress={handleBackLevel}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2"
                >
                  <ArrowLeft size={16} color="#374151" />
                </TouchableOpacity>
              )}
              <View className="flex-1">
                <Text className="text-base font-black text-gray-900">
                  Pilih {level === 'PROVINSI' ? 'Provinsi' : level === 'KOTA' ? 'Kota / Kabupaten' : level === 'KECAMATAN' ? 'Kecamatan' : 'Kelurahan / Desa'}
                </Text>
                <Text className="text-[10px] text-gray-500 font-medium" numberOfLines={1}>
                  {level === 'PROVINSI'
                    ? 'Langkah 1/4 (Pilih Provinsi Anda)'
                    : level === 'KOTA'
                    ? `Langkah 2/4 • Provinsi: ${toTitleCase(selectedProvince?.name || '')}`
                    : level === 'KECAMATAN'
                    ? `Langkah 3/4 • Kota: ${toTitleCase(selectedRegency?.name || '')}`
                    : `Langkah 4/4 • Kecamatan: ${toTitleCase(selectedDistrict?.name || '')}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center ml-2"
            >
              <X size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 mb-3">
            <Search size={15} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-xs text-gray-900"
            />
            {search.trim().length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* List or Loading State */}
          {loading ? (
            <View className="py-14 items-center justify-center">
              <ActivityIndicator size="small" color="#166534" />
              <Text className="text-xs text-gray-500 mt-2 font-medium">
                Memuat data wilayah...
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-80">
              {currentList().length === 0 ? (
                <View className="py-10 items-center justify-center">
                  <Text className="text-xs text-gray-500">
                    Tidak ada wilayah ditemukan
                  </Text>
                </View>
              ) : (
                currentList().map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      if (level === 'PROVINSI') handleSelectProvince(item);
                      else if (level === 'KOTA') handleSelectRegency(item);
                      else if (level === 'KECAMATAN') handleSelectDistrict(item);
                      else if (level === 'KELURAHAN') handleSelectVillage(item);
                    }}
                    className="py-3 px-3.5 border-b border-gray-100 flex-row items-center justify-between active:bg-gray-50"
                  >
                    <Text className="text-xs font-semibold text-gray-800">
                      {toTitleCase(item.name)}
                    </Text>
                    {level === 'KELURAHAN' ? (
                      <Check size={14} color="#166534" />
                    ) : (
                      <ChevronRight size={14} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

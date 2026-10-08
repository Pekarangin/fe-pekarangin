import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  TextInput,
  Alert,
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
  Bell,
  CheckCircle2,
  Lock,
  Clock,
  Plus,
  Trash2,
  X,
  Volume2,
  Check,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { ReminderSchedule } from '../../services/notifications';

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    stats,
    logout,
    reminders,
    updateReminderTime,
    toggleReminder,
    addCustomReminder,
    deleteReminder,
    triggerTestAlarm,
  } = useApp();

  // Time editing modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderSchedule | null>(null);
  const [editHour, setEditHour] = useState(7);
  const [editMinute, setEditMinute] = useState(0);

  // Add custom reminder modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState('Siram Siang');
  const [newSubtitle, setNewSubtitle] = useState('Cuaca terik / ekstra air');
  const [newHour, setNewHour] = useState(12);
  const [newMinute, setNewMinute] = useState(0);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handleOpenEditModal = (reminder: ReminderSchedule) => {
    setSelectedReminder(reminder);
    setEditHour(reminder.hour);
    setEditMinute(reminder.minute);
    setEditModalVisible(true);
  };

  const handleSaveEditTime = async () => {
    if (!selectedReminder) return;
    await updateReminderTime(selectedReminder.id, editHour, editMinute);
    setEditModalVisible(false);
    Alert.alert(
      '✅ Jadwal Diperbarui',
      `Alarm ${selectedReminder.label} disetel ke pukul ${String(editHour).padStart(2, '0')}:${String(editMinute).padStart(2, '0')} WIB.`
    );
  };

  const handleSaveNewReminder = async () => {
    if (!newLabel.trim()) return;
    await addCustomReminder(newLabel.trim(), newSubtitle.trim(), newHour, newMinute);
    setAddModalVisible(false);
    setNewLabel('Siram Siang');
    setNewSubtitle('Cuaca terik / ekstra air');
    Alert.alert(
      '✅ Jadwal Baru Ditambahkan',
      `Alarm ${newLabel} aktif pada pukul ${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')} WIB.`
    );
  };

  const handleTriggerTest = async (label = 'Siram Pekarangan') => {
    await triggerTestAlarm(label);
  };

  const ACHIEVEMENTS = [
    {
      id: 1,
      icon: '🥇',
      title: 'Panen Perdana',
      desc: 'Berhasil panen pertama kali',
      unlocked: true,
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
      progressText: '350g / 500g',
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
            <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md shadow-black/10">
              <Image
                source={{
                  uri:
                    user?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>

          <Text className="text-2xl font-black text-gray-900 tracking-tight">
            {user?.nama || 'Alex Smith'}
          </Text>

          {/* Badges Row */}
          <View className="mt-2 flex-row items-center gap-2">
            <View className="flex-row items-center bg-[#1C7430] px-3.5 py-1.5 rounded-full shadow-xs">
              <Leaf size={14} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-1.5 tracking-wide">
                Urban Farmer
              </Text>
            </View>
            <View className="flex-row items-center bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1.5 rounded-full">
              <Text className="text-xs font-black text-[#EA580C]">
                🔥 {stats.streak_hari} Hari
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
              3/4 Terbuka
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

        {/* Pengingat Perawatan & Alarm Notifikasi Section */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Bell size={18} color="#1C7430" />
              <Text className="text-sm font-extrabold text-gray-900 ml-2">
                Jadwal & Alarm Siram
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              className="flex-row items-center bg-green-50 px-2.5 py-1 rounded-xl border border-green-200"
            >
              <Plus size={13} color="#1C7430" />
              <Text className="text-[11px] font-bold text-[#1C7430] ml-1">
                Tambah
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mb-3.5">
            Atur jam pengingat manual. Alarm dan notifikasi lokal akan dikirimkan otomatis ke perangkat Anda.
          </Text>

          {/* List of Reminders */}
          <View className="space-y-3">
            {reminders.map((rem, index) => {
              const timeString = `${String(rem.hour).padStart(2, '0')}:${String(rem.minute).padStart(2, '0')} WIB`;
              const isCustom = !rem.id.startsWith('siram-pagi') && !rem.id.startsWith('siram-sore');

              return (
                <View
                  key={rem.id}
                  className={`flex-row items-center justify-between py-2 ${
                    index > 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(rem)}
                    activeOpacity={0.7}
                    className="flex-1 mr-3"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-xs font-bold text-gray-900">
                        {rem.label}
                      </Text>
                      <View className="bg-emerald-100 px-2 py-0.5 rounded-md ml-2 flex-row items-center">
                        <Clock size={10} color="#065F46" />
                        <Text className="text-[10px] font-extrabold text-emerald-900 ml-1">
                          {timeString}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] text-gray-400 mt-0.5">
                      {rem.subtitle} • <Text className="text-[#1C7430] font-semibold">Ubah Jam ⚙️</Text>
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    {isCustom && (
                      <TouchableOpacity
                        onPress={() => deleteReminder(rem.id)}
                        className="p-2 mr-1"
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    <Switch
                      value={rem.enabled}
                      onValueChange={() => toggleReminder(rem.id)}
                      trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                      thumbColor={rem.enabled ? '#1C7430' : '#F3F4F6'}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Test Alarm Action Button */}
          <TouchableOpacity
            onPress={() => handleTriggerTest('Siram Pekarangan Mandiri')}
            activeOpacity={0.8}
            className="mt-4 pt-3 border-t border-gray-100 flex-row items-center justify-center bg-green-50/70 border border-green-200/80 py-2.5 px-3 rounded-2xl shadow-2xs"
          >
            <Volume2 size={15} color="#1C7430" />
            <Text className="text-xs font-bold text-[#1C7430] ml-1.5">
              🔔 Uji Bunyi Alarm / Notifikasi Sekarang
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Details */}
        <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm shadow-black/5 mb-6">
          <Text className="text-sm font-extrabold text-gray-900 mb-3">
            Informasi Akun
          </Text>

          <View className="space-y-2.5">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-row items-center">
                <Mail size={15} color="#6B7280" />
                <Text className="text-xs font-medium text-gray-500 ml-2">
                  Email
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900">
                {user?.email || 'alex.smith@example.com'}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-1 border-t border-gray-100">
              <View className="flex-row items-center">
                <MapPin size={15} color="#6B7280" />
                <Text className="text-xs font-medium text-gray-500 ml-2">
                  Wilayah Pilot
                </Text>
              </View>
              <Text className="text-xs font-bold text-gray-900">
                {user?.wilayah || 'DIY / Jakarta Selatan'}
              </Text>
            </View>
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

        {/* Modal 1: Edit Reminder Time */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-2xl">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Clock size={18} color="#1C7430" />
                  <Text className="text-base font-extrabold text-gray-900 ml-2">
                    Ubah Waktu Alarm
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-gray-500 mb-4 leading-relaxed">
                Pilih waktu harian untuk alarm <Text className="font-bold text-gray-800">{selectedReminder?.label}</Text>.
              </Text>

              {/* Time Display Preview */}
              <View className="bg-[#E8F5E9] py-4 rounded-2xl items-center justify-center mb-4">
                <Text className="text-3xl font-black text-[#1C7430] tracking-wider">
                  {String(editHour).padStart(2, '0')}:{String(editMinute).padStart(2, '0')} <Text className="text-base font-bold">WIB</Text>
                </Text>
              </View>

              {/* Hour Selection Grid */}
              <Text className="text-xs font-bold text-gray-700 mb-2">
                Pilih Jam:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3.5 -mx-1">
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setEditHour(h)}
                    className={`px-3.5 py-2 rounded-xl mr-2 border ${
                      editHour === h
                        ? 'bg-[#1C7430] border-[#1C7430]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${editHour === h ? 'text-white' : 'text-gray-700'}`}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Minute Selection Grid */}
              <Text className="text-xs font-bold text-gray-700 mb-2">
                Pilih Menit:
              </Text>
              <View className="flex-row justify-between mb-5">
                {[0, 15, 30, 45].map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setEditMinute(m)}
                    className={`flex-1 py-2 mx-1 rounded-xl items-center justify-center border ${
                      editMinute === m
                        ? 'bg-[#1C7430] border-[#1C7430]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${editMinute === m ? 'text-white' : 'text-gray-700'}`}>
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Simpan Jam Alarm"
                onPress={handleSaveEditTime}
                size="md"
                className="w-full"
                icon={<Check size={16} color="#FFFFFF" />}
              />
            </View>
          </View>
        </Modal>

        {/* Modal 2: Add Custom Reminder */}
        <Modal
          visible={addModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-2xl">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Plus size={18} color="#1C7430" />
                  <Text className="text-base font-extrabold text-gray-900 ml-2">
                    Tambah Jadwal Pengingat
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Nama Pengingat
                </Text>
                <View className="bg-[#F9FAFB] border border-gray-200 rounded-2xl px-3.5 py-2.5">
                  <TextInput
                    value={newLabel}
                    onChangeText={setNewLabel}
                    placeholder="Contoh: Siram Siang / Cek Pupuk"
                    className="text-xs font-bold text-gray-900"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-xs font-bold text-gray-700 mb-1">
                  Keterangan Singkat
                </Text>
                <View className="bg-[#F9FAFB] border border-gray-200 rounded-2xl px-3.5 py-2.5">
                  <TextInput
                    value={newSubtitle}
                    onChangeText={setNewSubtitle}
                    placeholder="Contoh: Siram ekstra saat cuaca panas"
                    className="text-xs font-medium text-gray-900"
                  />
                </View>
              </View>

              {/* Time Display Preview */}
              <View className="bg-[#E8F5E9] py-3 rounded-2xl items-center justify-center mb-3">
                <Text className="text-2xl font-black text-[#1C7430]">
                  {String(newHour).padStart(2, '0')}:{String(newMinute).padStart(2, '0')} WIB
                </Text>
              </View>

              {/* Hour Selection Grid */}
              <Text className="text-xs font-bold text-gray-700 mb-1.5">
                Pilih Jam:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1">
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(h => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setNewHour(h)}
                    className={`px-3 py-1.5 rounded-xl mr-1.5 border ${
                      newHour === h
                        ? 'bg-[#1C7430] border-[#1C7430]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${newHour === h ? 'text-white' : 'text-gray-700'}`}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Minute Selection Grid */}
              <Text className="text-xs font-bold text-gray-700 mb-1.5">
                Pilih Menit:
              </Text>
              <View className="flex-row justify-between mb-4">
                {[0, 15, 30, 45].map(m => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setNewMinute(m)}
                    className={`flex-1 py-1.5 mx-1 rounded-xl items-center justify-center border ${
                      newMinute === m
                        ? 'bg-[#1C7430] border-[#1C7430]'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${newMinute === m ? 'text-white' : 'text-gray-700'}`}>
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Aktifkan Alarm Pengingat"
                onPress={handleSaveNewReminder}
                size="md"
                className="w-full"
                icon={<Check size={16} color="#FFFFFF" />}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

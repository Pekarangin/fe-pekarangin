import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { Lahan } from '../../types';

interface DeleteLahanModalProps {
  visible: boolean;
  lahan: Lahan | null;
  cropCount?: number;
  activeCrops?: any[];
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteLahanModal: React.FC<DeleteLahanModalProps> = ({
  visible,
  lahan,
  cropCount,
  activeCrops,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  if (!lahan) return null;

  const effectiveCropCount =
    typeof cropCount === 'number'
      ? cropCount
      : (activeCrops || []).filter(
          (c: any) => c.lahan_id === lahan.lahan_id && c.status === 'AKTIF'
        ).length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center shadow-2xl border border-gray-100">
          <View className="w-16 h-16 rounded-2xl bg-red-100 items-center justify-center mb-3.5 border border-red-200">
            <Trash2 size={30} color="#DC2626" />
          </View>

          <View className="bg-red-50 border border-red-200 px-3 py-1 rounded-full mb-2">
            <Text className="text-[10px] font-black text-red-900 uppercase tracking-wider">
              Konfirmasi Hapus
            </Text>
          </View>

          <Text className="text-lg font-black text-gray-900 text-center mb-1.5">
            Hapus Pekarangan?
          </Text>

          {/* Lahan Info Card */}
          <View className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 my-3 items-center">
            <Text className="text-sm font-black text-gray-900 text-center">
              🌱 {lahan.nama_lahan}
            </Text>
            <Text className="text-xs text-gray-500 font-medium mt-0.5">
              Luas: {lahan.luas_m2} m² • {effectiveCropCount} Tanaman Aktif
            </Text>
          </View>

          <Text className="text-xs text-gray-500 text-center leading-relaxed mb-5 px-1">
            {effectiveCropCount > 0
              ? `Pekarangan ini memuat ${effectiveCropCount} tanaman yang sedang dirawat. Menghapus pekarangan akan menghapus seluruh data tanaman dan riwayat perawatan permanen.`
              : 'Apakah Anda yakin ingin menghapus pekarangan ini? Tindakan ini tidak dapat dibatalkan.'}
          </Text>

          {/* Actions */}
          <View className="flex-row items-center w-full gap-2.5">
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              activeOpacity={0.8}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 border border-gray-200 items-center justify-center"
            >
              <Text className="text-xs font-bold text-gray-700">
                Batal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              activeOpacity={0.85}
              className="flex-1 py-3.5 rounded-2xl bg-red-600 items-center justify-center shadow-xs"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-xs font-black text-white">
                  Hapus Pekarangan
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

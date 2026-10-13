import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Sprout,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isError?: boolean;
}

const PRESET_PROMPTS = [
  'Bagaimana mengatasi daun tanaman yang menguning?',
  'Kapan waktu terbaik menyiram tanaman saat cuaca panas?',
  'Takaran pupuk organik yang pas untuk sayuran daun',
  'Cara membasmi hama kutu putih secara alami di pekarangan',
];

let msgSeq = 0;
function generateMessageId(prefix: string): string {
  msgSeq += 1;
  return `${prefix}-${msgSeq}-${Math.random().toString(36).slice(2, 7)}`;
}

function getFormattedTime(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function KonsultasiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, activeCrops, activeLahan, askAiInsight } = useApp();

  const [selectedCropId, setSelectedCropId] = useState<string | undefined>(undefined);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const activeOnlyCrops = activeCrops.filter(c => c.status === 'AKTIF');

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'agent',
      text: `Halo ${user?.nama || 'Sobat Pekarang'}! 🌱 Saya Agen Agronomis AI Pekarangin. Anda bisa berkonsultasi seputar perawatan tanaman, jadwal siram & pupuk, penanganan hama, atau strategi mengoptimalkan panen di pekarangan rumah Anda. Apa yang ingin ditanyakan hari ini?`,
      timestamp: 'Baru saja',
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId('usr'),
      sender: 'user',
      text: query,
      timestamp: getFormattedTime(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Kirim ke endpoint backend API (/ai-insight/chat)
      const res = await askAiInsight(query, selectedCropId);

      const agentReply: ChatMessage = {
        id: generateMessageId('agent'),
        sender: 'agent',
        text: res.reply || 'Terima kasih atas pertanyaannya! Pastikan tanaman mendapat sinar matahari cukup dan kelembapan media tanam terjaga.',
        timestamp: getFormattedTime(),
      };

      setMessages(prev => [...prev, agentReply]);
    } catch (err: any) {
      console.warn('Gagal kirim pesan ke agent API:', err);

      // Graceful fallback response jika server/koneksi bermasalah
      const fallbackReply: ChatMessage = {
        id: generateMessageId('agent-err'),
        sender: 'agent',
        text: 'Mohon maaf, saat ini server agen AI sedang mengalami gangguan koneksi. Untuk penanganan umum tanaman pekarangan: pastikan drainase pot lancar, siram di pagi atau sore hari, dan hindari paparan terik berlebih saat bibit masih muda. Silakan coba kembali sesaat lagi.',
        timestamp: getFormattedTime(),
        isError: true,
      };

      setMessages(prev => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: generateMessageId('welcome'),
        sender: 'agent',
        text: `Percakapan telah direset. Silakan tanyakan hal lain seputar budidaya tanaman pekarangan Anda! 🌿`,
        timestamp: getFormattedTime(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-[#F4F7F4]" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="bg-white border-b border-gray-200/80 px-4 py-3 flex-row items-center justify-between shadow-xs">
        <View className="flex-row items-center flex-1 mr-3">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={20} color="#1F2937" />
          </TouchableOpacity>
          <View className="relative mr-2.5">
            <View className="w-10 h-10 rounded-2xl bg-[#124E2A] items-center justify-center shadow-xs">
              <Bot size={22} color="#FFFFFF" />
            </View>
            <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-gray-900 tracking-tight" numberOfLines={1}>
              Agen Agronomis AI
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Sparkles size={11} color="#16A34A" />
              <Text className="text-[11px] font-semibold text-emerald-700 ml-1">
                Online • API Terhubung
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleResetChat}
          activeOpacity={0.7}
          className="p-2 rounded-xl bg-gray-50 border border-gray-200"
        >
          <RotateCcw size={16} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Lahan & Crop Context Filter Pills */}
      <View className="bg-white border-b border-gray-100 px-4 py-2.5">
        <View className="flex-row items-center mb-1.5">
          <Sprout size={13} color="#124E2A" />
          <Text className="text-[11px] font-bold text-gray-700 ml-1.5">
            Konteks Tanaman:
          </Text>
          {activeLahan && (
            <Text className="text-[11px] text-gray-400 ml-1.5" numberOfLines={1}>
              ({activeLahan.nama_lahan})
            </Text>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-1">
          <TouchableOpacity
            onPress={() => setSelectedCropId(undefined)}
            className={`px-3 py-1.5 rounded-xl mr-2 border ${
              selectedCropId === undefined
                ? 'bg-[#124E2A] border-[#124E2A]'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                selectedCropId === undefined ? 'text-white' : 'text-gray-600'
              }`}
            >
              🌿 Umum (Semua Tanaman)
            </Text>
          </TouchableOpacity>

          {activeOnlyCrops.map(crop => {
            const isSelected = selectedCropId === crop.tanaman_aktif_id;
            return (
              <TouchableOpacity
                key={crop.tanaman_aktif_id}
                onPress={() => setSelectedCropId(crop.tanaman_aktif_id)}
                className={`px-3 py-1.5 rounded-xl mr-2 border ${
                  isSelected
                    ? 'bg-[#124E2A] border-[#124E2A]'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold capitalize ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  🌱 {crop.komoditas_nama}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <View className="w-8 h-8 rounded-full bg-[#124E2A] items-center justify-center mr-2 mt-1 shadow-xs">
                  <Bot size={16} color="#FFFFFF" />
                </View>
              )}

              <View
                className={`max-w-[82%] px-4 py-3 rounded-2xl ${
                  isUser
                    ? 'bg-[#124E2A] rounded-tr-xs'
                    : msg.isError
                    ? 'bg-amber-50 border border-amber-200 rounded-tl-xs'
                    : 'bg-white border border-gray-100 rounded-tl-xs shadow-xs'
                }`}
              >
                {msg.isError && (
                  <View className="flex-row items-center mb-1">
                    <AlertCircle size={13} color="#D97706" />
                    <Text className="text-[11px] font-bold text-amber-800 ml-1">
                      Respons Cadangan Offline
                    </Text>
                  </View>
                )}
                <Text
                  className={`text-sm leading-relaxed ${
                    isUser ? 'text-white font-medium' : 'text-gray-800'
                  }`}
                >
                  {msg.text}
                </Text>
                <Text
                  className={`text-[10px] mt-1.5 self-end ${
                    isUser ? 'text-green-200 font-medium' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </Text>
              </View>

              {isUser && (
                <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center ml-2 mt-1 border border-emerald-200">
                  <User size={16} color="#124E2A" />
                </View>
              )}
            </View>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <View className="flex-row items-center justify-start mb-4">
            <View className="w-8 h-8 rounded-full bg-[#124E2A] items-center justify-center mr-2 shadow-xs">
              <Bot size={16} color="#FFFFFF" />
            </View>
            <View className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex-row items-center">
              <ActivityIndicator size="small" color="#124E2A" />
              <Text className="text-xs font-semibold text-gray-500 ml-2">
                Agen sedang menganalisis pertanyaan...
              </Text>
            </View>
          </View>
        )}

        {/* Quick Suggestion Pills (Shown when few messages) */}
        {messages.length <= 2 && !isLoading && (
          <View className="mt-4 mb-2">
            <View className="flex-row items-center mb-2 px-1">
              <HelpCircle size={13} color="#6B7280" />
              <Text className="text-xs font-bold text-gray-500 ml-1.5">
                Contoh Pertanyaan Cepat:
              </Text>
            </View>
            <View className="space-y-2">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSendMessage(prompt)}
                  activeOpacity={0.8}
                  className="bg-white border border-green-200/80 p-3 rounded-2xl shadow-xs flex-row items-center justify-between"
                >
                  <Text className="text-xs font-semibold text-gray-800 flex-1 mr-2">
                    {prompt}
                  </Text>
                  <Send size={12} color="#124E2A" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Message Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="bg-white border-t border-gray-200 px-4 pt-3 flex-row items-center shadow-lg"
        >
          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex-row items-center mr-2.5 border border-gray-200 focus:border-[#124E2A]">
            <TextInput
              placeholder="Tanyakan masalah tanaman ke Agen AI..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              className="flex-1 text-sm text-gray-900 max-h-24 py-1"
            />
          </View>

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.85}
            className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
              !inputText.trim() || isLoading
                ? 'bg-gray-300'
                : 'bg-[#124E2A]'
            }`}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

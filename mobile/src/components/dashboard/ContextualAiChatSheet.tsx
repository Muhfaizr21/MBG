import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldCheck,
  Flame,
  Lightbulb,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QualityVerdict } from '../../utils/quality';
import { DetectedFoodItem } from './ScannerScreen';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  badge?: string;
}

interface ContextualAiChatSheetProps {
  visible: boolean;
  onClose: () => void;
  batchCode: string;
  totalNutrition: {
    energi: number;
    protein: number;
    lemak: number;
    karbo: number;
    serat: number;
  };
  detectedItems: DetectedFoodItem[];
  score: number;
  holdingTempC: number;
  verdict: QualityVerdict;
}

const QUICK_PROMPTS = [
  'Apakah protein ini cukup untuk anak 10 tahun?',
  'Berapa batas aman suhu holding makanan ini?',
  'Apakah ada potensi alergen pada menu ini?',
  'Bagaimana rekomendasi porsi untuk anak SD kelas 1-3?',
  'Apa arti hasil classifier pada porsi ini?',
];

export const ContextualAiChatSheet: React.FC<ContextualAiChatSheetProps> = ({
  visible,
  onClose,
  batchCode,
  totalNutrition,
  detectedItems,
  score,
  holdingTempC,
  verdict,
}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const formatNumber = (num: number): string => {
    return num.toFixed(1).replace('.', ',');
  };

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Panduan ini memakai hasil server untuk batch **${batchCode || 'belum dipindai'}**. Dataset menghitung energi **${formatNumber(totalNutrition.energi)} kkal** dan protein **${formatNumber(totalNutrition.protein)} g**. Classifier hanya membedakan fresh/stale buah dan sayur; bukan detektor alergen, benda asing, atau keamanan mikrobiologis.`,
      timestamp: 'Baru saja',
      badge: 'Panduan hasil server',
    },
  ]);

  // Reset or scroll on open
  useEffect(() => {
    if (visible) {
      setMessages([{
        id: 'welcome',
        sender: 'ai',
        text: `Panduan ini memakai hasil server untuk batch **${batchCode || 'belum dipindai'}**. Dataset menghitung energi **${formatNumber(totalNutrition.energi)} kkal** dan protein **${formatNumber(totalNutrition.protein)} g**. Classifier hanya membedakan fresh/stale buah dan sayur; bukan detektor alergen, benda asing, atau keamanan mikrobiologis.`,
        timestamp: 'Baru saja',
        badge: 'Panduan hasil server',
      }]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, batchCode, totalNutrition.energi, totalNutrition.protein]);

  // Deterministic guide using only the values returned by the scan API; it is not an LLM.
  const generateContextualResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('alergen') || q.includes('alergi')) {
      return 'Model ini tidak mengenali bahan makanan dan tidak mendeteksi alergen. Periksa label resmi dari SPPG serta data alergi siswa; konfirmasi ke petugas jika belum jelas.';
    }
    if (q.includes('serat') || q.includes('vitamin')) {
      return 'Dataset yang dipakai API saat ini mengembalikan energi, protein, lemak, dan karbohidrat. Serat dan vitamin belum tersedia pada hasil ini.';
    }
    if (q.includes('suhu') || q.includes('holding') || q.includes('haccp') || q.includes('waktu')) {
      return `Suhu holding yang dimasukkan: ${holdingTempC}°C. Status server: ${verdict.label}. API belum menerima waktu selesai masak, jadi sisa waktu konsumsi tidak dapat dihitung.`;
    }
    if (q.includes('qr') || q.includes('skor') || q.includes('mutu') || q.includes('layak') || q.includes('aman')) {
      return `Hasil server untuk ${batchCode || 'boks ini'}: keyakinan classifier ${score}/100, status ${verdict.label}. QR hanya diperiksa formatnya. Classifier fresh/stale dilatih untuk buah dan sayur; ini bukan pembuktian keamanan mikrobiologis.`;
    }
    return `Lookup dataset server: energi ${formatNumber(totalNutrition.energi)} kkal, protein ${formatNumber(totalNutrition.protein)} g, lemak ${formatNumber(totalNutrition.lemak)} g, karbohidrat ${formatNumber(totalNutrition.karbo)} g. Hasil bergantung pada bahan dan berat yang dikirim; foto tidak mengenali bahan atau gramatur.`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${prev.length}`, sender: 'user', text: query, timestamp: 'Sekarang' },
    ]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Tampilkan panduan deterministik berdasarkan hasil server.
    setTimeout(() => {
      const responseText = generateContextualResponse(query);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${prev.length}`,
          sender: 'ai',
          text: responseText,
          timestamp: 'Sekarang',
          badge: 'Panduan hasil server',
        },
      ]);
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }, 650);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {/* Top Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.botIconWrapper}>
                <Bot size={22} color="#FFFFFF" strokeWidth={2.2} />
                <View style={styles.botSparkleMini}>
                  <Sparkles size={9} color="#F59E0B" fill="#F59E0B" />
                </View>
              </View>

              <View style={styles.headerTextWrapper}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>Panduan Gizi & Keamanan</Text>
                  <View style={styles.onlinePill}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Panduan</Text>
                  </View>
                </View>
                <Text style={styles.headerSubtitle}>
                  Konteks Aktif: Porsi MBG · {detectedItems.length} Kompartemen
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Tutup panduan"
              >
                <X size={18} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Context Summary Bar */}
            <View style={styles.contextSummaryBar}>
              <View style={styles.contextBadge}>
                <Flame size={12} color="#EA580C" />
                <Text style={styles.contextBadgeText}>{formatNumber(totalNutrition.energi)} kal</Text>
              </View>
              <View style={styles.contextBadge}>
                <Text style={styles.contextBadgeText}>Prot: {formatNumber(totalNutrition.protein)}g</Text>
              </View>
              <View style={styles.contextBadge}>
                <ShieldCheck size={12} color="#15803D" />
                <Text style={styles.contextBadgeText}>Keyakinan classifier {score}/100</Text>
              </View>
              <View style={styles.contextBadge}>
                <Text style={styles.contextBadgeText}>{holdingTempC}°C</Text>
              </View>
            </View>

            {/* Chat Thread */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((item) => {
                const isUser = item.sender === 'user';
                return (
                  <View
                    key={item.id}
                    style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}
                  >
                    {!isUser && (
                      <View style={styles.messageAiAvatar}>
                        <Sparkles size={14} color="#0C4A94" />
                      </View>
                    )}

                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.bubbleUser : styles.bubbleAi,
                      ]}
                    >
                      {item.badge && !isUser && (
                        <View style={styles.bubbleBadgeRow}>
                          <Text style={styles.bubbleBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser ? styles.bubbleTextUser : styles.bubbleTextAi,
                        ]}
                      >
                        {item.text}
                      </Text>
                      <Text
                        style={[
                          styles.bubbleTime,
                          isUser ? styles.bubbleTimeUser : styles.bubbleTimeAi,
                        ]}
                      >
                        {item.timestamp}
                      </Text>
                    </View>

                    {isUser && (
                      <View style={styles.messageUserAvatar}>
                        <User size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <View style={[styles.messageRow, styles.messageRowAi]}>
                  <View style={styles.messageAiAvatar}>
                    <Sparkles size={14} color="#0C4A94" />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                    <ActivityIndicator size="small" color="#0C4A94" />
                    <Text style={styles.typingText}>Menganalisis data porsi...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestion Prompts */}
            <View style={styles.quickPromptsSection}>
              <View style={styles.quickPromptsHeader}>
                <Lightbulb size={12} color="#D97706" />
                <Text style={styles.quickPromptsTitle}>Pertanyaan Populer</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPromptsScroll}
              >
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptChip}
                    onPress={() => handleSendMessage(prompt)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={prompt}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Chat Input Bar */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Tanyakan seputar gizi, kelayakan, AKG..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim().length > 0 && styles.sendButtonActive,
                ]}
                onPress={() => handleSendMessage()}
                disabled={inputText.trim().length === 0 || isTyping}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Kirim Pertanyaan"
              >
                <Send
                  size={16}
                  color={inputText.trim().length > 0 ? '#FFFFFF' : '#94A3B8'}
                  strokeWidth={2.4}
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  botIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0C4A94',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#0C4A94',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  botSparkleMini: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  onlineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    flexWrap: 'wrap',
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contextBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  messagesScroll: {
    height: 280,
    marginTop: 8,
  },
  messagesContainer: {
    paddingVertical: 6,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageRowAi: {
    justifyContent: 'flex-start',
    marginRight: 40,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
    marginLeft: 40,
  },
  messageAiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageUserAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0C4A94',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '88%',
  },
  bubbleAi: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#0C4A94',
    borderBottomRightRadius: 4,
  },
  bubbleBadgeRow: {
    marginBottom: 4,
  },
  bubbleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextAi: {
    color: '#1E293B',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bubbleTime: {
    fontSize: 9.5,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeAi: {
    color: '#94A3B8',
  },
  bubbleTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  quickPromptsSection: {
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickPromptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  quickPromptsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  quickPromptsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  promptChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promptChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#0C4A94',
    shadowColor: '#0C4A94',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Image as ImageIcon,
  Camera,
  Tag,
  Sparkles,
  Send,
  AlertCircle,
  Video,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AVAILABLE_TAGS, COMMUNITY_TAG_CONFIGS, CommunityPost } from '../../types/community';
import { useAuthRole } from '../../context/RoleContext';

// Helper to convert images to persistent Base64 Data URIs that survive browser reloads & restarts
const convertToPersistentBase64 = async (
  uri: string,
  rawBase64?: string | null,
): Promise<string> => {
  if (rawBase64) {
    return `data:image/jpeg;base64,${rawBase64}`;
  }
  if (uri.startsWith('data:')) {
    return uri;
  }
  // If running on web with blob: URI, convert to base64 Data URL
  if (Platform.OS === 'web' && uri.startsWith('blob:')) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to convert blob to base64 data URL:', e);
      return uri;
    }
  }
  return uri;
};

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    title: string;
    content: string;
    tag: string;
    mediaUri?: string;
    mediaType?: 'image' | 'video';
  }) => Promise<void>;
  initialData?: CommunityPost | null;
  mode?: 'create' | 'edit';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const { user } = useAuthRole();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState(AVAILABLE_TAGS[0]);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEdit = mode === 'edit' || Boolean(initialData);

  // Sync state whenever modal opens or initialData changes
  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.content || '');
        setSelectedTag(initialData.tag || AVAILABLE_TAGS[0]);
        setMediaUri(initialData.mediaUri || null);
        setMediaType(initialData.mediaType || 'image');
        setErrorMsg(null);
      } else {
        resetForm();
      }
    }
  }, [visible, initialData]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedTag(AVAILABLE_TAGS[0]);
    setMediaUri(null);
    setMediaType('image');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickMedia = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const isVideo = asset.type === 'video';
        if (!isVideo) {
          const persistentUri = await convertToPersistentBase64(asset.uri, asset.base64);
          setMediaUri(persistentUri);
        } else {
          setMediaUri(asset.uri);
        }
        setMediaType(isVideo ? 'video' : 'image');
      }
    } catch (err) {
      console.warn('Pick media error:', err);
      if (Platform.OS === 'web') {
        window.alert('Gagal mengakses galeri media. Pastikan izin akses media telah diaktifkan.');
      } else {
        Alert.alert('Gagal Mengakses Galeri', 'Pastikan izin akses media telah diaktifkan.');
      }
    }
  };

  const handleCaptureCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        if (Platform.OS === 'web') {
          window.alert('Aplikasi memerlukan izin kamera untuk mengambil foto.');
        } else {
          Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin kamera untuk mengambil foto.');
        }
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const persistentUri = await convertToPersistentBase64(asset.uri, asset.base64);
        setMediaUri(persistentUri);
        setMediaType('image');
      }
    } catch (err) {
      console.warn('Launch camera error:', err);
      if (Platform.OS === 'web') {
        window.alert('Terjadi kendala saat mengakses kamera.');
      } else {
        Alert.alert('Gagal Membuka Kamera', 'Terjadi kendala saat mengakses kamera.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Judul topik diskusi wajib diisi.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Isi detail diskusi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await onSubmit({
        id: initialData?.id,
        title: title.trim(),
        content: content.trim(),
        tag: selectedTag,
        mediaUri: mediaUri || undefined,
        mediaType,
      });
      resetForm();
      onClose();
    } catch (err) {
      console.warn('Submit post error:', err);
      setErrorMsg(isEdit ? 'Gagal menyimpan perubahan diskusi.' : 'Gagal mempublikasikan diskusi. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrapper}>
                <Sparkles size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {isEdit ? 'Edit Topik Diskusi' : 'Mulai Diskusi Baru'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEdit ? (
                    'Perbarui konten atau lampiran topik diskusi Anda'
                  ) : (
                    <>
                      Posting sebagai: <Text style={styles.authorHighlight}>{user.name}</Text> ({user.schoolName})
                    </>
                  )}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {errorMsg && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Tag Selector */}
            <View style={styles.formSection}>
              <View style={styles.sectionLabelRow}>
                <Tag size={14} color="#64748B" />
                <Text style={styles.sectionLabel}>Kategori / Tag Topik</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagChipsRow}
              >
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTag === tag;
                  const cfg = COMMUNITY_TAG_CONFIGS[tag];
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        isSelected && {
                          backgroundColor: cfg.bg,
                          borderColor: cfg.color,
                        },
                      ]}
                      onPress={() => setSelectedTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          isSelected && { color: cfg.color, fontWeight: '700' },
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Input Judul */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Judul Diskusi</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Contoh: Penanganan suhu boks di bawah 60°C..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setErrorMsg(null);
                }}
                maxLength={120}
              />
            </View>

            {/* Input Isi Pesan */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Isi Detail Diskusi / Pertanyaan</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Tuliskan pengalaman, SOP spesifik, atau kendala serah terima yang ingin didiskusikan..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={content}
                onChangeText={(t) => {
                  setContent(t);
                  setErrorMsg(null);
                }}
              />
            </View>

            {/* Media Attachment */}
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Lampirkan Foto / Video (Opsional)</Text>
              <View style={styles.mediaActionRow}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handlePickMedia}
                  activeOpacity={0.7}
                >
                  <ImageIcon size={18} color="#2563EB" />
                  <Text style={styles.mediaButtonText}>Galeri Media</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handleCaptureCamera}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color="#059669" />
                  <Text style={styles.mediaButtonText}>Buka Kamera</Text>
                </TouchableOpacity>
              </View>

              {/* Media Preview Box */}
              {mediaUri && (
                <View style={styles.mediaPreviewCard}>
                  {mediaType === 'video' ? (
                    <View style={styles.videoPlaceholder}>
                      <Video size={32} color="#D97706" />
                      <Text style={styles.videoLabel}>Video Terlampir</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: mediaUri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}

                  <TouchableOpacity
                    style={styles.removeMediaBtn}
                    onPress={() => setMediaUri(null)}
                    activeOpacity={0.8}
                  >
                    <X size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer CTA */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!title.trim() || !content.trim() || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!title.trim() || !content.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    {isEdit ? 'Simpan Perubahan' : 'Publikasikan'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  authorHighlight: {
    fontWeight: '600',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingVertical: 16,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    flex: 1,
  },
  formSection: {
    gap: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  tagChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
  },
  titleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  contentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: '#1E293B',
    minHeight: 110,
    lineHeight: 20,
  },
  mediaActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
  },
  mediaButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  mediaPreviewCard: {
    position: 'relative',
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
  },
  videoLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EBA338',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

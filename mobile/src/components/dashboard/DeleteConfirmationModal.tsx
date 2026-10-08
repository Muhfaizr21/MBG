import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';

export interface DeleteConfirmationModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  postTitle?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  title = 'Hapus Diskusi',
  message = 'Apakah Anda yakin ingin menghapus topik diskusi ini? Tindakan ini tidak dapat dibatalkan.',
  postTitle,
  isDeleting = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={isDeleting ? undefined : onCancel}
        />

        <View style={styles.modalCard}>
          {/* Warning Icon Badge */}
          <View style={styles.iconCircle}>
            <Trash2 size={24} color="#EF4444" />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Optional post title preview */}
          {postTitle ? (
            <View style={styles.postSnippetBox}>
              <Text style={styles.postSnippetText} numberOfLines={2}>
                "{postTitle}"
              </Text>
            </View>
          ) : null}

          {/* Confirmation Message */}
          <Text style={styles.modalMessage}>{message}</Text>

          {/* Action Buttons Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isDeleting && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Hapus</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  postSnippetBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    width: '100%',
  },
  postSnippetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnDisabled: {
    opacity: 0.65,
  },
  confirmBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

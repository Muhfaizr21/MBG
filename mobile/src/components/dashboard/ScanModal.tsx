import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { X, QrCode, Sparkles, Check, RefreshCw } from 'lucide-react-native';

interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ visible, onClose }) => {
  const [scanned, setScanned] = useState(false);
  const [simulatedCount, setSimulatedCount] = useState(50);

  const handleSimulateScan = () => {
    setScanned(true);
  };

  const handleConfirm = () => {
    Alert.alert(
      'Validasi Berhasil Disimpan',
      `Master Boks TOTE-05 (50 Porsi) berhasil tervalidasi dengan suhu 65.4°C. Data dikirim ke Satgas MBG.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            onClose();
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setScanned(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>AI Box Scanner MBG</Text>
              <Text style={styles.subtitle}>Arahkan kamera ke QR Code atau susunan boks</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder / Camera Simulation */}
          <View style={styles.scannerBox}>
            <View style={styles.viewfinderCornerTL} />
            <View style={styles.viewfinderCornerTR} />
            <View style={styles.viewfinderCornerBL} />
            <View style={styles.viewfinderCornerBR} />

            {scanned ? (
              <View style={styles.detectedResult}>
                <View style={styles.detectedBadge}>
                  <Sparkles size={16} color="#10B981" />
                  <Text style={styles.detectedBadgeText}>AI Terdeteksi Otomatis</Text>
                </View>
                <Text style={styles.detectedBoxId}>TOTE #05 (Kelas 3A)</Text>
                <Text style={styles.detectedCount}>{simulatedCount} Porsi Lengkap</Text>
                <Text style={styles.detectedTemp}>🌡️ Suhu Makanan: 65.4°C (Aman)</Text>
              </View>
            ) : (
              <View style={styles.scanningPlaceholder}>
                <QrCode size={56} color="#EBA338" />
                <Text style={styles.scanningText}>Memindai barcode boks...</Text>
                <TouchableOpacity style={styles.scanSimBtn} onPress={handleSimulateScan}>
                  <Text style={styles.scanSimBtnText}>Ketuk untuk Simulasi Deteksi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {scanned ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <RefreshCw size={16} color="#64748B" />
                <Text style={styles.resetBtnText}>Pindai Ulang</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Konfirmasi Validasi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  scannerBox: {
    height: 240,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  viewfinderCornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#EBA338',
  },
  viewfinderCornerTR: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#EBA338',
  },
  viewfinderCornerBL: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#EBA338',
  },
  viewfinderCornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#EBA338',
  },
  scanningPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  scanningText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  scanSimBtn: {
    backgroundColor: '#EBA338',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 6,
  },
  scanSimBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  detectedResult: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  detectedBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  detectedBoxId: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  detectedCount: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detectedTemp: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#EBA338',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});

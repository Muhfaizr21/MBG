import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { ChevronLeft, Camera, Check, AlertTriangle } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import {
  buildTicketId,
  deriveSeverity,
  INCIDENT_CATEGORIES,
  IncidentCategoryKey,
  IncidentTicket,
} from '../../utils/incident';
import { HANDOVER_SCHOOL, HANDOVER_SHIPMENT } from '../../data/mockHandoverData';

const FIRST_AID_STEPS = [
  'Amankan dan pisahkan boks yang bermasalah dari jangkauan anak-anak.',
  'Masukkan satu sampel ke plastik steril untuk uji laboratorium.',
  'Beri air putih matang kepada siswa yang sempat mencicipi, lalu bawa ke ruang UKS.',
];

const MAX_EVIDENCE = 3;

export const IncidentScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [categories, setCategories] = useState<IncidentCategoryKey[]>([]);
  const [affected, setAffected] = useState('');
  const [arrivalTemp, setArrivalTemp] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [ticket, setTicket] = useState<IncidentTicket | null>(null);

  const affectedPortions = parseInt(affected, 10) || 0;
  const temp = parseFloat(arrivalTemp);

  const severity = useMemo(
    () =>
      deriveSeverity({
        categories,
        affectedPortions,
        arrivalTempC: Number.isFinite(temp) ? temp : undefined,
      }),
    [categories, affectedPortions, temp],
  );

  const ready = categories.length > 0 && affectedPortions > 0;

  const toggleCategory = (key: IncidentCategoryKey) => {
    setCategories((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key],
    );
  };

  const handleSubmit = () => {
    if (!ready) {
      Alert.alert(
        'Laporan belum lengkap',
        categories.length === 0
          ? 'Pilih minimal satu kategori insiden.'
          : 'Isi jumlah porsi yang terdampak.',
      );
      return;
    }
    setTicket({
      id: buildTicketId({
        cityCode: HANDOVER_SCHOOL.cityCode,
        date: new Date(),
        npsnSuffix: HANDOVER_SCHOOL.npsnSuffix,
        sequence: 1,
      }),
      createdAt: new Date(),
      categories,
      affectedPortions,
      severity: severity.severity,
      sentToCommandCenter: false,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke beranda"
          >
            <ChevronLeft size={22} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Lapor Insiden</Text>
            <Text style={styles.subtitle}>{HANDOVER_SCHOOL.name}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Kamera belum terhubung, jadi bukti foto tidak bisa dilampirkan. Laporan
            tersimpan di perangkat dan belum dikirim ke Satuan Tugas MBG.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Kategori insiden</Text>
          <Text style={styles.blockCaption}>Pilih semua yang sesuai, bukan hanya yang pertama.</Text>

          {INCIDENT_CATEGORIES.map((category) => {
            const isSelected = categories.includes(category.key);
            return (
              <TouchableOpacity
                key={category.key}
                style={[styles.categoryRow, isSelected && styles.categoryRowOn]}
                onPress={() => toggleCategory(category.key)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${category.label}. ${category.hint}`}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected && <Check size={14} color="#1E293B" strokeWidth={3} />}
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryHint}>{category.hint}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Dampak</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Porsi terdampak</Text>
            <TextInput
              style={styles.fieldInput}
              value={affected}
              onChangeText={setAffected}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Jumlah porsi yang terdampak"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Suhu boks saat tiba, °C</Text>
            <TextInput
              style={styles.fieldInput}
              value={arrivalTemp}
              onChangeText={setArrivalTemp}
              keyboardType="numeric"
              placeholder=" opsional"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Suhu boks saat tiba dalam derajat Celsius"
            />
          </View>
          <View style={styles.fieldStack}>
            <Text style={styles.fieldLabel}>Catatan guru</Text>
            <TextInput
              style={styles.fieldTextarea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Apa yang guru lihat, rasakan, dan kapan"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              accessibilityLabel="Catatan guru tentang insiden"
            />
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Bukti foto</Text>
          <Text style={styles.blockCaption}>
            Watermark yang akan ditempelkan: waktu pengambilan, nama sekolah, koordinat
            GPS, dan ID batch {HANDOVER_SHIPMENT.fleetPlate}.
          </Text>
          <View style={styles.evidenceRow}>
            <View style={styles.evidenceSlot}>
              <Camera size={22} color="#94A3B8" />
              <Text style={styles.evidenceText}>Kamera belum aktif</Text>
            </View>
            {Array.from({ length: MAX_EVIDENCE - 1 }).map((_, index) => (
              <View key={index} style={styles.evidenceSlotEmpty}>
                <Text style={styles.evidenceIndex}>{index + 2}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.evidenceBtn}
            onPress={() => setEvidenceCount((previous) => Math.min(previous + 1, MAX_EVIDENCE))}
            disabled={evidenceCount >= MAX_EVIDENCE}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Tambah bukti foto"
            accessibilityState={{ disabled: evidenceCount >= MAX_EVIDENCE }}
          >
            <Text style={styles.evidenceBtnText}>
              {evidenceCount >= MAX_EVIDENCE
                ? `${MAX_EVIDENCE} slot bukti terpakai`
                : evidenceCount === 0
                  ? 'Tambah bukti foto'
                  : `${evidenceCount} slot terisi, sisanya terkunci`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.severityCard, { borderColor: severity.color }]}>
          <View style={styles.severityHead}>
            <AlertTriangle size={20} color={severity.color} strokeWidth={2.2} />
            <Text style={[styles.severityLabel, { color: severity.color }]}>
              {severity.label}
            </Text>
          </View>
          <Text style={styles.severityInstruction}>{severity.instruction}</Text>
          {severity.reasons.length > 0 && (
            <View style={styles.reasonList}>
              {severity.reasons.map((reason) => (
                <Text key={reason} style={styles.reasonText}>
                  {reason}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Tindakan pertama</Text>
          <Text style={styles.blockCaption}>Ikuti berurutan, jangan dilewati.</Text>
          {FIRST_AID_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Simpan laporan siaga"
        >
          <Text style={styles.submitBtnText}>Simpan laporan siaga</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet
        visible={ticket !== null}
        onClose={() => setTicket(null)}
        title="Laporan tersimpan di perangkat"
        subtitle={ticket?.id}
      >
        <Text style={styles.sheetBody}>
          Laporan dengan {ticket?.affectedPortions} porsi terdampak sudah dicatat sebagai
          tiket lokal. Belum ada yang dikirim ke Satuan Tugas MBG, jadi status investigasi
          dan penggantian porsi tidak bisa dipantau dari aplikasi ini.
        </Text>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F8F6' },
  content: { paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  notice: { marginHorizontal: 16, backgroundColor: '#FEF3E2', borderRadius: 14, padding: 12 },
  noticeText: { fontSize: 12, color: '#7C4A03', lineHeight: 18 },
  block: { marginTop: 24, paddingHorizontal: 16 },
  blockTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3 },
  blockCaption: { fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 17 },
  categoryRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
  categoryRowOn: { borderColor: '#EBA338', backgroundColor: '#FDF7EC' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#EBA338', borderColor: '#EBA338' },
  categoryText: { flex: 1 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', lineHeight: 20 },
  categoryHint: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 17 },
  fieldRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEEF0',
  },
  fieldStack: { marginTop: 12 },
  fieldLabel: { fontSize: 13, color: '#475569', flex: 1 },
  fieldInput: {
    width: 110,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },
  fieldTextarea: {
    marginTop: 8,
    minHeight: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  evidenceRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  evidenceSlot: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  evidenceSlotEmpty: {
    flex: 1,
    height: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EDEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceText: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },
  evidenceIndex: { fontSize: 13, fontWeight: '700', color: '#CBD5E1' },
  evidenceBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  evidenceBtnText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  severityCard: {
    marginHorizontal: 16,
    marginTop: 28,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  severityHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severityLabel: { fontSize: 19, fontWeight: '800' },
  severityInstruction: { fontSize: 14, color: '#1E293B', lineHeight: 21, marginTop: 8 },
  reasonList: { marginTop: 12, gap: 4 },
  reasonText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 14 },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDEBC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: { fontSize: 12, fontWeight: '800', color: '#7C4A03' },
  stepText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 21 },
  submitBtn: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 999,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  sheetBody: { fontSize: 13, color: '#334155', lineHeight: 20 },
});

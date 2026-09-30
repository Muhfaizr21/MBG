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
import { ChevronLeft, Check, Plus } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { SignaturePad } from '../ui/SignaturePad';
import {
  buildRegistrationNumber,
  checkBastReadiness,
  evaluateTemperature,
  reconcile,
  TemperatureReading,
} from '../../utils/handover';
import {
  HANDOVER_ORGANOLEPTIC_PROMPT,
  HANDOVER_SCHOOL,
  HANDOVER_SHIPMENT,
} from '../../data/mockHandoverData';

export const HandoverScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [toteTemps, setToteTemps] = useState<Record<number, string>>({});
  const [damaged, setDamaged] = useState('0');
  const [organolepticDone, setOrganolepticDone] = useState(false);
  const [driverSignature, setDriverSignature] = useState('');
  const [teacherSignature, setTeacherSignature] = useState('');
  const [issued, setIssued] = useState(false);

  const readings = useMemo(() => {
    const entries = Object.entries(toteTemps);
    return entries.map(([tote, value]) => ({
      tote: Number(tote),
      reading: evaluateTemperature(parseFloat(value), HANDOVER_SHIPMENT.containerKind),
    }));
  }, [toteTemps]);

  const unsafeReadings = readings.filter((item) => item.reading.status !== 'aman');
  const reconciliation = reconcile({
    orderedPortions: HANDOVER_SHIPMENT.orderedPortions,
    totesReceived: readings.length,
    damagedPortions: parseInt(damaged, 10) || 0,
    portionsPerTote: HANDOVER_SHIPMENT.portionsPerTote,
  });

  const registration = buildRegistrationNumber({
    cityCode: HANDOVER_SCHOOL.cityCode,
    date: new Date(2026, 8, 30),
    npsnSuffix: HANDOVER_SCHOOL.npsnSuffix,
    sequence: 42,
  });

  const readiness = checkBastReadiness({
    totesExpected: HANDOVER_SHIPMENT.expectedTotes,
    totesReceived: readings.length,
    hasUnsafeTemperature: unsafeReadings.length > 0,
    organolepticDone,
    damagedBalanced: reconciliation.balanced,
    driverSigned: Boolean(driverSignature),
    teacherSigned: Boolean(teacherSignature),
  });

  const handleIssue = () => {
    if (!readiness.ready) {
      Alert.alert(
        'BAST belum bisa diterbitkan',
        readiness.blockers.map((blocker) => `· ${blocker}`).join('\n'),
      );
      return;
    }
    setIssued(true);
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
            <Text style={styles.title}>Serah Terima BAST</Text>
            <Text style={styles.subtitle}>
              {HANDOVER_SCHOOL.name} · {HANDOVER_SHIPMENT.kitchen}
            </Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Data kuota dan pengantar di halaman ini adalah data contoh. Nomor BAST
            dibuat di perangkat, tidak ada yang dikirim ke server.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Tote diterima</Text>
          <Text style={styles.blockCaption}>
            1 tote = {HANDOVER_SHIPMENT.portionsPerTote} porsi · {HANDOVER_SHIPMENT.fleetPlate},{' '}
            {HANDOVER_SHIPMENT.driverName}
          </Text>

          {readings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Belum ada tote yang dicatat</Text>
              <Text style={styles.emptyBody}>
                Catat tote satu per satu saat master QR-nya dipindai di gerbang, lalu isi
                suhu termometernya.
              </Text>
            </View>
          ) : (
            readings.map(({ tote, reading }) => (
              <ToteRow
                key={tote}
                tote={tote}
                value={toteTemps[tote] ?? ''}
                reading={reading}
                onChange={(next) =>
                  setToteTemps((previous) => ({ ...previous, [tote]: next }))
                }
              />
            ))
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              const next = readings.length + 1;
              setToteTemps((previous) => ({ ...previous, [next]: '' }));
            }}
            disabled={readings.length >= HANDOVER_SHIPMENT.expectedTotes}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Catat tote ${readings.length + 1}`}
            accessibilityState={{
              disabled: readings.length >= HANDOVER_SHIPMENT.expectedTotes,
            }}
          >
            <Plus size={18} color="#1E293B" strokeWidth={2.5} />
            <Text style={styles.addBtnText}>
              {readings.length >= HANDOVER_SHIPMENT.expectedTotes
                ? `Semua ${HANDOVER_SHIPMENT.expectedTotes} tote tercatat`
                : 'Catat tote berikutnya'}
            </Text>
          </TouchableOpacity>
        </View>

        {unsafeReadings.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Uji organoleptik</Text>
            <Text style={styles.blockCaption}>{HANDOVER_ORGANOLEPTIC_PROMPT}</Text>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setOrganolepticDone((previous) => !previous)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: organolepticDone }}
              accessibilityLabel="Sudah diuji organoleptik"
            >
              <View style={[styles.checkbox, organolepticDone && styles.checkboxOn]}>
                {organolepticDone && <Check size={14} color="#1E293B" strokeWidth={3} />}
              </View>
              <Text style={styles.checkLabel}>
                Sampel sudah diuji dan hasilnya dicatat
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Rekonsiliasi porsi</Text>
          <Text style={styles.blockCaption}>{reconciliation.message}</Text>

          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Kuota pesanan</Text>
            <Text style={styles.reconValue}>{HANDOVER_SHIPMENT.orderedPortions} porsi</Text>
          </View>
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Diterima dari tote</Text>
            <Text style={styles.reconValue}>{reconciliation.receivedPortions} porsi</Text>
          </View>
          <View style={styles.reconRow}>
            <Text style={styles.reconLabel}>Bocor atau rusak fisik</Text>
            <TextInput
              style={styles.reconInput}
              value={damaged}
              onChangeText={setDamaged}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Jumlah porsi yang bocor atau rusak fisik"
            />
          </View>
          <View style={styles.reconTotal}>
            <Text style={styles.reconLabel}>Selisih</Text>
            <Text
              style={[
                styles.reconDifference,
                { color: reconciliation.balanced ? '#15803D' : '#B91C1C' },
              ]}
            >
              {reconciliation.discrepancy > 0 ? '+' : ''}
              {reconciliation.discrepancy} porsi
            </Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Tanda tangan digital</Text>
          <Text style={styles.blockCaption}>
            Berdua di layar ponsel: petugas pengantar dan guru validator.
          </Text>
          <SignaturePad
            label="Pihak pertama"
            party={`Petugas pengantar, ${HANDOVER_SHIPMENT.kitchen}`}
            signed={Boolean(driverSignature)}
            onSign={setDriverSignature}
            onClear={() => setDriverSignature('')}
          />
          <View style={styles.padGap} />
          <SignaturePad
            label="Pihak kedua"
            party={`Guru validator, ${HANDOVER_SCHOOL.name}`}
            signed={Boolean(teacherSignature)}
            onSign={setTeacherSignature}
            onClear={() => setTeacherSignature('')}
          />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Nomor registrasi</Text>
          <Text style={styles.registration}>{registration}</Text>
          <Text style={styles.blockCaption}>
            Nomor mengikuti format BAST/MBG-JKT/YYYYMMDD/NPSN-XXX. Belum terdaftar di
            server SPPG, jadi belum sah sebagai dokumen hukum.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.issueBtn}
          onPress={handleIssue}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Terbitkan BAST"
        >
          <Text style={styles.issueBtnText}>Terbitkan BAST</Text>
        </TouchableOpacity>

        {!readiness.ready && (
          <View style={styles.blockerList}>
            <Text style={styles.blockerTitle}>Yang belum lengkap</Text>
            {readiness.blockers.map((blocker) => (
              <Text key={blocker} style={styles.blockerText}>
                {blocker}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomSheet
        visible={issued}
        onClose={() => setIssued(false)}
        title="BAST diterbitkan di perangkat"
        subtitle={registration}
      >
        <Text style={styles.sheetBody}>
          Catatan serah terima tersimpan di perangkat ini. Salinan PDF belum bisa diunduh
          dan belum ada yang dikirim ke SPPG Dapur atau Satuan Tugas MBG, karena prototipe
          belum punya server maupun layanan PDF.
        </Text>
      </BottomSheet>
    </View>
  );
};

const ToteRow: React.FC<{
  tote: number;
  value: string;
  reading: TemperatureReading;
  onChange: (value: string) => void;
}> = ({ tote, value, reading, onChange }) => (
  <View style={styles.toteRow}>
    <View style={styles.toteHead}>
      <Text style={styles.toteTitle}>Tote {tote}</Text>
      <Text style={[styles.toteStatus, { color: reading.color }]}>{reading.label}</Text>
    </View>
    <View style={styles.toteInputRow}>
      <TextInput
        style={styles.toteInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="Suhu °C"
        placeholderTextColor="#94A3B8"
        accessibilityLabel={`Suhu termometer tote ${tote}, dalam derajat Celsius`}
      />
      <Text style={styles.toteMessage}>{reading.message}</Text>
    </View>
  </View>
);

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
  notice: {
    marginHorizontal: 16,
    backgroundColor: '#FEF3E2',
    borderRadius: 14,
    padding: 12,
  },
  noticeText: { fontSize: 12, color: '#7C4A03', lineHeight: 18 },
  block: { marginTop: 24, paddingHorizontal: 16 },
  blockTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3 },
  blockCaption: { fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 17 },
  emptyState: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  emptyBody: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
  toteRow: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
  toteHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toteTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  toteStatus: { fontSize: 12, fontWeight: '700' },
  toteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  toteInput: {
    width: 92,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#F9F8F6',
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  toteMessage: { flex: 1, fontSize: 11, color: '#64748B', lineHeight: 16 },
  addBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  checkRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
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
  checkLabel: { flex: 1, fontSize: 13, color: '#1E293B', lineHeight: 19 },
  reconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEEF0',
  },
  reconLabel: { fontSize: 13, color: '#64748B' },
  reconValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  reconInput: {
    width: 92,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#F9F8F6',
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },
  reconTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  reconDifference: { fontSize: 16, fontWeight: '800' },
  padGap: { height: 12 },
  registration: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  issueBtn: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 999,
    backgroundColor: '#EBA338',
    alignItems: 'center',
  },
  issueBtnText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  blockerList: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
  blockerTitle: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  blockerText: { fontSize: 12, color: '#475569', lineHeight: 18, marginTop: 4 },
  sheetBody: { fontSize: 13, color: '#334155', lineHeight: 20 },
});

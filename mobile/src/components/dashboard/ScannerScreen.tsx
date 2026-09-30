import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { QrCode, ChevronLeft, Check, ShieldAlert, WifiOff } from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { decideQuality, verifyQrPayload, QualityVerdict } from '../../utils/quality';
import { readMacros } from '../../utils/nutrition';
import { addScanLogEntry } from '../../utils/scanLog';
import {
  MOCK_MACRO_ESTIMATE,
  MOCK_SCAN_SCENARIOS,
  SCAN_GRADE_BAND,
  SCAN_SCHOOL,
  ScanScenario,
  ScenarioKey,
} from '../../data/mockScannerData';

const SEVERITY_COLOR = {
  none: '#15803D',
  warning: '#B45309',
  critical: '#B91C1C',
} as const;

export const ScannerScreen: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('layak');
  const [confirm, setConfirm] = useState<QualityVerdict | null>(null);
  const [logged, setLogged] = useState(false);

  const scenario = useMemo(
    () => MOCK_SCAN_SCENARIOS.find((item) => item.key === scenarioKey) ?? MOCK_SCAN_SCENARIOS[0],
    [scenarioKey],
  );

  const qr = useMemo(() => verifyQrPayload(scenario.payload, SCAN_SCHOOL), [scenario]);
  const verdict = useMemo(
    () =>
      decideQuality({
        score: scenario.score,
        holdingTempC: scenario.holdingTempC,
        minutesToDeadline: scenario.minutesToDeadline,
        qrValid: qr.valid,
      }),
    [scenario, qr.valid],
  );
  const macros = useMemo(() => readMacros(SCAN_GRADE_BAND, MOCK_MACRO_ESTIMATE), []);

  const handleAction = (approved: boolean) => {
    if (approved && verdict.verdict === 'ditolak') {
      Alert.alert(
        'Tidak bisa disetujui',
        'Boks ini berstatus tidak layak. Tolak dan amankan sampel, lalu ajukan penarikan batch.',
      );
      return;
    }
    addScanLogEntry({
      scannedAt: new Date(),
      batchCode: scenario.payload.code,
      portions: scenario.portions,
      score: scenario.score,
      severity: verdict.verdict,
    });
    setLogged(true);
    setConfirm(verdict);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.title}>Pindai Boks</Text>
            <Text style={styles.subtitle}>{SCAN_SCHOOL}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Kamera dan model deteksi belum terhubung. Pilih skenario untuk mencoba alur
            keputusan, semua angka di bawah berasal dari skenario itu.
          </Text>
        </View>

        <View style={styles.scenarioRow}>
          {MOCK_SCAN_SCENARIOS.map((item) => {
            const isSelected = item.key === scenarioKey;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.scenarioChip, isSelected && styles.scenarioChipActive]}
                onPress={() => setScenarioKey(item.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Skenario ${item.label}: ${item.description}`}
              >
                <Text style={[styles.scenarioText, isSelected && styles.scenarioTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <QrCode size={40} color="#EBA338" />
          <Text style={styles.viewfinderCode}>{scenario.payload.code}</Text>
          <Text style={styles.viewfinderHint}>Kamera belum aktif, kode ditampilkan sebagai teks</Text>
        </View>

        <ChecklistSection
          step="Tahap 1"
          title="Verifikasi QR boks"
          caption={`Selesai masak ${scenario.payload.cookFinishedAt}, batas aman 4 jam`}
          rows={qr.checks.map((check) => ({
            id: check.key,
            label: check.label,
            value: check.value,
            note: check.requirement,
            color: check.passed ? '#15803D' : '#B91C1C',
          }))}
        />

        <ChecklistSection
          step="Tahap 2"
          title="Deteksi visual porsi"
          caption="Empat kategori yang diperiksa model"
          rows={scenario.signals.map((signal) => ({
            id: signal.key,
            label: signal.label,
            value: signal.finding,
            note: undefined,
            color: SEVERITY_COLOR[signal.severity],
          }))}
        />

        {/* Bagian paling berisi di layar: satu keputusan, satu kalimat tindakan.
            Bagian di atas sengaja dibuat lebih pelan supaya mata turun ke sini
            terakhir (R-14, R-31). */}
        <View style={[styles.decisionCard, { borderColor: verdict.color }]}>
          <Text style={styles.decisionStep}>Keputusan mutu</Text>
          <View style={styles.decisionScoreRow}>
            <Text style={[styles.decisionScore, { color: verdict.color }]}>{scenario.score}</Text>
            <Text style={styles.decisionScoreUnit}>skor keamanan</Text>
          </View>
          <Text style={[styles.decisionLabel, { color: verdict.color }]}>{verdict.label}</Text>
          <Text style={styles.decisionAction}>{verdict.action}</Text>
          {verdict.reasons.length > 0 && (
            <View style={styles.reasonList}>
              {verdict.reasons.map((reason) => (
                <Text key={reason} style={styles.reasonText}>
                  {reason}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.holdingRow}>
            <Text style={styles.holdingText}>
              Suhu holding {scenario.holdingTempC}°C · sisa waktu {scenario.minutesToDeadline} menit
            </Text>
          </View>
        </View>

        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>Estimasi makronutrien per porsi</Text>
          <Text style={styles.sectionCaption}>
            Target kelompok SD atas. Estimasi dari segmentasi visual, bukan timbangan.
          </Text>
          {macros.map((macro) => (
            <View key={macro.key} style={styles.macroRow}>
              <Text style={styles.macroLabel}>
                {macro.label} · {macro.unit}
              </Text>
              <Text style={styles.macroValue}>
                {macro.estimated} / {macro.target}
              </Text>
              <View style={styles.macroTrack}>
                <View style={[styles.macroFill, { width: `${macro.ratio}%` }]} />
              </View>
              <Text style={styles.macroPercent}>{macro.percentage}% target</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, verdict.verdict === 'ditolak' && styles.dangerBtn]}
            onPress={() => handleAction(false)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Tolak dan amankan sampel"
          >
            <ShieldAlert size={18} color="#B91C1C" strokeWidth={2.2} />
            <Text style={[styles.secondaryBtnText, { color: '#B91C1C' }]}>
              Tolak & amankan sampel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              verdict.verdict === 'ditolak' && styles.primaryBtnBlocked,
            ]}
            onPress={() => handleAction(true)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Setujui porsi"
            accessibilityState={{ disabled: verdict.verdict === 'ditolak' }}
          >
            <Check size={18} color="#1E293B" strokeWidth={2.5} />
            <Text style={styles.primaryBtnText}>Setujui porsi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.localRow}>
          <WifiOff size={16} color="#64748B" />
          <Text style={styles.localText}>
            Belum ada pindaian tersimpan. Prototipe ini belum punya penyimpanan lokal,
            jadi riwayat Offline-First belum berfungsi.
          </Text>
        </View>
      </ScrollView>

      <BottomSheet
        visible={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Ringkasan keputusan"
        subtitle={
          logged
            ? 'Masuk buku log riwayat, belum dikirim ke server SPPG'
            : 'Dicatat di perangkat, belum dikirim ke server SPPG'
        }
      >
        <View style={[styles.sheetVerdict, { borderColor: confirm?.color ?? '#E7E9EC' }]}>
          <Text style={[styles.sheetVerdictLabel, { color: confirm?.color }]}>
            {confirm?.label}
          </Text>
          <Text style={styles.sheetVerdictAction}>{confirm?.action}</Text>
        </View>
        {confirm?.reasons.map((reason) => (
          <Text key={reason} style={styles.sheetReason}>
            {reason}
          </Text>
        ))}
      </BottomSheet>
    </View>
  );
};

interface ChecklistRow {
  id: string;
  label: string;
  value: string;
  note: string | undefined;
  color: string;
}

const ChecklistSection: React.FC<{
  step: string;
  title: string;
  caption: string;
  rows: ChecklistRow[];
}> = ({ step, title, caption, rows }) => (
  <View style={styles.checklist}>
    <View style={styles.checklistHeader}>
      <Text style={styles.checklistStep}>{step}</Text>
      <View style={styles.checklistHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCaption}>{caption}</Text>
      </View>
    </View>
    {rows.map((row) => (
      <View key={row.id} style={styles.checkRow}>
        <View style={[styles.checkDot, { backgroundColor: row.color }]} />
        <View style={styles.checkText}>
          <Text style={styles.checkLabel}>{row.label}</Text>
          <Text style={styles.checkValue}>{row.value}</Text>
          {row.note ? <Text style={styles.checkNote}>{row.note}</Text> : null}
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  notice: {
    marginHorizontal: 16,
    backgroundColor: '#FEF3E2',
    borderRadius: 14,
    padding: 12,
  },
  noticeText: {
    fontSize: 12,
    color: '#7C4A03',
    lineHeight: 18,
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  scenarioChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  scenarioChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  scenarioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  scenarioTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewfinder: {
    height: 190,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#EBA338',
  },
  cornerTL: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3 },
  viewfinderCode: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  viewfinderHint: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },
  checklist: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checklistStep: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C4A03',
    backgroundColor: '#FDEBC8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  checklistHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  sectionCaption: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 17,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EDEEF0',
  },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  checkText: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  checkValue: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
    lineHeight: 18,
  },
  checkNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  decisionCard: {
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
  },
  decisionStep: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  decisionScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  decisionScore: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
  },
  decisionScoreUnit: {
    fontSize: 13,
    color: '#64748B',
  },
  decisionLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  decisionAction: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
    marginTop: 8,
  },
  reasonList: {
    marginTop: 12,
    gap: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  holdingRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDEEF0',
  },
  holdingText: {
    fontSize: 12,
    color: '#64748B',
  },
  macroSection: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  macroRow: {
    marginTop: 14,
  },
  macroLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  macroTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E7E9EC',
    marginTop: 6,
  },
  macroFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B45309',
  },
  macroPercent: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    paddingHorizontal: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EC',
  },
  dangerBtn: {
    borderColor: '#F0B4B4',
    backgroundColor: '#FDF0F0',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#EBA338',
  },
  primaryBtnBlocked: {
    backgroundColor: '#E7E9EC',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  localText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  sheetVerdict: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    marginBottom: 12,
  },
  sheetVerdictLabel: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetVerdictAction: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginTop: 4,
  },
  sheetReason: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
});

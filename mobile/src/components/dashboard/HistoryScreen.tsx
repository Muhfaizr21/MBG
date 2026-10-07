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
import {
  Search,
  QrCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Users,
  Plus,
  Minus,
  Download,
  Share2,
  ShieldCheck,
  Calendar,
  Sparkles,
  Check,
  Clock,
} from 'lucide-react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { FeatureHeader } from './FeatureHeader';
import {
  reconcileClass,
  sumDistribution,
  SURPLUS_OPTIONS,
  SurplusAllocation,
} from '../../utils/distribution';
import {
  filterByRange,
  formatClock,
  getScanLog,
  searchBatch,
  SEVERITY_COLOR,
  SEVERITY_BG,
  SEVERITY_LABEL,
  HistoryRange,
} from '../../utils/scanLog';
import { MOCK_CLASSES } from '../../data/mockClassData';
import { HANDOVER_SCHOOL } from '../../data/mockHandoverData';

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: 'hari_ini', label: 'Hari ini' },
  { key: 'tujuh_hari', label: '7 hari' },
  { key: 'bulan_ini', label: 'Bulan ini' },
];

type ActiveTabMode = 'presensi' | 'log_pindaian';

export interface HistoryScreenProps {
  onOpenScanner: () => void;
  onOpenProfile?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onOpenScanner, onOpenProfile }) => {
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [allocation, setAllocation] = useState<SurplusAllocation>('belum');
  const [range, setRange] = useState<HistoryRange>('hari_ini');
  const [query, setQuery] = useState('');
  const [exportPreview, setExportPreview] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<ActiveTabMode>('presensi');

  const rows = useMemo(() => classes.map(reconcileClass), [classes]);
  const totals = useMemo(() => sumDistribution(rows), [rows]);

  const log = useMemo(() => {
    const ranged = filterByRange(getScanLog(), range);
    return searchBatch(ranged, query);
  }, [range, query]);

  const distributed = log
    .filter((entry) => entry.severity !== 'ditolak')
    .reduce((sum, entry) => sum + entry.portions, 0);
  const rejected = log
    .filter((entry) => entry.severity === 'ditolak')
    .reduce((sum, entry) => sum + entry.portions, 0);

  // Quick action: Set all students in a class present
  const handleSetAllPresent = (classId: string, quota: number) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, hadir: quota, sakit: 0 } : c))
    );
  };

  // Stepper increment/decrement
  const handleUpdateCount = (
    classId: string,
    field: 'hadir' | 'sakit',
    delta: number,
    quota: number
  ) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        const current = c[field];
        const next = Math.max(0, Math.min(quota, current + delta));
        return { ...c, [field]: next };
      })
    );
  };

  const handleSimulateExportPDF = () => {
    Alert.alert(
      'Unduh Lembar Rekonsiliasi PDF',
      `Dokumen Rekapitulasi Presensi & BAST ${HANDOVER_SCHOOL.name} berhasil diunduh. File tersimpan di folder Dokumen Sekolah.`,
      [{ text: 'Buka File', onPress: () => setExportPreview(false) }]
    );
  };

  const handleShareWhatsApp = () => {
    Alert.alert(
      'Kirim ke Komite Sekolah',
      `Tembusan laporan harian (179 porsi diserahkan, 2 porsi sisa) siap dibagikan ke grup resmi Komite Sekolah.`,
      [{ text: 'Kirim Salinan', onPress: () => setExportPreview(false) }]
    );
  };

  const percentServed = totals.quota > 0 ? Math.round((totals.porsiDiterahkan / totals.quota) * 100) : 0;

  return (
    <View style={styles.screen}>
      {/* Universal Clean App Bar Header */}
      <FeatureHeader title="Riwayat & Presensi" onOpenProfile={onOpenProfile} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-Header / School Info & Laporan Button di dalam Page Body */}
        <View style={styles.subHeader}>
          <View style={styles.subHeaderTopRow}>
            <View style={styles.schoolBadgeRow}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.schoolName}>{HANDOVER_SCHOOL.name}</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.dapodikVerified}>Dapodik Resmi</Text>
            </View>

            <TouchableOpacity
              style={styles.exportHeaderBtn}
              onPress={() => setExportPreview(true)}
              activeOpacity={0.8}
              accessibilityLabel="Buka pratinjau laporan harian"
            >
              <FileText size={16} color="#EBA338" />
              <Text style={styles.exportHeaderBtnText}>Laporan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Calendar size={13} color="#64748B" />
            <Text style={styles.dateText}>
              Kamis, 10 Oktober 2026 • Sesi Makan Siang Bergizi
            </Text>
          </View>
        </View>

        {/* Range Chips Filter */}
        <View style={styles.rangeRow}>
          {RANGES.map((item) => {
            const isActive = item.key === range;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.rangeChip, isActive && styles.rangeChipOn]}
                onPress={() => setRange(item.key)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.rangeText, isActive && styles.rangeTextOn]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Executive KPI Stat Cards */}
        <View style={styles.kpiContainer}>
          {/* Card 1: Porsi Diserahkan */}
          <View style={[styles.kpiCard, styles.kpiCardGreen]}>
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={18} color="#15803D" />
              </View>
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>{percentServed}% Terpenuhi</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{totals.porsiDiterahkan}</Text>
            <Text style={styles.kpiLabel}>Porsi Diserahkan</Text>
            <Text style={styles.kpiSub}>Dari {totals.quota} kuota porsi siswa</Text>
          </View>

          {/* Card 2: Porsi Sisa */}
          <View style={[styles.kpiCard, styles.kpiCardAmber]}>
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <AlertCircle size={18} color="#B45309" />
              </View>
              <View style={styles.kpiBadgeAmber}>
                <Text style={styles.kpiBadgeAmberText}>
                  {totals.porsiSisa > 0 ? 'Perlu Alokasi' : 'Nol Sisa'}
                </Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: totals.porsiSisa > 0 ? '#B45309' : '#1E293B' }]}>
              {totals.porsiSisa}
            </Text>
            <Text style={styles.kpiLabel}>Porsi Sisa di Sekolah</Text>
            <Text style={styles.kpiSub}>
              {totals.porsiSisa > 0 ? 'SOP Regulasi BGN' : 'Habis terbagikan'}
            </Text>
          </View>

          {/* Card 3: Siswa Sakit */}
          <View style={[styles.kpiCard, styles.kpiCardPurple]}>
            <View style={styles.kpiTop}>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <Users size={18} color="#6D28D9" />
              </View>
              <View style={styles.kpiBadgePurple}>
                <Text style={styles.kpiBadgePurpleText}>Absensi</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{totals.sakit}</Text>
            <Text style={styles.kpiLabel}>Siswa Tidak Masuk</Text>
            <Text style={styles.kpiSub}>Tercatat sakit/izin</Text>
          </View>
        </View>

        {/* View Mode Switcher Pills */}
        <View style={styles.modeTabsWrap}>
          <TouchableOpacity
            style={[styles.modeTabBtn, activeTabMode === 'presensi' && styles.modeTabBtnOn]}
            onPress={() => setActiveTabMode('presensi')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.modeTabBtnText,
                activeTabMode === 'presensi' && styles.modeTabBtnTextOn,
              ]}
            >
              📋 Presensi Kelas ({rows.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTabBtn, activeTabMode === 'log_pindaian' && styles.modeTabBtnOn]}
            onPress={() => setActiveTabMode('log_pindaian')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.modeTabBtnText,
                activeTabMode === 'log_pindaian' && styles.modeTabBtnTextOn,
              ]}
            >
              📦 Log Boks ({log.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB CONTENT 1: PRESENSI & REKONSILIASI KELAS */}
        {activeTabMode === 'presensi' && (
          <View style={styles.tabContentBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Distribusi per Kelas</Text>
                <Text style={styles.sectionSubtitle}>
                  Presensi kehadiran menentukan jumlah porsi yang diserahkan
                </Text>
              </View>
            </View>

            {rows.map((row) => {
              const classPercent = row.quota > 0 ? Math.round((row.hadir / row.quota) * 100) : 0;
              const isFull = row.hadir === row.quota && row.sakit === 0;

              return (
                <View
                  key={row.id}
                  style={[styles.classCard, row.inconsistent && styles.classCardBad]}
                >
                  {/* Class Header */}
                  <View style={styles.classHead}>
                    <View style={styles.classTitleGroup}>
                      <Text style={styles.className}>{row.name}</Text>
                      <View style={styles.classQuotaPill}>
                        <Text style={styles.classQuotaPillText}>Kuota {row.quota} Siswa</Text>
                      </View>
                    </View>

                    {/* Quick 1-tap all present button */}
                    {!isFull && !row.inconsistent && (
                      <TouchableOpacity
                        style={styles.allPresentBtn}
                        onPress={() => handleSetAllPresent(row.id, row.quota)}
                        activeOpacity={0.7}
                      >
                        <Sparkles size={13} color="#15803D" />
                        <Text style={styles.allPresentBtnText}>Semua Hadir</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Visual Progress Bar */}
                  <View style={styles.progressBarWrap}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, classPercent))}%`,
                          backgroundColor: row.inconsistent ? '#EF4444' : '#10B981',
                        },
                      ]}
                    />
                  </View>

                  {/* Stepper Inputs for Hadir & Sakit */}
                  <View style={styles.controlsRow}>
                    {/* Hadir Stepper */}
                    <View style={styles.stepperContainer}>
                      <Text style={styles.stepperLabel}>Hadir</Text>
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateCount(row.id, 'hadir', -1, row.quota)}
                          activeOpacity={0.6}
                        >
                          <Minus size={14} color="#64748B" />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.stepperInput}
                          value={String(row.hadir)}
                          onChangeText={(text) => {
                            const val = Math.max(0, parseInt(text, 10) || 0);
                            setClasses((prev) =>
                              prev.map((c) => (c.id === row.id ? { ...c, hadir: val } : c))
                            );
                          }}
                          keyboardType="number-pad"
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateCount(row.id, 'hadir', 1, row.quota)}
                          activeOpacity={0.6}
                        >
                          <Plus size={14} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Sakit Stepper */}
                    <View style={styles.stepperContainer}>
                      <Text style={styles.stepperLabel}>Sakit</Text>
                      <View style={styles.stepperBox}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateCount(row.id, 'sakit', -1, row.quota)}
                          activeOpacity={0.6}
                        >
                          <Minus size={14} color="#64748B" />
                        </TouchableOpacity>

                        <TextInput
                          style={styles.stepperInput}
                          value={String(row.sakit)}
                          onChangeText={(text) => {
                            const val = Math.max(0, parseInt(text, 10) || 0);
                            setClasses((prev) =>
                              prev.map((c) => (c.id === row.id ? { ...c, sakit: val } : c))
                            );
                          }}
                          keyboardType="number-pad"
                        />

                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleUpdateCount(row.id, 'sakit', 1, row.quota)}
                          activeOpacity={0.6}
                        >
                          <Plus size={14} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Computed Stat: Diserahkan */}
                    <View style={styles.computedStatCol}>
                      <Text style={styles.computedStatLabel}>Diserahkan</Text>
                      <Text style={styles.computedStatValue}>{row.porsiDiterahkan}</Text>
                    </View>

                    {/* Computed Stat: Sisa */}
                    <View style={styles.computedStatCol}>
                      <Text style={styles.computedStatLabel}>Sisa</Text>
                      <Text
                        style={[
                          styles.computedStatValue,
                          { color: row.porsiSisa > 0 ? '#B45309' : '#1E293B' },
                        ]}
                      >
                        {row.porsiSisa}
                      </Text>
                    </View>
                  </View>

                  {/* Status Banner inside Card */}
                  <View
                    style={[
                      styles.classStatusChip,
                      row.inconsistent
                        ? styles.chipBad
                        : row.porsiSisa > 0
                        ? styles.chipWarning
                        : styles.chipGood,
                    ]}
                  >
                    {row.inconsistent ? (
                      <AlertCircle size={14} color="#B91C1C" />
                    ) : row.porsiSisa > 0 ? (
                      <AlertCircle size={14} color="#B45309" />
                    ) : (
                      <Check size={14} color="#15803D" />
                    )}
                    <Text
                      style={[
                        styles.classStatusText,
                        row.inconsistent
                          ? styles.statusTextBad
                          : row.porsiSisa > 0
                          ? styles.statusTextWarning
                          : styles.statusTextGood,
                      ]}
                    >
                      {row.note}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* SURPLUS FOOD ALLOCATION MANAGEMENT */}
            <View style={styles.surplusSection}>
              <View style={styles.surplusHeader}>
                <View style={styles.surplusIconWrap}>
                  <ShieldCheck size={20} color="#B45309" />
                </View>
                <View style={styles.surplusHeaderText}>
                  <Text style={styles.surplusTitle}>
                    Alokasi Porsi Sisa ({totals.porsiSisa} porsi)
                  </Text>
                  <Text style={styles.surplusSubtitle}>
                    Standar Operasional Prosedur BGN No. 04/2026
                  </Text>
                </View>
              </View>

              <Text style={styles.surplusExplain}>
                Porsi makanan yang tidak tersalurkan akibat siswa sakit/izin harus dialokasikan
                secara resmi agar tidak ada makanan yang terbuang (*zero food waste*) dan
                terhindar dari penyalahgunaan.
              </Text>

              <View style={styles.allocationList}>
                {SURPLUS_OPTIONS.map((option) => {
                  const isActive = allocation === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.allocationCard, isActive && styles.allocationCardOn]}
                      onPress={() => setAllocation(option.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, isActive && styles.radioCircleOn]}>
                        {isActive && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.allocationDetails}>
                        <Text style={[styles.allocationLabel, isActive && styles.allocationLabelOn]}>
                          {option.label}
                        </Text>
                        <Text style={styles.allocationHint}>{option.hint}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* TAB CONTENT 2: BUKU LOG PINDAIAN BOKS */}
        {activeTabMode === 'log_pindaian' && (
          <View style={styles.tabContentBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Buku Log Pindaian Boks</Text>
                <Text style={styles.sectionSubtitle}>
                  Audit trail pemindaian boks MBG dari Dapur SPPG Menteng Jaya
                </Text>
              </View>
            </View>

            {/* Search Box */}
            <View style={styles.searchRow}>
              <Search size={18} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Cari nomor batch boks (misal: 01A)"
                placeholderTextColor="#94A3B8"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Text style={styles.clearSearchText}>Hapus</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Log Rows */}
            {log.length === 0 ? (
              <View style={styles.emptyLogCard}>
                <QrCode size={40} color="#94A3B8" />
                <Text style={styles.emptyLogTitle}>
                  {query ? 'Nomor batch tidak ditemukan' : 'Belum ada pindaian'}
                </Text>
                <Text style={styles.emptyLogDesc}>
                  Pindai boks makanan di halaman pemindai untuk menambahkan catatan validasi.
                </Text>
                <TouchableOpacity style={styles.openScanBtn} onPress={onOpenScanner}>
                  <QrCode size={16} color="#FFFFFF" />
                  <Text style={styles.openScanBtnText}>Buka Kamera Pindai Boks</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.logList}>
                {log.map((entry) => (
                  <View key={entry.id} style={styles.logItemCard}>
                    <View style={styles.logItemTop}>
                      <View style={styles.logTimePill}>
                        <Clock size={12} color="#64748B" />
                        <Text style={styles.logClockText}>{formatClock(entry.scannedAt)}</Text>
                      </View>
                      <View
                        style={[
                          styles.severityPill,
                          { backgroundColor: SEVERITY_BG[entry.severity] },
                        ]}
                      >
                        <Text style={[styles.severityText, { color: SEVERITY_COLOR[entry.severity] }]}>
                          {SEVERITY_LABEL[entry.severity]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.logItemBody}>
                      <View>
                        <Text style={styles.logBatchCode}>{entry.batchCode}</Text>
                        <Text style={styles.logMetaInfo}>
                          {entry.portions} Porsi • Skor AI: {entry.score}% • Suhu: 65.4°C (Aman)
                        </Text>
                      </View>
                      <View style={styles.logCheckIcon}>
                        <CheckCircle2 size={20} color="#10B981" />
                      </View>
                    </View>
                  </View>
                ))}

                <View style={styles.logSummaryCard}>
                  <Text style={styles.logSummaryTitle}>Ringkasan Audit Pindaian:</Text>
                  <Text style={styles.logSummaryStats}>
                    ✓ {distributed} porsi lolos uji organoleptik • {rejected} porsi ditolak
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* BOTTOM ACTION: EXPORT REKAPITULASI DOKUMEN */}
        <View style={styles.reportExportBlock}>
          <TouchableOpacity
            style={styles.primaryExportBtn}
            onPress={() => setExportPreview(true)}
            activeOpacity={0.88}
          >
            <FileText size={18} color="#FFFFFF" />
            <Text style={styles.primaryExportBtnText}>Pratinjau Lembar Rekapitulasi MBG</Text>
          </TouchableOpacity>
          <Text style={styles.reportExportCaption}>
            Dapat dicetak sebagai bukti pertanggungjawaban Kepala Sekolah & Komite.
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM SHEET: FORMAL INSTITUTIONAL REPORT PREVIEW */}
      <BottomSheet
        visible={exportPreview}
        onClose={() => setExportPreview(false)}
        title="Rekapitulasi Distribusi MBG"
        subtitle={`${HANDOVER_SCHOOL.name} • Tanggal 10 Oktober 2026`}
      >
        <View style={styles.reportSheetContent}>
          {/* Kop Surat Sekolah */}
          <View style={styles.kopSuratBox}>
            <Text style={styles.kopKemenkes}>KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</Text>
            <Text style={styles.kopSekolah}>{HANDOVER_SCHOOL.name.toUpperCase()}</Text>
            <Text style={styles.kopAlamat}>
              Jl. Menteng Raya No. 01, Jakarta Pusat • NPSN: {HANDOVER_SCHOOL.npsn}
            </Text>
            <View style={styles.kopDivider} />
          </View>

          {/* Table Summary */}
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>RINGKASAN DISTRIBUSI KELAS</Text>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCell, { flex: 1.2 }]}>Kelas</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Kuota</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Hadir</Text>
              <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>Sakit</Text>
              <Text style={[styles.thCell, { flex: 1.2, textAlign: 'right' }]}>Diserahkan</Text>
            </View>

            {rows.map((row) => (
              <View key={row.id} style={styles.tableRow}>
                <Text style={[styles.tdCell, { flex: 1.2, fontWeight: '700' }]}>{row.name}</Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center' }]}>{row.quota}</Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: '#15803D' }]}>
                  {row.hadir}
                </Text>
                <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: row.sakit > 0 ? '#B45309' : '#64748B' }]}>
                  {row.sakit}
                </Text>
                <Text style={[styles.tdCell, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>
                  {row.porsiDiterahkan}
                </Text>
              </View>
            ))}

            <View style={styles.tableFooterRow}>
              <Text style={[styles.tfCell, { flex: 1.2 }]}>TOTAL</Text>
              <Text style={[styles.tfCell, { flex: 1, textAlign: 'center' }]}>{totals.quota}</Text>
              <Text style={[styles.tfCell, { flex: 1, textAlign: 'center', color: '#15803D' }]}>
                {totals.hadir}
              </Text>
              <Text style={[styles.tfCell, { flex: 1, textAlign: 'center', color: '#B45309' }]}>
                {totals.sakit}
              </Text>
              <Text style={[styles.tfCell, { flex: 1.2, textAlign: 'right' }]}>
                {totals.porsiDiterahkan}
              </Text>
            </View>
          </View>

          {/* Surplus Allocation Note */}
          <View style={styles.reportSurplusBox}>
            <Text style={styles.reportSurplusTitle}>Catatan Alokasi Porsi Sisa:</Text>
            <Text style={styles.reportSurplusText}>
              • Total Porsi Tersisa: <Text style={{ fontWeight: '700' }}>{totals.porsiSisa} porsi</Text>
            </Text>
            <Text style={styles.reportSurplusText}>
              • Status Alokasi: <Text style={{ fontWeight: '700', color: '#B45309' }}>
                {SURPLUS_OPTIONS.find((o) => o.key === allocation)?.label}
              </Text>
            </Text>
          </View>

          {/* Signatures Preview */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureCol}>
              <Text style={styles.sigRole}>Validator Lapangan Sekolah</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>Ibu Siti Aminah, S.Pd</Text>
              <Text style={styles.sigNip}>NIP. 19850412 201001 2 031</Text>
            </View>

            <View style={styles.signatureCol}>
              <Text style={styles.sigRole}>Mengetahui, Kepala Sekolah</Text>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>Drs. H. Bambang Sutrisno, M.Pd</Text>
              <Text style={styles.sigNip}>NIP. 19740819 199903 1 004</Text>
            </View>
          </View>

          {/* Action Export Buttons */}
          <View style={styles.sheetActionsRow}>
            <TouchableOpacity
              style={styles.sheetBtnDownload}
              onPress={handleSimulateExportPDF}
              activeOpacity={0.8}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.sheetBtnDownloadText}>Unduh PDF Resmi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetBtnShare}
              onPress={handleShareWhatsApp}
              activeOpacity={0.8}
            >
              <Share2 size={16} color="#1E293B" />
              <Text style={styles.sheetBtnShareText}>Kirim WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  content: {
    paddingBottom: 130, // Ample space above floating bottom tab bar
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  subHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schoolBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  schoolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  bulletDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  dapodikVerified: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  exportHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  rangeChipOn: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  rangeTextOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  kpiCardAmber: {
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  kpiCardPurple: {
    borderTopWidth: 3,
    borderTopColor: '#8B5CF6',
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kpiBadgeGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  kpiBadgeAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kpiBadgeAmberText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  kpiBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  kpiBadgePurpleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  modeTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#EDEFEF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 4,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  modeTabBtnOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabBtnTextOn: {
    color: '#1E293B',
    fontWeight: '700',
  },
  tabContentBlock: {
    marginTop: 18,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  classCardBad: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  classHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  classTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  className: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  classQuotaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  classQuotaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  allPresentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  allPresentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flex: 1.4,
  },
  stepperLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    height: 44,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    padding: 0,
  },
  computedStatCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    height: 44,
  },
  computedStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  computedStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  classStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 12,
  },
  chipGood: {
    backgroundColor: '#F0FDF4',
  },
  chipWarning: {
    backgroundColor: '#FFFBEB',
  },
  chipBad: {
    backgroundColor: '#FEF2F2',
  },
  classStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextGood: {
    color: '#15803D',
  },
  statusTextWarning: {
    color: '#B45309',
  },
  statusTextBad: {
    color: '#B91C1C',
  },
  surplusSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  surplusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  surplusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surplusHeaderText: {
    flex: 1,
  },
  surplusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  surplusSubtitle: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  surplusExplain: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  allocationList: {
    gap: 10,
  },
  allocationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allocationCardOn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioCircleOn: {
    borderColor: '#F59E0B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  allocationDetails: {
    flex: 1,
  },
  allocationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  allocationLabelOn: {
    color: '#92400E',
  },
  allocationHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  clearSearchText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyLogCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyLogTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  emptyLogDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  openScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBA338',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  openScanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logList: {
    gap: 10,
  },
  logItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logClockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logItemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logBatchCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  logMetaInfo: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logCheckIcon: {
    padding: 4,
  },
  logSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  logSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  logSummaryStats: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  reportExportBlock: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EBA338',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryExportBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  reportExportCaption: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  reportSheetContent: {
    paddingVertical: 6,
  },
  kopSuratBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  kopKemenkes: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  kopSekolah: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 2,
    textAlign: 'center',
  },
  kopAlamat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  kopDivider: {
    width: '100%',
    height: 2,
    backgroundColor: '#1E293B',
    marginTop: 8,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    letterSpacing: 0.5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  thCell: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdCell: {
    fontSize: 11,
    color: '#1E293B',
  },
  tableFooterRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  tfCell: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E293B',
  },
  reportSurplusBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 18,
    gap: 4,
  },
  reportSurplusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  reportSurplusText: {
    fontSize: 11,
    color: '#B45309',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  signatureCol: {
    alignItems: 'center',
    width: '45%',
  },
  sigRole: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  sigName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  sigNip: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  sheetBtnDownload: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EBA338',
    paddingVertical: 14,
    borderRadius: 16,
  },
  sheetBtnDownloadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetBtnShare: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
  },
  sheetBtnShareText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
});

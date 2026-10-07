import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  ShieldCheck,
  CircleHelp,
  Sparkles,
  Zap,
  Check,
  CheckCircle2,
  Scan,
  PieChart,
  ArrowRight,
  BookOpen,
  Info,
  X,
  FileText,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BENTO_MEAL_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80';

export interface WelcomeScreenProps {
  onLoginPress?: () => void;
  onGuestPress?: () => void;
  onSopPress?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLoginPress,
  onGuestPress,
  onSopPress,
}) => {
  const router = useRouter();
  const { login } = useAuth();
  const [showSopModal, setShowSopModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleNavigateLogin = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.push('/login');
    }
  };

  const handleGuestExplore = async () => {
    if (onGuestPress) {
      onGuestPress();
      return;
    }
    // Mode Tamu / Demo: Auto-login dengan akun demo validator
    try {
      setIsGuestLoading(true);
      await login('validator@sdn01menteng.sch.id', 'Validator123!');
      router.replace('/');
    } catch (err) {
      console.warn('Guest login error:', err);
      router.push('/login');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleOpenSop = () => {
    if (onSopPress) {
      onSopPress();
    } else {
      setShowSopModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row: Satgas MBG Badge & Help Button */}
        <View style={styles.topHeaderRow}>
          <View style={styles.satgasBadge}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.satgasBadgeText}>Satgas MBG · Pengawasan Nasional</Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Informasi Aplikasi KawanGizi"
          >
            <CircleHelp size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Center Branding Section: Logo, Title, Tagline */}
        <View style={styles.brandingSection}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoBadge}>
              <Shield size={32} color="#1E293B" strokeWidth={2.5} fill="#1E293B" />
              <View style={styles.checkBadgeMini}>
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>
          </View>

          <Text style={styles.brandTitle}>
            Kawan<Text style={styles.brandTitleAccent}>Gizi</Text>
          </Text>
          <Text style={styles.tagline}>
            Mitigasi Keamanan Pangan & Makronutrien AI Sekolah
          </Text>
        </View>

        {/* Hero Card Preview with Visual Tags & Macros */}
        <View style={styles.heroCard}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: BENTO_MEAL_IMAGE }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Visual Overlays & Tags */}
            <View style={styles.overlayTopLeft}>
              <View style={styles.aiScanBadge}>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.aiScanText}>YOLOv8 Scan ~42ms</Text>
              </View>
            </View>

            <View style={styles.overlayTopRight}>
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.verifiedText}>100% Layak</Text>
              </View>
            </View>

            <View style={styles.overlayMidLeft}>
              <View style={styles.menuCodeBadge}>
                <Text style={styles.menuCodeText}>Menu MBG A-12</Text>
              </View>
            </View>

            <View style={styles.overlayMidRight}>
              <View style={styles.tempBadge}>
                <Text style={styles.tempText}>Suhu: 64.2°C</Text>
              </View>
            </View>

            <View style={styles.overlayBottomCenter}>
              <View style={styles.safeStatusPill}>
                <View style={styles.safeGreenDot} />
                <Text style={styles.safeStatusText}>Bebas Jamur & Lendir</Text>
              </View>
            </View>
          </View>

          {/* Mini Status Metrics Row below Image */}
          <View style={styles.heroMetricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconCircleGreen}>
                <ShieldCheck size={16} color="#059669" />
              </View>
              <View style={styles.metricTexts}>
                <Text style={styles.metricLabel}>Deteksi Basi Dini</Text>
                <Text style={styles.metricValueGreen}>Tervalidasi Aman</Text>
              </View>
            </View>

            <View style={styles.metricsDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIconCircleAmber}>
                <PieChart size={16} color="#D97706" />
              </View>
              <View style={styles.metricTexts}>
                <Text style={styles.metricLabel}>Gizi Makro Anak</Text>
                <Text style={styles.metricValueAmber}>685 kkal · 24g Pro</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Value Proposition Feature Cards Section */}
        <View style={styles.featuresSection}>
          {/* Card 1: Skrining Kamera Instan */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconBoxAmber}>
              <Scan size={22} color="#D97706" strokeWidth={2.4} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Skrining Kamera Instan</Text>
              <Text style={styles.featureDesc}>
                Deteksi visual risiko basi, kontaminasi mikroba, dan anomali aroma dalam 3 detik sebelum distribusi ke ruang kelas.
              </Text>
            </View>
          </View>

          {/* Card 2: Kalkulasi Gizi Otomatis */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconBoxGreen}>
              <PieChart size={22} color="#059669" strokeWidth={2.4} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Kalkulasi Gizi Otomatis</Text>
              <Text style={styles.featureDesc}>
                Estimasi presisi karbohidrat, protein hewani, serat sayur, dan kecukupan kalori standar Bappenas & Kemenkes.
              </Text>
            </View>
          </View>

          {/* Card 3: Terkoneksi Satgas MBG */}
          <View style={styles.featureCard}>
            <View style={styles.featureIconBoxBlue}>
              <ShieldCheck size={22} color="#2563EB" strokeWidth={2.4} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Terkoneksi Satgas MBG</Text>
              <Text style={styles.featureDesc}>
                BAST digital otomatis terunggah ke dasbor pusat, mengunci akuntabilitas katering dan kepastian keselamatan siswa.
              </Text>
            </View>
          </View>
        </View>

        {/* Pager Indicator Dots */}
        <View style={styles.pagerDotsRow}>
          <View style={styles.pagerDotActive} />
          <View style={styles.pagerDotInactive} />
          <View style={styles.pagerDotInactive} />
        </View>

        {/* Call to Action Buttons */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryLoginBtn}
            onPress={handleNavigateLogin}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Masuk sebagai Validator"
          >
            <Text style={styles.primaryLoginBtnText}>Masuk sebagai Validator</Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryGuestBtn}
              onPress={handleGuestExplore}
              activeOpacity={0.75}
              disabled={isGuestLoading}
              accessibilityRole="button"
              accessibilityLabel="Eksplorasi Mode Tamu"
            >
              <Text style={styles.secondaryGuestBtnText}>
                {isGuestLoading ? 'Menghubungkan...' : 'Eksplorasi Mode Tamu'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondarySopBtn}
              onPress={handleOpenSop}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Panduan & SOP MBG"
            >
              <Text style={styles.secondarySopBtnText}>Panduan & SOP MBG</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Credit & Regulatory Text */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTech}>
            Didukung AI YOLOv8 · Arsitektur Cloud Golang & Python
          </Text>
          <Text style={styles.footerVision}>
            Perlindungan Mutu Konsumsi Generasi Emas Indonesia 2045
          </Text>
        </View>
      </ScrollView>

      {/* Modal Panduan & SOP MBG */}
      <Modal
        visible={showSopModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSopModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sopModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <BookOpen size={20} color="#D97706" />
                <Text style={styles.modalTitle}>5 SOP Kunci Validator MBG</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSopModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sopScrollView}>
              <View style={styles.sopItem}>
                <Text style={styles.sopNumber}>01</Text>
                <View style={styles.sopItemText}>
                  <Text style={styles.sopItemTitle}>Suhu Penerimaan Tote Boks</Text>
                  <Text style={styles.sopItemDesc}>
                    Suhu makanan saat serah terima wajib di atas 60°C. Boks dengan suhu di bawah 55°C harus dikarantina dan dikonfirmasi ke SPPG.
                  </Text>
                </View>
              </View>

              <View style={styles.sopItem}>
                <Text style={styles.sopNumber}>02</Text>
                <View style={styles.sopItemText}>
                  <Text style={styles.sopItemTitle}>Jendela Konsumsi Maksimal</Text>
                  <Text style={styles.sopItemDesc}>
                    Makanan harus dikonsumsi maksimal 4 jam sejak selesai dimasak di SPPG demi menjamin higienitas biologis.
                  </Text>
                </View>
              </View>

              <View style={styles.sopItem}>
                <Text style={styles.sopNumber}>03</Text>
                <View style={styles.sopItemText}>
                  <Text style={styles.sopItemTitle}>Uji Organoleptik & AI Scan</Text>
                  <Text style={styles.sopItemDesc}>
                    Guru validator wajib memotret porsi sampel menggunakan kamera YOLOv8 AI untuk mengecek tekstur, aroma, dan lendir.
                  </Text>
                </View>
              </View>

              <View style={styles.sopItem}>
                <Text style={styles.sopNumber}>04</Text>
                <View style={styles.sopItemText}>
                  <Text style={styles.sopItemTitle}>Rekap Presensi & Alokasi Sisa</Text>
                  <Text style={styles.sopItemDesc}>
                    Porsi sisa dari siswa sakit atau izin dialokasikan sesuai instruksi BGN (dibawa pulang atau diberikan ke staf sekolah) dan tercatat di BAST.
                  </Text>
                </View>
              </View>

              <View style={styles.sopItem}>
                <Text style={styles.sopNumber}>05</Text>
                <View style={styles.sopItemText}>
                  <Text style={styles.sopItemTitle}>Tanda Tangan Digital BAST</Text>
                  <Text style={styles.sopItemDesc}>
                    Serah terima ditutup dengan tanda tangan digital bersama kurir armada SPPG dan langsung terunggah ke portal pengawasan pusat.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowSopModal(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Tutup Panduan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Info Platform */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.infoModalCard}>
            <View style={styles.infoIconWrapper}>
              <Info size={32} color="#D97706" />
            </View>
            <Text style={styles.infoModalTitle}>Tentang KawanGizi</Text>
            <Text style={styles.infoModalBody}>
              KawanGizi adalah aplikasi validasi lapangan terintegrasi untuk Program Makan Bergizi Gratis (MBG) Nasional.
              {'\n\n'}
              Sistem ini memadukan Computer Vision AI (YOLOv8) untuk deteksi kesegaran instan, kalkulasi makronutrien porsi anak, serta pencatatan BAST digital real-time antara Satuan Pelayanan Pangan Gizi (SPPG) dan sekolah.
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    alignItems: 'center',
  },

  // Top Bar Row
  topHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  satgasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 7,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  satgasBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Branding Section
  brandingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadgeContainer: {
    marginBottom: 10,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#EBA338',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkBadgeMini: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.6,
  },
  brandTitleAccent: {
    color: '#D97706',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
    lineHeight: 18,
  },

  // Hero Card
  heroCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlayTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  aiScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiScanText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlayTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlayMidLeft: {
    position: 'absolute',
    top: 46,
    left: 10,
  },
  menuCodeBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  menuCodeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlayMidRight: {
    position: 'absolute',
    top: 46,
    right: 10,
  },
  tempBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tempText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  overlayBottomCenter: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  safeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  safeGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  safeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Hero Metrics Row under image
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircleAmber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTexts: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValueGreen: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
    marginTop: 1,
  },
  metricValueAmber: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 1,
  },
  metricsDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },

  // Features Section
  featuresSection: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIconBoxAmber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconBoxGreen: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconBoxBlue: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // Pager Dots
  pagerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  pagerDotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EBA338',
  },
  pagerDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },

  // Action Buttons Section
  ctaSection: {
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  primaryLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EBA338',
    height: 52,
    borderRadius: 16,
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryLoginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryGuestBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  secondaryGuestBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  secondarySopBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondarySopBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },

  // Footer Section
  footerSection: {
    alignItems: 'center',
    gap: 3,
  },
  footerTech: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  footerVision: {
    fontSize: 9.5,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sopModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseBtn: {
    padding: 4,
  },
  sopScrollView: {
    marginBottom: 14,
  },
  sopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  sopNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
    width: 24,
  },
  sopItemText: {
    flex: 1,
  },
  sopItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  sopItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  modalConfirmBtn: {
    backgroundColor: '#EBA338',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  infoModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  infoIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoModalBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
});

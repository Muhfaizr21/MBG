import React, { useState } from 'react';
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
  MessageSquare,
  Heart,
  Share2,
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Clock,
  ChevronRight,
  Pin,
} from 'lucide-react-native';
import { FeatureHeader } from './FeatureHeader';

interface CommunityPost {
  id: string;
  author: string;
  school: string;
  timeAgo: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  snippet: string;
  repliesCount: number;
  likesCount: number;
  isPinned?: boolean;
}

const MOCK_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Ibu Ratna Dewi, S.Pd.',
    school: 'SDN Pegangsaan 01',
    timeAgo: '15 menit lalu',
    tag: 'SOP Suhu',
    tagColor: '#B45309',
    tagBg: '#FEF3C7',
    title: 'Protokol penanganan tote boks saat suhu mendekati batas minimum 60°C',
    snippet:
      'Rekan guru validator, jika pembacaan termometer boks tiba di 60.5°C, pastikan porsi dibagikan dalam rentang 30 menit sesuai SOP keamanan pangan BGN.',
    repliesCount: 14,
    likesCount: 28,
    isPinned: true,
  },
  {
    id: 'post-2',
    author: 'Pak Budi Santoso, M.Pd.',
    school: 'SDN Cikini 02',
    timeAgo: '1 jam lalu',
    tag: 'Rekap Presensi',
    tagColor: '#15803D',
    tagBg: '#DCFCE7',
    title: 'Format ekspor BAST digital & integrasi absensi kehadiran kelas',
    snippet:
      'Fitur validasi presensi sangat mempercepat serah terima harian. Rekap porsi sisa langsung sinkron tanpa perlu pencatatan manual.',
    repliesCount: 9,
    likesCount: 19,
  },
  {
    id: 'post-3',
    author: 'Ibu Nurul Hidayah, S.Pd.',
    school: 'SDN Menteng 03',
    timeAgo: '3 jam lalu',
    tag: 'Menu Alergi',
    tagColor: '#7C3AED',
    tagBg: '#F3E8FF',
    title: 'Penanganan porsi khusus bagi siswa intoleransi laktosa & kacang',
    snippet:
      'Mulai hari ini SPPG Menteng menyediakan label kuning untuk porsi diet khusus. Jangan lupa memeriksa kode batch saat serah terima.',
    repliesCount: 21,
    likesCount: 35,
  },
  {
    id: 'post-4',
    author: 'Pak Hendra Wijaya, S.Pd.',
    school: 'SDN Johar Baru 05',
    timeAgo: '5 jam lalu',
    tag: 'Pindai AI',
    tagColor: '#2563EB',
    tagBg: '#DBEAFE',
    title: 'Tips pencahayaan ruang kelas saat memindai boks dengan kamera AI',
    snippet:
      'Gunakan sudut 45 derajat agar permukaan wadah tidak memantulkan lampu neon, deteksi makronutrien karbohidrat dan protein menjadi jauh lebih presisi.',
    repliesCount: 7,
    likesCount: 16,
  },
];

const FILTER_TAGS = ['Semua', 'SOP Suhu', 'Rekap Presensi', 'Menu Alergi', 'Pindai AI'];

export interface CommunityTabContentProps {
  onOpenProfile?: () => void;
}

export const CommunityTabContent: React.FC<CommunityTabContentProps> = ({ onOpenProfile }) => {
  const [selectedTag, setSelectedTag] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCreatePost = () => {
    Alert.alert(
      'Mulai Diskusi Baru',
      'Fitur pembuatan utas diskusi guru validator MBG sedang disiapkan untuk rilis berikutnya.',
      [{ text: 'Mengerti', style: 'default' }]
    );
  };

  const filteredPosts = MOCK_POSTS.filter((post) => {
    const matchesTag = selectedTag === 'Semua' || post.tag === selectedTag;
    const matchesQuery =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.school.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesQuery;
  });

  return (
    <View style={styles.screen}>
      {/* Universal Clean App Bar Header */}
      <FeatureHeader title="Komunitas" onOpenProfile={onOpenProfile} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Komunitas */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerBadge}>
              <Sparkles size={13} color="#D97706" />
              <Text style={styles.bannerBadgeText}>Forum Guru Validator MBG</Text>
            </View>
            <View style={styles.memberBadge}>
              <ShieldCheck size={13} color="#10B981" />
              <Text style={styles.memberBadgeText}>148 Sekolah Terverifikasi</Text>
            </View>
          </View>
          <Text style={styles.bannerTitle}>Ruang Kolaborasi & Tanya Jawab SOP</Text>
          <Text style={styles.bannerSubtitle}>
            Berbagi praktik baik, tips penanganan boks makanan, dan solusi kendala distribusi bersama sesama guru validator.
          </Text>

          <TouchableOpacity
            style={styles.newPostButton}
            onPress={handleCreatePost}
            activeOpacity={0.85}
          >
            <PlusCircle size={18} color="#FFFFFF" />
            <Text style={styles.newPostButtonText}>Mulai Diskusi Baru</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari topik diskusi atau nama sekolah..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Horizontal Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {FILTER_TAGS.map((tag) => {
            const isActive = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of Community Posts */}
        <View style={styles.postsList}>
          {filteredPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            return (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                activeOpacity={0.9}
                onPress={() =>
                  Alert.alert(
                    post.title,
                    `${post.author} (${post.school})\n\n"${post.snippet}"\n\n${post.repliesCount} balasan aktif.`,
                    [{ text: 'Tutup' }]
                  )
                }
              >
                {post.isPinned && (
                  <View style={styles.pinnedBanner}>
                    <Pin size={12} color="#D97706" />
                    <Text style={styles.pinnedText}>Disematkan oleh Fasilitator BGN</Text>
                  </View>
                )}

                {/* Author Info & Tag */}
                <View style={styles.postHeader}>
                  <View style={styles.authorMeta}>
                    <Text style={styles.authorName}>{post.author}</Text>
                    <Text style={styles.authorSchool}>{post.school}</Text>
                  </View>
                  <View style={[styles.tagBadge, { backgroundColor: post.tagBg }]}>
                    <Text style={[styles.tagText, { color: post.tagColor }]}>{post.tag}</Text>
                  </View>
                </View>

                {/* Content */}
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postSnippet} numberOfLines={3}>
                  {post.snippet}
                </Text>

                {/* Footer Meta */}
                <View style={styles.postFooter}>
                  <View style={styles.timeWrapper}>
                    <Clock size={12} color="#94A3B8" />
                    <Text style={styles.timeText}>{post.timeAgo}</Text>
                  </View>

                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleLike(post.id)}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={15}
                        color={isLiked ? '#EF4444' : '#64748B'}
                        fill={isLiked ? '#EF4444' : 'transparent'}
                      />
                      <Text style={[styles.actionCount, isLiked && styles.actionCountLiked]}>
                        {post.likesCount + (isLiked ? 1 : 0)}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionBtn}>
                      <MessageSquare size={15} color="#64748B" />
                      <Text style={styles.actionCount}>{post.repliesCount}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bannerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  newPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EBA338',
    paddingVertical: 11,
    borderRadius: 14,
  },
  newPostButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  filterChipsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  postsList: {
    gap: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  authorSchool: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  postTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 6,
  },
  postSnippet: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionCountLiked: {
    color: '#EF4444',
  },
});

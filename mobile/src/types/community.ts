export interface CommunityCommentReply {
  id: string;
  author: string;
  school: string;
  authorId?: string;
  timeAgo: string;
  createdAt: string;
  content: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  author: string;
  school: string;
  authorId?: string;
  timeAgo: string;
  createdAt: string;
  content: string;
  likesCount?: number;
  isLiked?: boolean;
  replies?: CommunityCommentReply[];
}

export interface CommunityPost {
  id: string;
  author: string;
  school: string;
  authorId?: string;
  timeAgo: string;
  createdAt: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  content: string;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  likesCount: number;
  isLiked: boolean;
  isPinned?: boolean;
  comments: CommunityComment[];
}

export interface TagConfig {
  label: string;
  color: string;
  bg: string;
}

export const COMMUNITY_TAG_CONFIGS: Record<string, TagConfig> = {
  'SOP Suhu': { label: 'SOP Suhu', color: '#B45309', bg: '#FEF3C7' },
  'Rekap Presensi': { label: 'Rekap Presensi', color: '#15803D', bg: '#DCFCE7' },
  'Menu Alergi': { label: 'Menu Alergi', color: '#7C3AED', bg: '#F3E8FF' },
  'Pindai AI': { label: 'Pindai AI', color: '#2563EB', bg: '#DBEAFE' },
  'Distribusi': { label: 'Distribusi', color: '#D97706', bg: '#FEF3C7' },
  'Kebersihan': { label: 'Kebersihan', color: '#0D9488', bg: '#CCFBF1' },
};

export const AVAILABLE_TAGS = [
  'SOP Suhu',
  'Rekap Presensi',
  'Menu Alergi',
  'Pindai AI',
  'Distribusi',
  'Kebersihan',
];

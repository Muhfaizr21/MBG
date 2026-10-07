import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CommunityPost, COMMUNITY_TAG_CONFIGS } from '../types/community';
import {
  INITIAL_COMMUNITY_POSTS,
  fetchMockCommunityPosts,
  FetchCommunityParams,
  PaginatedCommunityResponse,
} from '../data/communityData';
import { getStorageItem, setStorageItem } from '../lib/storage';
import { useAuthRole } from './RoleContext';

const COMMUNITY_STORAGE_KEY = '@kawangizi_community_posts';

interface CreatePostInput {
  title: string;
  content: string;
  tag: string;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
}

interface CommunityContextType {
  posts: CommunityPost[];
  loading: boolean;
  activeThreadPost: CommunityPost | null;
  setActiveThreadPost: (post: CommunityPost | null) => void;
  createPost: (input: CreatePostInput) => Promise<CommunityPost>;
  deletePost: (postId: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  addReply: (postId: string, commentId: string, content: string) => Promise<void>;
  toggleLikeComment: (postId: string, commentId: string) => Promise<void>;
  resetToInitialData: () => Promise<void>;
  fetchPaginatedPosts: (params?: FetchCommunityParams) => Promise<PaginatedCommunityResponse>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [activeThreadPost, setActiveThreadPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthRole();

  // Load initial data from persistent storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedJson = await getStorageItem(COMMUNITY_STORAGE_KEY);
        if (cancelled) return;
        if (storedJson) {
          try {
            const parsed = JSON.parse(storedJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const userPosts = parsed.filter(
                (p: any) => !INITIAL_COMMUNITY_POSTS.some((ip) => ip.id === p.id),
              );
              const combined = [...userPosts, ...INITIAL_COMMUNITY_POSTS];
              setPosts(combined);
              await setStorageItem(COMMUNITY_STORAGE_KEY, JSON.stringify(combined));
              return;
            }
          } catch {
            // JSON parse failed, use fallback
          }
        }
        // Initialize with default mock posts
        setPosts(INITIAL_COMMUNITY_POSTS);
        await setStorageItem(COMMUNITY_STORAGE_KEY, JSON.stringify(INITIAL_COMMUNITY_POSTS));
      } catch (err) {
        console.warn('Load community posts error:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const savePosts = useCallback(async (updated: CommunityPost[]) => {
    setPosts(updated);
    setActiveThreadPost((current) => {
      if (!current) return null;
      return updated.find((p) => p.id === current.id) || null;
    });
    try {
      await setStorageItem(COMMUNITY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Save community posts error:', err);
    }
  }, []);

  const createPost = useCallback(
    async (input: CreatePostInput): Promise<CommunityPost> => {
      const tagCfg = COMMUNITY_TAG_CONFIGS[input.tag] || {
        label: input.tag,
        color: '#2563EB',
        bg: '#DBEAFE',
      };

      const newPost: CommunityPost = {
        id: `post-${Date.now()}`,
        author: user?.name || 'Guru Validator MBG',
        school: user?.schoolName || 'SDN Menteng 01 Pagi',
        authorId: user?.id || 'current-user',
        timeAgo: 'Baru saja',
        createdAt: new Date().toISOString(),
        tag: input.tag,
        tagColor: tagCfg.color,
        tagBg: tagCfg.bg,
        title: input.title.trim(),
        content: input.content.trim(),
        mediaUri: input.mediaUri,
        mediaType: input.mediaType || 'image',
        likesCount: 0,
        isLiked: false,
        comments: [],
      };

      const updated = [newPost, ...posts];
      await savePosts(updated);
      return newPost;
    },
    [posts, user, savePosts],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      const updated = posts.filter((p) => p.id !== postId);
      await savePosts(updated);
    },
    [posts, savePosts],
  );

  const toggleLikePost = useCallback(
    async (postId: string) => {
      const updated = posts.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          const likesCount = Math.max(0, post.likesCount + (isLiked ? 1 : -1));
          return { ...post, isLiked, likesCount };
        }
        return post;
      });
      await savePosts(updated);
    },
    [posts, savePosts],
  );

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!content.trim()) return;
      const updated = posts.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `c-${Date.now()}`,
            author: user?.name || 'Guru Validator MBG',
            school: user?.schoolName || 'SDN Menteng 01 Pagi',
            authorId: user?.id || 'current-user',
            timeAgo: 'Baru saja',
            createdAt: new Date().toISOString(),
            content: content.trim(),
            likesCount: 0,
            isLiked: false,
            replies: [],
          };
          return {
            ...post,
            comments: [...(post.comments || []), newComment],
          };
        }
        return post;
      });
      await savePosts(updated);
    },
    [posts, user, savePosts],
  );

  const addReply = useCallback(
    async (postId: string, commentId: string, content: string) => {
      if (!content.trim()) return;
      const updated = posts.map((post) => {
        if (post.id === postId) {
          const updatedComments = (post.comments || []).map((comment) => {
            if (comment.id === commentId) {
              const newReply = {
                id: `r-${Date.now()}`,
                author: user?.name || 'Guru Validator MBG',
                school: user?.schoolName || 'SDN Menteng 01 Pagi',
                authorId: user?.id || 'current-user',
                timeAgo: 'Baru saja',
                createdAt: new Date().toISOString(),
                content: content.trim(),
                likesCount: 0,
                isLiked: false,
              };
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              };
            }
            return comment;
          });
          return {
            ...post,
            comments: updatedComments,
          };
        }
        return post;
      });
      await savePosts(updated);
    },
    [posts, user, savePosts],
  );

  const toggleLikeComment = useCallback(
    async (postId: string, commentId: string) => {
      const updated = posts.map((post) => {
        if (post.id === postId) {
          const updatedComments = (post.comments || []).map((c) => {
            if (c.id === commentId) {
              const isLiked = !c.isLiked;
              const likesCount = Math.max(0, (c.likesCount || 0) + (isLiked ? 1 : -1));
              return { ...c, isLiked, likesCount };
            }
            return c;
          });
          return { ...post, comments: updatedComments };
        }
        return post;
      });
      await savePosts(updated);
    },
    [posts, savePosts],
  );

  const resetToInitialData = useCallback(async () => {
    await savePosts(INITIAL_COMMUNITY_POSTS);
  }, [savePosts]);

  const fetchPaginatedPosts = useCallback(
    async (params?: FetchCommunityParams): Promise<PaginatedCommunityResponse> => {
      return fetchMockCommunityPosts(posts, params);
    },
    [posts],
  );

  const value = useMemo(
    () => ({
      posts,
      loading,
      activeThreadPost,
      setActiveThreadPost,
      createPost,
      deletePost,
      toggleLikePost,
      addComment,
      addReply,
      toggleLikeComment,
      resetToInitialData,
      fetchPaginatedPosts,
    }),
    [
      posts,
      loading,
      activeThreadPost,
      setActiveThreadPost,
      createPost,
      deletePost,
      toggleLikePost,
      addComment,
      addReply,
      toggleLikeComment,
      resetToInitialData,
      fetchPaginatedPosts,
    ],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};

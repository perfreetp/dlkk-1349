import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { UserCheckIn, UserFavorite, SubmittedLocation, LocationFilter, LocationComment, LocationCategory } from '@/types/location';
import { mockCheckIns, mockFavorites, mockSubmissions, mockLocations } from '@/data/mockLocations';

const STORAGE_KEYS = {
  FAVORITES: 'campus_favorites',
  CHECKINS: 'campus_checkins',
  COMMENTS: 'campus_comments',
  LIKED_COMMENTS: 'campus_liked_comments',
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (e) {
    console.log(`[Store] Storage load error for', key, e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.log(`[Store] Storage save error for`, key, e);
  }
};

interface UserState {
  checkIns: UserCheckIn[];
  favorites: UserFavorite[];
  submissions: SubmittedLocation[];
  comments: LocationComment[];
  likedCommentIds: string[];
  filter: LocationFilter;
  searchKeyword: string;
  selectedCategory: LocationCategory | 'all';
  isFavorite: (locationId: string) => boolean;
  toggleFavorite: (locationId: string) => void;
  addCheckIn: (locationId: string, locationName: string) => void;
  addSubmission: (submission: Omit<SubmittedLocation, 'id' | 'submitTime' | 'status'>) => void;
  addComment: (locationId: string, rating: number, content: string) => LocationComment | null;
  toggleCommentLike: (commentId: string) => void;
  isCommentLiked: (commentId: string) => boolean;
  getCommentLikesCount: (comment: LocationComment) => number;
  deleteMyComment: (commentId: string) => void;
  getCommentsByLocation: (locationId: string) => LocationComment[];
  getCommentsByLocationSorted: (locationId: string, sortType: 'latest' | 'useful') => LocationComment[];
  getMyComments: () => LocationComment[];
  getCommentCountByLocation: (locationId: string) => number;
  setFilter: (filter: LocationFilter) => void;
  resetFilter: () => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (category: LocationCategory | 'all') => void;
  getFilteredLocations: () => typeof mockLocations;
}

const persistedComments = loadFromStorage<LocationComment[]>(STORAGE_KEYS.COMMENTS, []);
const persistedFavorites = loadFromStorage<UserFavorite[]>(STORAGE_KEYS.FAVORITES, []);
const persistedCheckIns = loadFromStorage<UserCheckIn[]>(STORAGE_KEYS.CHECKINS, []);
const persistedLikedComments = loadFromStorage<string[]>(STORAGE_KEYS.LIKED_COMMENTS, []);

const allFavorites = [...persistedFavorites, ...mockFavorites.filter(
  mf => !persistedFavorites.some(pf => pf.locationId === mf.locationId)
)];
const allCheckIns = [...persistedCheckIns, ...mockCheckIns];
const allComments = persistedComments;

export const useUserStore = create<UserState>((set, get) => ({
  checkIns: allCheckIns,
  favorites: allFavorites,
  submissions: mockSubmissions,
  comments: allComments,
  likedCommentIds: persistedLikedComments,
  filter: {},
  searchKeyword: '',
  selectedCategory: 'all',

  isFavorite: (locationId: string) => {
    return get().favorites.some(f => f.locationId === locationId);
  },

  toggleFavorite: (locationId: string) => {
    const { favorites } = get();
    const exists = favorites.find(f => f.locationId === locationId);
    let newFavorites: UserFavorite[];
    if (exists) {
      newFavorites = favorites.filter(f => f.locationId !== locationId);
    } else {
      newFavorites = [
        ...favorites,
        {
          id: `f${Date.now()}`,
          locationId,
          addTime: new Date().toISOString().split('T')[0],
        },
      ];
    }
    set({ favorites: newFavorites });
    saveToStorage(STORAGE_KEYS.FAVORITES, newFavorites);
    console.log('[UserStore] toggleFavorite:', { locationId, isFavorite: !exists });
  },

  addCheckIn: (locationId: string, locationName: string) => {
    const newCheckIn: UserCheckIn = {
      id: `ci${Date.now()}`,
      locationId,
      locationName,
      checkInTime: new Date().toLocaleString('zh-CN'),
      stampUrl: `https://picsum.photos/id/${100 + Math.floor(Math.random() * 50)}/200/200`,
    };
    const newCheckIns = [newCheckIn, ...get().checkIns];
    set({ checkIns: newCheckIns });
    saveToStorage(STORAGE_KEYS.CHECKINS, newCheckIns);
    console.log('[UserStore] addCheckIn:', newCheckIn);
  },

  addSubmission: (submission) => {
    const newSubmission: SubmittedLocation = {
      ...submission,
      id: `s${Date.now()}`,
      submitTime: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    set(state => ({
      submissions: [newSubmission, ...state.submissions],
    }));
    console.log('[UserStore] addSubmission:', newSubmission);
  },

  addComment: (locationId: string, rating: number, content: string) => {
    const trimmedContent = content.trim();
    const existingComment = get().comments.find(
      c => c.isMine && c.locationId === locationId && c.content === trimmedContent
    );
    if (existingComment) {
      console.log('[UserStore] Duplicate comment skipped, found:', existingComment.id);
      Taro.showToast({ title: '这条评价已经发过啦', icon: 'none' });
      return null;
    }

    const newComment: LocationComment = {
      id: `c${Date.now()}`,
      locationId,
      userId: 'me',
      userName: '我',
      content: trimmedContent,
      rating,
      createTime: new Date().toLocaleDateString('zh-CN'),
      likes: 0,
      isMine: true,
    };
    const newComments = [newComment, ...get().comments];
    set({ comments: newComments });
    saveToStorage(STORAGE_KEYS.COMMENTS, newComments);
    console.log('[UserStore] addComment:', newComment);
    return newComment;
  },

  toggleCommentLike: (commentId: string) => {
    const { likedCommentIds } = get();
    let newLikedIds: string[];
    if (likedCommentIds.includes(commentId)) {
      newLikedIds = likedCommentIds.filter(id => id !== commentId);
    } else {
      newLikedIds = [...likedCommentIds, commentId];
    }
    set({ likedCommentIds: newLikedIds });
    saveToStorage(STORAGE_KEYS.LIKED_COMMENTS, newLikedIds);
    console.log('[UserStore] toggleCommentLike:', { commentId, liked: !likedCommentIds.includes(commentId) });
  },

  isCommentLiked: (commentId: string) => {
    return get().likedCommentIds.includes(commentId);
  },

  getCommentLikesCount: (comment: LocationComment) => {
    const baseLikes = comment.likes || 0;
    const extraLiked = get().likedCommentIds.includes(comment.id) ? 1 : 0;
    return baseLikes + extraLiked;
  },

  deleteMyComment: (commentId: string) => {
    const newComments = get().comments.filter(c => c.id !== commentId);
    set({ comments: newComments });
    saveToStorage(STORAGE_KEYS.COMMENTS, newComments);
    console.log('[UserStore] deleteMyComment:', commentId);
  },

  getCommentsByLocation: (locationId: string) => {
    const mockLocation = mockLocations.find(loc => loc.id === locationId);
    const mockComments = mockLocation?.comments || [];
    const userComments = get().comments.filter(c => c.locationId === locationId);
    return [...userComments, ...mockComments];
  },

  getCommentsByLocationSorted: (locationId: string, sortType: 'latest' | 'useful') => {
    const comments = get().getCommentsByLocation(locationId);
    if (sortType === 'useful') {
      return [...comments].sort((a, b) => {
        const likesA = get().getCommentLikesCount(a);
        const likesB = get().getCommentLikesCount(b);
        return likesB - likesA;
      });
    }
    return comments;
  },

  getMyComments: () => {
    return get().comments.filter(c => c.isMine);
  },

  getCommentCountByLocation: (locationId: string) => {
    return get().getCommentsByLocation(locationId).length;
  },

  setFilter: (filter: LocationFilter) => {
    set({ filter });
    console.log('[UserStore] setFilter:', filter);
  },

  resetFilter: () => {
    set({ filter: {} });
    console.log('[UserStore] resetFilter');
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
    console.log('[UserStore] setSearchKeyword:', keyword);
  },

  setSelectedCategory: (category: LocationCategory | 'all') => {
    set({ selectedCategory: category });
    console.log('[UserStore] setSelectedCategory:', category);
  },

  getFilteredLocations: () => {
    const { filter, searchKeyword, selectedCategory } = get();
    let result = [...mockLocations];

    if (selectedCategory !== 'all') {
      result = result.filter(loc => loc.category === selectedCategory);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(loc =>
        loc.name.toLowerCase().includes(keyword) ||
        loc.description.toLowerCase().includes(keyword) ||
        loc.address.toLowerCase().includes(keyword) ||
        loc.tags.some(tag => tag.name.toLowerCase().includes(keyword))
      );
    }

    if (filter.crowdLevel) {
      result = result.filter(loc => loc.crowdLevel === filter.crowdLevel);
    }
    if (filter.businessStatus) {
      result = result.filter(loc => loc.businessStatus === filter.businessStatus);
    }
    if (filter.maxDistance) {
      result = result.filter(loc => loc.distance <= filter.maxDistance!);
    }
    if (filter.maxBudget) {
      result = result.filter(loc => loc.budget <= filter.maxBudget!);
    }

    return result;
  },
}));

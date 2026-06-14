import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  UserCheckIn,
  UserFavorite,
  SubmittedLocation,
  LocationFilter,
  LocationComment,
  LocationCategory,
  LocationActivity,
} from '@/types/location';
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
    console.log('[Store] Storage load error for', key, e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.log('[Store] Storage save error for', key, e);
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
  getFavoriteItem: (locationId: string) => UserFavorite | undefined;
  toggleFavorite: (locationId: string) => boolean;
  addCheckIn: (locationId: string, locationName: string) => UserCheckIn;
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

  getActivitiesByLocation: (locationId: string) => LocationActivity[];
  getMyActivities: () => LocationActivity[];
  getCheckInsByLocation: (locationId: string) => UserCheckIn[];
  getCheckInCountByLocation: (locationId: string) => number;
  getLocationStats: (locationId: string) => { comments: number; checkIns: number; favorites: number };

  setFilter: (filter: LocationFilter) => void;
  resetFilter: () => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (category: LocationCategory | 'all') => void;
  getFilteredLocations: () => typeof mockLocations;

  getMyLocationIds: () => string[];
  getMyInteractionsByLocation: (locationId: string) => {
    isFavorite: boolean;
    favoriteTime?: string;
    checkIns: UserCheckIn[];
    comments: LocationComment[];
    checkInCount: number;
    commentCount: number;
  };
}

const persistedComments = loadFromStorage<LocationComment[]>(STORAGE_KEYS.COMMENTS, []);
const persistedFavorites = loadFromStorage<UserFavorite[]>(STORAGE_KEYS.FAVORITES, []);
const persistedCheckIns = loadFromStorage<UserCheckIn[]>(STORAGE_KEYS.CHECKINS, []);
const persistedLikedComments = loadFromStorage<string[]>(STORAGE_KEYS.LIKED_COMMENTS, []);

const myFavorites: UserFavorite[] = persistedFavorites.map(f => ({ ...f, isMine: true }));
const myCheckIns: UserCheckIn[] = persistedCheckIns.map(c => ({ ...c, isMine: true }));
const myComments: LocationComment[] = persistedComments.map(c => ({ ...c, isMine: true }));

export const useUserStore = create<UserState>((set, get) => ({
  checkIns: myCheckIns,
  favorites: myFavorites,
  submissions: mockSubmissions,
  comments: myComments,
  likedCommentIds: persistedLikedComments,
  filter: {},
  searchKeyword: '',
  selectedCategory: 'all',

  isFavorite: (locationId: string) => {
    return get().favorites.some(f => f.locationId === locationId);
  },

  getFavoriteItem: (locationId: string) => {
    return get().favorites.find(f => f.locationId === locationId);
  },

  toggleFavorite: (locationId: string) => {
    const { favorites } = get();
    const exists = favorites.find(f => f.locationId === locationId);
    let newFavorites: UserFavorite[];
    let willBeFavorite: boolean;
    if (exists) {
      newFavorites = favorites.filter(f => f.locationId !== locationId);
      willBeFavorite = false;
    } else {
      newFavorites = [
        {
          id: `f${Date.now()}`,
          locationId,
          addTime: new Date().toLocaleString('zh-CN'),
          isMine: true,
        },
        ...favorites,
      ];
      willBeFavorite = true;
    }
    set({ favorites: newFavorites });
    saveToStorage(STORAGE_KEYS.FAVORITES, newFavorites);
    console.log('[UserStore] toggleFavorite:', { locationId, isFavorite: willBeFavorite });
    return willBeFavorite;
  },

  addCheckIn: (locationId: string, locationName: string) => {
    const now = new Date();
    const newCheckIn: UserCheckIn = {
      id: `ci${now.getTime()}`,
      locationId,
      locationName,
      checkInTime: now.toLocaleString('zh-CN'),
      stampUrl: `https://picsum.photos/id/${100 + parseInt(locationId) * 7 + (now.getSeconds() % 50)}/200/200`,
      isMine: true,
    };
    const newCheckIns = [newCheckIn, ...get().checkIns];
    set({ checkIns: newCheckIns });
    saveToStorage(STORAGE_KEYS.CHECKINS, newCheckIns);
    console.log('[UserStore] addCheckIn:', newCheckIn);
    return newCheckIn;
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
    if (!trimmedContent) {
      Taro.showToast({ title: '评价内容不能为空', icon: 'none' });
      return null;
    }
    const existingComment = get().comments.find(
      c => c.isMine && c.locationId === locationId && c.content === trimmedContent
    );
    if (existingComment) {
      console.log('[UserStore] Duplicate comment skipped, found:', existingComment.id);
      Taro.showToast({ title: '这条评价已经发过啦', icon: 'none' });
      return null;
    }

    const now = new Date();
    const newComment: LocationComment = {
      id: `c${now.getTime()}`,
      locationId,
      userId: 'me',
      userName: '我',
      content: trimmedContent,
      rating,
      createTime: now.toLocaleDateString('zh-CN'),
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

  getCheckInsByLocation: (locationId: string) => {
    return get().checkIns.filter(c => c.locationId === locationId);
  },

  getCheckInCountByLocation: (locationId: string) => {
    return get().checkIns.filter(c => c.locationId === locationId).length;
  },

  getLocationStats: (locationId: string) => {
    const mockLocation = mockLocations.find(loc => loc.id === locationId);
    const mockFavCount = mockFavorites.filter(f => f.locationId === locationId).length;
    const mockCheckInCount = mockCheckIns.filter(c => c.locationId === locationId).length;
    return {
      comments: get().getCommentCountByLocation(locationId),
      checkIns: get().getCheckInCountByLocation(locationId) + mockCheckInCount,
      favorites: (get().isFavorite(locationId) ? 1 : 0) + mockFavCount,
    };
  },

  getActivitiesByLocation: (locationId: string): LocationActivity[] => {
    const mockLocation = mockLocations.find(loc => loc.id === locationId);
    const activities: LocationActivity[] = [];

    const mockComments = mockLocation?.comments || [];
    mockComments.forEach(c => {
      activities.push({
        id: `act_${c.id}`,
        type: 'comment',
        locationId,
        locationName: mockLocation?.name || '',
        time: c.createTime,
        content: c.content,
        rating: c.rating,
        userName: c.userName,
        isMine: false,
      });
    });

    const userComments = get().comments.filter(c => c.locationId === locationId);
    userComments.forEach(c => {
      activities.push({
        id: `act_${c.id}`,
        type: 'comment',
        locationId,
        locationName: mockLocation?.name || '',
        time: c.createTime,
        content: c.content,
        rating: c.rating,
        userName: c.userName,
        isMine: true,
      });
    });

    const userCheckIns = get().checkIns.filter(c => c.locationId === locationId);
    userCheckIns.forEach(c => {
      activities.push({
        id: `act_${c.id}`,
        type: 'checkin',
        locationId,
        locationName: c.locationName,
        time: c.checkInTime,
        userName: '我',
        isMine: true,
      });
    });

    const userFavorite = get().getFavoriteItem(locationId);
    if (userFavorite) {
      activities.push({
        id: `act_${userFavorite.id}`,
        type: 'favorite',
        locationId,
        locationName: mockLocation?.name || '',
        time: userFavorite.addTime,
        userName: '我',
        isMine: true,
      });
    }

    return activities.sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });
  },

  getMyActivities: (): LocationActivity[] => {
    const activities: LocationActivity[] = [];

    get().comments.forEach(c => {
      const loc = mockLocations.find(l => l.id === c.locationId);
      activities.push({
        id: `act_${c.id}`,
        type: 'comment',
        locationId: c.locationId,
        locationName: loc?.name || '',
        time: c.createTime,
        content: c.content,
        rating: c.rating,
        userName: '我',
        isMine: true,
      });
    });

    get().checkIns.forEach(c => {
      activities.push({
        id: `act_${c.id}`,
        type: 'checkin',
        locationId: c.locationId,
        locationName: c.locationName,
        time: c.checkInTime,
        userName: '我',
        isMine: true,
      });
    });

    get().favorites.forEach(f => {
      const loc = mockLocations.find(l => l.id === f.locationId);
      activities.push({
        id: `act_${f.id}`,
        type: 'favorite',
        locationId: f.locationId,
        locationName: loc?.name || '',
        time: f.addTime,
        userName: '我',
        isMine: true,
      });
    });

    return activities.sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });
  },

  getMyLocationIds: (): string[] => {
    const ids = new Set<string>();
    get().favorites.forEach(f => ids.add(f.locationId));
    get().checkIns.forEach(c => ids.add(c.locationId));
    get().comments.forEach(c => ids.add(c.locationId));
    return Array.from(ids);
  },

  getMyInteractionsByLocation: (locationId: string) => {
    const fav = get().getFavoriteItem(locationId);
    const checkIns = get().getCheckInsByLocation(locationId);
    const comments = get().comments.filter(c => c.locationId === locationId);
    return {
      isFavorite: !!fav,
      favoriteTime: fav?.addTime,
      checkIns,
      comments,
      checkInCount: checkIns.length,
      commentCount: comments.length,
    };
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

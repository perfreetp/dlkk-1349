import { create } from 'zustand';
import type { UserCheckIn, UserFavorite, SubmittedLocation, LocationFilter, LocationComment, LocationCategory } from '@/types/location';
import { mockCheckIns, mockFavorites, mockSubmissions, mockLocations } from '@/data/mockLocations';

interface UserState {
  checkIns: UserCheckIn[];
  favorites: UserFavorite[];
  submissions: SubmittedLocation[];
  comments: LocationComment[];
  filter: LocationFilter;
  searchKeyword: string;
  selectedCategory: LocationCategory | 'all';
  isFavorite: (locationId: string) => boolean;
  toggleFavorite: (locationId: string) => void;
  addCheckIn: (locationId: string, locationName: string) => void;
  addSubmission: (submission: Omit<SubmittedLocation, 'id' | 'submitTime' | 'status'>) => void;
  addComment: (locationId: string, rating: number, content: string) => LocationComment;
  getCommentsByLocation: (locationId: string) => LocationComment[];
  getMyComments: () => LocationComment[];
  setFilter: (filter: LocationFilter) => void;
  resetFilter: () => void;
  setSearchKeyword: (keyword: string) => void;
  setSelectedCategory: (category: LocationCategory | 'all') => void;
  getFilteredLocations: () => typeof mockLocations;
}

const initialComments: LocationComment[] = [
  {
    id: 'c1',
    locationId: '1',
    userId: 'u1',
    userName: '匿名同学',
    content: '真的很安静，插座也够，考研复习的好地方！',
    rating: 5,
    createTime: '2024-01-10',
    likes: 23,
  },
];

export const useUserStore = create<UserState>((set, get) => ({
  checkIns: mockCheckIns,
  favorites: mockFavorites,
  submissions: mockSubmissions,
  comments: initialComments,
  filter: {},
  searchKeyword: '',
  selectedCategory: 'all',

  isFavorite: (locationId: string) => {
    return get().favorites.some(f => f.locationId === locationId);
  },

  toggleFavorite: (locationId: string) => {
    const { favorites } = get();
    const exists = favorites.find(f => f.locationId === locationId);
    if (exists) {
      set({
        favorites: favorites.filter(f => f.locationId !== locationId),
      });
    } else {
      set({
        favorites: [
          ...favorites,
          {
            id: `f${Date.now()}`,
            locationId,
            addTime: new Date().toISOString().split('T')[0],
          },
        ],
      });
    }
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
    set(state => ({
      checkIns: [newCheckIn, ...state.checkIns],
    }));
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
    const newComment: LocationComment = {
      id: `c${Date.now()}`,
      locationId,
      userId: 'me',
      userName: '我',
      content,
      rating,
      createTime: new Date().toLocaleDateString('zh-CN'),
      likes: 0,
      isMine: true,
    };
    set(state => ({
      comments: [newComment, ...state.comments],
    }));
    console.log('[UserStore] addComment:', newComment);
    return newComment;
  },

  getCommentsByLocation: (locationId: string) => {
    const mockLocation = mockLocations.find(loc => loc.id === locationId);
    const mockComments = mockLocation?.comments || [];
    const userComments = get().comments.filter(c => c.locationId === locationId);
    return [...userComments, ...mockComments];
  },

  getMyComments: () => {
    return get().comments.filter(c => c.isMine);
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

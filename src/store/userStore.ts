import { create } from 'zustand';
import type { UserCheckIn, UserFavorite, SubmittedLocation, LocationFilter } from '@/types/location';
import { mockCheckIns, mockFavorites, mockSubmissions } from '@/data/mockLocations';

interface UserState {
  checkIns: UserCheckIn[];
  favorites: UserFavorite[];
  submissions: SubmittedLocation[];
  filter: LocationFilter;
  isFavorite: (locationId: string) => boolean;
  toggleFavorite: (locationId: string) => void;
  addCheckIn: (locationId: string, locationName: string) => void;
  addSubmission: (submission: Omit<SubmittedLocation, 'id' | 'submitTime' | 'status'>) => void;
  setFilter: (filter: LocationFilter) => void;
  resetFilter: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  checkIns: mockCheckIns,
  favorites: mockFavorites,
  submissions: mockSubmissions,
  filter: {},

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

  setFilter: (filter: LocationFilter) => {
    set({ filter });
    console.log('[UserStore] setFilter:', filter);
  },

  resetFilter: () => {
    set({ filter: {} });
    console.log('[UserStore] resetFilter');
  },
}));

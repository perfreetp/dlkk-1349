export type LocationCategory = 'study' | 'food' | 'activity' | 'walk';

export type CrowdLevel = 'empty' | 'sparse' | 'moderate' | 'crowded';

export type BusinessStatus = 'open' | 'closed' | 'unknown';

export interface LocationFilter {
  category?: LocationCategory;
  maxDistance?: number;
  crowdLevel?: CrowdLevel;
  businessStatus?: BusinessStatus;
  maxBudget?: number;
}

export interface LocationTag {
  id: string;
  name: string;
  category: LocationCategory;
}

export interface LocationPhoto {
  id: string;
  url: string;
  uploadTime: string;
}

export interface LocationComment {
  id: string;
  locationId: string;
  userId: string;
  userName: string;
  content: string;
  rating: number;
  createTime: string;
  likes: number;
  isMine?: boolean;
}

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  photos: LocationPhoto[];
  tags: LocationTag[];
  rating: number;
  reviewCount: number;
  crowdLevel: CrowdLevel;
  businessStatus: BusinessStatus;
  businessHours: string;
  budget: number;
  seatCount: number;
  socketAvailable: boolean;
  recommendedTime: string;
  comments: LocationComment[];
  hotScore: number;
  isVerified: boolean;
}

export interface UserCheckIn {
  id: string;
  locationId: string;
  locationName: string;
  checkInTime: string;
  stampUrl: string;
  isMine?: boolean;
}

export interface UserFavorite {
  id: string;
  locationId: string;
  addTime: string;
  isMine?: boolean;
}

export type ActivityType = 'comment' | 'checkin' | 'favorite' | 'like';

export interface LocationActivity {
  id: string;
  type: ActivityType;
  locationId: string;
  locationName: string;
  time: string;
  content?: string;
  rating?: number;
  userName?: string;
  isMine: boolean;
}

export interface SubmittedLocation {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  description: string;
  tags: string[];
  submitTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CourseGap {
  weekday: number;
  startTime: string;
  endTime: string;
  duration: number;
}

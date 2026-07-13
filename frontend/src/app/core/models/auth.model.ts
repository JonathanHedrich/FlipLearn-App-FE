export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  displayName: string;
  email: string;
  role: string;
}

export interface CurrentUserResponse {
  id: number;
  displayName: string;
  email: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  validationErrors?: Record<string, string>;
}

export interface UserProfileResponse {
  id: number;
  displayName: string;
  email: string;
  role: string;
  memberSince: string;
  totalSets: number;
  totalCards: number;
  favoriteSets: number;
  completedSessions: number;
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  username: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  currentPassword: string;
}

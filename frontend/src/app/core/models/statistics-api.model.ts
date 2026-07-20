export interface DailyStudyActivityResponse {
  date: string;
  reviews: number;
  correctReviews: number;
  accuracy: number;
}

export interface SetAccuracyResponse {
  setId: number;
  title: string;
  color: string;
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
}

export interface AchievementResponse {
  code: string;
  icon: string;
  earned: boolean;
  currentValue: number;
  targetValue: number;
  progress: number;
  params: Record<string, unknown>;
}

export interface StatisticsOverviewResponse {
  totalSets: number;
  totalCards: number;
  completedSessions: number;

  totalReviews: number;
  correctReviews: number;
  incorrectReviews: number;
  accuracy: number;

  reviewsToday: number;
  correctReviewsToday: number;
  todayAccuracy: number;

  reviewsThisWeek: number;
  correctReviewsThisWeek: number;
  weeklyAccuracy: number;
  weeklyStudyMinutes: number;
  currentStreak: number;

  lastSevenDays: DailyStudyActivityResponse[];
  studyCalendar: DailyStudyActivityResponse[];
  setAccuracies: SetAccuracyResponse[];
  achievements: AchievementResponse[];
}

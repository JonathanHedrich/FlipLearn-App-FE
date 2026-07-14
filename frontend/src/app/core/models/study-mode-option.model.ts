import { StudyMode } from './study-api.model';

export interface StudyModeOption {
  value: StudyMode;
  title: string;
  description: string;
  icon: string;
  available: boolean;
  badge?: string;
}

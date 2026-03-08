export interface User {
  id: number;
  name: string;
  phone: string;
  weight?: number;
  height?: number;
  age?: number;
  goal?: string;
  role?: 'student' | 'instructor' | 'trainer' | 'gym_owner';
  instructor_id?: number;
  photo?: string;
  registration_number?: string;
}

export interface Trainer {
  id: number;
  user_id: number;
  trainer_code: string;
}

export interface Gym {
  id: number;
  name: string;
  location: string;
  owner_id: number;
  gym_code: string;
}

export interface GymRankingEntry {
  id: number;
  name: string;
  total_score: number;
}

export interface Activity {
  id: number;
  user_id: number;
  type: 'run' | 'bodybuilding' | 'crossfit';
  data: string;
  calories: number;
  timestamp: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  target_value: number;
  type: string;
  progress?: number;
  completed?: boolean;
}

export interface RankingEntry {
  name: string;
  score: number;
  photo?: string;
  registration_number?: string;
}

export interface DashboardData {
  stats: {
    total_calories: number;
    total_workouts: number;
  };
  challenge: Challenge;
  ranking: RankingEntry[];
}

export interface Recipe {
  id: string;
  title: string;
  category: 'emagrecer' | 'ganhar_massa';
  ingredients: string[];
  instructions: string;
  image?: string;
}

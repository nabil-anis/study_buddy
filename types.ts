export enum AppState {
  Landing,
  Onboarding,
  Dashboard,
}

export interface UserProfile {
  id?: string;
  name: string;
  age?: string;
  email?: string;
  photo: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Task {
  id: string | number;
  user_id?: string;
  text: string;
  completed: boolean;
  created_at?: string;
}

export interface SavedNote {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
}

export enum Theme {
  Calm,
  Focus,
}
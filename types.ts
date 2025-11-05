export enum AppState {
  Landing,
  Onboarding,
  Dashboard,
}

export interface UserProfile {
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
  id: number;
  text: string;
  completed: boolean;
}

// FIX: Add Theme enum to resolve import error in ThemeToggle.tsx.
export enum Theme {
  Calm,
  Focus,
}

export enum ModuleType {
  KNM = 'KNM',
  ONA = 'ONA',
  READING = 'Reading',
  LISTENING = 'Listening',
  WRITING = 'Writing',
  SPEAKING = 'Speaking',
  TUTOR = 'Tutor'
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'text' | 'audio';
  text: string;
  options?: string[];
  correctAnswer?: string; // For MC/TF
  explanation: string; // Bilingual explanation
  translation?: string; // English translation of the question
}

export interface UserStats {
  streak: number;
  lastLogin: string;
  totalPoints: number;
  level: 'A1' | 'A2' | 'B1';
  moduleProgress: Record<ModuleType, number>; // 0-100
  weakTopics: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReview: number; // Timestamp
  interval: number; // Days
  easeFactor: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
}

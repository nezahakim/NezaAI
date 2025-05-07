// Enhanced Riddle Bot Architecture

// 1. Core Models - Types and Interfaces
// types/riddle-types.ts
export interface Riddle {
    id: string;
    question: string;
    answer: string;
    category: RiddleCategory;
    difficulty: RiddieDifficulty;
    source?: string;
    hint?: string;
  }
  
  export enum RiddleCategory {
    FUNNY = 'funny',
    LOGIC = 'logic',
    MATH = 'math',
    MYSTERY = 'mystery',
    RANDOM = 'random'
  }
  
  export enum RiddieDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
  }
  
  export interface UserRiddleStats {
    solved: number;
    attempted: number;
    streak: number;
    lastPlayed: Date;
    points: number;
  }
  
  export interface GroupGame {
    gameId: string;
    chatId: number;
    startedBy: number; // User ID
    riddle: Riddle;
    startTime: Date;
    participants: Map<number, boolean>; // userId -> hasAnswered
    correctAnswers: number[];
    status: 'active' | 'completed' | 'expired';
    expiresAt: Date;
    hint_given: boolean;
  }
  
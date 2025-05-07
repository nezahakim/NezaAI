import type { Riddle, RiddleCategory, RiddieDifficulty, UserRiddleStats, GroupGame } from '../types/riddle-types';
  import { v4 as uuidv4 } from 'uuid';
  
  // Individual riddle sessions
  type RiddleSession = Map<string, string>;
  const activeRiddles: RiddleSession = new Map();
  
  // Group game sessions
  const groupGames: Map<number, GroupGame> = new Map(); // chatId -> game
  
  // User stats
  const userStats: Map<number, UserRiddleStats> = new Map(); // userId -> stats
  
  // Helper to make user-chat-specific key
  const getKey = (chatId: number, userId: number) => `${chatId}:${userId}`;
  
  // Set current individual riddle answer
  export const setActiveRiddle = (chatId: number, userId: number, answer: string) => {
    const key = getKey(chatId, userId);
    activeRiddles.set(key, normalize(answer));
  };

  let realAnswer: any;
  
  // Check if user's answer is correct (with tolerance)
  export const checkRiddleAnswer = (chatId: any, userId: any, input: string): boolean | null => {
    const key = getKey(chatId, userId);
    const correct = activeRiddles.get(key);
    realAnswer = correct;
    if (!correct) return null;
  
    // Update stats before clearing the session
    updateUserStats(userId, input === correct);
    
    activeRiddles.delete(key);
    return isAnswerClose(input, correct);
  };

  export const getRealAnswer = (): string => {
    const correct = realAnswer;
    return correct;
  };
  
  // Check if there's an active riddle
  export const hasActiveRiddle = (chatId: any, userId: any): boolean => {
    const key = getKey(chatId, userId);
    return activeRiddles.has(key);
  };
  
  // Group game management
  export const createGroupGame = (chatId: number, userId: number, riddle: Riddle): GroupGame => {
    // Cancel any existing game in this chat
    if (groupGames.has(chatId)) {
      endGroupGame(chatId, 'expired');
    }
  
    const game: GroupGame = {
      gameId: uuidv4(),
      chatId,
      startedBy: userId,
      riddle,
      startTime: new Date(),
      participants: new Map([[userId, false]]), // Starter is first participant
      correctAnswers: [],
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      hint_given: false
    };
  
    groupGames.set(chatId, game);
    return game;
  };
  
  export const joinGroupGame = (chatId: number, userId: number): boolean => {
    const game = groupGames.get(chatId);
    if (!game || game.status !== 'active') return false;
  
    game.participants.set(userId, false);
    return true;
  };
  
  export const checkGroupAnswer = (chatId: number, userId: number, answer: string): boolean => {
    const game = groupGames.get(chatId);
    if (!game || game.status !== 'active') return false;
  
    // Mark user as having attempted
    game.participants.set(userId, true);
  
    const isCorrect = isAnswerClose(answer, game.riddle.answer);
    if (isCorrect) {
      // Record correct answer
      game.correctAnswers.push(userId);
      updateUserStats(userId, true);
      
      // If this is the first correct answer, end the game
      if (game.correctAnswers.length === 1) {
        setTimeout(() => endGroupGame(chatId, 'completed'), 500);
      }
    } else {
      updateUserStats(userId, false);
    }
  
    return isCorrect;
  };
  
  export const endGroupGame = (chatId: number, status: 'completed' | 'expired'): GroupGame | null => {
    const game = groupGames.get(chatId);
    if (!game) return null;
  
    game.status = status;
    groupGames.delete(chatId);
    return game;
  };
  
  export const getActiveGroupGame = (chatId: number): GroupGame | null => {
    const game = groupGames.get(chatId);
    return game && game.status === 'active' ? game : null;
  };
  
  export const giveGroupGameHint = (chatId: number): string | null => {
    const game = groupGames.get(chatId);
    if (!game || game.status !== 'active' || game.hint_given) return null;
  
    game.hint_given = true;
    
    // Generate a hint by revealing parts of the answer
    const answer = game.riddle.answer;
    let hint = '';
    for (let i = 0; i < answer.length; i++) {
      if (answer[i] === ' ') {
        hint += ' ';
      } else if (i % 3 === 0) {
        hint += answer[i];
      } else {
        hint += '_';
      }
    }
    
    return hint;
  };
  
  // User stats management
  export const updateUserStats = (userId: number, wasCorrect: boolean) => {
    const stats = userStats.get(userId) || {
      solved: 0,
      attempted: 0,
      streak: 0,
      lastPlayed: new Date(),
      points: 0
    };
  
    stats.attempted++;
    stats.lastPlayed = new Date();
    
    if (wasCorrect) {
      stats.solved++;
      stats.streak++;
      stats.points += 10 + (stats.streak * 2); // Bonus for streaks
    } else {
      stats.streak = 0;
    }
  
    userStats.set(userId, stats);
  };
  
  export const getUserStats = (userId: number): UserRiddleStats => {
    return userStats.get(userId) || {
      solved: 0,
      attempted: 0,
      streak: 0,
      lastPlayed: new Date(0),
      points: 0
    };
  };
  
  export const getLeaderboard = (limit: number = 10): Array<{userId: number, stats: UserRiddleStats}> => {
    return Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, stats }))
      .sort((a, b) => b.stats.points - a.stats.points)
      .slice(0, limit);
  };
  
  // Persistence for stats (optional)
  export const saveUserStats = async (): Promise<void> => {
    try {
      // Here you would save to a database or file
      console.log("Saved user stats");
    } catch (err) {
      console.error("Failed to save user stats:", err);
    }
  };
  
  // Load previously saved stats (optional)
  export const loadUserStats = async (): Promise<void> => {
    try {
      // Here you would load from a database or file
      console.log("Loaded user stats");
    } catch (err) {
      console.error("Failed to load user stats:", err);
    }
  };
  
  // Cleanup expired games every minute
  setInterval(() => {
    const now = new Date();
    for (const [chatId, game] of groupGames.entries()) {
      if (game.status === 'active' && game.expiresAt < now) {
        endGroupGame(chatId, 'expired');
      }
    }
  }, 60 * 1000);
  
  // Normalize and compare functions
  const normalize = (text: string) =>
    text.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
  
  const isAnswerClose = (input: string, answer: string) => {
    const normalizedInput = normalize(input);
    const normalizedAnswer = normalize(answer);
  
    // Direct substring match (in either direction)
    if (
      normalizedAnswer.includes(normalizedInput) ||
      normalizedInput.includes(normalizedAnswer)
    ) return true;
  
    // Word overlap fallback
    const similarity = stringSimilarity(normalizedInput, normalizedAnswer);
    return similarity >= 0.7;
  };
  
  // Basic similarity (word overlap ratio)
  const stringSimilarity = (a: string, b: string) => {
    const wordsA = new Set(a.split(" "));
    const wordsB = new Set(b.split(" "));
    const matchCount = [...wordsA].filter(word => wordsB.has(word)).length;
    const total = new Set([...wordsA, ...wordsB]).size;
    return total === 0 ? 0 : matchCount / total;
  };
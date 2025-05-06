type RiddleSession = Map<string, string>;
const activeRiddles: RiddleSession = new Map();

// Helper to make user-chat-specific key
const getKey = (chatId: number, userId: number) => `${chatId}:${userId}`;

// Set current riddle answer
export const setActiveRiddle = (chatId: number, userId: number, answer: string) => {
  const key = getKey(chatId, userId);
  activeRiddles.set(key, normalize(answer));
};

// Check if user's answer is correct (with tolerance)
export const checkRiddleAnswer = (chatId: any, userId: any, input: string): boolean | null => {
  const key = getKey(chatId, userId);
  const correct = activeRiddles.get(key);
  if (!correct) return null;

  activeRiddles.delete(key);
  return isAnswerClose(input, correct);
};

// Normalize and compare
const normalize = (text: string) =>
  text.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');

// Compare with basic similarity logic
// const isAnswerClose = (input: string, answer: string) => {
//   const normalizedInput = normalize(input);
//   const similarity = stringSimilarity(normalizedInput, answer);
//   return similarity >= 0.8;
// };

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


export const hasActiveRiddle = (chatId: any, userId: any): boolean => {
  const key = `${chatId}:${userId}`;
  return activeRiddles.has(key);
};
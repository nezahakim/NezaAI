type Message = {
    text: string;
    isUser: boolean;
    timestamp: number;
  };
  
  const conversationCache: Map<string, { messages: Message[]; expiresAt: number }> = new Map();
  const TTL = 86400000; // 24 hours in ms
  
  export function saveConversation(userId: string, message: string, isUser = true) {
    const now = Date.now();
    const existing = conversationCache.get(userId);
  
    if (existing && existing.expiresAt > now) {
      existing.messages.push({ text: message, isUser, timestamp: now });
      existing.expiresAt = now + TTL;
    } else {
      conversationCache.set(userId, {
        messages: [{ text: message, isUser, timestamp: now }],
        expiresAt: now + TTL,
      });
    }
  }
  
  export function getConversationHistory(userId: string): Message[] {
    const entry = conversationCache.get(userId);
    if (!entry || entry.expiresAt < Date.now()) {
      conversationCache.delete(userId);
      return [];
    }
    return entry.messages;
  }
  
  export function generateFollowUpQuestion(_context: any): string {
    const questions = [
      "How does that make you feel?",
      "What are your thoughts on that?",
      "Have you considered any alternatives?",
      "Is there anything specific you'd like to focus on?",
      "How can I help you further with this?",
      "Did you manage to complete your tasks for today?",
      "Have you taken any breaks to relax?",
      "Is there anything exciting coming up in your week?",
    ] as any;
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  export function trimConversationHistory(userId: string) {
    const entry = conversationCache.get(userId);
    if (!entry) return;
  
    if (entry.messages.length > 50) {
      entry.messages = entry.messages.slice(-50);
    }
  }
  
  export function cleanUpOldConversations() {
    const now = Date.now();
    for (const [userId, entry] of conversationCache.entries()) {
      if (entry.expiresAt < now) {
        conversationCache.delete(userId);
      }
    }
  }
  
  // Schedule cleanup every 24 hours
  setInterval(cleanUpOldConversations, TTL);
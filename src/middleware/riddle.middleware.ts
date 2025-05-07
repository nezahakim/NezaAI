import { handleRiddleAnswer } from "../bot/controllers/riddle.controller";
import { hasActiveRiddle, getActiveGroupGame } from "../sessions/riddle.session";

// Middleware to prevent certain commands during active riddles
export const riddleBlocker = (ctx: any, next: Function) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) return next();

  // Check for individual riddle
  const active = hasActiveRiddle(chatId, userId);
  
  // Check for group game - only block commands for non-admins
  const groupGame = getActiveGroupGame(chatId);
  const isInGroupGame = groupGame && groupGame.participants.has(userId);
  
  // Skip middleware for riddle-related commands
  const command = ctx.message?.text?.split(' ')[0];
  const riddleCommands = ['/riddle', '/mystats', '/leaderboard', '/riddlehelp'];
  
  if (riddleCommands.includes(command)) {
    return next();
  }
  
  // Check if user is admin in group chats
  const isAdmin = async () => {
    try {
      if (ctx.chat.type === 'private') return false;
      const member = await ctx.telegram.getChatMember(chatId, userId);
      return ['creator', 'administrator'].includes(member.status);
    } catch (err) {
      console.error("Admin check error:", err);
      return false;
    }
  };
  
  // Block or allow based on conditions
  if (active) {
    return ctx.reply(
      "🧩 You're already solving a riddle! Please answer it or use /riddle to get a new one.",
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
  
  // Allow admins to bypass the blocker in group games
  if (isInGroupGame) {
    isAdmin().then(admin => {
      if (admin) {
        return next();
      } else {
        return ctx.reply(
          "🎮 There's an active riddle game in this group! Try solving it or wait until it ends.",
          { reply_to_message_id: ctx.message?.message_id }
        );
      }
    });
  } else {
    return next();
  }
};

// Message handler for riddle answers

export const riddleAnswerHandler = (ctx: any, next: Function) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  
  if (!userId || !chatId) return next();
  
  // Check for individual riddle
  const individualActive = hasActiveRiddle(chatId, userId);
  
  // Check for group game
  const groupGame = getActiveGroupGame(chatId);
  const isInGroupGame = groupGame && groupGame.participants.has(userId);
  
  // If there's either an individual riddle or group game active
  if (individualActive || isInGroupGame) {
    return handleRiddleAnswer(ctx);
  }
  
  return next();
};

// Activity tracking for riddle engagement
const activeUsers = new Set<number>();

export const trackRiddleActivity = (ctx: any, next: Function) => {
  const userId = ctx.from?.id;
  
  if (userId) {
    activeUsers.add(userId);
  }
  
  return next();
};

// Get a list of active users
export const getActiveRiddleUsers = (): number[] => {
  return Array.from(activeUsers);
};

// Clear inactive users occasionally
setInterval(() => {
  console.log(`Tracking ${activeUsers.size} active riddle users`);
}, 60 * 60 * 1000); // Log every hour
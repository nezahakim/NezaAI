// controllers/riddle.controller.ts
import { 
  setActiveRiddle, 
  checkRiddleAnswer, 
  createGroupGame,
  joinGroupGame, 
  checkGroupAnswer, 
  getActiveGroupGame,
  endGroupGame,
  giveGroupGameHint,
  getUserStats,
  getLeaderboard,
  getRealAnswer
} from "../../sessions/riddle.session";
import { type Riddle, RiddleCategory, RiddieDifficulty } from "../../types/riddle-types";
import { Markup } from "telegraf";

// Fetch riddle from API with category support
const fetchRiddle = async (category?: string): Promise<Riddle> => {
  try {
    let url = "https://riddles-api.vercel.app/random";
    
    // Use category-specific APIs when available
    if (category && ["funny", "math", "logic", "mystery"].includes(category)) {
      url = `https://riddles-api-eight.vercel.app/${category}`;
    }
    
    const res = await fetch(url);
    const data = await res.json() as any;
    
    return {
      id: Date.now().toString(),
      question: data.riddle,
      answer: data.answer,
      category: category as RiddleCategory || RiddleCategory.RANDOM,
      difficulty: RiddieDifficulty.MEDIUM // Default difficulty since API doesn't support it
    };
  } catch (err) {
    console.error("Failed to fetch riddle:", err);
    throw new Error("Could not fetch a riddle");
  }
};

// Handle /riddle command for individuals
export const sendRiddle = async (ctx: any) => {
  try {
    const text = ctx.message.text;
    const args = text.split(' ').slice(1);
    let category: string | undefined;
    
    // Parse arguments
    if (args.length > 0) {
      category = args[0].toLowerCase();
      if (!["funny", "math", "logic", "mystery"].includes(category || '')) {
        // Only accept valid categories
        await ctx.reply(
          "📋 *Available categories:*\n\n" +
          "• funny\n" +
          "• math\n" +
          "• logic\n" +
          "• mystery\n\n" +
          "Try again with `/riddle [category]`",
          { parse_mode: "Markdown" }
        );
        return;
      }
    }
    
    // Check if in a group chat
    const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
    
    if (isGroup) {
      // In groups, we'll start a group game
      return await startGroupRiddle(ctx, category);
    }
    
    // For private chats, handle individual riddles
    const riddle = await fetchRiddle(category);
    
    setActiveRiddle(ctx.chat.id, ctx.from.id, riddle.answer);
    
    await ctx.reply(
      `🧩 *The Unsolved Problem!*\n\n${riddle.question}\n\n_Reply with your answer below._`,
      {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown"
      }
    );

  } catch (err) {
    console.error("❌ Riddle fetch failed:", err);
    await ctx.reply("😕 Could not fetch a riddle right now. Please try again later.");
  }
};

// Start a group riddle game
export const startGroupRiddle = async (ctx: any, category?: string) => {
  try {
    const riddle = await fetchRiddle(category);
    const game = createGroupGame(ctx.chat.id, ctx.from.id, riddle);
    
    // Create inline keyboard for joining
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🎮 Join Game', `join_game:${game.gameId}`)],
      [
        Markup.button.callback('🔍 Hint', `hint_game:${game.gameId}`),
        Markup.button.callback('🏁 End Game', `end_game:${game.gameId}`)
      ]
    ]);
    
    await ctx.reply(
      `🔮 *The Unsolved Problem!*\n\n` +
      `Started by: ${ctx.from.first_name}\n` +
      `Category: ${capitalizeFirstLetter(riddle.category)}\n\n` +
      `🧩 *The Riddle:*\n${riddle.question}\n\n` +
      `_Join the game and reply with your answer! Game ends in 5 minutes or when someone solves it._`,
      {
        parse_mode: "Markdown",
        ...keyboard
      }
    );
    
    // Set a timeout to end the game after 5 minutes
    setTimeout(async () => {
      const expiredGame = endGroupGame(ctx.chat.id, 'expired');
      if (expiredGame && expiredGame.status === 'expired') {
        await ctx.reply(
          `⏱ *Time's up!*\n\n` +
          `Nobody solved the riddle correctly.\n` +
          `The answer was: *${expiredGame.riddle.answer}*\n\n` +
          `Start a new game with /riddle`,
          { parse_mode: "Markdown" }
        );
      }
    }, 5 * 60 * 1000);
    
  } catch (err) {
    console.error("❌ Group riddle start failed:", err);
    await ctx.reply("😕 Could not start a group riddle game right now.");
  }
};

// Handle individual riddle answers
export const handleRiddleAnswer = async (ctx: any) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const userAnswer = ctx.message.text;
  
  // Check if there's an active group game first
  const groupGame = getActiveGroupGame(chatId);
  if (groupGame && (ctx.message?.reply_to_message?.from?.id === ctx?.botInfo?.id || ctx?.messsage?.text.includes(`@${ctx?.botInfo?.username}`))) {
    const isCorrect = checkGroupAnswer(chatId, userId, userAnswer);
    
    if (isCorrect) {
      // First correct answer?
      if (groupGame.correctAnswers.length === 1) {
        await ctx.reply(
          `🎉 *Congratulations ${ctx.from.first_name}!*\n\n` +
          `You solved the riddle correctly!\n` +
          `The answer was: *${groupGame.riddle.answer}*\n\n` +
          `You've earned 10 points! 🏆`,
          {
            reply_to_message_id: ctx.message.message_id,
            parse_mode: "Markdown"
          }
        );
        
        // Send game summary
        const participants = Array.from(groupGame.participants.keys()).length;
        
        await ctx.reply(
          `🏁 *Game Over!*\n\n` +
          `Winner: ${ctx.from.first_name}\n` +
          `Total participants: ${participants}\n` +
          `Time taken: ${getTimeDifference(groupGame.startTime)}\n\n` +
          `Start a new game with /riddle`,
          { parse_mode: "Markdown" }
        );
      }
      return;
    }
    
    // Wrong answer in group game
    await ctx.reply(
      `❌ Sorry ${ctx.from.first_name}, that's not correct. Keep trying!`,
      { reply_to_message_id: ctx.message.message_id }
    );
    return;
  }
  
  // Handle individual riddle
  const result = checkRiddleAnswer(chatId, userId, userAnswer);
  if (result === null) return; // no active riddle
  
  if (result === true) {
    const stats = getUserStats(userId);
    await ctx.reply(
      `✅ *Correct!* Nice thinking, ${ctx.from.first_name}! 🧠\n\n` +
      `You've solved ${stats.solved} riddles and have a streak of ${stats.streak}! 🔥\n` +
      `Current score: ${stats.points} points`,
      {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown"
      }
    );
  } else {  
    const realAnswer = getRealAnswer();
    await ctx.reply(
      `❌ That's not it. Try again next time!\n\nThe answer was: *${normalizeAnswer(realAnswer || '')}*`,
      {
        reply_to_message_id: ctx.message.message_id,
        parse_mode: "Markdown"
      }
    );
  }
};

// Handle button callbacks
export const handleRiddleCallbacks = async (ctx: any) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  
  if (callbackData.startsWith('join_game:')) {
    const gameId = callbackData.split(':')[1];
    
    // Check if user is already the game creator
    const game = getActiveGroupGame(chatId);
    if (game && game.startedBy === userId) {
      await ctx.answerCbQuery(`You're already in the game as the creator!`);
      return;
    }
    
    const joined = joinGroupGame(chatId, userId);
    
    if (joined) {
      await ctx.answerCbQuery(`You've joined the riddle game! Submit your answer in the chat.`);
      
      // Get current game to see participant count
      if (game) {
        const count = Array.from(game.participants.keys()).length;
        await ctx.reply(
          `👋 ${ctx.from.first_name} has joined the riddle challenge!\n` +
          `Total participants: ${count}`,
          { reply_to_message_id: ctx.callbackQuery.message.message_id }
        );
      }
    } else {
      await ctx.answerCbQuery(`There's no active game to join.`);
    }
  }
  
  else if (callbackData.startsWith('hint_game:')) {
    const gameId = callbackData.split(':')[1];
    const hint = giveGroupGameHint(chatId);
    
    if (hint) {
      await ctx.answerCbQuery(`Revealing a hint!`);
      await ctx.reply(
        `🔍 *Hint:*\n\nPart of the answer looks like: \`${hint}\``,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.answerCbQuery(`No active game or hint already given.`);
    }
  }
  
  else if (callbackData.startsWith('end_game:')) {
    const gameId = callbackData.split(':')[1];
    
    // Only game starter or admins can end the game
    const game = getActiveGroupGame(chatId);
    if (!game) {
      await ctx.answerCbQuery(`There's no active game to end.`);
      return;
    }
    
    // Check if user is admin or game starter
    const isAdmin = await isUserAdmin(ctx);
    if (game.startedBy !== userId && !isAdmin) {
      await ctx.answerCbQuery(`Only the game starter or admins can end the game.`);
      return;
    }
    
    const endedGame = endGroupGame(chatId, 'expired');
    if (endedGame) {
      await ctx.answerCbQuery(`Game ended successfully.`);
      await ctx.reply(
        `🛑 *Game Ended*\n\n` +
        `The riddle challenge has been ended by ${ctx.from.first_name}.\n` +
        `The answer was: *${endedGame.riddle.answer}*\n\n` +
        `Start a new game with /riddle`,
        { parse_mode: "Markdown" }
      );
    }
  }
  
  else if (callbackData === 'show_leaderboard') {
    const leaderboard = await getFormattedLeaderboard(ctx);
    await ctx.reply(
      leaderboard,
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery();
  }
};

// Get and format leaderboard
export const getFormattedLeaderboard = async (ctx: any) => {
  const leaders = getLeaderboard(10) as any;
  let leaderboardText = `🏆 *Riddle Masters Leaderboard* 🏆\n\n`;
  
  if (leaders.length === 0) {
    leaderboardText += `No riddles have been solved yet. Be the first!`;
    return leaderboardText;
  }
  
  for (let i = 0; i < leaders.length; i++) {
    try {
      const { userId, stats } = leaders[i];
      let username = "Unknown";
      
      try {
        // Get user info from Telegram
        const user = await ctx.telegram.getChat(userId);
        username = user.first_name || user.username || "Unknown";
      } catch (err) {
        console.log(`Could not get username for ${userId}`);
      }
      
      leaderboardText += `${i + 1}. *${username}*\n`;
      leaderboardText += `   Points: ${stats.points} | Solved: ${stats.solved} | Streak: ${stats.streak}\n\n`;
    } catch (err) {
      console.error(`Error formatting leaderboard entry: ${err}`);
    }
  }
  
  return leaderboardText;
};

// Handle /leaderboard command
export const showLeaderboard = async (ctx: any) => {
  try {
    const leaderboard = await getFormattedLeaderboard(ctx);
    await ctx.reply(
      leaderboard,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            Markup.button.callback('🔄 Refresh', 'show_leaderboard')
          ]]
        }
      }
    );
  } catch (err) {
    console.error("❌ Leaderboard error:", err);
    await ctx.reply("⚠️ Could not display the leaderboard right now.");
  }
};

// Handle /mystats command
export const showUserStats = async (ctx: any) => {
  try {
    const userId = ctx.from.id;
    const stats = getUserStats(userId);
    
    await ctx.reply(
      `📊 *Your Riddle Stats*\n\n` +
      `Riddles solved: ${stats.solved}\n` +
      `Total attempts: ${stats.attempted}\n` +
      `Current streak: ${stats.streak} 🔥\n` +
      `Total points: ${stats.points} 🏆\n\n` +
      `Last played: ${formatDate(stats.lastPlayed)}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("❌ Stats error:", err);
    await ctx.reply("⚠️ Could not display your stats right now.");
  }
};

// Utility functions
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getTimeDifference = (startTime: Date) => {
  const diff = new Date().getTime() - startTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

const formatDate = (date: Date) => {
  if (date.getTime() === 0) return "Never";
  return date.toLocaleString();
};

const normalizeAnswer = (answer: string) => {
  return answer?.trim() || '';
};

const isUserAdmin = async (ctx: any) => {
  try {
    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
    return ['creator', 'administrator'].includes(member.status);
  } catch (err) {
    console.error("❌ Admin check error:", err);
    return false;
  }
};
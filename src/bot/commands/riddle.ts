import { 
  sendRiddle, 
  showLeaderboard, 
  showUserStats,
  handleRiddleCallbacks 
} from "../controllers/riddle.controller";

export const riddle = async (ctx: any, next: any) => {
  try {
    await sendRiddle(ctx);
  } catch (err) {
    console.error("❌ Error handling /riddle:", err);
    await ctx.reply("⚠️ Couldn't start a riddle right now. Try again later.");
  }

};

export const leaderboard = async (ctx: any) => {
  try {
    await showLeaderboard(ctx);
  } catch (err) {
    console.error("❌ Error handling /leaderboard:", err);
    await ctx.reply("⚠️ Couldn't show the leaderboard right now. Try again later.");
  }
};

export const mystats = async (ctx: any) => {
  try {
    await showUserStats(ctx);
  } catch (err) {
    console.error("❌ Error handling /mystats:", err);
    await ctx.reply("⚠️ Couldn't show your stats right now. Try again later.");
  }
};

export const riddleHelp = async (ctx: any) => {
  try {
    await ctx.reply(
      `🧩 *The Unsolved Problem - Help* 🧩\n\n` +
      `*Available Commands:*\n\n` +
      `/riddle - Start a new riddle (in groups, starts a group game)\n` +
      `/riddle [category] - Start a riddle from a specific category\n` +
      `/mystats - See your personal riddle statistics\n` +
      `/leaderboard - View the top riddle solvers\n` +
      `/riddlehelp - Show this help message\n\n` +
      
      `*Available Categories:*\n` +
      `• funny\n` +
      `• logic\n` +
      `• math\n` +
      `• mystery\n\n` +
      
      `*Example:* \`/riddle funny\`\n\n` +
      
      `*Group Games:*\n` +
      `In group chats, /riddle starts a group challenge where everyone can participate. The first person to solve the riddle wins!`,
      {
        parse_mode: "Markdown"
      }
    );
  } catch (err) {
    console.error("❌ Error handling /riddlehelp:", err);
    await ctx.reply("⚠️ Couldn't show help right now. Try again later.");
  }
};

// Register all riddle-related callbacks
export const registerRiddleCallbacks = (bot: any) => {
  bot.action(/join_game:.+/, handleRiddleCallbacks);
  bot.action(/hint_game:.+/, handleRiddleCallbacks);
  bot.action(/end_game:.+/, handleRiddleCallbacks);
  bot.action('show_leaderboard', handleRiddleCallbacks);
};
import { Telegraf } from "telegraf";
import commands from './commands/index';
import { middleware } from "../middleware/index";
import { riddleAnswerHandler, trackRiddleActivity } from "../middleware/riddle.middleware";
import ReminderSystem from "../utils/reminder";
import { loadUserStats, saveUserStats } from "../sessions/riddle.session";
import { registerRiddleCallbacks } from "./commands/riddle";
import { cancelTutorial, tutorial, TutorialProcess } from "./controllers/tutorial.controller";
import { messagerHandler } from "../handler/message.handler";

export const bot = new Telegraf(process.env.BOT_TOKEN || '');
commands(bot, middleware);

const reminder = new ReminderSystem();
await reminder.loadUsers();

registerRiddleCallbacks(bot);
await loadUserStats();


setInterval(async () => {
  await saveUserStats();
}, 30 * 60 * 1000);

bot.on("text", middleware, trackRiddleActivity, riddleAnswerHandler, async (ctx: any) => {
  const userId = String(ctx.from.id);
  const chatId = ctx.chat.id;
  const username = ctx.from.username || "anonymous";


  if (ctx.chat.type === 'private' || ctx.message.text.includes(`@${ctx.me}`) || ctx.message?.reply_to_message?.from?.id === ctx.botInfo.id) {
    const messageHandle = messagerHandler(ctx)    
    if(!messageHandle){
      await ctx.reply(
        `👋 Hey ${ctx.from.first_name}!\n\n` +
        `🧠 *Feeling curious?* Type /riddle and challenge your brain!\n\n` +
        `*Try these too:*\n` +
        `🔍 /search  ☁️ /weather  📰 /news\n` +
        `🎨 /imagine  📋 /help\n\n` +
        `👇 Pick a command and see what happens!`,
        {
          reply_to_message_id: ctx.message.message_id,
          parse_mode: "Markdown"
        }
      );
    }
  }

  if(ctx.chat.type !== "private"){
    console.log(`Group (${ctx.chat.title}): ${ctx.message.text}`);
  }


  await TutorialProcess(ctx);
  await reminder.updateUser(userId, chatId, username);
});

import Context from "telegraf";

setInterval(async () => {
  await reminder.checkAndNotifyInactiveUsers(Context);
}, 60 * 60 * 1000);

bot.action("tutorial", (ctx: any) => tutorial(ctx));
bot.action("cancel_tutorial", (ctx: any) => cancelTutorial(ctx));

process.once('SIGINT', async () => {
  console.log('Shutting down, saving riddle stats...');
  await saveUserStats();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log('Shutting down, saving riddle stats...');
  await saveUserStats();
  process.exit(0);
});

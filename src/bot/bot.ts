// import { Telegraf } from "telegraf";
// import commands from './commands/index'
// import { cancelTutorial, tutorial, TutorialProcess } from "./controllers/tutorial.controller";
// import { middleware } from "../middleware/index";
// import { messagerHandler } from "../handler/message.handler";
// import ReminderSystem from "../utils/reminder";
// import { Riddle } from "./controllers/riddle.controller";
// import { riddleBlocker } from "../middleware/riddle.middleware";


// export const bot = new Telegraf(process.env.BOT_TOKEN || '')
// commands(bot, middleware)

// const reminder = new ReminderSystem();
// await reminder.loadUsers();



// bot.on('text', middleware, riddleBlocker, async (ctx)=>{
//     messagerHandler(ctx)
//     TutorialProcess(ctx)

//     const userId = String(ctx.from.id);
//     const chatId = ctx.chat.id;
//     const username = ctx.from.username || "anonymous";
//     await reminder.updateUser(userId, chatId, username);  
// })

// // Check every hour
// setInterval(async () => {
//   await reminder.checkAndNotifyInactiveUsers(bot);
// }, 60 * 60 * 1000);



// bot.action('tutorial', (ctx: any)=>{tutorial(ctx)})
// bot.action('cancel_tutorial', (ctx: any)=>{cancelTutorial(ctx)})


import { Telegraf } from "telegraf";
import commands from './commands/index';
import { cancelTutorial, tutorial, TutorialProcess } from "./controllers/tutorial.controller";
import { middleware } from "../middleware/index";
import { messagerHandler } from "../handler/message.handler";
import ReminderSystem from "../utils/reminder";
import { Riddle } from "./controllers/riddle.controller";
import { hasActiveRiddle } from "../sessions/riddle.session";

export const bot = new Telegraf(process.env.BOT_TOKEN || '');

commands(bot, middleware);

const reminder = new ReminderSystem();
await reminder.loadUsers();

// ✅ Unified message handler
bot.on("text", middleware, async (ctx: any) => {
  const userId = String(ctx.from.id);
  const chatId = ctx.chat.id;
  const username = ctx.from.username || "anonymous";

  // 🧩 Check for active riddle
  if (hasActiveRiddle(chatId, userId)) {
    await Riddle(ctx);
    return;
  }

  // ✅ Proceed with normal flow if no riddle is active
  await messagerHandler(ctx);
  await TutorialProcess(ctx);
  await reminder.updateUser(userId, chatId, username);
});

setInterval(async () => {
  await reminder.checkAndNotifyInactiveUsers(bot);
}, 60 * 60 * 1000);

bot.action("tutorial", (ctx: any) => tutorial(ctx));
bot.action("cancel_tutorial", (ctx: any) => cancelTutorial(ctx));

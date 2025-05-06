import { bot } from "./bot/bot";



bot.launch().then(() => console.log("Bot is runnings!"));
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
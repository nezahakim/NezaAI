import { hasActiveRiddle } from "../sessions/riddle.session";


export const riddleBlocker = (ctx: any, next: Function) => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  if (!userId || !chatId) return next();

  const active = hasActiveRiddle(chatId, userId);
  if (active) {
    return ctx.reply("🧩 You're already solving a riddle! Please answer it before doing anything else.");
  }

  return next();
};

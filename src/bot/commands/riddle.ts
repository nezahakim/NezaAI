import { sendRiddle } from "../controllers/riddle.controller";

export const riddle = async (ctx: any) => {
  try {
    await sendRiddle(ctx);
  } catch (err) {
    console.error("❌ Error handling /riddle:", err);
    await ctx.reply("⚠️ Couldn't start a riddle right now. Try again later.");
  }
};

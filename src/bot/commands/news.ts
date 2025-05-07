import { getNewsUpdate, sendNewsUpdate } from "../controllers/news.controller";

export const news = async (ctx: any, next: any) => {
  try {
    // Notify user it's fetching
    const msg = await ctx.reply("🕵️‍♂️ Fetching the latest news for you...");
    const newsData = await getNewsUpdate();

    if (!newsData) {
      await ctx.reply("⚠️ Couldn't find fresh news right now. Try again soon.");
      return;
    }

    // Send the news
    const res = await sendNewsUpdate(ctx, newsData);
    if(res){
      await ctx.deleteMessage(msg.message_id);
      next();
    }

  } catch (err: any) {
    console.error('❌ Error in /news command:', err.message);
    await ctx.reply("🚨 Something went wrong while fetching the news.");
  }
  
  
};

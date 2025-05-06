import { fetchPexels } from "../controllers/imagine.controller";

export const imagine = async (ctx: any) => {
  const text = ctx.message.text;
  const query = text.split(" ").slice(1).join(" ");

  if (!query) {
    return ctx.reply("🖼 Please provide something to search.\nExample: `/imagine galaxy sky`", { parse_mode: "Markdown" });
  }

  const imageUrl = await fetchPexels(query, "image");

  if (!imageUrl) {
    return ctx.reply("❌ No images found. Try another keyword.");
  }

  await ctx.replyWithPhoto(imageUrl, {
    caption: `🔍 Here's an image for: *${query}*`,
    parse_mode: "Markdown"
  });
  
};

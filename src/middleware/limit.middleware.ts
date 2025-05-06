import { canUserRequest, recordUsage } from "../bot/controllers/rate.controller";

const CHANNEL = "@NezaAI";

export default async function limitMiddleware(ctx: any, next: any) {
  const user = ctx.from;
  const isPrivate = ctx.chat.type === "private";

  if (!user) return ctx.reply("⚠️ Could not identify user.");

  try {
    const member = await ctx.telegram.getChatMember(CHANNEL, user.id);
    const isSubscribed = ["member", "administrator", "creator"].includes(member.status);

    const allowed = canUserRequest(user.id, isPrivate, isSubscribed);

    if (!allowed) {
      const msg = isSubscribed
        ? "🚫 You’ve hit your limit for now. Try again later."
        : `🔒 Limit reached. Join ${CHANNEL} for bonus access.`;
      return ctx.reply(msg);
    }

    recordUsage(user.id);
    ctx.isSubscribed = isSubscribed;
    return next();

  } catch (err) {
    console.error("❌ Channel check failed:", err);
    return ctx.reply("⚠️ Couldn’t verify channel subscription.");
  }
}

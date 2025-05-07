import { woGen as wogen } from "../ai/wogen";

const woGen = new wogen();

export const messagerHandler = async (ctx: any) => {
  const isGroup = ctx.chat.type.includes("group");
  const botUsername = ctx.botInfo.username;

  const messageText = ctx.message.text || "";
  const replyToMessage = ctx.message.reply_to_message;
  const isReplyToBot = replyToMessage?.from?.id === ctx.botInfo.id;

  if (isGroup && !messageText.includes(`@${botUsername}`) && !isReplyToBot) {
    return;
  }

  const replToMessageId = ctx.message.message_id;
  let sentMessage: { message_id: any } | null = null;
  let fullResponse = "";
  let typingInterval: any;

  const updateMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      if (!sentMessage) {
        sentMessage = await ctx.reply(content.trim(), {
          reply_to_message_id: replToMessageId,
          parse_mode: "Markdown",
        });
      } else {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          sentMessage.message_id,
          null,
          content.trim(),
          { parse_mode: "Markdown" }
        );
      }
    } catch (error: any) {
      console.error("Update error:", error.message);
    }
  };

  try {
    typingInterval = setInterval(() => {
      ctx.telegram.sendChatAction(ctx.chat.id, "typing");
    }, 2500);

    for await (const chunk of woGen.generateText(
      ctx.from.id,
      messageText,
      ctx.chat.type
    )) {
      fullResponse += chunk;
      await updateMessage(fullResponse);
    }
  } catch(err: any){
    console.log("Error in message handler:", err.message);
    return false;
  }finally {
    clearInterval(typingInterval);
  }
};

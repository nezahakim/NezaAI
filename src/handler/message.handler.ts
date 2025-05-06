// import { woGen as wogen} from "../ai/wogen";

// const woGen = new wogen();

// export const messagerHandler = async (ctx: any) => {

//     const replyToMessageId = ctx.message.reply_to_message?.message_id;
//     const replToMessage = ctx.message.message_id;
//     let sentMessage: { message_id: any; } | null = null;
//     let fullResponse = "";
//     let typingInterval;

//     const updateMessage = async (content: any) => {
//         if (!content.trim()) return;

//         try {
//             if (!sentMessage) {
//                 sentMessage = await ctx.reply(content.trim(), {
//                     reply_to_message_id: replToMessage,
//                     parse_mode: "Markdown"
//                 });
//             } else {
//                 await ctx.telegram.editMessageText(
//                     ctx.chat.id,
//                     sentMessage.message_id,
//                     null,
//                     content.trim(),
//                     { parse_mode: "Markdown" }
//                 );
//             }
//         } catch (error: any) {
//             console.error("Update error:", error.message);
//         }
//     };

//     try {
//         typingInterval = setInterval(
//             () => ctx.telegram.sendChatAction(ctx.chat.id, "typing"),
//             2500
//         );

//         for await (const chunk of woGen.generateText(
//             ctx.from.id,
//             ctx.message.text,
//             ctx.chat.type
//         )) {
//             fullResponse += chunk;
//             await updateMessage(fullResponse);
//         }
//     } finally {
//         clearInterval(typingInterval);
//     }
// };


import { woGen as wogen } from "../ai/wogen";

const woGen = new wogen();

export const messagerHandler = async (ctx: any) => {
  const isGroup = ctx.chat.type.includes("group");
  const botUsername = ctx.botInfo.username;
  const replyToMessageId = ctx.message.reply_to_message?.message_id;


  // 👇 Only reply in group if the bot is mentioned
  if (isGroup && !ctx.message.text.includes(`@${botUsername}`) && !replyToMessageId) {
    return; // Not tagged, so ignore the message
  }

  const replToMessage = ctx.message.message_id;
  let sentMessage: { message_id: any } | null = null;
  let fullResponse = "";
  let typingInterval;

  const updateMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      if (!sentMessage) {
        sentMessage = await ctx.reply(content.trim(), {
          reply_to_message_id: replToMessage,
          parse_mode: "Markdown"
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
      ctx.message.text,
      ctx.chat.type
    )) {
      fullResponse += chunk;
      await updateMessage(fullResponse);
    }
  } finally {
    clearInterval(typingInterval);
  }
};

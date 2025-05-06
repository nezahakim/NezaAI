import { setActiveRiddle } from "../../sessions/riddle.session";
import { checkRiddleAnswer } from "../../sessions/riddle.session";

let RiddlesAnswer = ''

export const sendRiddle = async (ctx: any) => {
  try {

    const text = ctx.text
    const query = text.split(' ').slice(1).join(' ').toLowerCase().trim();
    let res;


    if(query.length > 0){

        if(query == "funny"){
            res = await fetch(`https://riddles-api-eight.vercel.app/${query}`);
        }else{
            ctx.reply(`Try to enter the Query!\nFor example: \`/riddle funny\` we have only *Funny available*.`, {parse_mode:"Markdown"})
            return
        }

        
    }else{
        res = await fetch("https://riddles-api.vercel.app/random");
    }

    const data = await res.json() as any;

    const question = data.riddle;
    const answer = data.answer;

    RiddlesAnswer = answer;

    setActiveRiddle(ctx.chat.id, ctx.from.id, answer);

    await ctx.reply(`🧩 *Riddle Time!*\n\n${question}\n\n_Reply with your answer below._`, {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "Markdown"
    });

  } catch (err) {
    console.error("❌ Riddle fetch failed:", err);
    await ctx.reply("😕 Could not fetch a riddle right now.");
  }
};


export const Riddle = async (ctx: any) =>{

        const userId = String(ctx.from.id);
        const chatId = ctx.chat.id;

     const result = checkRiddleAnswer(chatId, userId, ctx.message.text);
      if (result === null) return; // no active riddle
    
      if (result === true) {
        await ctx.reply("✅ Correct! Nice thinking. 🧠", {
            reply_to_message_id: ctx.message.message_id,
        });
      } else {
        await ctx.reply(`❌ That's not it. Try again next time! The real answer was: *${RiddlesAnswer}*`, 
            {   reply_to_message_id: ctx.message.message_id,
                parse_mode: "Markdown"
            });
    }
}
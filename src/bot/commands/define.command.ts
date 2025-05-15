import { getWordDefinition } from '../controllers/define.controller';

export const define = async(ctx: any) => {
    const input = ctx.message?.text?.split(' ').slice(1).join(' ');

    if (!input) {
      return ctx.reply('❗ Please provide a word to define.\nExample: /define hello');
    }

    try {
      const { text, audioBuffer, audioFileName } = await getWordDefinition(input.trim());

      if (audioBuffer && audioFileName) {
        // Telegram caption limit is 1024 characters
        const caption = text.slice(0, 1024);
        const remaining = text.length > 1024 ? text.slice(1024) : null;

        await ctx.replyWithAudio(
          { source: audioBuffer, filename: audioFileName },
          { caption, parse_mode: 'Markdown' }
        );

        if (remaining) {
          // Send the rest of the definition as a follow-up message
          await ctx.reply(remaining, { parse_mode: 'Markdown' });
        }
      } else {
        // No audio, send everything as text
        await ctx.reply(text, { parse_mode: 'Markdown' });
      }
    } catch (error: any) {
        console.log(error)
      return ctx.reply(`❌ Sorry we can't process it now, try again later!`);
    }
}

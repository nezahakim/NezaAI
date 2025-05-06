export const middleware = async (ctx: any, next:any) => {

    const user = ctx.from;
    const channel = "@NezaAI";

    try {
        if (ctx.chat.type !== 'group' || ctx.chat.type !== 'supergroup') {
            const member = await ctx.telegram.getChatMember(channel, user.id);
            if (["member", "administrator", "creator"].includes(member.status)) {
                return next();
            } else {
                return ctx.reply('Hi, there!\nIt\'s better if you Join the official channel to get started. Here is it @NezaAI.',{
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Join Channel',
                                    url: `https://t.me/${channel.replace('@', '')}`
                                }
                            ]
                        ]
                    }
                });
            }
        }else {
            return next();
        }

    } catch (error) {
        console.log('Membership check error:', error);
        return ctx.reply('Unable to verify channel membership. Please try again later.');
    }
};

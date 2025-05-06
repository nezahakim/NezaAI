import { welcomeMSG } from "../../utils/messages"
import { Markup } from 'telegraf'
import file from "../../utils/file"

export const start = (ctx: any) =>{
    ctx.replyWithPhoto({ source: file("../../public/welcome.jpg") }, { caption: welcomeMSG, parse_mode: "Markdown"},
        Markup.inlineKeyboard([
            [Markup.button.callback('Tutorial', 'tutorial')]
        ]),
    )
}
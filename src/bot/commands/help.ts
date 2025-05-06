import { helpMSG } from "../../utils/messages"

export const help = (ctx: any) =>{
    ctx.reply(helpMSG, {parse_mode:"Markdown"})
}
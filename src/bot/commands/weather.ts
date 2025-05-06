import weatherService from "../controllers/weather.controller"

export const weather = (ctx: any)=>{
    const text = ctx.text
    const city = text.split(' ').slice(1).join(' ')

    if(city.length > 0) {
        weatherService(ctx, city)
    }else{
        ctx.reply(`Try to enter the Query!\nFor example: \`/weather Tokyo.\` `, {parse_mode:"Markdown"})
    }
}
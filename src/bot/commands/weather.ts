import weatherService from "../controllers/weather.controller"

export const weather = async (ctx: any, next: any)=>{
    const text = ctx.text
    const city = text.split(' ').slice(1).join(' ')

    if(city.length > 0) {
        const res = await weatherService(ctx, city)
        if(res){
            next();
        }
    }else{
        ctx.reply(`Try to enter the Query!\nFor example: \`/weather Tokyo.\` `, {parse_mode:"Markdown"})
    }
}
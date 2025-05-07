import searchService from "../controllers/search.controller"


export const search = async (ctx: any, next:any) =>{
    const text = ctx.text
    const query = text.split(' ').slice(1).join(' ')

    if(query.length > 0){
        const res = await searchService(ctx, query)
        if(res){
            next();
        }
    }else{
        ctx.reply(`Try to enter the Query!\nFor example: \`/search AI news.\` `, {parse_mode:"Markdown"})
    }    
}
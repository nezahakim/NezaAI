import searchService from "../controllers/search.controller"
import { isTutorialInProgress } from "../controllers/tutorial.controller"


export const search = async (ctx: any, next:any) =>{
    const text = ctx.text
    const query = text.split(' ').slice(1).join(' ')

    if(query.length > 0){
        const res = await searchService(ctx, query)
        
        if(res && isTutorialInProgress(ctx)){
            next();
        }
    }else{
        ctx.reply(`Try to enter the Query!\nFor example: \`/search AI news.\` `, {parse_mode:"Markdown"})
    }    
}
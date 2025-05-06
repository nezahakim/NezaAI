import { start } from "./start";
import { help } from "./help";
import { tutorial } from "./tutorial";
import { search } from "./search";
import { weather } from "./weather";
import { news } from "./news";
import { imagine } from "./imagine";
import { riddle } from "./riddle";
import { riddleBlocker } from "../../middleware/riddle.middleware";

const commands = (bot: any, middleware: any) => {
    bot.command('start', middleware, riddleBlocker, start)
    bot.command('help', middleware, riddleBlocker, help)
    bot.command('tutorial', middleware, riddleBlocker, tutorial)
    bot.command('search', middleware,riddleBlocker, search)   
    bot.command('weather', middleware, riddleBlocker, weather)
    bot.command('news', middleware,riddleBlocker, news)
    bot.command('imagine', middleware,riddleBlocker, imagine)
    bot.command("riddle",middleware,riddleBlocker, riddle);
}

export default commands;
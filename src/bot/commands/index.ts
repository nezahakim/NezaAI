import { start } from "./start";
import { help } from "./help";
import { tutorial } from "./tutorial";
import { search } from "./search";
import { weather } from "./weather";
import { news } from "./news";
import { imagine } from "./imagine";
import { riddle, leaderboard, mystats, riddleHelp } from "./riddle";
import { riddleBlocker } from "../../middleware/riddle.middleware";
import { define } from "./define.command";

const commands = (bot: any, middleware: any) => {
    // Core bot commands
    bot.command('start', middleware, riddleBlocker, start);
    bot.command('help', middleware, riddleBlocker, help);
    bot.command('tutorial', middleware, riddleBlocker, tutorial);
    bot.command('search', middleware, riddleBlocker, search);   
    bot.command('weather', middleware, riddleBlocker, weather);
    bot.command('news', middleware, riddleBlocker, news);
    bot.command('imagine', middleware, riddleBlocker, imagine);
    bot.command('define', middleware, riddleBlocker, define)
    
   
    bot.command("riddle", middleware, riddle);
    bot.command("leaderboard", middleware, leaderboard);
    bot.command("mystats", middleware, mystats);
    bot.command("riddlehelp", middleware, riddleHelp);
    
   
    bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot' },
        { command: 'help', description: 'Show help' },
        { command: 'riddle', description: 'Get a new riddle to solve' },
        { command: 'leaderboard', description: 'View top riddle solvers' },
        { command: 'mystats', description: 'See your riddle stats' },
        { command: 'riddlehelp', description: 'Get help with riddle commands' },
        { command: 'search', description: 'Search for something' },
        { command: 'weather', description: 'Get weather information' },
        { command: 'news', description: 'Get latest news' },
        { command: 'imagine', description: 'Generate an image' },
        { command: 'tutorial', description: 'Learn how to use the bot' },
        { command: 'define', description: 'Get the proper definition of an English word' }
    ]).catch((err: any) => console.error('Failed to set commands menu:', err));
};

export default commands;
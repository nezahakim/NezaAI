import { Markup } from "telegraf";
import file from "../../utils/file";
const tutorialSteps = [
    {
        message:
            `*🎉Welcome to the NezaAI tutorial!🎉*

1. Let's start with image generation.

Command /imagine is used to create AI images, you begin with /imagine and then followed by description of the image you want.

*Example:* Type: \`/imagine a futuristic city\` to create your first AI image.
`,
        expectedCommand: "/imagine",
        response:
            "Great job! You've created your first AI-generated image. Let's try something else.",
    },
    {
        message:
            `2. *🌦️ Weather Updates with NezaAI! 🌦️*\n\nThe /weather command gives you real-time weather information for any location. Simply type /weather followed by a city name.\n\n*Example:* Type: \`/weather New York\` to see current conditions in New York.`,
        expectedCommand: "/weather",
        response:
            "Excellent! You now know how to check weather updates. This feature helps you stay prepared wherever you go!",
    },
    {
        message:
            `3. *🔍 Search the Web with NezaAI! 🔍*\n\nUse the /search command to find information online without leaving the app. Just type /search followed by your query.\n\n*Example:* Type: \`/search latest AI trends\` to discover what's new in AI.`,
        expectedCommand: "/search",
        response:
            "Perfect! You've mastered the search feature. This will help you find information quickly without switching apps.",
    },
    {
        message:
            `4. *📰 Stay Informed with NezaAI! 📰*\n\nThe /news command brings you the latest headlines and stories. Simply type /news followed by a topic of interest.\n\n*Example:* Type: \`/news latest AI trends\` to see recent news about artificial intelligence.`,
        expectedCommand: "/news",
        response:
            "Awesome! You now know how to stay updated with the latest news. Let's check out your rewards next!",
    },
] as any;

export const userTutorialProgress = new Map();

export const tutorial = (ctx: any) => {
    try {
        const telegramId = ctx.from.id.toString();
        userTutorialProgress.set(telegramId, 0);
        ctx.replyWithPhoto({source:file('../../public/1.jpeg')},{caption:tutorialSteps[0].message, parse_mode: "Markdown"});
    } catch (error) {
        console.error("Error sending tutorial message:", error);
    }
};

export const cancelTutorial = (ctx: any) => {

    const telegramId = ctx.from.id.toString();
    const progress = userTutorialProgress.get(telegramId);

    if(progress === undefined){
        ctx.reply('There is no Tutorial you were doing! if you want to start a tutorial please type /tutorial. ')
    }else{
        userTutorialProgress.delete(telegramId);
        ctx.reply('You completely canceled the Tutorial Process!\nTry again when you want to learn how to use NezaAI!\nHave a good one.')   
    }
}


export const TutorialProcess = async (ctx: any) => {
    const telegramId = ctx.from.id.toString();
    const progress = userTutorialProgress.get(telegramId);

    if (progress !== undefined) {
        const currentStep = tutorialSteps[progress];
        if (ctx.text.startsWith(currentStep.expectedCommand)) {
            ctx.telegram.sendMessage(telegramId, currentStep.response);

            if (progress < tutorialSteps.length - 1) {
                userTutorialProgress.set(telegramId, progress + 1);
                ctx.telegram.sendMessage(
                    telegramId,
                    tutorialSteps[progress + 1].message,
                    {parse_mode:"Markdown"}
                );
            } else {
                userTutorialProgress.delete(telegramId);
                
                ctx.telegram.sendMessage(
                    telegramId,
                    "Tutorial completed! Enjoy using NezaAI!",
                );
            }
        } else {
            ctx.telegram.sendMessage(
                telegramId,
                "Wrong command! Try the real shown command to complete the tutorial. if you want to cancel the Tutorial, please click cancel.",
                Markup.inlineKeyboard(
                    [Markup.button.callback('Cancel','cancel_tutorial')]
                )
            );
        }
    }
};
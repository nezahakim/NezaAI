import { bot } from "./bot/bot";
import Elysia from "elysia";

const app = new Elysia();
app.get("/", () => "Hello World!");
app.get("/health", () => "OK");

app.listen(9000, () => {
  console.log("Server is running!");
});

bot.launch().then(() => console.log("Bot is runnings!"));
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
import { Bot } from "grammy";
import { registerHandlers } from "./handlers";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не найден");
}

export const bot = new Bot(token);

registerHandlers(bot);

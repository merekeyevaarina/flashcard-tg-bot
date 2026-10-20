import { webhookCallback } from "grammy";
import { bot } from "@/src/lib/telegram/bot";

export const POST = webhookCallback(bot, "std/http");

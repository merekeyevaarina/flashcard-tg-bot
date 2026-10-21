import { webhookCallback } from "grammy";
import { bot } from "@/src/lib/telegram/bot";

const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

const handleTelegramWebhook = webhookSecret
    ? webhookCallback(bot, "std/http", { secretToken: webhookSecret })
    : undefined;

export function GET(): Response {
    return Response.json({ ok: true });
}

export async function POST(request: Request): Promise<Response> {
    if (!handleTelegramWebhook) {
        return Response.json(
            { error: "TELEGRAM_WEBHOOK_SECRET не настроен" },
            { status: 503 },
        );
    }

    return handleTelegramWebhook(request);
}

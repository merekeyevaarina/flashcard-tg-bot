import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function setTelegramWebhook(): Promise<void> {
    const webhookUrlValue = process.env.TELEGRAM_WEBHOOK_URL;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookUrlValue) {
        throw new Error("TELEGRAM_WEBHOOK_URL не найден");
    }

    if (!webhookSecret || !/^[A-Za-z0-9_-]{1,256}$/.test(webhookSecret)) {
        throw new Error(
            "TELEGRAM_WEBHOOK_SECRET должен содержать от 1 до 256 символов: латинские буквы, цифры, _ или -",
        );
    }

    const webhookUrl = new URL(webhookUrlValue);
    if (
        webhookUrl.protocol !== "https:" ||
        !webhookUrl.pathname.endsWith("/api/telegram")
    ) {
        throw new Error(
            "TELEGRAM_WEBHOOK_URL должен быть HTTPS-адресом и оканчиваться на /api/telegram",
        );
    }

    const { bot } = await import("./src/lib/telegram/bot");

    await bot.api.setWebhook(webhookUrl.toString(), {
        secret_token: webhookSecret,
        allowed_updates: ["message", "callback_query"],
    });

    console.log("Telegram webhook настроен.");
}

setTelegramWebhook().catch((error: unknown) => {
    console.error(
        "Не удалось настроить Telegram webhook:",
        error instanceof Error ? error.message : "Неизвестная ошибка",
    );
    process.exitCode = 1;
});

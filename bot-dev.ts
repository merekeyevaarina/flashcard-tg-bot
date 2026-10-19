import { loadEnvConfig } from "@next/env";

async function startBot(): Promise<void> {
    loadEnvConfig(process.cwd());

    // Import only after loading .env because bot.ts reads the token at module load.
    const { bot } = await import("./src/lib/telegram/bot");
    await bot.start({
        onStart: ({ username }) => {
            console.log(`Telegram-бот @${username} запущен через long polling.`);
        },
    });
}

void startBot().catch((error: unknown) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const safeErrorMessage = token
        ? errorMessage.replaceAll(token, "[токен скрыт]")
        : errorMessage;

    console.error(
        `Telegram-бот остановился: ${safeErrorMessage}`,
    );
    process.exitCode = 1;
});

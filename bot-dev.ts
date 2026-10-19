import { loadEnvConfig } from "@next/env";

async function startBot(): Promise<void> {
    loadEnvConfig(process.cwd());

    const { bot } = await import("./src/lib/telegram/bot");

    await bot.start({
        onStart: (botInfo) => {
            console.log(`Бот @${botInfo.username} успешно запущен!`);
        },
    });
}

startBot().catch((error: unknown) => {
    console.error(
        "Не удалось запустить Telegram-бота:",
        error instanceof Error ? error.message : error,
    );

    process.exitCode = 1;
});
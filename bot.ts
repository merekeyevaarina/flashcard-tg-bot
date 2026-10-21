import "dotenv/config";
import { prisma } from "./src/lib/db/prisma";
import { bot } from "./src/lib/telegram/bot";

function stopBot(signal: NodeJS.Signals): void {
    console.log(`Получен ${signal}, останавливаю Telegram-бота...`);
    void bot.stop().catch((error: unknown) => {
        console.error("Не удалось корректно остановить бота:", error);
        process.exitCode = 1;
    });
}

process.once("SIGINT", () => stopBot("SIGINT"));
process.once("SIGTERM", () => stopBot("SIGTERM"));

bot.catch(({ ctx, error }) => {
    console.error(
        `Ошибка при обработке обновления Telegram ${ctx.update.update_id}:`,
        error,
    );
});

async function startBot(): Promise<void> {
    await bot.init();

    await bot.start({
        onStart: (botInfo) => {
            console.log(`Бот @${botInfo.username} запущен через long polling.`);
        },
    });
}

void startBot().catch((error: unknown) => {
    console.error("Не удалось запустить Telegram-бота:", error);
    process.exitCode = 1;
}).finally(async () => {
    try {
        await prisma.$disconnect();
    } catch (error) {
        console.error("Не удалось закрыть подключение к базе данных:", error);
        process.exitCode = 1;
    }
});

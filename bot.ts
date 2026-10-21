import "dotenv/config";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { prisma } from "./src/lib/db/prisma";
import { bot } from "./src/lib/telegram/bot";
import { webhookCallback } from "grammy";

const webhookPath = "/telegram/webhook";
const webhookSecretSeed = process.env.WEBHOOK_SECRET;
const publicUrl = (process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL)
    ?.replace(/\/+$/, "");

if (!webhookSecretSeed) {
    throw new Error("WEBHOOK_SECRET не найден. Добавьте его в переменные окружения Render.");
}

if (!publicUrl || !publicUrl.startsWith("https://")) {
    throw new Error(
        "Не найден публичный HTTPS-адрес. На Render используется RENDER_EXTERNAL_URL; " +
            "для локального запуска укажите WEBHOOK_URL.",
    );
}

// Telegram accepts only letters, digits, underscores, and hyphens in its webhook secret.
const webhookSecret = createHash("sha256").update(webhookSecretSeed).digest("hex");
const handleWebhook = webhookCallback(bot, "http", { secretToken: webhookSecret });

bot.catch(({ ctx, error }) => {
    console.error(
        `Ошибка при обработке обновления Telegram ${ctx.update.update_id}:`,
        error,
    );
});

const server = createServer((request, response) => {
    const path = request.url?.split("?", 1)[0];

    if (request.method === "GET" && path === "/health") {
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("ok");
        return;
    }

    if (request.method === "POST" && path === webhookPath) {
        void handleWebhook(request, response).catch((error: unknown) => {
            console.error("Не удалось обработать webhook Telegram:", error);
            if (!response.headersSent) {
                response.writeHead(500);
            }
            if (!response.writableEnded) {
                response.end("Webhook processing failed");
            }
        });
        return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
});

async function closeServer(): Promise<void> {
    if (!server.listening) return;

    await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
}

async function stop(signal: NodeJS.Signals): Promise<void> {
    console.log(`Получен ${signal}, останавливаю HTTP-сервер...`);
    try {
        await closeServer();
        await prisma.$disconnect();
    } catch (error) {
        console.error("Не удалось корректно остановить приложение:", error);
        process.exitCode = 1;
    }
}

process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

async function startBot(): Promise<void> {
    const port = Number(process.env.PORT || 10000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Некорректный PORT: ${process.env.PORT}`);
    }

    await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => reject(error);
        server.once("error", onError);
        server.listen(port, "0.0.0.0", () => {
            server.off("error", onError);
            resolve();
        });
    });

    try {
        const botInfo = await bot.init();
        await bot.api.setWebhook(`${publicUrl}${webhookPath}`, {
            secret_token: webhookSecret,
            allowed_updates: ["message", "callback_query"],
        });

        console.log(
            `Бот @${botInfo.username} запущен через webhook на порту ${port}.`,
        );
    } catch (error) {
        await closeServer();
        throw error;
    }
}

void startBot().catch(async (error: unknown) => {
    console.error("Не удалось запустить Telegram-бота:", error);
    process.exitCode = 1;
    try {
        await closeServer();
        await prisma.$disconnect();
    } catch (shutdownError) {
        console.error("Не удалось закрыть ресурсы приложения:", shutdownError);
    }
});

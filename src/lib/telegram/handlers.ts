import type { Bot } from "grammy";
import { dislikeQuestion, likeQuestion } from "../progress/service";
import { getQuestionById } from "../questions/service";
import { revealAnswer, sendNextFlashcard, sendWelcome } from "./flashcards";

export function registerHandlers(bot: Bot): void {
    bot.command("start", async (ctx) => {
        await sendWelcome(ctx);
        await sendNextFlashcard(ctx);
    });

    bot.callbackQuery(/^(like|dislike):(\d+)$/, async (ctx) => {
        const match = ctx.match;
        if (!Array.isArray(match)) {
            await ctx.answerCallbackQuery();
            return;
        }

        const [, reaction, questionIdValue] = match;
        const action = reaction === "like" ? "like" : "dislike";
        const question = await getQuestionById(Number(questionIdValue));
        if (!question) {
            await ctx.answerCallbackQuery("Этот вопрос больше недоступен.");
            return;
        }

        const userId = ctx.from?.id;
        if (userId === undefined) {
            await ctx.answerCallbackQuery("Не удалось определить пользователя.");
            return;
        }

        try {
            if (action === "like") {
                await likeQuestion(userId, question.id);
            } else {
                await dislikeQuestion(userId, question.id);
            }
        } catch {
            await ctx.answerCallbackQuery(
                "Не удалось сохранить ответ. Попробуйте ещё раз.",
            );
            return;
        }

        await ctx.answerCallbackQuery(
            action === "like"
                ? "Лайк сохранён."
                : "Вопрос добавлен в очередь на повтор.",
        );
        await revealAnswer(ctx, question, action);
    });

    bot.callbackQuery(/^next:(\d+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();
        await sendNextFlashcard(ctx);
    });
}

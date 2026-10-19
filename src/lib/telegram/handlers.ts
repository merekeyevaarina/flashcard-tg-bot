import type { Bot } from "grammy";
import { dislikeQuestion, likeQuestion } from "../progress/service";
import { getQuestionById } from "../questions/service";
import { revealAnswer, sendNextFlashcard } from "./flashcards";

export function registerHandlers(bot: Bot): void {
    bot.command("start", async (ctx) => {
        await ctx.reply(
            "Привет! 👋\n\nДавай изучать IT по карточкам. Вопросы будут появляться случайно.",
        );
        await sendNextFlashcard(ctx);
    });

    bot.callbackQuery(/^(like|dislike):(\d+)$/, async (ctx) => {
        const match = ctx.match;
        if (!Array.isArray(match)) {
            await ctx.answerCallbackQuery();
            return;
        }

        const [, reaction, questionIdValue] = match;
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
            if (reaction === "like") {
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
            reaction === "like"
                ? "Лайк сохранён."
                : "Вопрос повторится при следующем /start.",
        );
        await revealAnswer(ctx, question);
    });
}

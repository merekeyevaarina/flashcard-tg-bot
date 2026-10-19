import { InlineKeyboard } from "grammy";
import type { Context } from "grammy";
import { markQuestionPresentedAgain } from "../progress/service";
import { selectNextQuestion } from "../questions/service";

export async function sendNextFlashcard(ctx: Context): Promise<void> {
    const userId = ctx.from?.id;
    if (userId === undefined) {
        await ctx.reply("Не удалось определить пользователя для карточек.");
        return;
    }

    const nextCallbackMatch = ctx.callbackQuery?.data?.match(/^next:(\d+)$/);
    const excludeQuestionId = nextCallbackMatch
        ? Number(nextCallbackMatch[1])
        : undefined;
    const selection = await selectNextQuestion(userId, excludeQuestionId);

    if (selection.status === "empty") {
        const message = "Пока нет карточек. Добавьте вопросы в базу данных.";
        if (nextCallbackMatch) {
            await ctx.editMessageText(message, {
                reply_markup: { inline_keyboard: [] },
            });
        } else {
            await ctx.reply(message);
        }
        return;
    }

    if (selection.status === "complete") {
        const message = "Вы отметили лайком все вопросы. Отличная работа! 🎉";
        if (nextCallbackMatch) {
            await ctx.editMessageText(message, {
                reply_markup: { inline_keyboard: [] },
            });
        } else {
            await ctx.reply(message);
        }
        return;
    }

    const { question, isReview } = selection;
    const keyboard = new InlineKeyboard()
        .text("👍 Лайк", `like:${question.id}`)
        .text("👎 Дизлайк", `dislike:${question.id}`);

    if (nextCallbackMatch) {
        await ctx.editMessageText(question.question, { reply_markup: keyboard });
    } else {
        await ctx.reply(question.question, { reply_markup: keyboard });
    }

    if (isReview) {
        await markQuestionPresentedAgain(userId, question.id);
    }
}

export async function revealAnswer(
    ctx: Context,
    question: { id: number; question: string; answer: string },
): Promise<void> {
    const keyboard = new InlineKeyboard().text(
        "➡️ Следующий вопрос",
        `next:${question.id}`,
    );

    await ctx.editMessageText(
        `${question.question}\n\n✅ Правильный ответ:\n${question.answer}`,
        { reply_markup: keyboard },
    );
}

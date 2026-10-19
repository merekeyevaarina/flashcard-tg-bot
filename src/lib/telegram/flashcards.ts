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

    const selection = await selectNextQuestion(userId);

    if (selection.status === "empty") {
        await ctx.reply("Пока нет карточек. Добавьте вопросы в базу данных.");
        return;
    }

    if (selection.status === "complete") {
        await ctx.reply("Вы отметили лайком все вопросы. Отличная работа! 🎉");
        return;
    }

    const { question, isReview } = selection;
    const keyboard = new InlineKeyboard()
        .text("👍 Лайк", `like:${question.id}`)
        .text("👎 Дизлайк", `dislike:${question.id}`);

    await ctx.reply(question.question, { reply_markup: keyboard });

    if (isReview) {
        await markQuestionPresentedAgain(userId, question.id);
    }
}

export async function revealAnswer(
    ctx: Context,
    question: { question: string; answer: string },
): Promise<void> {
    await ctx.editMessageText(
        `${question.question}\n\n✅ Правильный ответ:\n${question.answer}`,
        { reply_markup: { inline_keyboard: [] } },
    );
}

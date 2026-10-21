import type { Context } from "grammy";
import { markQuestionPresentedAgain } from "../progress/service";
import { selectNextQuestion } from "../questions/service";

type InputRichMessage = Parameters<Context["replyWithRichMessage"]>[0];

function questionCard(question: { id: number; question: string }): InputRichMessage {
    return {
        blocks: [
            { type: "heading", size: 3, text: "🧠 Карточка" },
            { type: "paragraph", text: question.question },
            {
                type: "buttons",
                buttons: [
                    {
                        text: "👍 Лайк",
                        callback_data: `like:${question.id}`,
                        style: "success",
                    },
                    {
                        text: "👎 Дизлайк",
                        callback_data: `dislike:${question.id}`,
                        style: "danger",
                    },
                ],
            },
        ],
    };
}

function answerCard(question: {
    id: number;
    question: string;
    answer: string;
}): InputRichMessage {
    return {
        blocks: [
            { type: "heading", size: 4, text: "Вопрос" },
            { type: "paragraph", text: question.question },
            { type: "divider" },
            { type: "heading", size: 3, text: "✅ Правильный ответ" },
            { type: "paragraph", text: question.answer },
            {
                type: "buttons",
                buttons: [
                    {
                        text: "➡️ Следующий вопрос",
                        callback_data: `next:${question.id}`,
                        style: "primary",
                    },
                ],
            },
        ],
    };
}

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
    if (nextCallbackMatch) {
        await ctx.editMessageText(questionCard(question), {
            reply_markup: { inline_keyboard: [] },
        });
    } else {
        await ctx.replyWithRichMessage(questionCard(question));
    }

    if (isReview) {
        await markQuestionPresentedAgain(userId, question.id);
    }
}

export async function revealAnswer(
    ctx: Context,
    question: { id: number; question: string; answer: string },
): Promise<void> {
    await ctx.editMessageText(answerCard(question), {
        reply_markup: { inline_keyboard: [] },
    });
}

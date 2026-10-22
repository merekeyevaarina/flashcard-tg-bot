import type { Context } from "grammy";
import type { InputRichMessage } from "grammy/types";
import { markQuestionPresentedAgain } from "../progress/service";
import { selectNextQuestion } from "../questions/service";

type Flashcard = { id: number; question: string; answer: string };
type Reaction = "like" | "dislike";

function renderQuestion(question: Flashcard): InputRichMessage {
    return {
        blocks: [
            { type: "heading", size: 3, text: "🎴 IT-карточка" },
            { type: "paragraph", text: question.question },
            { type: "divider" },
            { type: "footer", text: "Вспомни ответ и выбери оценку" },
            {
                type: "buttons",
                align: "center",
                buttons: [
                    {
                        text: "👍 Знаю",
                        style: "success",
                        callback_data: `like:${question.id}`,
                    },
                    {
                        text: "🔁 Повторить",
                        style: "primary",
                        callback_data: `dislike:${question.id}`,
                    },
                ],
            },
        ],
    };
}

function renderAnswer(question: Flashcard, reaction: Reaction): InputRichMessage {
    const feedback =
        reaction === "like"
            ? "✅ Отмечено как знакомое"
            : "🔁 Карточка вернётся на повтор";

    return {
        blocks: [
            { type: "heading", size: 3, text: "💡 Разбор" },
            {
                type: "paragraph",
                text: { type: "bold", text: question.question },
            },
            { type: "blockquote", blocks: [{ type: "paragraph", text: question.answer }] },
            { type: "divider" },
            { type: "footer", text: feedback },
            {
                type: "buttons",
                align: "center",
                buttons: [
                    {
                        text: "➡️ Следующая карточка",
                        style: "primary",
                        callback_data: `next:${question.id}`,
                    },
                ],
            },
        ],
    };
}

function renderStatus(
    title: string,
    message: string,
    footer: string,
): InputRichMessage {
    return {
        blocks: [
            { type: "heading", size: 3, text: title },
            { type: "paragraph", text: message },
            { type: "divider" },
            { type: "footer", text: footer },
        ],
    };
}

async function updateCardMessage(
    ctx: Context,
    message: InputRichMessage,
    isCallbackUpdate: boolean,
): Promise<void> {
    if (isCallbackUpdate) {
        await ctx.editMessageText(message, {
            // Remove the legacy inline keyboard when updating a card sent before Rich Messages.
            reply_markup: { inline_keyboard: [] },
        });
    } else {
        await ctx.replyWithRichMessage(message);
    }
}

export async function sendWelcome(ctx: Context): Promise<void> {
    await ctx.replyWithRichMessage({
        blocks: [
            { type: "heading", size: 2, text: "🧠 IT-карточки" },
            {
                type: "paragraph",
                text: "Короткая практика, чтобы закрепить знания в программировании и технологиях.",
            },
            { type: "divider" },
            {
                type: "footer",
                text: "Вспомни ответ, затем отметь: знаешь его или хочешь повторить.",
            },
        ],
    });
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
        await updateCardMessage(
            ctx,
            renderStatus(
                "🗂 Пока пусто",
                "В этой колоде ещё нет карточек.",
                "Добавьте вопросы в базу данных, и можно начинать.",
            ),
            Boolean(nextCallbackMatch),
        );
        return;
    }

    if (selection.status === "complete") {
        await updateCardMessage(
            ctx,
            renderStatus(
                "🎉 Отличная работа!",
                "Вы отметили лайком все вопросы.",
                "Загляните позже — карточки для повторения появятся снова.",
            ),
            Boolean(nextCallbackMatch),
        );
        return;
    }

    const { question, isReview } = selection;
    await updateCardMessage(ctx, renderQuestion(question), Boolean(nextCallbackMatch));

    if (isReview) {
        await markQuestionPresentedAgain(userId, question.id);
    }
}

export async function revealAnswer(
    ctx: Context,
    question: Flashcard,
    reaction: Reaction,
): Promise<void> {
    await updateCardMessage(ctx, renderAnswer(question, reaction), true);
}

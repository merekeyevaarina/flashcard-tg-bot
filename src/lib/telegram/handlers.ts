
import type { Bot, Context } from "grammy";

import { dislikeQuestion, likeQuestion } from "../progress/service";
import { getQuestionById } from "../questions/service";
import { getRandomTestQuestions } from "../questions/test-service";

import {
    revealAnswer,
    sendModeMenu,
    sendNextFlashcard,
    sendWelcome,
} from "./flashcards";

import {
    startTest,
    getTestSession,
    submitTestAnswer,
    finishTest,
} from "./test-session";

async function sendTestQuestion(
    ctx: Context,
    userId: number,
): Promise<void> {
    const session = getTestSession(userId);

    if (!session) {
        await ctx.reply("Тест не найден. Нажми /start и начни заново.");
        return;
    }

    if (session.currentIndex >= session.questions.length) {
        const total = session.questions.length;
        const score = session.score;
        const percentage =
            total > 0 ? Math.round((score / total) * 100) : 0;

        await ctx.reply(
            `🎉 Тест завершён!\n\nРезультат: ${score} из ${total}\nПроцент правильных ответов: ${percentage}%`,
        );

        finishTest(userId);
        return;
    }

    const question = session.questions[session.currentIndex];
    const options = question.options;

    if (
        !Array.isArray(options) ||
        !options.every((option) => typeof option === "string")
    ) {
        await ctx.reply("Ошибка: варианты ответов заполнены неверно.");
        finishTest(userId);
        return;
    }

    await ctx.reply(
        `📝 Вопрос ${session.currentIndex + 1} из ${session.questions.length}\n\n${question.question}\n\n${options.join("\n")}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "А",
                            callback_data: `test-answer:${question.id}:0`,
                        },
                        {
                            text: "Б",
                            callback_data: `test-answer:${question.id}:1`,
                        },
                    ],
                    [
                        {
                            text: "В",
                            callback_data: `test-answer:${question.id}:2`,
                        },
                        {
                            text: "Г",
                            callback_data: `test-answer:${question.id}:3`,
                        },
                    ],
                ],
            },
        },
    );
}

export function registerHandlers(bot: Bot): void {
    bot.command("start", async (ctx) => {
        await sendModeMenu(ctx);
    });

    bot.callbackQuery(/^(like|dislike):(\d+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();

        const match = ctx.match;
        if (!Array.isArray(match)) {
            return;
        }

        const [, reaction, questionIdValue] = match;
        const action = reaction === "like" ? "like" : "dislike";

        const question = await getQuestionById(Number(questionIdValue));

        if (!question) {
            await ctx.reply("Этот вопрос больше недоступен.");
            return;
        }

        const userId = ctx.from?.id;

        if (userId === undefined) {
            await ctx.reply("Не удалось определить пользователя.");
            return;
        }

        try {
            if (action === "like") {
                await likeQuestion(userId, question.id);
            } else {
                await dislikeQuestion(userId, question.id);
            }
        } catch {
            await ctx.reply(
                "Не удалось сохранить ответ. Попробуйте ещё раз.",
            );
            return;
        }

        await revealAnswer(ctx, question, action);
    });

    bot.callbackQuery(/^next:(\d+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();
        await sendNextFlashcard(ctx);
    });

    bot.callbackQuery("mode:flashcards", async (ctx) => {
        await ctx.answerCallbackQuery();

        await sendWelcome(ctx);
        await sendNextFlashcard(ctx);
    });

    bot.callbackQuery("mode:tests", async (ctx) => {
        await ctx.answerCallbackQuery();

        const userId = ctx.from?.id;

        if (userId === undefined) {
            await ctx.reply("Не удалось определить пользователя.");
            return;
        }

        try {
            const questions = await getRandomTestQuestions(20);

            if (questions.length === 0) {
                await ctx.reply("В базе пока нет тестовых вопросов.");
                return;
            }

            startTest(userId, questions);
            await sendTestQuestion(ctx, userId);
        } catch (error) {
            console.error("Ошибка запуска теста:", error);
            await ctx.reply(
                "Не удалось запустить тест. Попробуй ещё раз позже.",
            );
        }
    });

    bot.callbackQuery(/^test-answer:(\d+):(\d+)$/, async (ctx) => {
        await ctx.answerCallbackQuery();

        const userId = ctx.from?.id;

        if (userId === undefined) {
            return;
        }

        const match = ctx.match;
        const questionId = Number(match[1]);
        const selectedOption = Number(match[2]);

        const session = getTestSession(userId);

        if (!session) {
            await ctx.reply(
                "Тест не найден. Нажми /start и начни заново.",
            );
            return;
        }

        const currentQuestion = session.questions[session.currentIndex];

        if (!currentQuestion || currentQuestion.id !== questionId) {
            await ctx.reply("Этот вопрос уже обработан.");
            return;
        }

        if (
            !Number.isInteger(selectedOption) ||
            selectedOption < 0 ||
            selectedOption > 3
        ) {
            return;
        }

        submitTestAnswer(userId, selectedOption);

        await sendTestQuestion(ctx, userId);
    });
}

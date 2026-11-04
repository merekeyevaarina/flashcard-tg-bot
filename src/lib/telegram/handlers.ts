
import type { Bot, Context } from "grammy";

import {dislikeQuestion, isAdmin, likeQuestion} from "../progress/service";
import {addQuestion, getQuestionById} from "../questions/service";
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
import {clearAdminSession, getAdminSession, startFlashcardCreation, updateAdminSession} from "./admin-session";

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

    bot.command("admin", async (ctx) => {
        if (!ctx.from) {
            await ctx.reply("Не удалось определить пользователя.");
            return;
        }

        const telegramId = String(ctx.from.id);

        const admin = await isAdmin(telegramId);

        if (!admin) {
            await ctx.reply("⛔ У тебя нет доступа к панели администратора.");
            return;
        }

        await ctx.reply("👑 Панель администратора", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📚 Управление Flashcards",
                            callback_data: "admin:flashcards",
                        },
                    ],
                    [
                        {
                            text: "📝 Управление тестами",
                            callback_data: "admin:tests",
                        },
                    ],
                ],
            },
        });    });

    bot.callbackQuery("admin:flashcards:add", async (ctx) => {
        if (!ctx.from || !(await isAdmin(String(ctx.from.id)))) {
            await ctx.answerCallbackQuery({
                text: "⛔ Нет доступа",
                show_alert: true,
            });
            return;
        }

        await ctx.answerCallbackQuery();

        startFlashcardCreation(ctx.from.id);

        await ctx.reply("📚 Отправь текст нового вопроса:");
    });

    bot.on("message:text", async (ctx, next) => {
        if (!ctx.from) {
            return;
        }

        const session = getAdminSession(ctx.from.id);

        if (!session || session.action !== "add_flashcard") {
            await next();
            return;
        }

        const text = ctx.message.text.trim();

        if (session.step === "waiting_question") {
            if (!text) {
                await ctx.reply("Вопрос не может быть пустым. Попробуй ещё раз.");
                return;
            }

            updateAdminSession(ctx.from.id, {
                action: "add_flashcard",
                step: "waiting_answer",
                question: text,
            });

            await ctx.reply("✍️ Теперь отправь ответ на вопрос:");
            return;
        }

        if (session.step === "waiting_answer") {
            if (!text) {
                await ctx.reply("Ответ не может быть пустым. Попробуй ещё раз.");
                return;
            }

            try {
                const question = await addQuestion(
                    session.question!,
                    text,
                );

                clearAdminSession(ctx.from.id);

                await ctx.reply(
                    `✅ Вопрос успешно добавлен!\n\nID: ${question.id}\nВопрос: ${question.question}`,
                );
            } catch (error) {
                console.error("Ошибка добавления Flashcard:", error);
                await ctx.reply("Не удалось сохранить вопрос. Попробуй ещё раз.");
            }
        }
    });
    bot.callbackQuery("admin:flashcards", async (ctx) => {
        await ctx.answerCallbackQuery();

        await ctx.reply("📚 Управление Flashcards", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "➕ Добавить вопрос", callback_data: "admin:flashcards:add" }],
                    [{ text: "📋 Посмотреть вопросы", callback_data: "admin:flashcards:list" }],
                    [{ text: "⬅️ Назад", callback_data: "admin:back" }],
                ],
            },
        });
    });

    bot.callbackQuery("admin:tests", async (ctx) => {
        if (!ctx.from || !(await isAdmin(String(ctx.from.id)))) {
            await ctx.answerCallbackQuery({
                text: "⛔ Нет доступа",
                show_alert: true,
            });
            return;
        }

        await ctx.answerCallbackQuery();

        await ctx.reply("📝 Управление тестами", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "➕ Добавить вопрос", callback_data: "admin:tests:add" }],
                    [{ text: "📋 Посмотреть вопросы", callback_data: "admin:tests:list" }],
                    [{ text: "⬅️ Назад", callback_data: "admin:back" }],
                ],
            },
        });
    });

    bot.callbackQuery("admin:back", async (ctx) => {
        if (!ctx.from || !(await isAdmin(String(ctx.from.id)))) {
            await ctx.answerCallbackQuery({
                text: "⛔ Нет доступа",
                show_alert: true,
            });
            return;
        }

        await ctx.answerCallbackQuery();

        await ctx.reply("👑 Панель администратора", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📚 Управление Flashcards",
                            callback_data: "admin:flashcards",
                        },
                    ],
                    [
                        {
                            text: "📝 Управление тестами",
                            callback_data: "admin:tests",
                        },
                    ],
                ],
            },
        });
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



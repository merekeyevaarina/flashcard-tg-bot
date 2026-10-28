import type { Bot } from "grammy";
import { dislikeQuestion, likeQuestion } from "../progress/service";
import { getQuestionById } from "../questions/service";
import {revealAnswer, sendModeMenu, sendNextFlashcard, sendWelcome} from "./flashcards";
import { getRandomTestQuestions } from "../questions/test-service";



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

    bot.callbackQuery("mode:flashcards", async (ctx) => {
        await ctx.answerCallbackQuery();

        await sendWelcome(ctx);
        await sendNextFlashcard(ctx);
    });


    bot.callbackQuery("mode:tests", async (ctx) => {
        await ctx.answerCallbackQuery();

        const questions = await getRandomTestQuestions(20);

        if (questions.length === 0) {
            await ctx.reply("В базе пока нет тестовых вопросов.");
            return;
        }

        const question = questions[0];
        const options = question.options;

        if (!Array.isArray(options) || !options.every(
            (option) => typeof option === "string",
        )) {
            await ctx.reply("Ошибка: варианты ответов заполнены неверно.");
            return;
        }

        await ctx.reply(
            `📝 Вопрос 1 из ${questions.length}\n\n${question.question}\n\n${options.join("\n")}`,
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
    });



}

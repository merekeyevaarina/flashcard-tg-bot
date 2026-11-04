import { getUserProgress } from "../progress/service";
import {createQuestion, deleteQuestionById, findAllQuestions, findQuestionById} from "./repository";

export async function getQuestionById(id: number) {
    return findQuestionById(id);
}

export async function getAllQuestions() {
    return findAllQuestions();
}

export async function selectNextQuestion(
    userId: number,
    excludeQuestionId?: number,
) {
    const [questions, progress] = await Promise.all([
        findAllQuestions(),
        getUserProgress(userId),
    ]);

    if (questions.length === 0) {
        return { status: "empty" as const };
    }

    const availableQuestions = questions.filter(
        ({ id }) => !progress.likedQuestionIds.includes(id),
    );

    if (availableQuestions.length === 0) {
        return { status: "complete" as const };
    }

    const alternativeQuestions = availableQuestions.filter(
        ({ id }) => id !== excludeQuestionId,
    );
    const candidates =
        alternativeQuestions.length > 0 ? alternativeQuestions : availableQuestions;

    const reviewIds = new Set(progress.reviewQuestionIds);
    const newQuestions = candidates.filter(({ id }) => !reviewIds.has(id));
    const questionPool = newQuestions.length > 0 ? newQuestions : candidates;
    const question = questionPool[Math.floor(Math.random() * questionPool.length)];

    return {
        status: "question" as const,
        question,
        isReview: reviewIds.has(question.id),
    };
}

export async function addQuestion(
    question: string,
    answer: string,
) {
    if (!question.trim() || !answer.trim()) {
        throw new Error("Вопрос и ответ не должны быть пустыми");
    }

    return createQuestion(question.trim(), answer.trim());
}
export async function removeQuestion(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Некорректный ID вопроса");
    }

    const question = await findQuestionById(id);

    if (!question) {
        throw new Error("Вопрос не найден");
    }

    return deleteQuestionById(id);
}

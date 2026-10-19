import { getUserProgress } from "../progress/service";
import { findAllQuestions, findQuestionById } from "./repository";

export async function getQuestionById(id: number) {
    return findQuestionById(id);
}

export async function selectNextQuestion(userId: number) {
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

    const reviewIds = new Set(progress.reviewQuestionIds);
    const reviewQuestions = availableQuestions.filter(({ id }) => reviewIds.has(id));
    const questionPool = reviewQuestions.length > 0 ? reviewQuestions : availableQuestions;
    const question = questionPool[Math.floor(Math.random() * questionPool.length)];

    return {
        status: "question" as const,
        question,
        isReview: reviewIds.has(question.id),
    };
}

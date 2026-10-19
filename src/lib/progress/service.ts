import { ProgressStatus } from "@prisma/client";
import {
    deleteQuestionProgress,
    ensureUser,
    findProgressForUser,
    findQuestionProgressStatus,
    upsertQuestionProgress,
} from "./repository";

export type UserProgress = {
    likedQuestionIds: number[];
    reviewQuestionIds: number[];
};

export async function getUserProgress(userId: number): Promise<UserProgress> {
    const internalUserId = await ensureUser(String(userId));

    const progress = await findProgressForUser(internalUserId);

    return {
        likedQuestionIds: progress
            .filter(({ status }) => status === ProgressStatus.LIKED)
            .map(({ questionId }) => questionId),
        reviewQuestionIds: progress
            .filter(({ status }) => status === ProgressStatus.REVIEW)
            .map(({ questionId }) => questionId),
    };
}

export async function likeQuestion(
    userId: number,
    questionId: number,
): Promise<void> {
    const internalUserId = await ensureUser(String(userId));
    await upsertQuestionProgress(
        internalUserId,
        questionId,
        ProgressStatus.LIKED,
    );
}

export async function dislikeQuestion(
    userId: number,
    questionId: number,
): Promise<void> {
    const internalUserId = await ensureUser(String(userId));

    const currentStatus = await findQuestionProgressStatus(
        internalUserId,
        questionId,
    );

    // A previously liked question is complete and must not return to review.
    if (currentStatus === ProgressStatus.LIKED) {
        return;
    }

    await upsertQuestionProgress(
        internalUserId,
        questionId,
        ProgressStatus.REVIEW,
    );
}

export async function markQuestionPresentedAgain(
    userId: number,
    questionId: number,
): Promise<void> {
    const internalUserId = await ensureUser(String(userId));
    await deleteQuestionProgress(
        internalUserId,
        questionId,
        ProgressStatus.REVIEW,
    );
}

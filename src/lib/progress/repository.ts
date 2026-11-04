import { ProgressStatus } from "@prisma/client";
import { prisma } from "../db/prisma";

export async function ensureUser(telegramId: string): Promise<number> {
    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;

    const isAdmin = telegramId === adminTelegramId;

    const user = await prisma.user.upsert({
        where: { telegramId },

        create: {
            telegramId,
            role: isAdmin ? "ADMIN" : "USER",
        },

        update: isAdmin ? { role: "ADMIN" } : {},

        select: { id: true },
    });

    return user.id;
}

export function findProgressForUser(userId: number) {
    return prisma.userQuestion.findMany({
        where: { userId },
        select: { questionId: true, status: true },
    });
}

export async function findQuestionProgressStatus(
    userId: number,
    questionId: number,
): Promise<ProgressStatus | null> {
    const progress = await prisma.userQuestion.findUnique({
        where: { userId_questionId: { userId, questionId } },
        select: { status: true },
    });

    return progress?.status ?? null;
}

export async function upsertQuestionProgress(
    userId: number,
    questionId: number,
    status: ProgressStatus,
): Promise<void> {
    await prisma.userQuestion.upsert({
        where: { userId_questionId: { userId, questionId } },
        create: { userId, questionId, status },
        update: { status },
    });
}

export async function deleteQuestionProgress(
    userId: number,
    questionId: number,
    status: ProgressStatus,
): Promise<void> {
    await prisma.userQuestion.deleteMany({
        where: { userId, questionId, status },
    });
}

export async function findUserByTelegramId(telegramId: string) {
    return prisma.user.findUnique({
        where: { telegramId },
        select: {
            id: true,
            role: true,
        },
    });
}

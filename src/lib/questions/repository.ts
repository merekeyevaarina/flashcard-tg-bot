import { prisma } from "../db/prisma";

export async function findAllQuestions() {
    return prisma.question.findMany({
        orderBy: { id: "asc" },
        select: { id: true, question: true, answer: true },
    });
}

export async function findQuestionById(id: number) {
    return prisma.question.findUnique({
        where: { id },
        select: { id: true, question: true, answer: true },
    });
}

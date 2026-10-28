
import type { getRandomTestQuestions } from "../questions/test-service";

type TestQuestions = Awaited<
    ReturnType<typeof getRandomTestQuestions>
>;

type TestSession = {
    questions: TestQuestions;
    currentIndex: number;
    score: number;
};

const sessions = new Map<number, TestSession>();

export function startTest(
    userId: number,
    questions: TestQuestions,
): void {
    sessions.set(userId, {
        questions,
        currentIndex: 0,
        score: 0,
    });
}

export function getTestSession(
    userId: number,
): TestSession | undefined {
    return sessions.get(userId);
}

export function submitTestAnswer(
    userId: number,
    selectedOption: number,
): boolean {
    const session = sessions.get(userId);

    if (!session) {
        return false;
    }

    const question = session.questions[session.currentIndex];

    if (!question) {
        return false;
    }

    const correctOptions = ["А", "Б", "В", "Г"];
    const selectedLetter = correctOptions[selectedOption];

    if (selectedLetter === question.correctOption) {
        session.score += 1;
    }

    session.currentIndex += 1;

    return true;
}

export function finishTest(userId: number): void {
    sessions.delete(userId);
}

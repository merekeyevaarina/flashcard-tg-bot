type AdminSession = {
    action: "add_flashcard";
    step: "waiting_question" | "waiting_answer";
    question?: string;
};

const adminSessions = new Map<number, AdminSession>();

export function startFlashcardCreation(userId: number) {
    adminSessions.set(userId, {
        action: "add_flashcard",
        step: "waiting_question",
    });
}

export function getAdminSession(userId: number) {
    return adminSessions.get(userId);
}

export function updateAdminSession(
    userId: number,
    session: AdminSession,
) {
    adminSessions.set(userId, session);
}

export function clearAdminSession(userId: number) {
    adminSessions.delete(userId);
}
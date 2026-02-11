import { prisma } from "../../prisma";

export const hiwiSessionsService = {
    async updateMyStatus(userId: number, hiwiSessionId: number, status: "AVAILABLE" | "MAYBE" | "UNAVAILABLE") {
        // find hiwi by userId
        const hiwi = await prisma.hiWi.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!hiwi) throw new Error("HIWI_NOT_FOUND");

        // ensure assignment exists and belongs to this hiwi
        const assignment = await prisma.hiWiSession.findUnique({
            where: { id: hiwiSessionId },
            select: { id: true, hiwiId: true },
        });
        if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND");
        if (assignment.hiwiId !== hiwi.id) throw new Error("FORBIDDEN");

        // update
        // IMPORTANT: hiWiSession model must have "status" field
        const updated = await prisma.hiWiSession.update({
            where: { id: hiwiSessionId },
            data: { status },
            select: { id: true, status: true, sessionId: true, hiwiId: true },
        });

        return updated;
    },
};
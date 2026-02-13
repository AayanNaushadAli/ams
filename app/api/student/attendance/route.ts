import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const records = await db.attendance.findMany({
            where: { studentId: session.user.id },
            include: {
                class: { select: { name: true, code: true } },
            },
            orderBy: { date: "desc" },
            take: 30,
        });

        const allRecords = await db.attendance.findMany({
            where: { studentId: session.user.id },
            select: { status: true },
        });

        const stats = {
            total: allRecords.length,
            present: allRecords.filter(r => r.status === "PRESENT").length,
            absent: allRecords.filter(r => r.status === "ABSENT").length,
            late: allRecords.filter(r => r.status === "LATE").length,
        };

        return NextResponse.json({ stats, history: records });
    } catch (error) {
        console.error("Fetch attendance error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

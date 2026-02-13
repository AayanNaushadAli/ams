import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { records, classId } = await req.json();

        if (!records || !Array.isArray(records) || !classId) {
            return NextResponse.json({ error: "records array and classId required" }, { status: 400 });
        }

        for (const record of records) {
            const date = new Date(record.date);
            date.setHours(0, 0, 0, 0);

            const existing = await db.attendance.findFirst({
                where: {
                    studentId: record.studentId,
                    classId: classId,
                    date: {
                        gte: date,
                        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            if (existing) {
                await db.attendance.update({
                    where: { id: existing.id },
                    data: { status: record.status },
                });
            } else {
                await db.attendance.create({
                    data: {
                        studentId: record.studentId,
                        classId: classId,
                        status: record.status,
                        date: date,
                    },
                });
            }
        }

        return NextResponse.json({ message: "Attendance saved" });
    } catch (error) {
        console.error("Save attendance error:", error);
        return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
    }
}

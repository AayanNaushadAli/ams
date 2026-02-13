import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET students enrolled in a class + today's attendance
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");
        const dateStr = searchParams.get("date");

        if (!classId) {
            return NextResponse.json({ error: "classId is required" }, { status: 400 });
        }

        // Fetch enrolled students
        const enrollments = await db.enrollment.findMany({
            where: { classId },
            include: { student: { select: { id: true, name: true, email: true } } },
            orderBy: { student: { name: "asc" } },
        });

        const students = enrollments.map(e => e.student);

        // Fetch attendance for this class + date
        const date = dateStr ? new Date(dateStr) : new Date();
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const attendance = await db.attendance.findMany({
            where: {
                classId,
                date: { gte: date, lt: nextDay },
            },
            select: { studentId: true, status: true },
        });

        return NextResponse.json({ students, attendance });
    } catch (error) {
        console.error("Fetch students error:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

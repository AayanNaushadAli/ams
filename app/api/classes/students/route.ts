import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET enrollments for a class, or all enrollments for a student
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");
        const studentId = searchParams.get("studentId");

        if (classId) {
            // Get students enrolled in a class
            const enrollments = await db.enrollment.findMany({
                where: { classId },
                include: { student: { select: { id: true, name: true, email: true } } },
                orderBy: { student: { name: "asc" } },
            });
            return NextResponse.json({ students: enrollments.map(e => e.student) });
        }

        if (studentId) {
            // Get classes a student is enrolled in
            const enrollments = await db.enrollment.findMany({
                where: { studentId },
                include: { class: { select: { id: true, name: true, code: true } } },
            });
            return NextResponse.json({ classes: enrollments.map(e => e.class) });
        }

        return NextResponse.json({ error: "classId or studentId required" }, { status: 400 });
    } catch (error) {
        console.error("Fetch enrollments error:", error);
        return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
    }
}

// POST - enroll students in a class (or a student in multiple classes)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { studentId, classIds } = await req.json();

        if (!studentId || !classIds || !Array.isArray(classIds)) {
            return NextResponse.json({ error: "studentId and classIds[] required" }, { status: 400 });
        }

        // Remove all existing enrollments for this student
        await db.enrollment.deleteMany({ where: { studentId } });

        // Create new enrollments
        if (classIds.length > 0) {
            await db.enrollment.createMany({
                data: classIds.map((classId: string) => ({ studentId, classId })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json({ message: "Enrollments updated" });
    } catch (error) {
        console.error("Update enrollments error:", error);
        return NextResponse.json({ error: "Failed to update enrollments" }, { status: 500 });
    }
}

// DELETE - remove a single enrollment
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");
        const classId = searchParams.get("classId");

        if (!studentId || !classId) {
            return NextResponse.json({ error: "studentId and classId required" }, { status: 400 });
        }

        await db.enrollment.deleteMany({ where: { studentId, classId } });
        return NextResponse.json({ message: "Enrollment removed" });
    } catch (error) {
        console.error("Delete enrollment error:", error);
        return NextResponse.json({ error: "Failed to remove enrollment" }, { status: 500 });
    }
}

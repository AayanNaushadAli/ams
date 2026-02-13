import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET all classes
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const classes = await db.class.findMany({
            include: {
                _count: { select: { enrollments: true } },
                teacher: { select: { id: true, name: true, email: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(classes);
    } catch (error) {
        console.error("Fetch classes error:", error);
        return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
    }
}

// POST create a new class
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { name, code, teacherId } = await req.json();
        if (!name?.trim() || !code?.trim()) {
            return NextResponse.json({ error: "Class name and code are required" }, { status: 400 });
        }

        const newClass = await db.class.create({
            data: {
                name: name.trim(),
                code: code.trim(),
                teacherId: teacherId || null,
            },
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
            return NextResponse.json({ error: "Class code already exists" }, { status: 409 });
        }
        console.error("Create class error:", error);
        return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
    }
}

// DELETE a class
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");

        if (!classId) {
            return NextResponse.json({ error: "classId is required" }, { status: 400 });
        }

        await db.class.delete({ where: { id: classId } });
        return NextResponse.json({ message: "Class deleted" });
    } catch (error) {
        console.error("Delete class error:", error);
        return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
    }
}

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                enrollments: {
                    include: { class: { select: { id: true, name: true, code: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Fetch users error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId, role } = await req.json();

        if (!userId || !role) {
            return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
        }

        const validRoles = ["ADMIN", "TEACHER", "STUDENT"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        if (userId === session.user.id) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        await db.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: "User deleted" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}

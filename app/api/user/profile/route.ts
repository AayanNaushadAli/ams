import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: { name: name.trim() },
            select: { id: true, name: true, email: true, role: true },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

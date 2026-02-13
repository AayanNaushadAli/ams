"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Pencil, X, Check, Loader2 } from "lucide-react";

export default function UserMenu() {
    const { data: session, update } = useSession();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(session?.user?.name || "");
    const [saving, setSaving] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
                setEditing(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Sync name with session
    useEffect(() => {
        if (session?.user?.name) setName(session.user.name);
    }, [session?.user?.name]);

    const saveName = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });
            if (res.ok) {
                await update({ name: name.trim() });
                setEditing(false);
            }
        } catch (err) {
            console.error("Failed to update name:", err);
        } finally {
            setSaving(false);
        }
    };

    const initial = (session?.user?.name || session?.user?.email || "?").charAt(0).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => { setOpen(!open); setEditing(false); }}
                className="flex items-center gap-2 glass px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
                <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                    {initial}
                </div>
                <span className="hidden sm:inline">{session?.user?.name || "User"}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Profile Header */}
                    <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold">
                                {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                                {editing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            autoFocus
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && saveName()}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                        <button onClick={saveName} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300">
                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        </button>
                                        <button onClick={() => { setEditing(false); setName(session?.user?.name || ""); }} className="p-1 text-slate-400 hover:text-slate-300">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-white font-medium truncate">{session?.user?.name || "User"}</p>
                                )}
                                <p className="text-slate-400 text-xs truncate">{session?.user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                            >
                                <Pencil size={16} />
                                Edit Name
                            </button>
                        )}
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

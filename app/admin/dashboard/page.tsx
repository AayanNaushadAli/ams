"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Users, GraduationCap, BookOpen, Shield, Trash2,
    Loader2, RefreshCw, Plus, X, FolderOpen, Save
} from "lucide-react";
import UserMenu from "@/app/components/UserMenu";

interface ClassInfo {
    id: string;
    name: string;
    code: string;
}

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
    enrollments: { class: ClassInfo }[];
}

interface ClassData {
    id: string;
    name: string;
    code: string;
    _count: { enrollments: number };
    teacher: { id: string; name: string | null; email: string } | null;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [classesLoading, setClassesLoading] = useState(true);
    const [newClassName, setNewClassName] = useState("");
    const [newClassCode, setNewClassCode] = useState("");
    const [creatingClass, setCreatingClass] = useState(false);

    // Enrollment form
    const [enrollStudent, setEnrollStudent] = useState<UserData | null>(null);
    const [enrollClassIds, setEnrollClassIds] = useState<string[]>([]);
    const [enrollSaving, setEnrollSaving] = useState(false);

    const [activeTab, setActiveTab] = useState<"users" | "classes">("users");

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users");
            if (res.ok) setUsers(await res.json());
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            setClassesLoading(true);
            const res = await fetch("/api/classes");
            if (res.ok) setClasses(await res.json());
        } catch (err) {
            console.error("Failed to fetch classes:", err);
        } finally {
            setClassesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated" && session?.user?.role === "ADMIN") {
            fetchUsers();
            fetchClasses();
        }
    }, [status, session, fetchUsers, fetchClasses]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
        router.push("/login");
        return null;
    }

    // --- User actions ---
    const changeRole = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Delete this user?")) return;
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
            if (res.ok) setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    // --- Enrollment ---
    const openEnrollForm = (user: UserData) => {
        setEnrollStudent(user);
        setEnrollClassIds(user.enrollments.map(e => e.class.id));
    };

    const toggleEnrollClass = (classId: string) => {
        setEnrollClassIds(prev =>
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const saveEnrollments = async () => {
        if (!enrollStudent) return;
        setEnrollSaving(true);
        try {
            const res = await fetch("/api/classes/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: enrollStudent.id, classIds: enrollClassIds }),
            });
            if (res.ok) {
                // Refresh users to get updated enrollments
                await fetchUsers();
                setEnrollStudent(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEnrollSaving(false);
        }
    };

    // --- Class Actions ---
    const createClass = async () => {
        if (!newClassName.trim() || !newClassCode.trim()) return;
        setCreatingClass(true);
        try {
            const res = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newClassName.trim(), code: newClassCode.trim() }),
            });
            if (res.ok) {
                setNewClassName("");
                setNewClassCode("");
                fetchClasses();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingClass(false);
        }
    };

    const deleteClass = async (classId: string) => {
        if (!confirm("Delete this class? All enrollments will be removed.")) return;
        try {
            const res = await fetch(`/api/classes?classId=${classId}`, { method: "DELETE" });
            if (res.ok) {
                fetchClasses();
                fetchUsers();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const stats = {
        total: users.length,
        students: users.filter(u => u.role === "STUDENT").length,
        teachers: users.filter(u => u.role === "TEACHER").length,
        admins: users.filter(u => u.role === "ADMIN").length,
    };

    const roleColors: Record<string, string> = {
        ADMIN: "bg-purple-500/10 text-purple-400",
        TEACHER: "bg-blue-500/10 text-blue-400",
        STUDENT: "bg-emerald-500/10 text-emerald-400",
    };

    return (
        <div className="min-h-screen p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400">Manage users, classes & enrollments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { fetchUsers(); fetchClasses(); }}
                        className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <UserMenu />
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Users", val: stats.total, icon: Users, color: "blue" },
                    { label: "Students", val: stats.students, icon: GraduationCap, color: "emerald" },
                    { label: "Teachers", val: stats.teachers, icon: BookOpen, color: "blue" },
                    { label: "Admins", val: stats.admins, icon: Shield, color: "purple" },
                ].map(s => (
                    <div key={s.label} className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-9 h-9 rounded-lg bg-${s.color}-500/20 flex items-center justify-center text-${s.color}-400`}>
                                <s.icon size={18} />
                            </div>
                            <h3 className="text-slate-400 text-xs font-medium">{s.label}</h3>
                        </div>
                        <p className={`text-2xl font-bold text-${s.color}-400`}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "users" ? "bg-slate-800/60 text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-slate-200"}`}
                >
                    <span className="flex items-center gap-2"><Users size={16} /> Users</span>
                </button>
                <button
                    onClick={() => setActiveTab("classes")}
                    className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "classes" ? "bg-slate-800/60 text-white border-b-2 border-purple-500" : "text-slate-400 hover:text-slate-200"}`}
                >
                    <span className="flex items-center gap-2"><FolderOpen size={16} /> Classes ({classes.length})</span>
                </button>
            </div>

            {/* ===== ENROLLMENT MODAL ===== */}
            {enrollStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEnrollStudent(null)}>
                    <div className="glass-card w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Enroll Student in Classes</h2>
                            <button onClick={() => setEnrollStudent(null)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                {(enrollStudent.name || enrollStudent.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium">{enrollStudent.name || "Unnamed"}</p>
                                <p className="text-slate-400 text-sm">{enrollStudent.email}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-slate-400 mb-3">Select classes to enroll in:</h3>
                            {classes.length === 0 ? (
                                <p className="text-slate-500 text-sm py-4 text-center">No classes created yet. Go to Classes tab first.</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {classes.map(cls => {
                                        const isEnrolled = enrollClassIds.includes(cls.id);
                                        return (
                                            <button
                                                key={cls.id}
                                                onClick={() => toggleEnrollClass(cls.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isEnrolled
                                                        ? "border-purple-500/50 bg-purple-500/10"
                                                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isEnrolled ? "bg-purple-500 border-purple-500" : "border-slate-500"
                                                    }`}>
                                                    {isEnrolled && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-slate-200 font-medium text-sm">{cls.name}</p>
                                                    <p className="text-slate-400 text-xs">{cls.code} · {cls._count.enrollments} students</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <p className="text-sm text-slate-400">{enrollClassIds.length} class{enrollClassIds.length !== 1 ? "es" : ""} selected</p>
                            <div className="flex gap-2">
                                <button onClick={() => setEnrollStudent(null)} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm">Cancel</button>
                                <button
                                    onClick={saveEnrollments}
                                    disabled={enrollSaving}
                                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {enrollSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== USERS TAB ===== */}
            {activeTab === "users" && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50">
                        <h2 className="text-lg font-semibold text-white">All Users</h2>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-12 text-slate-400">No users found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 text-slate-400">
                                    <tr>
                                        <th className="p-4 font-medium">Name</th>
                                        <th className="p-4 font-medium">Email</th>
                                        <th className="p-4 font-medium text-center">Role</th>
                                        <th className="p-4 font-medium">Enrolled Classes</th>
                                        <th className="p-4 font-medium text-center">Joined</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-slate-200 font-medium">{user.name || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-400 text-sm">{user.email}</td>
                                            <td className="p-4 text-center">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => changeRole(user.id, e.target.value)}
                                                    disabled={user.id === session?.user?.id || actionLoading === user.id}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border-none cursor-pointer ${roleColors[user.role] || ""} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <option value="STUDENT" className="bg-slate-800 text-white">Student</option>
                                                    <option value="TEACHER" className="bg-slate-800 text-white">Teacher</option>
                                                    <option value="ADMIN" className="bg-slate-800 text-white">Admin</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                {user.role === "STUDENT" ? (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {user.enrollments.length > 0 ? (
                                                            user.enrollments.map(e => (
                                                                <span key={e.class.id} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                                                                    {e.class.code}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">No classes</span>
                                                        )}
                                                        <button
                                                            onClick={() => openEnrollForm(user)}
                                                            className="px-2 py-0.5 bg-slate-700 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded text-xs transition-colors"
                                                        >
                                                            + Manage
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center text-slate-400 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.id !== session?.user?.id ? (
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50"
                                                        title="Delete user"
                                                    >
                                                        {actionLoading === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-500">You</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== CLASSES TAB ===== */}
            {activeTab === "classes" && (
                <div className="space-y-6">
                    <div className="glass-card p-5">
                        <h3 className="text-white font-semibold mb-4">Create New Class</h3>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <input
                                type="text"
                                placeholder='Class name, e.g. "Data Structures"'
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <input
                                type="text"
                                placeholder='Code, e.g. "CS201-A"'
                                value={newClassCode}
                                onChange={(e) => setNewClassCode(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && createClass()}
                                className="sm:w-40 bg-slate-900 border border-slate-700 rounded-lg py-2 px-4 text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                                onClick={createClass}
                                disabled={creatingClass || !newClassName.trim() || !newClassCode.trim()}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                            >
                                {creatingClass ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Create
                            </button>
                        </div>
                    </div>

                    {classesLoading ? (
                        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>
                    ) : classes.length === 0 ? (
                        <div className="glass-card text-center p-12 text-slate-400">No classes yet. Create one above.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.map(cls => (
                                <div key={cls.id} className="glass-card p-5 group relative">
                                    <button
                                        onClick={() => deleteClass(cls.id)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                        title="Delete class"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <FolderOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{cls.name}</h4>
                                            <p className="text-slate-400 text-xs">{cls.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                                        <span className="text-slate-400 text-sm">{cls._count.enrollments} students enrolled</span>
                                        {cls.teacher && (
                                            <span className="text-xs text-blue-400">👨‍🏫 {cls.teacher.name || cls.teacher.email}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

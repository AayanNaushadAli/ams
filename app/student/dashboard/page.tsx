"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BookOpen, Check, Loader2 } from "lucide-react";
import UserMenu from "@/app/components/UserMenu";

interface AttendanceRecord {
    id: string;
    date: string;
    status: string;
    class: { name: string; code: string };
}

export default function StudentDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/student/attendance");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0 });
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") fetchAttendance();
    }, [status, fetchAttendance]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    const chartData = [
        { name: "Present", value: stats.present || 0, color: "#10B981" },
        { name: "Absent", value: stats.absent || 0, color: "#EF4444" },
        { name: "Late", value: stats.late || 0, color: "#F59E0B" },
    ].filter(d => d.value > 0);

    const statusColors: Record<string, string> = {
        PRESENT: "bg-emerald-500/10 text-emerald-400",
        ABSENT: "bg-red-500/10 text-red-400",
        LATE: "bg-orange-500/10 text-orange-400",
        EXCUSED: "bg-blue-500/10 text-blue-400",
    };

    const statusBarColors: Record<string, string> = {
        PRESENT: "bg-emerald-500",
        ABSENT: "bg-red-500",
        LATE: "bg-orange-500",
        EXCUSED: "bg-blue-500",
    };

    return (
        <div className="min-h-screen p-6 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Student Dashboard
                    </h1>
                    <p className="text-slate-400">Welcome back, {session?.user?.name || "Student"}</p>
                </div>
                <UserMenu />
            </header>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
            ) : (
                <>
                    {/* Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-1 glass-card p-6 flex flex-col items-center justify-center relative">
                            <h3 className="absolute top-6 left-6 text-slate-400 text-sm font-medium">Overall Attendance</h3>
                            {chartData.length > 0 ? (
                                <>
                                    <div className="h-48 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                                        <span className="text-3xl font-bold text-white">{percentage}%</span>
                                    </div>
                                </>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-slate-500 mt-4">No attendance data yet</div>
                            )}
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="glass-card p-6 flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                                        <BookOpen size={20} />
                                    </div>
                                    <h3 className="text-slate-200 font-medium">Total Classes</h3>
                                </div>
                                <p className="text-4xl font-bold text-white mt-2">{stats.total}</p>
                            </div>
                            <div className="glass-card p-6 flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                                        <Check size={20} />
                                    </div>
                                    <h3 className="text-slate-200 font-medium">Classes Attended</h3>
                                </div>
                                <p className="text-4xl font-bold text-emerald-400 mt-2">{stats.present}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    <div className="glass-card overflow-hidden">
                        {history.length === 0 ? (
                            <div className="text-center p-12 text-slate-400">
                                No attendance records yet. Your attendance will appear here once your teacher marks it.
                            </div>
                        ) : (
                            <div className="p-1">
                                {history.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-12 rounded-full ${statusBarColors[item.status] || "bg-slate-500"}`} />
                                            <div>
                                                <h4 className="text-slate-200 font-medium">{item.class?.name || "General"}</h4>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {item.class?.code} · {new Date(item.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || ""}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

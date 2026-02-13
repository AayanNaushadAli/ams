"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, X, Search, Calendar, Loader2, Plus } from "lucide-react";
import UserMenu from "@/app/components/UserMenu";

interface ClassData {
    id: string;
    name: string;
    code: string;
    _count: { enrollments: number };
}

interface Student {
    id: string;
    name: string | null;
    email: string;
}

interface AttendanceRecord {
    studentId: string;
    status: string;
}

export default function TeacherDashboard() {
    const { status } = useSession();
    const router = useRouter();

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [newClassName, setNewClassName] = useState("");
    const [newClassCode, setNewClassCode] = useState("");
    const [creatingClass, setCreatingClass] = useState(false);

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [saveMessage, setSaveMessage] = useState("");

    const fetchClasses = useCallback(async () => {
        try {
            const res = await fetch("/api/classes");
            if (res.ok) {
                const data = await res.json();
                setClasses(data);
                if (data.length > 0 && !selectedClassId) {
                    setSelectedClassId(data[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch classes:", err);
        }
    }, [selectedClassId]);

    const fetchStudents = useCallback(async () => {
        if (!selectedClassId) {
            setStudents([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await fetch(`/api/teacher/students?classId=${selectedClassId}&date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
                const initial: Record<string, string> = {};
                if (data.attendance) {
                    data.attendance.forEach((a: AttendanceRecord) => {
                        initial[a.studentId] = a.status;
                    });
                }
                data.students?.forEach((s: Student) => {
                    if (!initial[s.id]) initial[s.id] = "PRESENT";
                });
                setAttendance(initial);
            }
        } catch (err) {
            console.error("Failed to fetch students:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedClassId, date]);

    useEffect(() => {
        if (status === "authenticated") fetchClasses();
    }, [status, fetchClasses]);

    useEffect(() => {
        if (status === "authenticated" && selectedClassId) fetchStudents();
    }, [status, selectedClassId, date, fetchStudents]);

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
                const created = await res.json();
                setClasses([...classes, { ...created, _count: { enrollments: 0 } }]);
                setSelectedClassId(created.id);
                setNewClassName("");
                setNewClassCode("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingClass(false);
        }
    };

    const setStudentStatus = (studentId: string, newStatus: string) => {
        setAttendance({ ...attendance, [studentId]: newStatus });
    };

    const saveAttendance = async () => {
        setSaving(true);
        setSaveMessage("");
        try {
            const records = Object.entries(attendance).map(([studentId, st]) => ({
                studentId,
                status: st,
                date,
            }));
            const res = await fetch("/api/teacher/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records, classId: selectedClassId }),
            });
            if (res.ok) {
                setSaveMessage("Attendance saved successfully!");
                setTimeout(() => setSaveMessage(""), 3000);
            } else {
                setSaveMessage("Failed to save attendance");
            }
        } catch (err) {
            console.error(err);
            setSaveMessage("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        (s.name || s.email).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const presentCount = Object.values(attendance).filter(s => s === "PRESENT").length;
    const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;
    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="min-h-screen p-6 space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Teacher Dashboard
                    </h1>
                    <p className="text-slate-400">Mark attendance by class</p>
                </div>
                <UserMenu />
            </header>

            {/* Class Selector */}
            <div className="glass-card p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 flex-1 w-full">
                        <label className="text-slate-400 text-sm font-medium whitespace-nowrap">Class:</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                            {classes.length === 0 && <option value="">No classes yet</option>}
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.code}) — {c._count.enrollments} students</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Class name..."
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 w-36"
                        />
                        <input
                            type="text"
                            placeholder="Code..."
                            value={newClassCode}
                            onChange={(e) => setNewClassCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && createClass()}
                            className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500 w-28"
                        />
                        <button
                            onClick={createClass}
                            disabled={creatingClass || !newClassName.trim() || !newClassCode.trim()}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                        >
                            {creatingClass ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Create
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-medium">Students in {selectedClass?.code || "—"}</h3>
                    <p className="text-3xl font-bold text-white mt-2">{students.length}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-medium">Present Today</h3>
                    <p className="text-3xl font-bold text-emerald-400 mt-2">{presentCount}</p>
                </div>
                <div className="glass-card p-6">
                    <h3 className="text-slate-400 text-sm font-medium">Attendance Rate</h3>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{attendancePercentage}%</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="glass-card overflow-hidden">
                {!selectedClassId ? (
                    <div className="text-center p-12 text-slate-400">Create a class above to start marking attendance.</div>
                ) : loading ? (
                    <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>
                ) : students.length === 0 ? (
                    <div className="text-center p-12 text-slate-400">No students enrolled in this class. Ask the admin to enroll students.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="p-4 font-medium">Student Name</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium text-center">Status</th>
                                <th className="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                            {(student.name || student.email).charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-slate-200 font-medium">{student.name || student.email}</span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{student.email}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${attendance[student.id] === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' :
                                                attendance[student.id] === 'ABSENT' ? 'bg-red-500/10 text-red-400' :
                                                    'bg-orange-500/10 text-orange-400'}`}>
                                            {attendance[student.id] || "PRESENT"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setStudentStatus(student.id, "PRESENT")}
                                                title="Mark Present"
                                                className={`p-2 rounded-lg transition-all ${attendance[student.id] === 'PRESENT'
                                                    ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => setStudentStatus(student.id, "ABSENT")}
                                                title="Mark Absent"
                                                className={`p-2 rounded-lg transition-all ${attendance[student.id] === 'ABSENT'
                                                    ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'}`}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Save Button */}
            {students.length > 0 && (
                <div className="flex items-center justify-end gap-4">
                    {saveMessage && (
                        <span className={`text-sm ${saveMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
                            {saveMessage}
                        </span>
                    )}
                    <button
                        onClick={saveAttendance}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Attendance"}
                    </button>
                </div>
            )}
        </div>
    );
}

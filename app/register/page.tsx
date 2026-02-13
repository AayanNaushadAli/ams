"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const registerUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (data.password !== data.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (data.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "Registration failed");
                return;
            }

            router.push("/login?registered=true");
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" />
                <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-slate-600/20 blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden p-8 z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-slate-300">Join the attendance management system</p>
                </div>

                <form onSubmit={registerUser} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-200 ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <User className="h-5 w-5" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData({ ...data, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-light"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-slate-200 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-light"
                                placeholder="name@college.edu"
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium text-slate-200 ml-1">I am a</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <select
                                id="role"
                                name="role"
                                value={data.role}
                                onChange={(e) => setData({ ...data, role: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-light appearance-none cursor-pointer"
                            >
                                <option value="STUDENT" className="bg-slate-800">Student</option>
                                <option value="TEACHER" className="bg-slate-800">Teacher</option>
                            </select>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-200 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-light"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200 ml-1">Confirm Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                value={data.confirmPassword}
                                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-light"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-slate-400 text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

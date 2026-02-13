"use client";

import { useState } from "react";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [data, setData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getDashboardPath = (role?: string) => {
        switch (role) {
            case "ADMIN": return "/admin/dashboard";
            case "TEACHER": return "/teacher/dashboard";
            case "STUDENT": return "/student/dashboard";
            default: return "/student/dashboard";
        }
    };

    // If already authenticated, redirect
    if (status === "authenticated") {
        router.push(getDashboardPath(session?.user?.role));
        return null;
    }

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const callback = await signIn("credentials", {
                ...data,
                redirect: false,
            });

            if (callback?.error) {
                setError("Invalid email or password");
            }

            if (callback?.ok && !callback?.error) {
                const updatedSession = await getSession();
                router.push(getDashboardPath(updatedSession?.user?.role));
            }
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
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-300">Sign in to access your dashboard</p>
                </div>

                <form onSubmit={loginUser} className="space-y-6">
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
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
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
                                Signing In...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-slate-400 text-sm">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
}

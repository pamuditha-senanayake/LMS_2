"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Security Updated</h3>
                    <p className="text-slate-400 text-sm">Your password has been reset successfully. Redirecting you to the login portal...</p>
                </div>
                <Link 
                    href="/login" 
                    className="mt-8 inline-block px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-sm transition-all"
                >
                    Manual Redirect
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="mb-8 text-left">
                <h3 className="text-2xl font-bold text-white mb-2">New security code</h3>
                <p className="text-slate-400 text-sm font-medium">Create a new secure password for your CourseFlow account.</p>
            </div>

            {!token ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-500 text-xs font-bold text-center mb-6">
                    Error: Security link is missing or invalid. Please request a new one.
                    <div className="mt-4">
                        <Link href="/forgot-password" className="underline uppercase tracking-widest">forgot password</Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && <div className="p-3 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-500 text-xs font-bold text-center">{error}</div>}

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">New Security Code</label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            className="px-5 py-4 bg-slate-950/50 border border-slate-800 focus:border-primary/50 rounded-2xl outline-none text-white text-sm font-medium transition-all"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="confirmPassword">Confirm Code</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            className="px-5 py-4 bg-slate-950/50 border border-slate-800 focus:border-primary/50 rounded-2xl outline-none text-white text-sm font-medium transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 rounded-2xl bg-primary hover:bg-primary-dark active:scale-95 transition-all text-white py-4 font-black text-sm shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? "Updating Security..." : "Reset Password"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="flex h-screen bg-[#020617] text-white selection:bg-primary/30 overflow-hidden">
            <div className="flex-1 h-full overflow-y-auto scrollbar-none z-10 relative">
                <div className="min-h-full w-full flex flex-col items-center justify-center p-8 md:p-12 py-12">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full" />

                    <div className="w-full max-w-md space-y-6 relative animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex flex-col items-center gap-4 text-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-card border border-border-main shadow-2xl flex items-center justify-center p-2">
                                <img src="/A.png" alt="CourseFlow" className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl md:text-3xl leading-none font-black uppercase tracking-tight text-white">
                                    CourseFlow
                                </h2>
                                <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Institutional Portal</p>
                            </div>
                        </div>

                        <Suspense fallback={
                            <div className="bg-slate-900/50 rounded-3xl p-12 border border-white/10 flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Validating...</p>
                            </div>
                        }>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex flex-[1.2] h-full bg-[#020617] overflow-hidden relative border-l border-white/10">
                <img 
                    src="/login-bg.png" 
                    alt="CourseFlow Ecosystem" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-transparent z-10" />
            </div>
        </div>
    );
}

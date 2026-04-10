"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            setMessage(data.message);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#020617] text-white selection:bg-primary/30 overflow-hidden">
            <div className="flex-1 h-full overflow-y-auto scrollbar-none z-10 relative">
                <div className="min-h-full w-full flex flex-col items-center justify-center p-8 md:p-12 py-12">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full" />

                    <div className="w-full max-w-md space-y-6 relative animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex flex-col items-center gap-4 text-center">
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

                        <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
                            <div className="mb-8 text-left">
                                <Link 
                                    href="/login" 
                                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest mb-6"
                                >
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                                <h3 className="text-2xl font-bold text-white mb-2">Recover Access</h3>
                                <p className="text-slate-400 text-sm font-medium">Enter your registered email address to receive a security reset link.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                {error && <div className="p-3 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-500 text-xs font-bold text-center">{error}</div>}
                                {message && <div className="p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-xl text-emerald-500 text-xs font-bold text-center">{message}</div>}

                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="px-5 py-4 bg-slate-950/50 border border-slate-800 focus:border-primary/50 rounded-2xl outline-none text-white text-sm font-medium transition-all"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={!!message}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !!message}
                                    className="mt-6 rounded-2xl bg-primary hover:bg-primary-dark active:scale-95 transition-all text-white py-4 font-black text-sm shadow-xl shadow-primary/20 disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : message ? "Link Sent" : "Send Reset Link"}
                                </button>
                            </form>
                        </div>
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

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0f172a] overflow-hidden z-50">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#76323f] via-[#2d1218] to-black z-0"></div>

            {/* Decorative Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#c09f80] rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#76323f] rounded-full mix-blend-overlay filter blur-[128px] opacity-20 animate-pulse delay-1000"></div>

            <div className="w-full max-w-md z-10 p-4">
                <div className="relative group">
                    {/* Glassmorphism Card */}
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-white/10">

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-white/20">
                                <Lock className="text-[#c09f80]" size={32} />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                            <p className="text-white/50 text-sm mt-2">Sign in to access your dashboard</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-white/70 ml-1 uppercase tracking-wider">Email</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-white/30 group-focus-within/input:text-[#c09f80] transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#c09f80]/50 focus:border-[#c09f80]/50 transition-all duration-200"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-white/70 ml-1 uppercase tracking-wider">Password</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white/30 group-focus-within/input:text-[#c09f80] transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#c09f80]/50 focus:border-[#c09f80]/50 transition-all duration-200"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#c09f80] to-[#a08060] hover:from-[#d1b192] hover:to-[#b19171] text-[#2d1218] font-bold rounded-xl shadow-lg shadow-[#c09f80]/10 hover:shadow-[#c09f80]/20 transform transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-white/40">
                                Don't have an account?{' '}
                                <a href="#" className="text-[#c09f80] hover:text-[#e0c0a0] transition-colors font-medium">
                                    Contact Support
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

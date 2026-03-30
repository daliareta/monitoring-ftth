"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ShieldCheck, Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Static demo credentials for now
    if (username === "admin" && password === "noc123") {
      document.cookie = "ftth_auth=true; path=/; max-age=86400"; // 24h
      document.cookie = "ftth_role=admin; path=/; max-age=86400";
      router.push("/");
    } else if (username === "teknisi" && password === "tk123") {
      document.cookie = "ftth_auth=true; path=/; max-age=86400"; // 24h
      document.cookie = "ftth_role=technician; path=/; max-age=86400";
      router.push("/");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/20">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 mb-6 group transition-transform hover:scale-105 active:scale-95">
              <Zap className="text-white fill-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Sanwanay Network</h1>
            <p className="text-zinc-500 text-sm font-medium">Network Operation Center Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm animate-in fade-in zoom-in duration-300">
                <ShieldCheck size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg shadow-white/5 uppercase tracking-wider text-sm mt-4"
            >
              Sign In to NOC
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-800/50 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
               <ShieldCheck size={12} /> Encrypted
             </div>
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
               <ShieldCheck size={12} /> Admin Only
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

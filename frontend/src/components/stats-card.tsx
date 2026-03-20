"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon: LucideIcon;
  color?: "blue" | "emerald" | "rose" | "amber";
}

export default function StatsCard({ 
  title, 
  value, 
  unit, 
  subValue, 
  icon: Icon, 
  color = "blue" 
}: StatsCardProps) {
  const colorMap = {
    blue: "from-blue-600/20 to-transparent text-blue-500 border-blue-600/20 shadow-blue-900/20",
    emerald: "from-emerald-600/20 to-transparent text-emerald-500 border-emerald-600/20 shadow-emerald-900/20",
    rose: "from-rose-600/20 to-transparent text-rose-500 border-rose-600/20 shadow-rose-900/20",
    amber: "from-amber-600/20 to-transparent text-amber-500 border-amber-600/20 shadow-amber-900/20",
  };

  const ringMap = {
    blue: "bg-blue-600/10 text-blue-500 shadow-blue-600/10",
    emerald: "bg-emerald-600/10 text-emerald-500 shadow-emerald-600/10",
    rose: "bg-rose-600/10 text-rose-500 shadow-rose-600/10",
    amber: "bg-amber-600/10 text-amber-500 shadow-amber-600/10",
  };

  return (
    <div className={cn(
      "bg-zinc-950 border border-zinc-900 p-8 rounded-[2rem] flex flex-col relative overflow-hidden group transition-all duration-500 hover:border-zinc-800 hover:-translate-y-1 shadow-2xl hover:shadow-zinc-950/50",
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-1000",
        colorMap[color]
      )} />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
          ringMap[color]
        )}>
          <Icon size={22} className="group-hover:rotate-6 transition-transform" />
        </div>
        <div className="h-6 w-12 bg-zinc-900/50 border border-zinc-800 rounded-full flex items-center justify-center">
           <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", `bg-${color === 'blue' ? 'blue' : color === 'emerald' ? 'emerald' : color === 'rose' ? 'rose' : 'amber'}-500`)} />
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{title}</p>
        <div className="flex items-baseline gap-1">
          <h2 className="text-4xl font-black text-white tracking-tighter italic">
            {typeof value === 'number' && isNaN(value) ? '0' : value}
          </h2>
          {unit && <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">{unit}</span>}
        </div>
        {subValue && (
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2">{subValue}</p>
        )}
      </div>
    </div>
  );
}

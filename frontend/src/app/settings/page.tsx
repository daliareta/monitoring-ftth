"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  Cpu, 
  Save,
  Lock,
  Loader2
} from "lucide-react";

type SettingTab = 'SECURITY' | 'SYNC' | 'NOTIFS' | 'GEO' | 'HW';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('SECURITY');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500); // Simulate save
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div>
         <div className="flex items-center gap-3 mb-3">
            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-zinc-700/50">Core Configuration</span>
         </div>
         <h1 className="text-4xl font-black text-white tracking-tight uppercase italic mb-2">System Settings</h1>
         <p className="text-zinc-500 text-sm font-medium">Global parameters, security policies, and application state.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
         {/* Navigation Sidebar */}
         <div className="lg:col-span-1 space-y-2">
            <SettingNavItem icon={Shield} label="Security & Access" active={activeTab === 'SECURITY'} onClick={() => setActiveTab('SECURITY')} />
            <SettingNavItem icon={Database} label="Sync Intervals" active={activeTab === 'SYNC'} onClick={() => setActiveTab('SYNC')} />
            <SettingNavItem icon={Bell} label="Notifications" active={activeTab === 'NOTIFS'} onClick={() => setActiveTab('NOTIFS')} />
            <SettingNavItem icon={Globe} label="Localization" active={activeTab === 'GEO'} onClick={() => setActiveTab('GEO')} />
            <SettingNavItem icon={Cpu} label="Hardware Profiles" active={activeTab === 'HW'} onClick={() => setActiveTab('HW')} />
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 space-y-8">
            {activeTab === 'SECURITY' && (
              <div className="bg-[#050505] border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                 <div className="border-b border-zinc-900 pb-6">
                    <h3 className="text-xl font-black text-white uppercase italic mb-1 flex items-center gap-3">
                       <Lock size={20} className="text-blue-500" /> Authentication Level
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Configure NOC & Super-Admin Credentials</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">NOC Username</label>
                       <input type="text" value="admin" disabled className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white font-medium opacity-50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Session TTL (Hours)</label>
                       <input type="number" defaultValue={24} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-all" />
                    </div>
                 </div>

                 <div className="pt-8 border-t border-zinc-900 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20"
                    >
                       {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                       {saving ? "Saving..." : "Save Changes"}
                    </button>
                 </div>
              </div>
            )}

            {activeTab !== 'SECURITY' && (
               <div className="bg-[#050505] border border-zinc-900 rounded-[2.5rem] p-20 text-center animate-in zoom-in-95 duration-500">
                  <Cpu size={48} className="mx-auto text-zinc-800 mb-6" />
                  <h3 className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">Module Pending Implementation</h3>
                  <p className="text-zinc-700 text-xs mt-2 max-w-sm mx-auto">This sub-system will be activated upon integration of global ACS nodes.</p>
               </div>
            )}

            <div className="bg-rose-500/5 border border-rose-900/20 rounded-[2.5rem] p-10 flex items-center justify-between">
               <div>
                  <h4 className="text-rose-500 font-black uppercase italic mb-1">Danger Zone</h4>
                  <p className="text-zinc-500 text-xs font-medium">Flush all telemetry data and reset hardware mappings.</p>
               </div>
               <button className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Reset System
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function SettingNavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
        active ? "bg-zinc-900 text-white border border-zinc-800" : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30"
      )}
    >
       <Icon size={16} className={active ? "text-blue-500" : "text-zinc-700"} />
       {label}
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

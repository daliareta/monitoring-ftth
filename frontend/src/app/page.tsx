"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { 
  Map as MapIcon, 
  Plus, 
  RefreshCw, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  Search,
  Zap
} from "lucide-react";
import StatsCard from "@/components/stats-card";
import ProvisioningForm from "@/components/provisioning-form";
import CustomerModal from "@/components/customer-modal";

// Load Map dynamically to avoid SSR issues with Leaflet
const NetworkMap = dynamic(() => import("@/components/map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#09090b] animate-pulse rounded-[2rem] flex flex-col items-center justify-center text-zinc-700 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin" />
      <span className="text-xs font-black uppercase tracking-widest">Initializing GIS Engine...</span>
    </div>
  )
});

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"map" | "provisioning">("map");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/network-map", {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 1 minute
    return () => clearInterval(interval);
  }, []);

  const totalCustomers = data.reduce((acc, odp: any) => acc + (odp.customers?.length || 0), 0);
  const onlineCustomers = data.reduce((acc, odp: any) => 
    acc + (odp.customers?.filter((c: any) => c.status === "ONLINE").length || 0), 0
  );
  const offlineCustomers = totalCustomers - onlineCustomers;

  // Calculate Dynamic Average RX
  const customersWithRx = data.flatMap(odp => odp.customers || []).filter(c => c.rx_live !== null && c.rx_live !== undefined);
  const avgRx = customersWithRx.length > 0 
    ? (customersWithRx.reduce((acc: number, c: any) => acc + c.rx_live, 0) / customersWithRx.length).toFixed(1)
    : "---";

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-blue-600/20">Live Status</span>
            <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Last Updated: Just Now</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic mb-2">Network Snapshot</h1>
          <p className="text-zinc-500 text-sm font-medium">Real-time tracking of fiber optic distribution and customer health.</p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/30 p-2 rounded-[1.5rem] border border-zinc-800/50 backdrop-blur-sm">
          <button 
            onClick={() => setActiveView("map")}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeView === 'map' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <MapIcon size={16} /> GIS View
          </button>
          <button 
            onClick={() => setActiveView("provisioning")}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeView === 'provisioning' 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Plus size={16} /> NOC Tools
          </button>
          <div className="w-[1px] h-8 bg-zinc-800" />
          <button 
            onClick={fetchData}
            title="Refresh Data"
            className="p-3 bg-zinc-950 text-zinc-500 hover:text-white border border-zinc-800 rounded-2xl transition-all active:rotate-180 duration-500"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Endpoints" 
          value={totalCustomers} 
          subValue={totalCustomers > 0 ? "Network synced" : "Empty Registry"}
          icon={Layers} 
          color="blue"
        />
        <StatsCard 
          title="Active Sessions" 
          value={onlineCustomers} 
          subValue={totalCustomers > 0 ? `${((onlineCustomers/totalCustomers)*100).toFixed(1)}% Uptime` : "---"}
          icon={CheckCircle} 
          color="emerald"
        />
        <StatsCard 
          title="Alerts (LOS)" 
          value={offlineCustomers} 
          subValue={offlineCustomers > 0 ? "Action needed" : "Clean Slate"}
          icon={AlertTriangle} 
          color="rose"
        />
        <StatsCard 
          title="Average RX" 
          value={avgRx} 
          unit={avgRx !== "---" ? "dBm" : ""}
          subValue={avgRx !== "---" ? "Healthy range" : "No telemetry"}
          icon={Activity} 
          color="amber"
        />
      </div>

      {/* Central Viewport */}
      <div className="relative group">
        {activeView === "map" ? (
          <div className="h-[750px] w-full bg-[#050505] border border-zinc-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl transition-all duration-700 group-hover:border-zinc-800">
            <NetworkMap 
              data={data} 
              onSelectCustomer={(c: any) => setSelectedCustomer(c)} 
            />
            
            {/* Legend Overlay - Minimal & Sleek */}
            <div className="absolute bottom-8 left-8 z-[1000] flex items-center gap-2 p-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden">
               <div className="flex items-center gap-4 px-4 py-2 border-r border-zinc-800/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ODP</span>
               </div>
               <div className="flex items-center gap-4 px-4 py-2 border-r border-zinc-800/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Online</span>
               </div>
               <div className="flex items-center gap-4 px-4 py-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">LOS</span>
               </div>
            </div>

            {/* Float Badge */}
            <div className="absolute top-8 left-8 z-[1000] flex items-center gap-3 px-5 py-3 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-900/40">
               <Zap size={14} className="text-white fill-white" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">GIS Live Engine</span>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
            <ProvisioningForm />
          </div>
        )}
      </div>

      {/* Customer Intelligence Modal */}
      {selectedCustomer && (
        <CustomerModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
        />
      )}
    </div>
  );
}

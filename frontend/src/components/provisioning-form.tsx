"use client";

import { useState, useEffect } from "react";
import { UserPlus, MapPin, Database, Server, Smartphone, Info, Activity, ShieldCheck, Zap } from "lucide-react";

export default function ProvisioningForm() {
  const [loading, setLoading] = useState(false);
  const [olts, setOlts] = useState<any[]>([]);
  const [odps, setOdps] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    billing_id: "",
    name: "",
    pppoe_username: "",
    olt_id: "",
    odp_id: "",
    odp_port: 1,
    sn_mac: "",
    rx_installation: -18.5,
    location_lat: 0,
    location_long: 0,
    pon_port: "1/1/1",
    onu_id: "1",
    router_id: ""
  });

  const fetchDropdownData = async () => {
    try {
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      const [oltRes, odpRes, routerRes] = await Promise.all([
        fetch("/api/olts", { headers }),
        fetch("/api/odps", { headers }),
        fetch("/api/routers", { headers })
      ]);
      const [oltJson, odpJson, routerJson] = await Promise.all([
        oltRes.json(),
        odpRes.json(),
        routerRes.json()
      ]);
      setOlts(oltJson || []);
      setOdps(odpJson || []);
      setRouters(routerJson || []);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/provisioning", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Success! Customer provisioned in DB and Hardware Sync triggered.");
        setFormData({
          billing_id: "",
          name: "",
          pppoe_username: "",
          olt_id: "",
          odp_id: "",
          odp_port: 1,
          sn_mac: "",
          rx_installation: -18.5,
          location_lat: 0,
          location_long: 0,
          pon_port: "1/1/1",
          onu_id: "1",
          router_id: ""
        });
      } else {
        const err = await response.json();
        alert(`Failed: ${err.error || "Unknown hardware error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Critical network failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] border border-zinc-900 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group hover:border-zinc-800 transition-all duration-700">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-zinc-900 pb-10 relative z-10">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/20">
             <UserPlus className="text-white" size={28} />
           </div>
           <div>
             <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Provisioning</h2>
             <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">New Terminal Deployment</p>
           </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-zinc-900/50 rounded-2xl border border-zinc-800">
           <ShieldCheck size={16} className="text-blue-500" />
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">NOC Level 2 Authenticated</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Identity Block */}
          <div className="space-y-8 p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-900/50 hover:border-zinc-800 transition-colors">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <Info size={14} /> Subscriber Identity
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <FormGroup label="Full Name">
                <input type="text" required className="form-input shadow-inner" placeholder="E.g. Budi Santoso" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </FormGroup>
              <div className="grid grid-cols-2 gap-6">
                <FormGroup label="Billing ID">
                  <input type="text" required className="form-input" placeholder="CID-1002" value={formData.billing_id} onChange={(e) => setFormData({...formData, billing_id: e.target.value})} />
                </FormGroup>
                <FormGroup label="PPPoE Username">
                  <input type="text" required className="form-input" placeholder="budi@home" value={formData.pppoe_username} onChange={(e) => setFormData({...formData, pppoe_username: e.target.value})} />
                </FormGroup>
              </div>
            </div>
          </div>

          {/* OLT Mapping Block */}
          <div className="space-y-8 p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-900/50 hover:border-zinc-800 transition-colors">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <Zap size={14} /> Access Network (OLT)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="Target OLT">
                <select required className="form-input" value={formData.olt_id} onChange={(e) => setFormData({...formData, olt_id: e.target.value})}>
                  <option value="">Select Hardware</option>
                  {olts.map(o => <option key={o.id} value={o.id}>{o.name} ({o.type})</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Router API">
                <select required className="form-input" value={formData.router_id} onChange={(e) => setFormData({...formData, router_id: e.target.value})}>
                  <option value="">Select Core Router</option>
                  {routers.map(r => <option key={r.id} value={r.id}>{r.name} - {r.ip_address}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="PON Port">
                <input type="text" required className="form-input" placeholder="1/1/1" value={formData.pon_port} onChange={(e) => setFormData({...formData, pon_port: e.target.value})} />
              </FormGroup>
              <FormGroup label="ONU ID">
                <input type="text" required className="form-input" placeholder="16" value={formData.onu_id} onChange={(e) => setFormData({...formData, onu_id: e.target.value})} />
              </FormGroup>
            </div>
          </div>

          {/* ODP Mapping Block */}
          <div className="space-y-8 p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-900/50 hover:border-zinc-800 transition-colors">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <Database size={14} /> Passive Infrastructure (ODP)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="ODP Cabinet">
                <select required className="form-input" value={formData.odp_id} onChange={(e) => setFormData({...formData, odp_id: e.target.value})}>
                  <option value="">Select ODP</option>
                  {odps.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="ODP Port">
                <input type="number" required min="1" max="128" className="form-input" value={formData.odp_port} onChange={(e) => setFormData({...formData, odp_port: parseInt(e.target.value)})} />
              </FormGroup>
              <div className="col-span-2">
                <FormGroup label="ONU Serial / MAC">
                  <input type="text" required className="form-input font-mono" placeholder="ZTEG12345678" value={formData.sn_mac} onChange={(e) => setFormData({...formData, sn_mac: e.target.value})} />
                </FormGroup>
              </div>
            </div>
          </div>

          {/* GIS Block */}
          <div className="space-y-8 p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-900/50 hover:border-zinc-800 transition-colors">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-3">
               <MapPin size={14} /> GIS Mapping
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <FormGroup label="Latitude">
                <input type="number" step="any" required className="form-input" placeholder="-6.123" value={formData.location_lat} onChange={(e) => setFormData({...formData, location_lat: parseFloat(e.target.value)})} />
              </FormGroup>
              <FormGroup label="Longitude">
                <input type="number" step="any" required className="form-input" placeholder="106.123" value={formData.location_long} onChange={(e) => setFormData({...formData, location_long: parseFloat(e.target.value)})} />
              </FormGroup>
              <div className="col-span-2">
                <FormGroup label="Installation Status RX (dBm)">
                  <input type="number" step="0.01" className="form-input bg-blue-600/5 border-blue-600/20 text-blue-500 font-black" placeholder="-19.00" value={formData.rx_installation} onChange={(e) => setFormData({...formData, rx_installation: parseFloat(e.target.value)})} />
                </FormGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900">
           <button 
             type="submit"
             disabled={loading}
             className="w-full h-20 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-black rounded-3xl transition-all duration-300 active:scale-[0.98] shadow-2xl flex items-center justify-center gap-4 text-sm uppercase tracking-widest italic"
           >
             {loading ? (
               <div className="w-6 h-6 border-4 border-zinc-800 border-t-black rounded-full animate-spin" />
             ) : (
               <>
                 <Smartphone size={20} />
                 Commit Provisioning to Hardware
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

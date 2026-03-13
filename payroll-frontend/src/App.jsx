import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

// --- Global Settings ---
const DASHBOARD_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

// --- Custom UI Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <motion.button 
    whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.03)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
      active 
      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
      : 'text-slate-500 hover:text-slate-200'
    }`}
  >
    <div className="flex items-center gap-3">
        <Icon size={18} className={active ? 'text-blue-400' : 'group-hover:text-blue-400'} />
        <span className="font-bold text-xs tracking-wide uppercase">{label}</span>
    </div>
    {active && <motion.div layoutId="active-pill" className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
  </motion.button>
);

const StatCard = ({ label, value, unit, icon: Icon, trend, color="blue" }) => {
    const colorClasses = {
        blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        amber: "text-amber-400 bg-amber-400/10 border-amber-400/20"
    };

    return (
        <motion.div variants={ITEM_VARIANTS} className="card-clean group">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl border ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/10">
                            {trend}
                        </span>
                    </div>
                )}
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <h4 className="text-3xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">{value}</h4>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{unit}</span>
            </div>
            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                />
            </div>
        </motion.div>
    );
};

function App() {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [empAddress, setEmpAddress] = useState("");
  const [empName, setEmpName] = useState("");
  const [salary, setSalary] = useState("");
  const [contractBal, setContractBal] = useState("0");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data Fetching logic remains similar but with better error handling
  const fetchData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, provider);
      const balance = await provider.getBalance(contractAddress);
      setContractBal(ethers.formatEther(balance));

      const count = await contract.getEmployeeCount();
      let tempEmployees = [];
      for (let i = 0; i < Number(count); i++) {
        const addr = await contract.employeeList(i);
        const details = await contract.employees(addr);
        tempEmployees.push({
          address: addr,
          name: details.name,
          salary: ethers.formatEther(details.salary),
          isActive: details.isActive
        });
      }
      setEmployees(tempEmployees);
    } catch (err) { console.error("Fetch Data Error:", err); }
  };

  const checkAdminStatus = async (userAddress) => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, provider);
      const owner = await contract.owner();
      setIsAdmin(userAddress.toLowerCase() === owner.toLowerCase());
    } catch (err) { console.error("Admin Check Error:", err); }
  };

  useEffect(() => {
    fetchData();
    if (account) checkAdminStatus(account);
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) { console.error("Wallet Connection Error", err); }
    } else { alert("Please install MetaMask!"); }
  };

  const addEmployee = async () => {
    if (!isAdmin) return alert("❌ Admin status required");
    if (!empName || !empAddress || !salary) return alert("All fields are required!");
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      const tx = await contract.addEmployee(empAddress, empName, ethers.parseEther(salary));
      await tx.wait();
      alert("✅ Employee Added!");
      fetchData();
    } catch (err) { alert("Transaction failed."); } finally { setLoading(false); }
  };

  const claimSalary = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      const tx = await contract.claimSalary();
      await tx.wait();
      alert("💰 Salary Claimed!");
      fetchData();
    } catch (err) { alert("Claim rejected."); } finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      {/* Dynamic Background */}
      <div className="mesh-gradient">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <Lucide.Menu size={24} />
      </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="px-4 mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Lucide.Cpu size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">D-PAYROLL</h1>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">Institutional</span>
            </div>
          </div>
        </div>

        <div className="px-2 mb-8">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 shimmer">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/5">
                        <Lucide.Briefcase size={14} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registry Unit</p>
                        <p className="text-xs font-bold text-slate-200">Mainnet-Alpha</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                        <span>Load Factor</span>
                        <span className="text-blue-400">42%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[42%] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
            </div>
        </div>

        <nav className="space-y-1.5 flex-1 px-2">
          <SidebarItem 
            icon={Lucide.Layout} 
            label="Overview" 
            active={activeTab === "overview"} 
            onClick={() => {setActiveTab("overview"); setIsSidebarOpen(false);}} 
          />
          <SidebarItem 
            icon={Lucide.Users2} 
            label="Nodes" 
            active={activeTab === "nodes"} 
            onClick={() => {setActiveTab("nodes"); setIsSidebarOpen(false);}} 
          />
          <SidebarItem 
            icon={Lucide.HardDrive} 
            label="Storage" 
            active={activeTab === "ledger"} 
            onClick={() => {setActiveTab("ledger"); setIsSidebarOpen(false);}} 
          />
        </nav>

        <div className="px-2 mt-auto border-t border-white/5 pt-6 space-y-4">
          {!account ? (
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <Lucide.Link2 size={16} />
              Hook Wallet
            </motion.button>
          ) : (
            <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-4 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Lucide.ShieldCheck size={20} />
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-bg-deep rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auth Verified</p>
                <p className="text-xs font-mono font-bold text-slate-300 truncate mt-0.5">
                  {account.slice(0, 4)}...{account.slice(-4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-12 gap-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-500/10">v4.0.1 Stable</span>
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Verified</span>
            </div>
            <h2 className="text-5xl xl:text-6xl font-black tracking-tighter text-white">System <span className="text-blue-500 italic">Nexus</span></h2>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-4 bg-white/[0.03] p-2 rounded-3xl border border-white/5"
          >
            <div className="flex -space-x-2 px-2">
                {[1,2,3].map(i => <div key={i} className="h-8 w-8 rounded-full border-2 border-bg-deep bg-slate-800" />)}
            </div>
            <div className="pr-4 py-1 border-l border-white/10 pl-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cluster Participants</p>
                <p className="text-sm font-black text-blue-400">128 Nodes</p>
            </div>
          </motion.div>
        </header>

        <motion.div 
          variants={DASHBOARD_VARIANTS}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label="Internal Treasury" value={contractBal} unit="ETH" icon={Lucide.Wallet2} trend="+12.4 ETH" />
                <StatCard label="Live Nodes" value={employees.length} unit="Active" icon={Lucide.Combine} color="emerald" />
                <StatCard label="Sync Cycle" value="30" unit="Days" icon={Lucide.RefreshCcw} color="amber" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-5 space-y-8">
                  <motion.section variants={ITEM_VARIANTS} className="card-clean relative">
                    {!isAdmin && account && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center rounded-[24px]">
                        <div className="bg-white/10 p-5 rounded-3xl mb-4 shadow-xl border border-white/10 animate-float-slow">
                          <Lucide.ShieldAlert size={32} className="text-white" />
                        </div>
                        <h4 className="font-black text-2xl text-white tracking-tighter">Auth Required</h4>
                        <p className="text-xs text-slate-400 mt-3 max-w-[240px] font-medium leading-relaxed">Identity verification failed. Governance privileges missing for this action.</p>
                      </div>
                    )}
                    <h3 className="text-2xl font-black mb-8 flex items-center gap-4 tracking-tighter">
                      <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-400 border border-blue-600/10">
                        <Lucide.HardDriveUpload size={20} />
                      </div>
                      Node Deployment
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Participant ID</label>
                        <input className="input-field" placeholder="01-NODE-ALPHA" onChange={(e) => setEmpName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Address</label>
                        <input className="input-field" placeholder="0x00...000" onChange={(e) => setEmpAddress(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Allocation Load</label>
                        <input className="input-field" placeholder="0.00 ETH" onChange={(e) => setSalary(e.target.value)} />
                      </div>
                      <button onClick={addEmployee} disabled={loading || !isAdmin} className="w-full btn-primary mt-6 py-4 disabled:opacity-30">
                        {loading ? "INITIALIZING..." : "EXECUTE DEPLOYMENT"}
                      </button>
                    </div>
                  </motion.section>

                  <motion.section variants={ITEM_VARIANTS} className="card-clean bg-emerald-600/[0.03] border-emerald-500/20 group">
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-4 text-emerald-400 tracking-tighter">
                      <div className="p-3 bg-emerald-400/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Lucide.Zap size={20} />
                      </div>
                      Instant Settlement
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-8 font-semibold">
                      Initiate immediate on-chain settlement for pending rewards. Multi-sig validation handled in background.
                    </p>
                    <button onClick={claimSalary} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      {loading ? "PROCESSING..." : "CLAIM REWARDS"}
                    </button>
                  </motion.section>
                </div>

                <div className="xl:col-span-7">
                  <motion.section variants={ITEM_VARIANTS} className="card-clean h-full min-h-[600px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-black tracking-tighter">Cluster Ledger</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Node Status</p>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-2xl border border-white/5">
                        <Lucide.Activity size={14} className="text-emerald-400" />
                        <span className="text-[11px] font-black text-white">{employees.length} Online</span>
                      </div>
                    </div>

                    <div className="premium-table-container flex-1">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Alias</th>
                            <th>Hash ID</th>
                            <th className="text-right">Allocation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {employees.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="py-32 text-center">
                                <Lucide.Layers size={48} className="mx-auto text-slate-800 mb-6 opacity-50" />
                                <p className="text-slate-600 font-black uppercase tracking-widest text-xs">No Nodes Discovered</p>
                              </td>
                            </tr>
                          ) : (
                            employees.map((emp, i) => (
                              <tr key={i} className="group transition-colors hover:bg-white/[0.01]">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="font-black text-slate-200 group-hover:text-blue-400 transition-colors uppercase text-sm tracking-tighter">{emp.name}</span>
                                    </div>
                                </td>
                                <td className="font-mono text-[10px] text-slate-500 font-bold tracking-widest">
                                  {emp.address.slice(0, 10)}...{emp.address.slice(-6)}
                                </td>
                                <td className="text-right">
                                  <div className="font-black text-white text-lg group-hover:scale-105 transition-transform origin-right">
                                    {emp.salary} <span className="text-[10px] text-blue-500 ml-1">ETH</span>
                                  </div>
                                  <div className="badge-status bg-white/[0.05] mt-2 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                    Verified Node
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.section>
                </div>
              </div>
            </>
          )}

          {activeTab === "nodes" && (
             <motion.div variants={ITEM_VARIANTS} className="card-clean py-20 text-center">
                <Lucide.Users2 size={48} className="mx-auto text-blue-500/20 mb-4" />
                <h3 className="text-2xl font-black">Node Intelligence</h3>
                <p className="text-slate-500 mt-2 font-bold tracking-widest uppercase text-[10px]">Neural monitoring arriving in next epoch.</p>
             </motion.div>
          )}

          {activeTab === "ledger" && (
             <motion.div variants={ITEM_VARIANTS} className="card-clean py-20 text-center">
                <Lucide.HardDrive size={48} className="mx-auto text-blue-500/20 mb-4" />
                <h3 className="text-2xl font-black">Immutable Storage</h3>
                <p className="text-slate-500 mt-2 font-bold tracking-widest uppercase text-[10px]">Synchronizing historical blocks...</p>
             </motion.div>
          )}
        </motion.div>

        <footer className="mt-20 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
             <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">Node Cluster: Stable-721</p>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Audit Report</span>
            <span className="hover:text-blue-500 cursor-pointer transition-colors">Support Registry</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

// --- Premium UI Components ---

const StatusPill = ({ label, colorClass = "bg-emerald-500" }) => (
  <div className="flex items-center gap-2 bg-white/5 border border-white/5 pl-2 pr-3 py-1 rounded-full backdrop-blur-md">
    <div className={`h-1.5 w-1.5 rounded-full ${colorClass} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
  </div>
);

const StatCard = ({ label, value, unit, icon: Icon, colorClass, gradient }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.01 }}
    className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group cursor-default"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
    <div className="flex justify-between items-start mb-6">
      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 group-hover:text-white transition-colors duration-500">
        <Icon size={20} />
      </div>
      <StatusPill label="Real-time" />
    </div>
    <div className="space-y-1">
      <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 block">{label}</span>
      <div className="flex items-baseline gap-2.5">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-5xl font-black tracking-tighter"
        >
          {value}
        </motion.span>
        <span className={`text-xs font-black uppercase tracking-widest ${colorClass}`}>{unit}</span>
      </div>
    </div>
  </motion.div>
);

const OnboardInput = ({ label, placeholder, icon: Icon, onChange }) => (
  <div className="space-y-3 group">
    <label className="text-[10px] font-black text-slate-500 uppercase ml-6 tracking-[0.3em] group-focus-within:text-blue-400 transition-colors uppercase">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        className="w-full bg-slate-900/40 border border-white/5 pl-14 pr-7 py-5 rounded-[30px] outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold placeholder:text-slate-700 text-slate-200" 
        placeholder={placeholder} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

function App() {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [empAddress, setEmpAddress] = useState("");
  const [empName, setEmpName] = useState("");
  const [salary, setSalary] = useState("");
  const [contractBal, setContractBal] = useState("0");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, provider);
      const balance = await provider.getBalance(contractAddress);
      setContractBal(ethers.formatEther(balance));

      const count = await contract.getEmployeeCount();
      let tempEmployees = [];
      for (let i = 0; i < count; i++) {
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
    <div className="min-h-screen bg-black text-white p-6 md:p-16 lg:p-24 selection:bg-emerald-500/30 font-sans tracking-tight">
      {/* 8-10s Looping Mesh Background */}
      <div className="mesh-gradient-bg">
        <div className="mesh-blob bg-blue-600/10 w-[60vw] h-[60vw] left-[-10%] top-[-10%]" />
        <div className="mesh-blob bg-emerald-600/10 w-[50vw] h-[50vw] right-[-5%] bottom-[-5%] delay-[2s]" />
        <div className="mesh-blob bg-indigo-600/5 w-[40vw] h-[40vw] top-[20%] right-[30%] delay-[4s]" />
      </div>

      <div className="max-w-7xl mx-auto z-10 relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-5">
               <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Lucide.Boxes size={34} className="text-black" />
               </div>
               <h1 className="text-6xl font-black italic tracking-tighter">D-PAYROLL</h1>
            </div>
            <p className="text-slate-500 font-bold text-xl leading-relaxed max-w-lg">
               The futuristic layer for <span className="text-slate-300">automated institutional payroll</span> settlement on Ethereum.
            </p>
          </motion.div>

          {!account ? (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet} 
              className="px-12 py-6 bg-white text-black rounded-[32px] font-black text-xl flex items-center gap-4 transition-all"
            >
              AUTH PROTOCOL
              <Lucide.ShieldCheck size={22} strokeWidth={3} />
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-6 glass-pill px-10 py-5 rounded-[40px]"
            >
              <div className="text-right">
                <span className="text-[10px] text-slate-550 font-black uppercase tracking-[0.3em] block mb-1">Authenticated Terminal</span>
                <span className="font-mono text-emerald-400 font-bold tracking-widest">{account.slice(0,6)}...{account.slice(-4)}</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-600 p-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Lucide.Binary size={24} className="text-white" />
              </div>
            </motion.div>
          )}
        </header>

        {/* Global Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-32">
          <StatCard label="Internal Treasury" value={contractBal} unit="ETH" icon={Lucide.Waves} colorClass="text-blue-500" gradient="from-blue-600 to-indigo-600" />
          <StatCard label="Personnel Nodes" value={employees.length} unit="Units" icon={Lucide.Cpu} colorClass="text-emerald-500" gradient="from-emerald-500 to-teal-600" />
          <div className="glass p-8 rounded-[40px] border border-white/5 flex items-center gap-6 group hover:border-emerald-500/20 transition-all">
            <div className="h-16 w-16 rounded-[22px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500">
               <Lucide.Activity size={32} />
            </div>
            <div className="space-y-1">
               <span className="text-[11px] font-black text-slate-550 uppercase tracking-[0.25em] block">Status Protocol</span>
               <span className="text-emerald-400 font-black tracking-tight text-[22px] flex items-center gap-2">
                  ENCRYPTED LIVE
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></div>
               </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Action Center - 5 cols */}
          <div className="lg:col-span-5 space-y-12">
            <section className="glass p-11 rounded-[50px] relative overflow-hidden group">
               {!isAdmin && account && (
                 <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-30 flex flex-col items-center justify-center p-14 text-center">
                    <div className="h-20 w-20 bg-white/5 border border-white/5 rounded-[24px] flex items-center justify-center mb-8 rotate-12 transition-transform hover:rotate-0">
                      <Lucide.Infinity size={36} className="text-slate-700" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tighter">Permission Denied</h3>
                    <p className="text-slate-500 text-lg mt-4 leading-relaxed font-medium">
                       Institutional onboarding requires Architect keys. Please re-authenticate via the core governance wallet.
                    </p>
                 </div>
               )}
               <div className="flex justify-between items-center mb-12">
                  <h3 className="text-3xl font-black flex items-center gap-5 tracking-tighter">
                    <Lucide.Zap size={28} className="text-emerald-400" />
                    Onboard Staff
                  </h3>
                  <div className="px-5 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Secure Module</div>
               </div>
               
               <div className="space-y-8">
                 {[
                   { label: "Personnel Identifier", placeholder: "e.g. Satoshi Nakamoto", icon: Lucide.User, set: setEmpName },
                   { label: "Public Receipt Key", placeholder: "0x...", icon: Lucide.Database, set: setEmpAddress },
                   { label: "Liquidity Stream (ETH)", placeholder: "0.20", icon: Lucide.Zap, set: setSalary }
                 ].map((field, i) => (
                   <OnboardInput key={i} label={field.label} placeholder={field.placeholder} icon={field.icon} onChange={field.set} />
                 ))}

                 <motion.button 
                    whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 60px rgba(16,185,129,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addEmployee} 
                    disabled={loading || !isAdmin} 
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 py-7 rounded-[32px] font-black text-xl shadow-xl shadow-emerald-500/10 transition-all mt-6"
                 >
                   {loading ? "COMMITTING SECURELY..." : "COMMENCE ONBOARDING"}
                 </motion.button>
               </div>
            </section>

            <motion.section 
               whileHover={{ scale: 1.02 }}
               className="bg-gradient-to-br from-blue-600/10 via-transparent to-transparent p-12 rounded-[50px] border border-blue-500/20 relative group overflow-hidden"
            >
               <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                  <Lucide.Cpu size={250} strokeWidth={1} />
               </div>
               <h3 className="text-3xl font-black mb-6 flex items-center gap-5 text-blue-400 tracking-tighter">
                  <Lucide.Database size={28} />
                  Staff Portal
               </h3>
               <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                  30-day epoch locked. Liquidate your earnings only after protocol validation.
               </p>
               <motion.button 
                 whileHover={{ scale: 1.02, x: 5 }}
                 onClick={claimSalary} 
                 disabled={loading} 
                 className="w-full bg-blue-600 py-7 rounded-[32px] font-black text-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-4 group"
               >
                 {loading ? "VALIDATING..." : "EXECUTE SETTLEMENT"}
                 <Lucide.ArrowUpRight size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
               </motion.button>
            </motion.section>
          </div>

          {/* Data Ledger - 7 cols */}
          <div className="lg:col-span-7">
            <section className="glass p-12 rounded-[60px] h-full flex flex-col hover:border-white/10 transition-all duration-700">
               <div className="flex items-center justify-between mb-16 px-4">
                  <h3 className="text-3xl font-black flex items-center gap-5 tracking-tighter">
                    <Lucide.ListTree size={28} className="text-slate-500" />
                    Ledger History
                  </h3>
                  <div className="bg-emerald-500/10 text-emerald-500 px-6 py-2.5 rounded-full border border-emerald-500/10 text-[10px] font-black uppercase tracking-[0.3em]">Institutional Grade</div>
               </div>

               <div className="space-y-6 flex-1 overflow-y-auto pr-4 custom-scrollbar max-h-[900px]">
                  <AnimatePresence>
                    {employees.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-48 border-2 border-dashed border-white/5 rounded-[50px] gap-8">
                        <div className="h-28 w-28 bg-white/5 rounded-[40px] flex items-center justify-center animate-bounce">
                           <Lucide.Ghost size={44} className="text-slate-800" />
                        </div>
                        <p className="text-slate-700 font-black uppercase tracking-[0.4em] text-sm">Waiting for Data Nodes</p>
                      </div>
                    ) : (
                      employees.map((emp, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="bg-white/5 border border-white/5 p-8 rounded-[40px] flex justify-between items-center group hover:bg-white/[0.08] hover:border-blue-500/30 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-7">
                             <div className="h-20 w-20 rounded-[28px] bg-gradient-to-br from-slate-900 to-black border border-white/10 flex items-center justify-center text-slate-700 transition-all duration-500 group-hover:text-blue-500 group-hover:border-blue-500/20 shadow-inner">
                                <Lucide.UserCircle size={40} strokeWidth={1.5} />
                             </div>
                             <div>
                                <p className="font-black text-2xl group-hover:text-white transition-colors">{emp.name}</p>
                                <p className="text-sm font-mono text-slate-500 mt-2 tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">{emp.address}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-4xl tracking-tighter">{emp.salary} <span className="text-xs text-emerald-500 uppercase italic ml-1 font-black">ETH</span></p>
                             <div className="flex items-center justify-end gap-3 mt-3">
                                <span className="text-[10px] font-black text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 rounded-xl uppercase tracking-[0.2em]">Active Settlement</span>
                             </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
               </div>
            </section>
          </div>
        </div>

        <footer className="mt-48 pb-20 border-t border-white/5 pt-16 flex flex-col lg:flex-row justify-between items-center gap-12 opacity-30 hover:opacity-100 transition-all duration-700">
           <div className="flex items-center gap-6">
              <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                 <Lucide.Atom size={20} />
              </div>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em]">Decentralized Payroll Architecture © 2026</p>
           </div>
           
           <div className="flex gap-16 items-center">
             {["Infrastructure", "Compliance", "API Protocol", "Network"].map((item, i) => (
               <span key={i} className="text-[11px] font-black uppercase tracking-[0.3em] cursor-pointer hover:text-emerald-500 transition-colors">{item}</span>
             ))}
           </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
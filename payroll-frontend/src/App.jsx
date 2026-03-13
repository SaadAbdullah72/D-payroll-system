import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

// --- Components ---

const BackgroundEffects = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        x: [0, 50, 0],
        y: [0, 30, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full" 
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        x: [0, -50, 0],
        y: [0, -30, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full" 
    />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
  </div>
);

const LandingPage = ({ onEnter }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -100 }}
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
         {[...Array(6)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute bg-white/5 rounded-full blur-xl"
             style={{
               width: Math.random() * 300 + 100,
               height: Math.random() * 300 + 100,
               left: `${Math.random() * 100}%`,
               top: `${Math.random() * 100}%`,
             }}
             animate={{
               y: [0, -40, 0],
               opacity: [0.1, 0.3, 0.1],
               scale: [1, 1.1, 1],
             }}
             transition={{
               duration: Math.random() * 10 + 10,
               repeat: Infinity,
               delay: Math.random() * 5,
             }}
           />
         ))}
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <span className="inline-block px-4 py-1.5 rounded-full glass text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
          The Future of Web3 Payroll
        </span>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-tight">
          SMART <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">STAFFING</span><br />
          FOR THE ON-CHAIN ERA
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Automate your organization's liquidity. Onboard employees, manage streaming salaries, 
          and secure your treasury with industry-leading encryption.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="px-10 py-5 bg-white text-black rounded-2xl font-black text-lg shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group"
          >
            Launch Terminal
            <Lucide.ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 glass rounded-2xl font-black text-lg hover:bg-white/5 transition-all"
          >
            Read Whitepaper
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-[1px] h-20 bg-gradient-to-b from-white/20 to-transparent"></div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Scroll Down</p>
      </motion.div>
    </motion.div>
  );
};

const Navbar = ({ account, onConnect }) => (
  <header className="flex justify-between items-center py-8 mb-12 relative z-50">
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-700 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-all">
        <Lucide.Wallet2 size={24} />
      </div>
      <h1 className="text-2xl font-black tracking-tighter italic">D-PAYROLL <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full not-italic tracking-normal ml-2 text-slate-400 border border-white/5 font-medium">PROTOCOL</span></h1>
    </div>
    
    {!account ? (
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onConnect} 
        className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm backdrop-blur-md"
      >
        Auth Wallet
      </motion.button>
    ) : (
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 pl-4 pr-2 py-1.5 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col items-end">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Authenticated</span>
           <span className="text-xs font-mono text-slate-300">{account.slice(0,6)}...{account.slice(-4)}</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 p-[1px]">
          <div className="h-full w-full rounded-xl bg-[#0a0a0b] flex items-center justify-center">
            <Lucide.User size={20} className="text-blue-400" />
          </div>
        </div>
      </div>
    )}
  </header>
);

const StatCard = ({ label, value, unit, icon: Icon, color = "blue" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-8 rounded-[40px] flex-1 relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-8 text-${color}-500/10 transition-transform group-hover:scale-125 duration-500`}>
      <Icon size={120} strokeWidth={1} />
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-5xl font-black tracking-tight">{value}</h2>
        <span className={`text-${color}-500 text-lg font-black italic`}>{unit}</span>
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-${color}-500 to-transparent w-0 group-hover:w-full transition-all duration-700`}></div>
  </motion.div>
);

// --- Main App ---

function App() {
  const [showLanding, setShowLanding] = useState(true);
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
    if (!isAdmin) return alert("❌ Access Denied: Admin privileges required.");
    if (!empName || !empAddress || !salary) return alert("All fields are required!");

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      
      const tx = await contract.addEmployee(empAddress, empName, ethers.parseEther(salary));
      await tx.wait();
      
      alert("✅ Staff Onboarded Successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Transaction Error. Check console.");
    } finally { setLoading(false); }
  };

  const claimSalary = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      
      const tx = await contract.claimSalary();
      await tx.wait();
      
      alert("💰 Salary Claimed Successfully!");
      fetchData();
    } catch (err) {
      alert("⏳ Transfer Restricted: Cooldown period active or unauthorized address.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen text-white relative font-sans">
      <BackgroundEffects />
      
      <AnimatePresence mode="wait">
        {showLanding ? (
          <LandingPage key="landing" onEnter={() => setShowLanding(false)} />
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-6 pb-20"
          >
            <Navbar account={account} onConnect={connectWallet} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <StatCard label="Internal Treasury" value={contractBal} unit="ETH" icon={Lucide.BarChart3} />
              <div className="glass-card p-8 rounded-[40px] flex items-center gap-6 lg:col-span-1">
                <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Lucide.ShieldCheck size={40} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Contract Status</p>
                  <p className="text-2xl font-black tracking-tight text-emerald-400">ENCRYPTED & LIVE</p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1">v1.2.4-stable-prod</p>
                </div>
              </div>
              <StatCard label="Total Personnel" value={employees.length} unit="NODES" icon={Lucide.Cpu} color="indigo" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
              {/* Left Column: Forms */}
              <div className="space-y-8">
                <section className="glass-card p-10 rounded-[50px] relative overflow-hidden group">
                  {!isAdmin && account && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-10">
                      <div className="h-20 w-20 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center mb-6">
                        <Lucide.Lock size={32} className="text-slate-500" />
                      </div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Access Restricted</h4>
                      <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                        Only the Protocol Architect can onboard new personnel to this treasury.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                        <Lucide.UserPlus size={20} />
                      </div>
                      Onboard Staff
                    </h3>
                    <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-3 py-1 rounded-full uppercase">Restricted API</span>
                  </div>

                  <div className="space-y-6">
                    {[
                      { label: "Full Name", placeholder: "e.g. Satoshi Nakamoto", value: empName, set: setEmpName },
                      { label: "Wallet Address", placeholder: "0x...", value: empAddress, set: setEmpAddress },
                      { label: "Annual Salary (ETH)", placeholder: "0.25", value: salary, set: setSalary }
                    ].map((field, i) => (
                      <div key={i} className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">{field.label}</label>
                        <input 
                          value={field.value}
                          onChange={(e) => field.set(e.target.value)}
                          className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-[24px] outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-700" 
                          placeholder={field.placeholder} 
                        />
                      </div>
                    ))}
                    
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addEmployee} 
                      disabled={loading || !isAdmin} 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 py-6 mt-4 rounded-3xl font-black text-lg shadow-xl shadow-blue-900/20 hover:shadow-blue-600/30 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                      {loading ? "EXECUTING TRANSACTION..." : "COMMENCE ONBOARDING"}
                    </motion.button>
                  </div>
                </section>

                <section className="bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 p-10 rounded-[50px] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 text-emerald-500/10 pointer-events-none">
                     <Lucide.Zap size={80} strokeWidth={1} />
                   </div>
                   <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4 mb-4 text-emerald-400">
                      <Lucide.Zap size={24}/> Payday Portal
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-sm">
                      Streaming salaries are locked via smart contract logic. Claims are permitted every 30 days based on individual performance metrics.
                   </p>
                   <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={claimSalary} 
                    disabled={loading} 
                    className="w-full bg-emerald-600 py-6 rounded-3xl font-black text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                   >
                    {loading ? "VERIFYING BLOCKCHAIN..." : "CLAIM LIQUIDITY"}
                   </motion.button>
                </section>
              </div>

              {/* Right Column: List */}
              <div className="space-y-8 h-full">
                <section className="glass-card p-10 rounded-[50px] h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4 text-slate-300">
                      <Lucide.Layers size={22}/> Staff Ledger
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Live On-Chain</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar max-h-[720px]">
                    {employees.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-white/5 rounded-[40px]">
                        <Lucide.Inbox size={48} className="text-slate-700 mb-6" />
                        <p className="text-slate-600 font-medium italic">No personnel found on the protocol ledger.</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {employees.map((emp, i) => (
                          <motion.div 
                            key={emp.address}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:bg-white/[0.08] hover:border-blue-500/20 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-5">
                              <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                                <Lucide.Activity size={24} />
                              </div>
                              <div>
                                <h4 className="font-black text-lg group-hover:text-white transition-colors">{emp.name}</h4>
                                <p className="text-[10px] font-mono text-slate-500 tracking-tighter">{emp.address}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black text-white">{emp.salary} <span className="text-[10px] text-blue-500 italic">ETH</span></p>
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Active Status</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      {!showLanding && (
        <footer className="max-w-7xl mx-auto px-6 py-10 flex border-t border-white/5 mt-20 justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[10px] font-bold uppercase tracking-widest">Distributed Ledger System © 2026</p>
           <div className="flex gap-6">
              <span className="text-[10px] font-bold cursor-pointer hover:text-blue-400 transition-colors">Github</span>
              <span className="text-[10px] font-bold cursor-pointer hover:text-blue-400 transition-colors">Documentation</span>
              <span className="text-[10px] font-bold cursor-pointer hover:text-blue-400 transition-colors">Support</span>
           </div>
        </footer>
      )}
    </div>
  );
}

export default App;
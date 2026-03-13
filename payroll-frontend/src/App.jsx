import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

const StatCard = ({ label, value, unit, icon: Icon, colorClass }) => (
  <div className="glass p-7 rounded-[32px] border border-white/5 flex flex-col gap-3 transition-all hover:border-white/10 group cursor-default">
    <div className="flex items-center gap-2.5 text-slate-500 group-hover:text-slate-400 transition-colors">
      <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5`}>
        <Icon size={14} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
    </div>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-4xl font-black tracking-tight">{value}</span>
      <span className={`text-xs font-black uppercase tracking-widest ${colorClass}`}>{unit}</span>
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
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-14 lg:p-20 font-sans selection:bg-blue-500/30">
      {/* Refined subtle background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full opacity-60"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full opacity-60"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter italic flex items-center gap-4">
              <div className="bg-white text-black p-2.5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <Lucide.Wallet2 size={32} />
              </div>
              D-PAYROLL
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md">Enterprise-grade decentralized payroll management for the decentralized future.</p>
          </div>

          {!account ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connectWallet} 
              className="px-10 py-5 bg-white text-black rounded-3xl font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.08)] hover:bg-slate-200 transition-all flex items-center gap-3 active:shadow-inner"
            >
              Auth Network
              <Lucide.Zap size={18} className="fill-black" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-5 bg-white/5 border border-white/10 px-8 py-4 rounded-[32px] backdrop-blur-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Authenticated</span>
                <span className="text-sm font-mono font-bold text-blue-400">{account.slice(0,6)}...{account.slice(-4)}</span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20">
                <Lucide.Fingerprint size={22} />
              </div>
            </div>
          )}
        </header>

        {/* Executive Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <StatCard label="Internal Treasury" value={contractBal} unit="ETH" icon={Lucide.BarChart3} colorClass="text-blue-500" />
          <StatCard label="Personnel Nodes" value={employees.length} unit="Members" icon={Lucide.Cpu} colorClass="text-indigo-500" />
          <div className="glass p-7 rounded-[32px] border border-white/5 flex items-center gap-5 transition-all hover:border-emerald-500/20 group">
             <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Lucide.ShieldCheck size={28} />
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-[0.15em] block">Status Protocol</span>
                <span className="text-emerald-400 font-black tracking-tight text-lg">ENCRYPTED LIVE</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Action Modules */}
          <div className="space-y-10">
            <section className="glass p-10 rounded-[48px] border border-white/5 relative overflow-hidden transition-all hover:border-white/10">
               {!isAdmin && account && (
                 <div className="absolute inset-0 bg-black/85 backdrop-blur-lg z-20 flex flex-col items-center justify-center p-12 text-center ring-1 ring-white/10 rounded-[48px]">
                    <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                      <Lucide.Lock size={28} className="text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Access Restricted</h3>
                    <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-xs">
                       Administrative privileges are required for personnel onboarding. Please authenticate with the Architect wallet.
                    </p>
                 </div>
               )}
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-4">
                    <Lucide.UserPlus2 size={24} className="text-blue-500" />
                    Onboard Staff
                  </h3>
                  <span className="text-[9px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">Protocol-Level</span>
               </div>
               <div className="space-y-6">
                 {[
                   { label: "Personel Name", placeholder: "e.g. Saad Abdullah", set: setEmpName },
                   { label: "Public Receipt Address", placeholder: "0x...", set: setEmpAddress },
                   { label: "Monthly Liquidity (ETH)", placeholder: "0.25", set: setSalary }
                 ].map((field, i) => (
                   <div key={i} className="space-y-2.5">
                     <label className="text-[10px] font-black text-slate-500 uppercase ml-5 tracking-[0.2em]">{field.label}</label>
                     <input 
                       className="w-full bg-slate-900/50 border border-white/5 p-5 rounded-[24px] outline-none focus:border-blue-500/40 focus:bg-slate-900 transition-all font-medium placeholder:text-slate-700" 
                       placeholder={field.placeholder} 
                       onChange={(e)=>field.set(e.target.value)} 
                     />
                   </div>
                 ))}
                 <motion.button 
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={addEmployee} 
                    disabled={loading || !isAdmin} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 py-6 rounded-[28px] font-black text-lg hover:shadow-[0_15px_40px_rgba(37,99,235,0.2)] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale mt-4"
                 >
                   {loading ? "COMMITTING TO CHAIN..." : "COMMENCE ONBOARDING"}
                 </motion.button>
               </div>
            </section>

            <section className="bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent p-10 rounded-[48px] border border-emerald-500/15 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 text-emerald-500/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <Lucide.Zap size={100} strokeWidth={1} />
               </div>
               <h3 className="text-2xl font-black mb-5 flex items-center gap-4 text-emerald-400">
                 <Lucide.CreditCard size={24} />
                 Staff Portal
               </h3>
               <p className="text-slate-400 text-sm mb-10 leading-relaxed max-w-sm">
                 Claims are locked to 30-day settlement cycles. Ensure you are authenticated with the signature address registered on the protocol.
               </p>
               <motion.button 
                 whileHover={{ scale: 1.01 }}
                 whileTap={{ scale: 0.99 }}
                 onClick={claimSalary} 
                 disabled={loading} 
                 className="w-full bg-emerald-600/90 py-6 rounded-[28px] font-black text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/10 active:scale-95 flex items-center justify-center gap-3"
               >
                 {loading ? "VERIFYING SETTLEMENT..." : "EXECUTE SETTLEMENT"}
                 <Lucide.ArrowUpRight size={18} />
               </motion.button>
            </section>
          </div>

          {/* Data Ledger */}
          <section className="glass p-10 rounded-[48px] border border-white/5 h-full flex flex-col transition-all hover:border-white/10">
            <div className="flex items-center justify-between mb-12">
               <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 text-slate-300">
                 <Lucide.Layers2 size={24} className="text-indigo-400" />
                 Ledger History
               </h3>
               <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                 <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">On-Chain</span>
               </div>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto pr-3 custom-scrollbar max-h-[750px]">
              {employees.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[40px] gap-6 group">
                  <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12">
                     <Lucide.Inbox size={32} className="text-slate-700" />
                  </div>
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Ledger Empty</p>
                </div>
              ) : (
                employees.map((emp, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 border border-white/5 p-6 rounded-[32px] flex justify-between items-center group hover:bg-white/[0.08] hover:border-blue-500/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center text-slate-600 transition-colors group-hover:text-blue-400">
                        <Lucide.User size={24} />
                      </div>
                      <div>
                        <p className="font-black text-lg group-hover:text-white transition-colors">{emp.name}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 tracking-tighter">{emp.address.slice(0,25)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-2xl tracking-tighter">{emp.salary} <span className="text-xs text-blue-500 font-black italic ml-1">ETH</span></p>
                      <div className="flex items-center justify-end gap-2 mt-1.5">
                         <span className="text-[9px] font-black text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 rounded-lg uppercase tracking-widest">Active Settlement</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 hover:opacity-100 transition-opacity pb-10">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Decentralized Payroll Architecture © 2026</p>
            <div className="flex gap-10 items-center">
               <span className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors">Documentation</span>
               <span className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors">API System</span>
               <span className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors">Network Status</span>
            </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
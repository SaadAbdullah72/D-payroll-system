import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

const StatCard = ({ label, value, unit, icon: Icon, colorClass }) => (
  <div className={`glass p-6 rounded-3xl border border-white/5 flex flex-col gap-2`}>
    <div className="flex items-center gap-2 text-slate-400">
      <Icon size={16} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-black">{value}</span>
      <span className={`text-sm font-bold uppercase ${colorClass}`}>{unit}</span>
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
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6 md:p-12 font-sans selection:bg-blue-500/30">
      {/* Light background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Lucide.Wallet2 size={24} />
              </div>
              D-PAYROLL
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Simplified Decentralized Payroll Management</p>
          </div>

          {!account ? (
            <button onClick={connectWallet} className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/5">
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Account</span>
                <span className="text-xs font-mono text-blue-400">{account.slice(0,6)}...{account.slice(-4)}</span>
              </div>
              <Lucide.CheckCircle2 className="text-emerald-500" size={20} />
            </div>
          )}
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard label="Vault Balance" value={contractBal} unit="ETH" icon={Lucide.PieChart} colorClass="text-blue-500" />
          <StatCard label="Total Staff" value={employees.length} unit="Members" icon={Lucide.Users} colorClass="text-indigo-500" />
          <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Lucide.ShieldCheck size={24} />
             </div>
             <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Network Status</span>
                <span className="text-emerald-500 font-bold">Mainnet Secure</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Main Controls */}
          <div className="space-y-8">
            <section className="glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
               {!isAdmin && account && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center ring-1 ring-white/10 rounded-[40px]">
                    <Lucide.Lock size={40} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold">Admin Privileges Required</h3>
                    <p className="text-slate-500 text-sm mt-2">Connect with the contract owner address to manage staff.</p>
                 </div>
               )}
               <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                 <Lucide.PlusCircle size={24} className="text-blue-500" />
                 Add New Employee
               </h3>
               <div className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-4 tracking-widest">Name</label>
                   <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" placeholder="Full Name" onChange={(e)=>setEmpName(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-4 tracking-widest">Wallet</label>
                   <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" placeholder="0x..." onChange={(e)=>setEmpAddress(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase ml-4 tracking-widest">Salary (ETH)</label>
                   <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium" placeholder="0.05" onChange={(e)=>setSalary(e.target.value)} />
                 </div>
                 <button onClick={addEmployee} disabled={loading || !isAdmin} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                   {loading ? "Adding..." : "Confirm Onboarding"}
                 </button>
               </div>
            </section>

            <section className="bg-emerald-600/5 p-8 rounded-[40px] border border-emerald-500/10">
               <h3 className="text-2xl font-black mb-4 flex items-center gap-3 text-emerald-500">
                 <Lucide.Zap size={24} />
                 Staff Portal
               </h3>
               <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                 Claim your salary every 30 days. Make sure you are using your registered wallet address.
               </p>
               <button onClick={claimSalary} disabled={loading} className="w-full bg-emerald-600 py-5 rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                 {loading ? "Verifying..." : "Claim Monthly Salary"}
               </button>
            </section>
          </div>

          {/* Employee List */}
          <section className="glass p-8 rounded-[40px] border border-white/5 h-fit">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-300">
              <Lucide.LayoutList size={24} />
              Payroll Ledger
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {employees.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-slate-600 italic">
                  No personnel registered yet.
                </div>
              ) : (
                employees.map((emp, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                    <div>
                      <p className="font-bold text-lg group-hover:text-blue-400 transition-colors">{emp.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">{emp.address.slice(0,18)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl">{emp.salary} <span className="text-xs text-blue-500">ETH</span></p>
                      <span className="text-[9px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="mt-20 py-10 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Decentralized Payroll Protocol © 2026</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
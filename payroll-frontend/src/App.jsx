import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

function App() {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [empAddress, setEmpAddress] = useState("");
  const [empName, setEmpName] = useState("");
  const [salary, setSalary] = useState("");
  const [contractBal, setContractBal] = useState("0");
  const [loading, setLoading] = useState(false);

  // 1. Contract se Balance aur Employee List uthana
  const fetchData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, provider);
      
      // Balance fetch
      const balance = await provider.getBalance(contractAddress);
      setContractBal(ethers.formatEther(balance));

      // Employee List fetch
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
    } catch (err) {
      console.error("Fetch Data Error:", err);
    }
  };

  // 2. Admin Check Logic (Case Insensitive)
  const checkAdminStatus = async (userAddress) => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, provider);
      const owner = await contract.owner();
      // Dono addresses ko lowercase karke compare karna zaroori hai
      setIsAdmin(userAddress.toLowerCase() === owner.toLowerCase());
    } catch (err) {
      console.error("Admin Check Error:", err);
    }
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
    } else {
      alert("Please install MetaMask!");
    }
  };

  const addEmployee = async () => {
    if (!isAdmin) return alert("❌ Access Denied: Only Admin (Contract Owner) can add employees.");
    if (!empName || !empAddress || !salary) return alert("All fields are required!");

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      
      const tx = await contract.addEmployee(empAddress, empName, ethers.parseEther(salary));
      await tx.wait();
      
      alert("✅ Success: Employee Onboarded!");
      fetchData(); // List update karein
    } catch (err) {
      console.error(err);
      alert("Transaction Failed! Check console for details.");
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
      
      alert("💰 Success: Salary Transferred!");
      fetchData();
    } catch (err) {
      alert("⏳ Access Denied: 30 days not passed or you are not a registered employee.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans selection:bg-blue-500/30">
      {/* Visual Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Navbar */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-700 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Lucide.Wallet2 size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic">D-PAYROLL <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full not-italic tracking-normal ml-2 text-slate-400 border border-white/5 font-medium">V1.0</span></h1>
          </div>
          
          {!account ? (
            <button onClick={connectWallet} className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 shadow-xl shadow-white/5">
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 pl-4 pr-2 py-1.5 rounded-2xl">
              <span className="text-xs font-mono text-slate-400">{account.slice(0,6)}...{account.slice(-4)}</span>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500"></div>
            </div>
          )}
        </header>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 bg-white/[0.03] border border-white/5 p-8 rounded-[40px] backdrop-blur-md">
            <p className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Vault Liquidity</p>
            <div className="text-5xl font-bold flex items-baseline gap-2">
              {contractBal} <span className="text-blue-500 text-xl font-black italic">ETH</span>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Lucide.ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
              <p className="text-emerald-400 font-black tracking-tight text-lg">ENCRYPTED & LIVE</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Admin Panel */}
          <section>
            <div className="bg-[#121214] border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
              {!isAdmin && account && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6">
                  <Lucide.Lock size={40} className="mb-4 text-slate-500" />
                  <p className="font-bold text-slate-300">ADMIN ACCESS REQUIRED</p>
                  <p className="text-xs text-slate-500 mt-2">Only the contract creator can manage staff.</p>
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Lucide.UserPlus size={18} />
                </div>
                Onboard Staff
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Full Name</label>
                  <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Saad Abdullah" onChange={(e)=>setEmpName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Wallet Address</label>
                  <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors" placeholder="0x..." onChange={(e)=>setEmpAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Salary Amount (ETH)</label>
                  <input className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500 transition-colors" placeholder="0.05" onChange={(e)=>setSalary(e.target.value)} />
                </div>
                <button onClick={addEmployee} disabled={loading || !isAdmin} className="w-full bg-blue-600 py-4 mt-4 rounded-2xl font-black hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? "COMMITTING..." : "REGISTER EMPLOYEE"}
                </button>
              </div>
            </div>
          </section>

          {/* Right Side: Portal & List */}
          <div className="space-y-8">
            {/* Claim Portal */}
            <section className="bg-gradient-to-br from-emerald-600/20 to-transparent border border-emerald-500/10 p-8 rounded-[40px]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-emerald-500">
                <Lucide.Zap size={20}/> Employee Portal
              </h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">Smart contract logic: Payouts are only enabled every 30 days for registered wallet addresses.</p>
              <button onClick={claimSalary} disabled={loading} className="w-full bg-emerald-600 py-4 rounded-2xl font-black hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-600/20">
                {loading ? "VERIFYING..." : "CLAIM SALARY"}
              </button>
            </section>

            {/* Employee List */}
            <section className="bg-white/[0.02] border border-white/5 p-8 rounded-[40px]">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-400">
                <Lucide.Users size={18}/> Active Staff List
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {employees.length === 0 ? (
                  <div className="text-center py-10 text-slate-600 border-2 border-dashed border-white/5 rounded-3xl text-sm italic">
                    No records found on-chain
                  </div>
                ) : (
                  employees.map((emp, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-blue-500/30 transition-colors">
                      <div>
                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{emp.name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{emp.address.slice(0,12)}...{emp.address.slice(-10)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white">{emp.salary} ETH</p>
                        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Active</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
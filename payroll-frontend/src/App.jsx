import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Stable Imports
import * as Lucide from 'lucide-react'; 
import { motion } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

function App() {
  const [account, setAccount] = useState(null);
  const [empAddress, setEmpAddress] = useState("");
  const [empName, setEmpName] = useState("");
  const [salary, setSalary] = useState("");
  const [contractBal, setContractBal] = useState("0");
  const [loading, setLoading] = useState(false);

  const updateBalance = async () => {
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const balance = await provider.getBalance(contractAddress);
      setContractBal(ethers.formatEther(balance));
    } catch (err) { console.error("Balance Error:", err); }
  };

  useEffect(() => { 
    updateBalance(); 
    const interval = setInterval(updateBalance, 10000); // Har 10 sec baad update
    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) { console.error("Wallet Error:", err); }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const addEmployee = async () => {
    try {
      if (!empName || !empAddress || !salary) return alert("Fields missing!");
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, PayrollABI.abi, signer);
      const tx = await contract.addEmployee(empAddress, empName, ethers.parseEther(salary));
      await tx.wait();
      alert("✅ Employee Added!");
    } catch (err) {
      alert("❌ Error: Check if you are Admin");
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
      alert("💰 Salary Claimed!");
      updateBalance();
    } catch (err) {
      alert("⏳ Access Denied: 30 days not passed or insufficient funds.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-sans overflow-x-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl">
               <Lucide.Coins size={28} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">D-PAYROLL</h1>
          </div>
          
          {!account ? (
            <button onClick={connectWallet} className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-slate-200 transition">
              Connect Wallet
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-blue-400 font-mono text-sm">
              {account.slice(0,6)}...{account.slice(-4)}
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl lg:col-span-2">
            <span className="text-slate-500 text-sm">Total Vault Liquidity</span>
            <div className="text-4xl font-bold mt-1">{contractBal} <span className="text-blue-500 text-lg">ETH</span></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
             <Lucide.ShieldCheck className="text-emerald-500" size={40} />
             <div>
               <div className="text-sm text-slate-500">Protocol Status</div>
               <div className="font-bold text-emerald-500">SECURE & LIVE</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Admin */}
          <div className="bg-[#121214] border border-white/5 p-8 rounded-[32px] shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Lucide.UserPlus size={20} className="text-blue-500"/> Admin Panel</h3>
            <div className="space-y-4">
              <input className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500" placeholder="Employee Name" onChange={(e)=>setEmpName(e.target.value)} />
              <input className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500" placeholder="Wallet Address" onChange={(e)=>setEmpAddress(e.target.value)} />
              <input className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-blue-500" placeholder="Salary (ETH)" onChange={(e)=>setSalary(e.target.value)} />
              <button onClick={addEmployee} disabled={loading} className="w-full bg-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
                {loading ? "Confirming..." : "Onboard Staff"}
              </button>
            </div>
          </div>

          {/* Employee */}
          <div className="bg-[#121214] border border-white/5 p-8 rounded-[32px] shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-500"><Lucide.Zap size={20}/> Employee Portal</h3>
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mb-12">
              <p className="text-sm text-slate-400">Claims are processed automatically. Smart contract enforces a 30-day payout window.</p>
            </div>
            <button onClick={claimSalary} disabled={loading} className="w-full bg-emerald-600 py-4 rounded-2xl font-bold hover:bg-emerald-500 transition shadow-xl shadow-emerald-600/20">
              {loading ? "Processing..." : "CLAIM SALARY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
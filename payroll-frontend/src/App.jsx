import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

// --- Professional Dashboard Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'group-hover:text-blue-400'} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const MetricCard = ({ label, value, unit, icon: Icon, trend }) => (
  <div className="card-clean space-y-4">
    <div className="flex justify-between items-start">
      <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <h4 className="text-3xl font-bold tracking-tight">{value}</h4>
        <span className="text-xs font-bold text-slate-500 lowercase">{unit}</span>
      </div>
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
  const [activeTab, setActiveTab] = useState("dashboard");

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
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Lucide.LayoutDashboard size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">D-PAYROLL</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem 
            icon={Lucide.PieChart} 
            label="Dashboard" 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <SidebarItem 
            icon={Lucide.Users} 
            label="Personnel" 
            active={activeTab === "personnel"} 
            onClick={() => setActiveTab("personnel")} 
          />
          <SidebarItem 
            icon={Lucide.History} 
            label="Ledger" 
            active={activeTab === "ledger"} 
            onClick={() => setActiveTab("ledger")} 
          />
        </nav>

        <div className="pt-8 border-t border-white/5 space-y-4">
          {!account ? (
            <button 
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Lucide.Wallet size={18} />
              Connect Wallet
            </button>
          ) : (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Lucide.User size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Authenticated</p>
                <p className="text-xs font-mono font-bold text-slate-300 truncate">{account}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
            <p className="text-slate-400 mt-1">Institutional-grade payroll settlement network.</p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full border border-emerald-500/10 text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Network Live
          </div>
        </header>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard label="Internal Treasury" value={contractBal} unit="ETH" icon={Lucide.Database} trend="+2.4%" />
          <MetricCard label="Active Personnel" value={employees.length} unit="Nodes" icon={Lucide.Cpu} />
          <MetricCard label="Settlement Cycle" value="30" unit="Days" icon={Lucide.RefreshCcw} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Action Modules */}
          <div className="xl:col-span-4 space-y-8">
            <section className="card-clean relative overflow-hidden">
              {!isAdmin && account && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 text-center">
                  <Lucide.Lock size={32} className="text-slate-600 mb-4" />
                  <h4 className="font-bold text-slate-200">Admin Required</h4>
                  <p className="text-xs text-slate-500 mt-2">Personnel onboarding is restricted to governance wallets.</p>
                </div>
              )}
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Lucide.UserPlus size={20} className="text-blue-500" />
                Onboard Personnel
              </h3>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Full Name</label>
                  <input className="input-field" placeholder="e.g. Satoshi Nakamoto" onChange={(e) => setEmpName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Wallet Address</label>
                  <input className="input-field" placeholder="0x..." onChange={(e) => setEmpAddress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Monthly Salary (ETH)</label>
                  <input className="input-field" placeholder="0.25" onChange={(e) => setSalary(e.target.value)} />
                </div>
                <button 
                  onClick={addEmployee}
                  disabled={loading || !isAdmin}
                  className="w-full btn-primary disabled:opacity-50 mt-2"
                >
                  {loading ? "Processing..." : "Add Personnel"}
                </button>
              </div>
            </section>

            <section className="card-clean bg-emerald-500/5 border-emerald-500/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-500">
                <Lucide.CreditCard size={20} />
                Portal Access
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Claim registered earnings for the current epoch. Settlement requires protocol validation.
              </p>
              <button 
                onClick={claimSalary}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Execute Claim"}
              </button>
            </section>
          </div>

          {/* Data Ledger */}
          <div className="xl:col-span-8">
            <section className="card-clean h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold">Personnel Ledger</h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-900 px-3 py-1 rounded-md">Total Records: {employees.length}</span>
              </div>

              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-white/5 pb-4">
                      <th className="font-semibold pb-4">Name</th>
                      <th className="font-semibold pb-4">Wallet Address</th>
                      <th className="font-semibold pb-4 text-right">Salary</th>
                      <th className="font-semibold pb-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center text-slate-600 italic">No personnel nodes found on the registry.</td>
                      </tr>
                    ) : (
                      employees.map((emp, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 font-bold text-slate-200">{emp.name}</td>
                          <td className="py-4 font-mono text-xs text-slate-500">{emp.address.slice(0,20)}...</td>
                          <td className="py-4 text-right font-bold text-blue-400">{emp.salary} ETH</td>
                          <td className="py-4 text-right">
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-wider">Active</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-slate-500">
          <p className="text-xs uppercase tracking-[0.2em] font-bold">Protocol v2.4.0-Stable</p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors">Audit</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-white cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
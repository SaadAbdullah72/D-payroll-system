import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contractAddress } from './contractAddress';
import PayrollABI from './PayrollABI.json';

// --- Improved Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }) => (
  <motion.button 
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
      : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    <Icon size={20} className={active ? 'text-blue-500' : 'group-hover:text-blue-400'} />
    <span className="font-semibold text-sm">{label}</span>
  </motion.button>
);

const MetricCard = ({ label, value, unit, icon: Icon, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card-clean"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/10">
        <Icon size={22} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10">
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1.5 mt-2">
      <h4 className="text-3xl font-bold tracking-tight text-white">{value}</h4>
      <span className="text-xs font-bold text-slate-500 uppercase">{unit}</span>
    </div>
  </motion.div>
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
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Lucide.Menu size={24} />
      </button>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
            <Lucide.Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">D-PAYROLL</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Core Network</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <SidebarItem 
            icon={Lucide.LayoutGrid} 
            label="Overview" 
            active={activeTab === "dashboard"} 
            onClick={() => {setActiveTab("dashboard"); setIsSidebarOpen(false);}} 
          />
          <SidebarItem 
            icon={Lucide.Users} 
            label="Employees" 
            active={activeTab === "personnel"} 
            onClick={() => {setActiveTab("personnel"); setIsSidebarOpen(false);}} 
          />
          <SidebarItem 
            icon={Lucide.ShieldCheck} 
            label="Governance" 
            active={activeTab === "ledger"} 
            onClick={() => {setActiveTab("ledger"); setIsSidebarOpen(false);}} 
          />
        </nav>

        <div className="pt-6 border-t border-white/5 space-y-4">
          {!account ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/10"
            >
              <Lucide.Wallet size={18} />
              Connect Wallet
            </motion.button>
          ) : (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Lucide.Fingerprint size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Identity Check</p>
                <p className="text-sm font-mono font-medium text-slate-300 truncate mt-1">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-white">System Protocol</h2>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
              On-chain payroll orchestration and distribution layer.
            </p>
          </div>
          <div className="bg-emerald-500/5 text-emerald-500 px-5 py-2.5 rounded-2xl border border-emerald-500/10 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3">
            <Lucide.Globe size={14} />
            Sepolia Testnet
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard label="Treasury Balance" value={contractBal} unit="ETH" icon={Lucide.Target} trend="+512.2%" />
                <MetricCard label="Node Participants" value={employees.length} unit="Nodes" icon={Lucide.Database} />
                <MetricCard label="Epoch Duration" value="30" unit="Days" icon={Lucide.Clock} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-5 space-y-8">
                  <section className="card-clean relative">
                    {!isAdmin && account && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center rounded-3xl">
                        <div className="bg-white/10 p-4 rounded-full mb-4">
                          <Lucide.Lock size={28} className="text-white" />
                        </div>
                        <h4 className="font-bold text-xl text-white">Access Restricted</h4>
                        <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Node registration is limited to governance authorized wallets.</p>
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Lucide.UserPlus size={18} />
                      </div>
                      Register Node
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alias Name</label>
                        <input className="input-field" placeholder="e.g. CORE_UNIT_01" onChange={(e) => setEmpName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Node Address</label>
                        <input className="input-field" placeholder="0x..." onChange={(e) => setEmpAddress(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Allocated (ETH)</label>
                        <input className="input-field" placeholder="0.00" onChange={(e) => setSalary(e.target.value)} />
                      </div>
                      <button 
                        onClick={addEmployee}
                        disabled={loading || !isAdmin}
                        className="w-full btn-primary mt-4 disabled:opacity-20"
                      >
                        {loading ? "Transacting..." : "Initialize Node"}
                      </button>
                    </div>
                  </section>

                  <section className="card-clean border-emerald-500/20 bg-emerald-500/[0.02]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-emerald-500">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Lucide.Download size={18} />
                      </div>
                      Reward Withdrawal
                    </h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">
                      Execute treasury call to pull registered rewards. All distributions are logged on the immutable ledger.
                    </p>
                    <button 
                      onClick={claimSalary}
                      disabled={loading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/10"
                    >
                      {loading ? "Verifying..." : "Pull Rewards"}
                    </button>
                  </section>
                </div>

                <div className="xl:col-span-7">
                  <section className="card-clean overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Protocol Nodes</h3>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{employees.length} Entries</span>
                      </div>
                    </div>

                    <div className="premium-table-container">
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Participant Alias</th>
                            <th>Verification Address</th>
                            <th className="text-right">Allocation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="py-20 text-center">
                                <Lucide.Inbox size={40} className="mx-auto text-slate-800 mb-4" />
                                <p className="text-slate-600 font-bold italic">No active nodes registered.</p>
                              </td>
                            </tr>
                          ) : (
                            employees.map((emp, i) => (
                              <tr key={i}>
                                <td className="font-bold text-slate-200">{emp.name}</td>
                                <td className="font-mono text-xs text-slate-500">
                                  {emp.address.slice(0, 12)}...{emp.address.slice(-6)}
                                </td>
                                <td className="text-right">
                                  <div className="font-black text-blue-400">{emp.salary} ETH</div>
                                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Pending Sync</div>
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
            </motion.div>
          )}

          {activeTab === "personnel" && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-clean py-20 text-center">
                <Lucide.Users size={48} className="mx-auto text-blue-500/20 mb-4" />
                <h3 className="text-2xl font-bold">Node Management</h3>
                <p className="text-slate-500 mt-2">Enhanced personnel controls arriving in next epoch.</p>
             </motion.div>
          )}

          {activeTab === "ledger" && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-clean py-20 text-center">
                <Lucide.History size={48} className="mx-auto text-blue-500/20 mb-4" />
                <h3 className="text-2xl font-bold">On-chain Ledger</h3>
                <p className="text-slate-500 mt-2">Historical data indexing in progress.</p>
             </motion.div>
          )}
        </AnimatePresence>

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
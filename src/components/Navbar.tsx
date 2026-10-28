import React from 'react';
import { 
  ShieldCheck, 
  Plus, 
  RefreshCw, 
  Compass, 
  Vote, 
  FileCheck, 
  Sliders, 
  Activity,
  Layers,
  Coins,
  RotateCcw
} from 'lucide-react';
import { Web3Account } from '../types/blockchain';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentAccount: Web3Account;
  onOpenCreateModal: () => void;
  onOpenPersonaModal: () => void;
  onResetSimulation?: () => void;
  blockNumber: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentAccount,
  onOpenCreateModal,
  onOpenPersonaModal,
  onResetSimulation,
  blockNumber
}) => {
  const navItems = [
    { id: 'campaigns', label: 'Campaigns & Causes', icon: Compass },
    { id: 'milestones', label: 'Milestones & Governance', icon: Vote },
    { id: 'audit', label: 'Immutable Audit Trail', icon: FileCheck },
    { id: 'security', label: 'Multi-Chain Protocol & Architecture', icon: Sliders }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 h-16">
          {/* Brand & Multi-Chain Status Beacon */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('campaigns')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 group-hover:border-teal-300 transition-colors shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-bold font-display tracking-tight text-slate-900 whitespace-nowrap">
                  CharityChain
                </span>
                {/* Active Multi-Chain Status Beacon with tooltip */}
                <div className="tooltip-group">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse cursor-pointer inline-block" />
                  <div className="tooltip-panel absolute top-full mt-2 left-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-mono rounded shadow-lg whitespace-nowrap">
                    Smart Contract Online · Block #{blockNumber}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Iconic Navigation Bar with Instant Tooltips */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="tooltip-group">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    aria-label={item.label}
                    className={`p-2 sm:px-3 sm:py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs border border-teal-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden lg:inline text-xs font-medium">
                      {item.id === 'campaigns' ? 'Campaigns' : item.id === 'milestones' ? 'Milestones' : item.id === 'audit' ? 'Audit' : 'Protocol'}
                    </span>
                  </button>

                  {/* Instant Tooltip for All Screens */}
                  <div className="tooltip-panel absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap font-sans">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Account Trigger & Iconic Create Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Account Switcher with Role Glyph */}
            <div className="tooltip-group">
              <button
                onClick={onOpenPersonaModal}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-all text-xs cursor-pointer shadow-xs"
              >
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-teal-600 font-mono font-bold text-xs uppercase shadow-xs">
                  {currentAccount.role[0]}
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-slate-900 font-semibold truncate max-w-[100px] leading-tight">
                    {currentAccount.name.split(' ')[0]}
                  </div>
                  <div className="text-teal-600 font-mono tabular-nums text-[11px] font-bold">
                    {currentAccount.balanceEth.toFixed(2)} ETH
                  </div>
                </div>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-teal-600 transition-colors" />
              </button>

              <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] rounded-md shadow-md whitespace-nowrap font-sans">
                <div className="font-semibold">{currentAccount.name} ({currentAccount.role})</div>
                <div className="text-slate-300 font-mono text-[10px]">{currentAccount.address.slice(0, 10)}...{currentAccount.address.slice(-6)}</div>
              </div>
            </div>

            {/* Reset Simulation Preset Button with Tooltip */}
            {onResetSimulation && (
              <div className="tooltip-group">
                <button
                  onClick={onResetSimulation}
                  aria-label="Reset simulation to initial state"
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/70 text-slate-500 hover:text-amber-700 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-sans rounded-md shadow-md whitespace-nowrap">
                  Reset Simulation to Factory Defaults
                </div>
              </div>
            )}

            {/* Start Campaign Action */}
            <div className="tooltip-group">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Start Campaign</span>
              </button>

              <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap font-sans">
                Deploy New Cause to Escrow
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

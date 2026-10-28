import React, { useState } from 'react';
import { X, Check, Wallet, Copy, Shield, Users, Building, AlertCircle, RefreshCw, LogOut, Sparkles } from 'lucide-react';
import { Web3Account } from '../types/blockchain';
import { blockchain } from '../services/blockchainEngine';
import { CONTRACT_ADDRESS } from '../contracts/TransparentCharityContract';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Web3Account[];
  currentAccount: Web3Account;
  onSelectAccount: (account: Web3Account) => void;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccount,
  onSelectAccount
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [metaMaskLoading, setMetaMaskLoading] = useState(false);
  const [metaMaskError, setMetaMaskError] = useState<string | null>(null);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  if (!isOpen) return null;

  const isMetaMaskCurrent = currentAccount.role === 'metamask' || blockchain.isMetaMaskActive();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConnectMetaMask = async () => {
    if (metaMaskLoading) return;
    setMetaMaskLoading(true);
    setMetaMaskError(null);
    try {
      await blockchain.connectMetaMask();
      onClose();
    } catch (err: any) {
      setMetaMaskError(err.message || "Failed to connect to MetaMask");
    } finally {
      setMetaMaskLoading(false);
    }
  };

  const handleDisconnect = () => {
    blockchain.disconnectMetaMask();
  };

  const handleTopUp = (amount: number = 5.0) => {
    blockchain.topUpDemoBalance(amount);
    setFaucetSuccess(true);
    setTimeout(() => setFaucetSuccess(false), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Shield className="w-4 h-4 text-amber-600" />;
      case 'donor':
        return <Users className="w-4 h-4 text-teal-600" />;
      case 'vendor':
        return <Building className="w-4 h-4 text-blue-600" />;
      default:
        return <Wallet className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">Switch Account Role</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Test donor voting, vendor settlement, or connect your browser Web3 wallet
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Smart Contract Address */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-medium font-sans">Smart Contract Escrow Address</span>
            </div>
            <div className="flex items-center justify-between font-mono text-slate-800">
              <span className="truncate pr-2">{CONTRACT_ADDRESS}</span>
              <button
                onClick={() => handleCopy(CONTRACT_ADDRESS)}
                className="text-slate-500 hover:text-teal-700 shrink-0 p-1 cursor-pointer"
                title="Copy address"
              >
                {copied === CONTRACT_ADDRESS ? (
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Current Active Wallet & Test Faucet */}
          <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200 text-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 font-mono">
                Active Account Balance
              </div>
              <div className="font-mono text-sm font-bold text-teal-900 mt-0.5 tabular-nums">
                {currentAccount.balanceEth.toFixed(4)} ETH
              </div>
            </div>
            <button
              onClick={() => handleTopUp(5.0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{faucetSuccess ? 'Added +5.0 ETH!' : 'Add +5.0 Test ETH'}</span>
            </button>
          </div>

          {/* Account Cards */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Pre-Funded Demo Accounts
            </div>

            {accounts.map((acc) => {
              const isSelected = acc.id === currentAccount.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    onSelectAccount(acc);
                    onClose();
                  }}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(acc.role)}
                      <span className="text-sm font-semibold text-slate-900">{acc.name}</span>
                      <span className="text-[11px] text-slate-500 capitalize">
                        ({acc.role})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-teal-700 tabular-nums">
                        {acc.balanceEth.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-2 font-sans">{acc.description}</p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                    <span className="truncate pr-2">{acc.address}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(acc.address);
                      }}
                      className="text-slate-400 hover:text-teal-700 cursor-pointer"
                      title="Copy Address"
                    >
                      {copied === acc.address ? (
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Browser Web3 / MetaMask Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono mb-2">
              External Web3 Wallet
            </div>

            {isMetaMaskCurrent ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>MetaMask Connected</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Disconnect</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-700 truncate">
                  {currentAccount.address}
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={handleConnectMetaMask}
                  disabled={metaMaskLoading}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>{metaMaskLoading ? 'Connecting to Browser Wallet...' : 'Connect MetaMask / Browser Web3'}</span>
                </button>

                {metaMaskError && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-800">Connection Notice</div>
                        <p className="text-[11px] mt-0.5 leading-relaxed">{metaMaskError}</p>
                      </div>
                    </div>
                    {metaMaskError.includes("pending") && (
                      <button
                        onClick={handleConnectMetaMask}
                        className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Check Pending Approval</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

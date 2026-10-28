import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, Coins } from 'lucide-react';
import { Campaign, Web3Account } from '../types/blockchain';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  currentAccount: Web3Account;
  onConfirmDonation: (campaignId: number, amountEth: number) => Promise<void>;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  campaign,
  currentAccount,
  onConfirmDonation
}) => {
  const [amount, setAmount] = useState<string>('1.0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !campaign) return null;

  const quickAmounts = ['0.5', '1.0', '2.5', '5.0'];

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter an amount greater than 0 ETH.");
      return;
    }

    if (numAmount > currentAccount.balanceEth) {
      setError(`Insufficient balance. You have ${currentAccount.balanceEth.toFixed(4)} ETH.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirmDonation(campaign.id, numAmount);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process donation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Donate to Escrow</h3>
              <p className="text-xs text-slate-500 font-sans truncate max-w-[240px]">{campaign.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDonate} className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 font-sans">Donation Amount</span>
              <span className="font-mono text-slate-500">
                Wallet Balance: <strong className="text-teal-700 tabular-nums">{currentAccount.balanceEth.toFixed(4)} ETH</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:border-teal-500 tabular-nums pr-16 shadow-xs"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-slate-500">
                ETH
              </span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2">
            {quickAmounts.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(q)}
                className={`flex-1 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                  amount === q
                    ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                +{q} ETH
              </button>
            ))}
          </div>

          {/* Safety Guarantee */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg text-xs flex items-center gap-2 text-teal-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="text-[11px] leading-relaxed">
              Locked safely in smart contract escrow. Released only after donors approve vendor bills.
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Confirming On-Chain...</span>
              ) : (
                <span>Deposit {amount ? `${amount} ETH` : ''}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

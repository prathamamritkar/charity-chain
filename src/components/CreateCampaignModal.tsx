import React, { useState } from 'react';
import { X, AlertCircle, Plus, ShieldCheck } from 'lucide-react';
import { Web3Account } from '../types/blockchain';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: Web3Account;
  onCreateCampaign: (
    title: string,
    description: string,
    category: string,
    beneficiaryName: string,
    targetEth: number,
    durationDays: number
  ) => Promise<void>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onCreateCampaign
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Healthcare & Medical Aid');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [targetEth, setTargetEth] = useState('5.0');
  const [durationDays, setDurationDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Healthcare & Medical Aid',
    'Clean Water & Rural Infrastructure',
    'Education & Welfare',
    'Emergency Relief',
    'Community Infrastructure'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetEth);
    const duration = parseInt(durationDays, 10);

    if (!title.trim() || !description.trim() || !beneficiaryName.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (isNaN(target) || target <= 0) {
      setError("Goal must be greater than 0 ETH.");
      return;
    }

    if (isNaN(duration) || duration <= 0) {
      setError("Duration must be at least 1 day.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreateCampaign(title, description, category, beneficiaryName, target, duration);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Start New Cause</h3>
              <p className="text-xs text-slate-500 font-sans">Lock funds in escrow with milestone consensus</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Campaign Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solar Borewell Clean Water Initiative"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Sector / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Beneficiary Organization
              </label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="e.g. Gramin Vikas Foundation"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Fundraising Goal (ETH)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={targetEth}
                onChange={(e) => setTargetEth(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Campaign Purpose & Spending Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail how funds will be spent and what itemized invoices will be submitted for donor voting..."
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg text-xs flex items-center gap-2 text-teal-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="text-[11px] leading-relaxed">
              Target and description hashes are cryptographically pinned to the blockchain contract.
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
                <span>Deploying Escrow...</span>
              ) : (
                <span>Deploy Campaign</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

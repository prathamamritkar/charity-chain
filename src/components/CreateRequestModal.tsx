import React, { useState } from 'react';
import { X, AlertCircle, FileCheck, ShieldCheck } from 'lucide-react';
import { Campaign, Web3Account } from '../types/blockchain';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  currentAccount: Web3Account;
  onCreateRequest: (
    campaignId: number,
    description: string,
    vendorAddress: string,
    vendorName: string,
    amountEth: number,
    invoiceText: string
  ) => Promise<void>;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  campaign,
  currentAccount,
  onCreateRequest
}) => {
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('Biomedical Equipments India Ltd');
  const [vendorAddress, setVendorAddress] = useState('0x90F79bf6EB2c4f870365E785982E1f101E93b906');
  const [amountEth, setAmountEth] = useState('2.5');
  const [invoiceText, setInvoiceText] = useState('Invoice #INV-2026-4491: 5x Medical Grade Multipara Monitors with 2-year warranty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !campaign) return null;

  const availableBalance = campaign.totalDonatedEth - campaign.totalSpentEth;

  const defaultVendors = [
    { name: 'Biomedical Equipments India Ltd', address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' },
    { name: 'Apex Solar & Water Drilling Corp', address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df' },
    { name: 'Community Medical Supply Co', address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountEth);

    if (!description.trim() || !vendorName.trim() || !vendorAddress.trim() || !invoiceText.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be greater than 0 ETH.");
      return;
    }

    if (amount > availableBalance) {
      setError(`Amount (${amount} ETH) exceeds available escrow balance (${availableBalance.toFixed(2)} ETH).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreateRequest(campaign.id, description, vendorAddress, vendorName, amount, invoiceText);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create spending request.");
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
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Submit Milestone Bill</h3>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Escrow Balance Available */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-600 font-sans">Available Escrow Pool:</span>
            <span className="font-mono font-bold text-teal-700 tabular-nums">
              {availableBalance.toFixed(2)} ETH
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Expense Item Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Procurement of 3x ICU Mechanical Ventilators (Batch A)"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Select Verified Vendor
            </label>
            <div className="space-y-1.5 mb-2">
              {defaultVendors.map((v) => (
                <button
                  type="button"
                  key={v.address}
                  onClick={() => {
                    setVendorName(v.name);
                    setVendorAddress(v.address);
                  }}
                  className={`w-full p-2 text-left rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    vendorAddress.toLowerCase() === v.address.toLowerCase()
                      ? 'bg-teal-50 border-teal-500 text-teal-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium truncate">{v.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 ml-2">{v.address.slice(0, 6)}...{v.address.slice(-4)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                Payment Amount (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={availableBalance}
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Vendor Wallet Address (Receiving Account)
            </label>
            <input
              type="text"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
              Invoice Content / Raw Receipt Text
            </label>
            <textarea
              rows={2}
              value={invoiceText}
              onChange={(e) => setInvoiceText(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg text-xs flex items-center gap-2 text-teal-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
            <span className="text-[11px] leading-relaxed">
              A cryptographic Keccak-256 fingerprint of this invoice is computed and anchored on-chain.
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
                <span>Submitting to Blockchain...</span>
              ) : (
                <span>Submit for Voting</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

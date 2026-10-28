import React, { useState } from 'react';
import { ShieldCheck, Code2, Copy, Check, ChevronDown, ChevronUp, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { SOLIDITY_SOURCE_CODE, PROTOCOL_FAQ } from '../contracts/TransparentCharityContract';

export const ProtocolSecurityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'code' | 'security'>('faq');
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SOLIDITY_SOURCE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">Security Guarantees & Fund Protection</h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Smart contract rules ensuring donations only disburse directly to verified vendors after donor vote.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fund Protections
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contract Code
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {PROTOCOL_FAQ.map((item, idx) => {
            const isExpanded = expandedQ === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setExpandedQ(isExpanded ? null : idx)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm text-slate-900 font-display">
                    {item.q}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-sans">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Security & Fund Protections */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display">Non-Custodial Escrow</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Neither the campaign creator nor any platform admin can directly withdraw donor funds. Funds only exit the contract when paid directly to a verified supplier after a majority vote.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display">50% Majority Consensus</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Each donor votes with weight proportional to their contribution. A vendor payout is cryptographically locked until over 50% of the active campaign stake votes to approve.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display">Automated Donor Refunds</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              If a campaign fails to reach its funding target by its deadline timestamp, the contract permits any donor to invoke <code>claimRefund()</code> to reclaim 100% of their deposited ETH.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Contract Source Code */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400">contracts/TransparentCharity.sol (Solidity ^0.8.20)</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <div className="p-5 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-slate-300 leading-relaxed">
              <code>{SOLIDITY_SOURCE_CODE}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

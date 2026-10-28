import React, { useState } from 'react';
import { Lock, ThumbsUp, Send, Users, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface EscrowFlowDiagramProps {
  totalDonatedEth: number;
  totalEscrowLockedEth: number;
  totalDisbursedEth: number;
  totalMilestonesCount: number;
}

export const EscrowFlowDiagram: React.FC<EscrowFlowDiagramProps> = ({
  totalDonatedEth,
  totalEscrowLockedEth,
  totalDisbursedEth,
  totalMilestonesCount
}) => {
  const [selectedNode, setSelectedNode] = useState<number>(1);

  const nodes = [
    {
      id: 0,
      title: '1. Donors Give ETH',
      subtitle: 'Wallet Deposit',
      icon: Users,
      metric: `${totalDonatedEth.toFixed(2)} ETH`,
      metricLabel: 'Total Inflow',
      borderColor: 'border-teal-200',
      bgColor: 'bg-teal-50/70',
      textColor: 'text-teal-800',
      activeRing: 'ring-2 ring-teal-500',
      summary: 'Donors contribute funds directly into the campaign escrow. Voting rights are recorded on-chain proportional to contribution weight.'
    },
    {
      id: 1,
      title: '2. Locked in Escrow',
      subtitle: 'Smart Contract Vault',
      icon: Lock,
      metric: `${totalEscrowLockedEth.toFixed(2)} ETH`,
      metricLabel: 'Guarded in Contract',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/70',
      textColor: 'text-amber-800',
      activeRing: 'ring-2 ring-amber-500',
      summary: 'Capital remains locked inside the autonomous contract vault. Organizers cannot withdraw or divert funds to private accounts.'
    },
    {
      id: 2,
      title: '3. Donor Quorum Vote',
      subtitle: '>50% Consensus Gate',
      icon: ThumbsUp,
      metric: `${totalMilestonesCount} Invoices`,
      metricLabel: 'Milestone Bills',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50/70',
      textColor: 'text-blue-800',
      activeRing: 'ring-2 ring-blue-500',
      summary: 'Before releasing any payment, the organizer submits an itemized supplier invoice. Donors verify receipts and cast cryptographic votes.'
    },
    {
      id: 3,
      title: '4. Direct Vendor Settlement',
      subtitle: 'Zero Intermediaries',
      icon: Send,
      metric: `${totalDisbursedEth.toFixed(2)} ETH`,
      metricLabel: 'Paid to Suppliers',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/70',
      textColor: 'text-emerald-800',
      activeRing: 'ring-2 ring-emerald-500',
      summary: 'Upon reaching consensus (>50%), payment transfers directly to the verified supplier address. Settlement hashes are anchored irrevocably.'
    }
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 transition-all shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
            Escrow Money Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any phase to inspect how donor funds are protected and verified.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Escrow</span>
        </div>
      </div>

      {/* 4-Step Visual Flow Track - Responsive 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {nodes.map((node, idx) => {
          const Icon = node.icon;
          const isSelected = selectedNode === node.id;

          return (
            <div key={node.id} className="relative group">
              <button
                onClick={() => setSelectedNode(node.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? `${node.bgColor} ${node.borderColor} ${node.activeRing} shadow-sm`
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white shadow-xs' : 'bg-white border border-slate-200'} ${node.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Step 0{node.id + 1}
                  </span>
                </div>

                <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5 font-display">
                  {node.title}
                </div>
                <div className="text-[11px] text-slate-500 mb-2 font-sans">
                  {node.subtitle}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between font-mono">
                  <span className="text-[10px] text-slate-500">{node.metricLabel}</span>
                  <span className={`text-xs font-bold tabular-nums ${node.textColor}`}>{node.metric}</span>
                </div>
              </button>

              {/* Connecting Chevron Arrow - only when arranged horizontally in 4 cols */}
              {idx < 3 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 shadow-xs">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Step Explanation Card */}
      <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 font-sans">{nodes[selectedNode].title}: </span>
            <span className="text-slate-600 font-sans">{nodes[selectedNode].summary}</span>
          </div>
        </div>

        <div className="shrink-0 font-mono text-[11px] text-slate-500 flex items-center gap-1.5 self-end sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Non-Custodial Guarantee</span>
        </div>
      </div>
    </div>
  );
};

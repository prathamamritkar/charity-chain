import React from 'react';
import { Clock, ShieldCheck, Coins, Vote, RotateCcw, Check, Lock, CheckCircle2 } from 'lucide-react';
import { Campaign, Web3Account } from '../types/blockchain';

interface CampaignCardProps {
  campaign: Campaign;
  currentAccount: Web3Account;
  onDonate: (campaign: Campaign) => void;
  onViewMilestones: (campaign: Campaign) => void;
  onClaimRefund: (campaignId: number) => void;
  onVerifyHash: (hash: string, title: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  currentAccount,
  onDonate,
  onViewMilestones,
  onClaimRefund,
  onVerifyHash
}) => {
  const percentFunded = Math.min(100, (campaign.totalDonatedEth / campaign.targetAmountEth) * 100);
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= campaign.deadlineTimestamp;
  const isTargetMet = campaign.totalDonatedEth >= campaign.targetAmountEth;
  const userDonation = campaign.donations[currentAccount.address] || 0;
  const availableEscrow = Math.max(0, campaign.totalDonatedEth - campaign.totalSpentEth);
  const daysRemaining = Math.max(0, Math.ceil((campaign.deadlineTimestamp - now) / 86400));

  const spentPercent = Math.min(100, (campaign.totalSpentEth / campaign.targetAmountEth) * 100);
  const escrowPercent = Math.min(100 - spentPercent, (availableEscrow / campaign.targetAmountEth) * 100);

  // SVG Circular Gauge calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentFunded / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between group h-full">
      {/* Top Section */}
      <div className="flex-1 flex flex-col">
        {/* Uniform Top Row: Category & Beneficiary on Left, Aligned Status Badge on Right */}
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              {campaign.category}
            </span>
            <span className="text-xs text-slate-500 truncate" title={campaign.beneficiaryName}>
              {campaign.beneficiaryName}
            </span>
          </div>

          {/* Time Remaining Badge - Pixel-perfect, identically positioned on EVERY card */}
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="tabular-nums">{isExpired ? 'Ended' : `${daysRemaining}d left`}</span>
          </div>
        </div>

        {/* Title & Circular Mini Gauge Header - Consistent 2-line height */}
        <div className="flex items-start justify-between gap-3 mb-2 min-h-[2.85rem]">
          <h3 
            className="text-base font-bold font-display text-slate-900 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2"
            title={campaign.title}
          >
            {campaign.title}
          </h3>

          {/* Circular Funding Gauge */}
          <div className="tooltip-group shrink-0">
            <div className="relative w-11 h-11 flex items-center justify-center cursor-pointer">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 52 52">
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  className="stroke-teal-600 transition-all duration-700"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono font-bold text-[10px] text-slate-800 tabular-nums">
                {percentFunded.toFixed(0)}%
              </span>
            </div>

            <div className="tooltip-panel absolute top-full mt-1 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-mono rounded shadow-md whitespace-nowrap">
              {campaign.totalDonatedEth.toFixed(2)} / {campaign.targetAmountEth.toFixed(2)} ETH Funded
            </div>
          </div>
        </div>

        {/* Description - Standardized 2-line clamp */}
        <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed font-sans h-9">
          {campaign.description}
        </p>

        {/* High-Contrast Financial Gauge Panel */}
        <div className="space-y-2 mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-lg mt-auto">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <div>
              <span className="text-teal-700 font-bold text-sm tabular-nums">
                {campaign.totalDonatedEth.toFixed(2)} ETH
              </span>
              <span className="text-slate-500 text-[11px] ml-1">
                of {campaign.targetAmountEth.toFixed(2)} ETH target
              </span>
            </div>
            <span className="text-slate-500 text-[11px] font-medium font-sans">
              Escrow Protected
            </span>
          </div>

          {/* Segmented Visual Progress Bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
            {/* Paid directly to suppliers */}
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${spentPercent}%` }}
              title={`Disbursed: ${campaign.totalSpentEth.toFixed(2)} ETH`}
            />
            {/* Guarded in Escrow */}
            <div
              className="bg-teal-600 h-full transition-all duration-500"
              style={{ width: `${escrowPercent}%` }}
              title={`In Escrow: ${availableEscrow.toFixed(2)} ETH`}
            />
          </div>

          {/* Breakdown Indicators */}
          <div className="flex justify-between items-center text-[11px] font-mono pt-0.5">
            <span className="flex items-center gap-1.5 text-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              <span>In Escrow: {availableEscrow.toFixed(2)} ETH</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Paid Out: {campaign.totalSpentEth.toFixed(2)} ETH</span>
            </span>
          </div>
        </div>

        {/* Milestone Steps Visual Indicator - Clean inline badges without horizontal scrollbar */}
        <div className="flex items-center justify-between gap-2 p-2.5 mb-4 bg-white rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-medium text-slate-500 shrink-0">Bills:</span>
            <div className="flex items-center gap-1.5 flex-wrap py-0.5">
              {campaign.requests.length === 0 ? (
                <span className="text-[11px] text-slate-400 font-sans">None yet</span>
              ) : (
                <>
                  {campaign.requests.slice(0, 4).map((req) => (
                    <div key={req.id} className="tooltip-group shrink-0">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold cursor-pointer transition-transform hover:scale-110 ${
                          req.executed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : req.approvalPercentage > 50
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {req.executed ? <Check className="w-3 h-3" /> : req.id + 1}
                      </div>

                      <div className="tooltip-panel absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-md whitespace-nowrap font-sans">
                        #{req.id + 1}: {req.vendorName} ({req.amountEth} ETH) · {req.executed ? 'Paid' : `${req.approvalPercentage.toFixed(0)}% votes`}
                      </div>
                    </div>
                  ))}
                  {campaign.requests.length > 4 && (
                    <button
                      onClick={() => onViewMilestones(campaign)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
                      title="View all milestone bills"
                    >
                      +{campaign.requests.length - 4}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Cryptographic Hash Anchor Button with Tooltip */}
          <div className="tooltip-group shrink-0 ml-auto">
            <button
              onClick={() => onVerifyHash(campaign.metadataHash, campaign.title)}
              className="flex items-center gap-1 font-mono text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Verify Hash</span>
            </button>

            <div className="tooltip-panel absolute bottom-full mb-1.5 right-0 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-md whitespace-nowrap font-mono">
              On-chain proposal hash
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="tooltip-group">
          <button
            onClick={() => onViewMilestones(campaign)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[34px]"
          >
            <Vote className="w-3.5 h-3.5 text-slate-600" />
            <span>Milestones ({campaign.requests.length})</span>
          </button>
          <div className="tooltip-panel absolute top-full mt-1.5 left-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
            Inspect itemized bills and cast approval votes
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refund button if eligible */}
          {isExpired && !isTargetMet && userDonation > 0 && (
            <div className="tooltip-group">
              <button
                onClick={() => onClaimRefund(campaign.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer min-h-[34px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Claim Refund</span>
              </button>
              <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
                Withdraw {userDonation.toFixed(2)} ETH (Target not met by deadline)
              </div>
            </div>
          )}

          {/* Primary Donate Action with Tooltip */}
          <div className="tooltip-group">
            <button
              onClick={() => onDonate(campaign)}
              disabled={isExpired}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer min-h-[34px] ${
                isExpired
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Donate</span>
            </button>
            <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
              Lock funds in smart contract escrow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

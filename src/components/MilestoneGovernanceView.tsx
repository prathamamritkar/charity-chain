import React, { useState } from 'react';
import { CheckCircle2, FileCheck, ThumbsUp, Send, Plus, Users, ShieldAlert, Check, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { Campaign, Web3Account } from '../types/blockchain';

interface MilestoneGovernanceViewProps {
  campaigns: Campaign[];
  currentAccount: Web3Account;
  onVote: (campaignId: number, requestId: number) => void;
  onExecutePayment: (campaignId: number, requestId: number) => void;
  onOpenCreateRequest: (campaign: Campaign) => void;
  onVerifyHash: (hash: string, description: string) => void;
}

export const MilestoneGovernanceView: React.FC<MilestoneGovernanceViewProps> = ({
  campaigns,
  currentAccount,
  onVote,
  onExecutePayment,
  onOpenCreateRequest,
  onVerifyHash
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(campaigns[0]?.id || 1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'executed'>('all');
  const [executingRequestId, setExecutingRequestId] = useState<number | null>(null);
  const [votingRequestId, setVotingRequestId] = useState<number | null>(null);

  const handleVoteClick = async (campaignId: number, requestId: number) => {
    if (votingRequestId !== null) return;
    setVotingRequestId(requestId);
    try {
      await onVote(campaignId, requestId);
    } finally {
      setVotingRequestId(null);
    }
  };

  const handleDisburseClick = async (campaignId: number, requestId: number) => {
    if (executingRequestId !== null) return;
    setExecutingRequestId(requestId);
    try {
      await onExecutePayment(campaignId, requestId);
    } finally {
      setExecutingRequestId(null);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];
  const userDonation = selectedCampaign ? (selectedCampaign.donations[currentAccount.address] || 0) : 0;
  const isOrganizer = selectedCampaign && selectedCampaign.organizer.toLowerCase() === currentAccount.address.toLowerCase();

  const requests = selectedCampaign ? selectedCampaign.requests : [];
  const pendingRequests = requests.filter(r => !r.executed && r.approvalPercentage <= 50);
  const approvedRequests = requests.filter(r => !r.executed && r.approvalPercentage > 50);
  const executedRequests = requests.filter(r => r.executed);

  const displayedRequests = requests.filter(r => {
    if (filterStatus === 'pending') return !r.executed && r.approvalPercentage <= 50;
    if (filterStatus === 'approved') return !r.executed && r.approvalPercentage > 50;
    if (filterStatus === 'executed') return r.executed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Campaign Selector */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900">Milestone Governance & Vendor Payouts</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
              <span className="text-teal-700 font-bold">
                {(selectedCampaign.totalDonatedEth - selectedCampaign.totalSpentEth).toFixed(2)} ETH in escrow
              </span>
              {userDonation > 0 && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>Your voting weight: <strong className="text-slate-900">{userDonation.toFixed(2)} ETH ({((userDonation / selectedCampaign.totalDonatedEth) * 100).toFixed(0)}%)</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Campaign Selector & Create Expense Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
              aria-label="Select campaign"
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500 cursor-pointer font-sans shadow-xs max-w-full"
            >
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  #{camp.id}: {camp.title.slice(0, 36)}...
                </option>
              ))}
            </select>

            {isOrganizer && (
              <div className="tooltip-group">
                <button
                  onClick={() => onOpenCreateRequest(selectedCampaign)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-xs min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Milestone Bill</span>
                </button>
                <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
                  Attach supplier invoice and submit for donor voting
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scalable Filter Tabs for Bills */}
        {requests.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-4 border-t border-slate-100 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              All Bills ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              Voting Open ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'approved'
                  ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              Approved ({approvedRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('executed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterStatus === 'executed'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              Disbursed ({executedRequests.length})
            </button>
          </div>
        )}
      </div>

      {/* Expense Requests Grid */}
      {selectedCampaign && requests.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-xs">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold font-display text-slate-800">No Expense Requests Submitted Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-sans">
            The organizer has not submitted any vendor invoices for this campaign yet.
          </p>
          {isOrganizer && (
            <button
              onClick={() => onOpenCreateRequest(selectedCampaign)}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer font-sans shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Invoice</span>
            </button>
          )}
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl p-8 text-center shadow-xs">
          <p className="text-xs text-slate-500 font-sans">
            No milestone bills matching the selected filter.
          </p>
          <button
            onClick={() => setFilterStatus('all')}
            className="mt-3 text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
          >
            Show all bills
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map((request) => {
            const hasVoted = request.voters.includes(currentAccount.address.toLowerCase());
            const isApproved = request.approvalPercentage > 50;

            return (
              <div
                key={request.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-teal-400 hover:shadow-xs transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Vendor & Invoice Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700">
                        Milestone #{request.id + 1}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {request.vendorName}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {request.vendor.slice(0, 8)}...{request.vendor.slice(-6)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-sans leading-relaxed">
                      {request.description}
                    </p>

                    {/* Cryptographic Hash Badge with Tooltip */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="tooltip-group">
                        <button
                          onClick={() => onVerifyHash(request.invoiceHash, request.invoiceText || request.description)}
                          className="flex items-center gap-1.5 text-[11px] font-mono text-teal-700 hover:text-teal-900 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>Invoice Hash: {request.invoiceHash.slice(0, 14)}...</span>
                        </button>
                        <div className="tooltip-panel absolute bottom-full mb-1 left-0 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-md whitespace-nowrap font-mono">
                          Verify Immutable Invoice Hash On-Chain
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {request.voters.length} donor {request.voters.length === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount, Visual Consensus Split Gauge & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 lg:gap-8 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {/* Amount & Status */}
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {request.amountEth.toFixed(2)} ETH
                      </div>
                      <div className="text-[11px]">
                        {request.executed ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 sm:justify-end">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disbursed
                          </span>
                        ) : isApproved ? (
                          <span className="text-teal-700 font-semibold flex items-center gap-1 sm:justify-end">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Approved
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1 sm:justify-end">
                            <Lock className="w-3 h-3 text-amber-600" /> Voting Open
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Consensus Split Gauge (>50% Threshold Gate) */}
                    <div className="w-full sm:w-40 md:w-44 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Consensus: {request.approvalPercentage.toFixed(0)}%</span>
                        <span className="text-teal-700 font-semibold">&gt;50% Gate</span>
                      </div>

                      {/* Visual Progress Bar with 50% Threshold Line */}
                      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-500 ${
                            request.executed
                              ? 'bg-emerald-500'
                              : isApproved
                              ? 'bg-teal-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, request.approvalPercentage)}%` }}
                        />
                        {/* 50% majority marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                          style={{ left: '50%' }}
                          title="50% Majority Threshold"
                        />
                      </div>
                    </div>

                    {/* Action Triggers: Vote or Finalize */}
                    <div className="flex items-center gap-2">
                      {!request.executed && (
                        <>
                          {/* Vote Action */}
                          <div className="tooltip-group">
                            <button
                              onClick={() => handleVoteClick(selectedCampaign.id, request.id)}
                              disabled={hasVoted || userDonation <= 0 || votingRequestId === request.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                                hasVoted
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200 cursor-default'
                                  : userDonation <= 0 || votingRequestId === request.id
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                              }`}
                            >
                              {votingRequestId === request.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Voting...</span>
                                </>
                              ) : (
                                <>
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                                </>
                              )}
                            </button>

                            <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
                              {hasVoted
                                ? 'Vote cast with your contribution weight'
                                : userDonation <= 0
                                ? 'Only donors with contributions can vote'
                                : `Vote to release ${request.amountEth} ETH`}
                            </div>
                          </div>

                          {/* Finalize Disbursement Trigger (if approved & user is organizer or donor) */}
                          {isApproved && (
                            <div className="tooltip-group">
                              <button
                                onClick={() => handleDisburseClick(selectedCampaign.id, request.id)}
                                disabled={executingRequestId === request.id || request.executed}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                                  executingRequestId === request.id || request.executed
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                }`}
                              >
                                {executingRequestId === request.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Disbursing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Disburse</span>
                                  </>
                                )}
                              </button>
                              <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
                                Trigger contract transfer of {request.amountEth} ETH directly to vendor
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

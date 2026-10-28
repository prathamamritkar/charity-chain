import React, { useState, useEffect } from 'react';
import { blockchain, TxResult } from './services/blockchainEngine';
import { Campaign, Web3Account } from './types/blockchain';
import { Navbar } from './components/Navbar';
import { PersonaSwitcherModal } from './components/PersonaSwitcherModal';
import { CampaignCard } from './components/CampaignCard';
import { MilestoneGovernanceView } from './components/MilestoneGovernanceView';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { DonateModal } from './components/DonateModal';
import { CreateRequestModal } from './components/CreateRequestModal';
import { InvoiceVerifierModal } from './components/InvoiceVerifierModal';
import { AuditTrailView } from './components/AuditTrailView';
import { ProtocolSecurityView } from './components/ProtocolSecurityView';
import { TransactionToast } from './components/TransactionToast';
import { EscrowFlowDiagram } from './components/EscrowFlowDiagram';
import { TransparencyMetricsVisualizer } from './components/TransparencyMetricsVisualizer';
import { Plus, ShieldCheck, Lock, CheckCircle2, Search } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('campaigns');
  const [accounts, setAccounts] = useState<Web3Account[]>(blockchain.getAccounts());
  const [currentAccount, setCurrentAccount] = useState<Web3Account>(blockchain.getCurrentAccount());
  const [campaigns, setCampaigns] = useState<Campaign[]>(blockchain.getCampaigns());
  const [blockNumber, setBlockNumber] = useState<number>(blockchain.getBlockNumber());

  // Search & Filter state for scalable campaign discovery
  const [campaignSearch, setCampaignSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'FUNDED' | 'ENDED'>('ALL');
  const [sortOption, setSortOption] = useState<'newest' | 'funded' | 'ending_soon'>('newest');

  // Modal States
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState<Campaign | null>(null);
  const [createRequestCampaign, setCreateRequestCampaign] = useState<Campaign | null>(null);
  const [verifierData, setVerifierData] = useState<{ isOpen: boolean; hash: string; description: string }>({
    isOpen: false,
    hash: '',
    description: ''
  });

  // Toasts
  const [lastTx, setLastTx] = useState<TxResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Sync with blockchain engine updates
  useEffect(() => {
    const unsubscribe = blockchain.subscribe(() => {
      setAccounts([...blockchain.getAccounts()]);
      setCurrentAccount({ ...blockchain.getCurrentAccount() });
      setCampaigns([...blockchain.getCampaigns()]);
      setBlockNumber(blockchain.getBlockNumber());
    });
    return unsubscribe;
  }, []);

  // Handlers
  const handleSelectAccount = (account: Web3Account) => {
    blockchain.setAccount(account);
  };

  const handleCreateCampaign = async (
    title: string,
    description: string,
    category: string,
    beneficiaryName: string,
    targetEth: number,
    durationDays: number
  ) => {
    try {
      setLastError(null);
      const res = await blockchain.createCampaign(
        title,
        description,
        category,
        beneficiaryName,
        targetEth,
        durationDays
      );
      setLastTx(res);
    } catch (err: any) {
      setLastError(err.message || "Failed to create campaign");
    }
  };

  const handleConfirmDonation = async (campaignId: number, amountEth: number) => {
    try {
      setLastError(null);
      const res = await blockchain.donate(campaignId, amountEth);
      setLastTx(res);
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Failed to execute donation");
      throw err;
    }
  };

  const handleCreateSpendingRequest = async (
    campaignId: number,
    description: string,
    vendorAddress: string,
    vendorName: string,
    amountEth: number,
    invoiceText: string
  ) => {
    try {
      setLastError(null);
      const res = await blockchain.createSpendingRequest(
        campaignId,
        description,
        vendorAddress,
        vendorName,
        amountEth,
        invoiceText
      );
      setLastTx(res);
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Failed to create milestone request");
      throw err;
    }
  };

  const handleVote = async (campaignId: number, requestId: number) => {
    try {
      setLastError(null);
      const res = await blockchain.voteOnRequest(campaignId, requestId);
      setLastTx(res);
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Failed to cast vote");
    }
  };

  const handleExecutePayment = async (campaignId: number, requestId: number) => {
    try {
      setLastError(null);
      const res = await blockchain.executePayment(campaignId, requestId);
      setLastTx(res);
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Payment execution failed");
    }
  };

  const handleClaimRefund = async (campaignId: number) => {
    try {
      setLastError(null);
      const res = await blockchain.claimRefund(campaignId);
      setLastTx(res);
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Refund claim failed");
    }
  };

  const handleResetSimulation = async () => {
    try {
      setLastError(null);
      await blockchain.resetToDefaults();
      setLastTx({
        success: true,
        txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        blockNumber: 19482910,
        gasUsed: 21000,
        eventName: "SimulationPresetReset"
      });
    } catch (err: any) {
      setLastTx(null);
      setLastError(err.message || "Failed to reset simulation state");
    }
  };

  const handleOpenVerifier = (hash: string, description: string) => {
    setVerifierData({
      isOpen: true,
      hash,
      description
    });
  };

  // Aggregated Stats
  const totalEscrowLocked = campaigns.reduce(
    (acc, c) => acc + Math.max(0, c.totalDonatedEth - c.totalSpentEth),
    0
  );
  const totalDisbursed = campaigns.reduce((acc, c) => acc + c.totalSpentEth, 0);
  const totalMilestonesCount = campaigns.reduce((acc, c) => acc + c.requests.length, 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Universal Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentAccount={currentAccount}
        onOpenCreateModal={() => setIsCreateCampaignOpen(true)}
        onOpenPersonaModal={() => setIsPersonaModalOpen(true)}
        onResetSimulation={handleResetSimulation}
        blockNumber={blockNumber}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Campaigns Overview Tab */}
        {activeTab === 'campaigns' && (
          <section className="space-y-6">
            {/* Protocol Overview Strip */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
                    Transparent Charity Funds
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl font-sans">
                    Donations remain locked in smart contract escrow and disburse directly to verified vendors only after majority donor approval.
                  </p>
                </div>

                <div className="tooltip-group">
                  <button
                    onClick={() => setIsCreateCampaignOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0 self-start md:self-auto font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start Campaign</span>
                  </button>
                  <div className="tooltip-panel absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded shadow-md whitespace-nowrap">
                    Initialize new milestone-governed escrow
                  </div>
                </div>
              </div>

              {/* 3 High-Level Metrics */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 font-mono text-xs">
                <div>
                  <div className="text-slate-500 text-[11px] uppercase tracking-wider font-mono">Funds in Escrow</div>
                  <div className="text-xl sm:text-2xl font-bold text-teal-700 tabular-nums mt-1 font-mono">
                    {totalEscrowLocked.toFixed(2)} ETH
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px] uppercase tracking-wider font-mono">Paid to Vendors</div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums mt-1 font-mono">
                    {totalDisbursed.toFixed(2)} ETH
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 text-[11px] uppercase tracking-wider font-mono">Active Campaigns</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums mt-1 font-mono">
                    {campaigns.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive 4-Stage Escrow Flow Diagram */}
            <EscrowFlowDiagram
              totalDonatedEth={campaigns.reduce((acc, c) => acc + c.totalDonatedEth, 0)}
              totalEscrowLockedEth={totalEscrowLocked}
              totalDisbursedEth={totalDisbursed}
              totalMilestonesCount={totalMilestonesCount}
            />

            {/* Fund Allocation & Category Breakdown Visualizer */}
            <TransparencyMetricsVisualizer
              campaigns={campaigns}
            />

            {/* Campaign Filtering & Search Controls */}
            {(() => {
              const uniqueCategories = Array.from(new Set(campaigns.map((c) => c.category)));
              const now = Math.floor(Date.now() / 1000);

              const filteredCampaigns = campaigns
                .filter((camp) => {
                  const isExpired = now >= camp.deadlineTimestamp;
                  const isTargetMet = camp.totalDonatedEth >= camp.targetAmountEth;

                  const matchesSearch =
                    campaignSearch === '' ||
                    camp.title.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                    camp.beneficiaryName.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                    camp.description.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                    camp.category.toLowerCase().includes(campaignSearch.toLowerCase());

                  const matchesCategory = selectedCategory === 'ALL' || camp.category === selectedCategory;

                  let matchesStatus = true;
                  if (selectedStatus === 'ACTIVE') matchesStatus = !isExpired && !isTargetMet;
                  else if (selectedStatus === 'FUNDED') matchesStatus = isTargetMet;
                  else if (selectedStatus === 'ENDED') matchesStatus = isExpired;

                  return matchesSearch && matchesCategory && matchesStatus;
                })
                .sort((a, b) => {
                  if (sortOption === 'funded') {
                    return b.totalDonatedEth / b.targetAmountEth - a.totalDonatedEth / a.targetAmountEth;
                  }
                  if (sortOption === 'ending_soon') {
                    return a.deadlineTimestamp - b.deadlineTimestamp;
                  }
                  return b.id - a.id;
                });

              return (
                <div className="space-y-4 pt-2">
                  {/* Section Title & Search/Sort Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold font-display text-slate-900">
                        Active Causes & Campaigns
                      </h2>
                      <p className="text-xs text-slate-500 font-sans">
                        Showing {filteredCampaigns.length} of {campaigns.length} registered causes
                      </p>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search causes..."
                          value={campaignSearch}
                          onChange={(e) => setCampaignSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs w-44 sm:w-52"
                        />
                      </div>

                      <select
                        value={sortOption}
                        onChange={(e: any) => setSortOption(e.target.value)}
                        aria-label="Sort causes"
                        className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500 shadow-xs cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="funded">Most Funded</option>
                        <option value="ending_soon">Ending Soon</option>
                      </select>
                    </div>
                  </div>

                  {/* Category & Status Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedCategory === 'ALL'
                            ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        All Sectors
                      </button>
                      {uniqueCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Status Segmented Toggle */}
                    <div className="flex items-center gap-1 text-[11px] font-medium bg-white p-0.5 rounded-lg border border-slate-200/80">
                      {(['ALL', 'ACTIVE', 'FUNDED', 'ENDED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setSelectedStatus(st)}
                          className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                            selectedStatus === st
                              ? 'bg-teal-600 text-white font-semibold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : st === 'FUNDED' ? 'Funded' : 'Ended'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Responsive Scalable Grid */}
                  {filteredCampaigns.length === 0 ? (
                    <div className="bg-white border border-slate-200/90 rounded-xl p-10 text-center shadow-xs">
                      <p className="text-sm font-semibold font-display text-slate-800">No campaigns found</p>
                      <p className="text-xs text-slate-500 mt-1 font-sans">
                        No causes match your current filter or search criteria.
                      </p>
                      <button
                        onClick={() => {
                          setCampaignSearch('');
                          setSelectedCategory('ALL');
                          setSelectedStatus('ALL');
                        }}
                        className="mt-4 px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                      {filteredCampaigns.map((camp) => (
                        <CampaignCard
                          key={camp.id}
                          campaign={camp}
                          currentAccount={currentAccount}
                          onDonate={(c) => setDonateCampaign(c)}
                          onViewMilestones={() => {
                            setActiveTab('milestones');
                          }}
                          onClaimRefund={handleClaimRefund}
                          onVerifyHash={(hash, title) => handleOpenVerifier(hash, title)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {activeTab === 'milestones' && (
          <MilestoneGovernanceView
            campaigns={campaigns}
            currentAccount={currentAccount}
            onVote={handleVote}
            onExecutePayment={handleExecutePayment}
            onOpenCreateRequest={(camp) => setCreateRequestCampaign(camp)}
            onVerifyHash={handleOpenVerifier}
          />
        )}

        {activeTab === 'audit' && <AuditTrailView />}

        {activeTab === 'security' && <ProtocolSecurityView />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">CharityChain</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Non-custodial charity fund tracking & milestone distribution</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Direct milestone payouts · 100% verified donor governance
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <PersonaSwitcherModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        accounts={accounts}
        currentAccount={currentAccount}
        onSelectAccount={handleSelectAccount}
      />

      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        currentAccount={currentAccount}
        onCreateCampaign={handleCreateCampaign}
      />

      <DonateModal
        isOpen={donateCampaign !== null}
        onClose={() => setDonateCampaign(null)}
        campaign={donateCampaign}
        currentAccount={currentAccount}
        onConfirmDonation={handleConfirmDonation}
      />

      <CreateRequestModal
        isOpen={createRequestCampaign !== null}
        onClose={() => setCreateRequestCampaign(null)}
        campaign={createRequestCampaign}
        currentAccount={currentAccount}
        onCreateRequest={handleCreateSpendingRequest}
      />

      <InvoiceVerifierModal
        isOpen={verifierData.isOpen}
        onClose={() => setVerifierData({ isOpen: false, hash: '', description: '' })}
        initialHash={verifierData.hash}
        initialDescription={verifierData.description}
      />

      {/* Transaction & Error Notification Toasts */}
      <TransactionToast
        txResult={lastTx}
        errorMessage={lastError}
        onClose={() => {
          setLastTx(null);
          setLastError(null);
        }}
      />
    </div>
  );
}

import { ethers } from 'ethers';
import { Campaign, SpendingRequest, Web3Account, AuditLogItem } from '../types/blockchain';
import { CONTRACT_ABI, CONTRACT_ADDRESS, PREFUNDED_ACCOUNTS } from '../contracts/TransparentCharityContract';

export interface TxResult {
  success: boolean;
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  eventName?: string;
  error?: string;
}

class BlockchainEngine {
  private accounts: Web3Account[] = [...PREFUNDED_ACCOUNTS];
  private currentAccount: Web3Account = PREFUNDED_ACCOUNTS[0];
  private isMetaMaskMode: boolean = false;
  private isConnectingMetaMask: boolean = false;
  private metaMaskListenersAttached: boolean = false;
  private currentBlock: number = 19482910;
  private campaigns: Campaign[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.initDefaultState();
  }

  private initDefaultState() {
    const now = Math.floor(Date.now() / 1000);
    this.campaigns = [
      {
        id: 1,
        title: "Rural Hospital Oxygen & Ventilator ICU Fund",
        description: "Procurement of 5 high-flow ventilators and multi-parameter cardiac monitors for rural trauma ICU in Nandurbar district. Funds are milestone-locked until supplier dispatch notes and warranty certificates are submitted.",
        category: "Healthcare & Medical Aid",
        beneficiaryName: "Jeevan Memorial Charitable Trust",
        organizer: PREFUNDED_ACCOUNTS[0].address,
        targetAmountEth: 12.5,
        totalDonatedEth: 7.5,
        totalSpentEth: 0,
        deadlineTimestamp: now + (30 * 24 * 3600),
        isClosed: false,
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes("Rural Hospital Oxygen & Ventilator ICU Fund")),
        donations: {
          [PREFUNDED_ACCOUNTS[1].address]: 6.0, // Alice
          [PREFUNDED_ACCOUNTS[2].address]: 1.5, // Bob
        },
        requests: [
          {
            id: 0,
            campaignId: 1,
            description: "Procurement of 3 High-Flow Mechanical Ventilators (Batch A)",
            vendor: PREFUNDED_ACCOUNTS[3].address,
            vendorName: "Biomedical Equipments India Ltd",
            amountEth: 4.5,
            approvalEth: 6.0,
            approvalPercentage: 80.0, // 6.0 / 7.5 = 80% > 50%
            executed: false,
            invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("Procurement of 3 High-Flow Mechanical Ventilators (Batch A)")),
            voters: [PREFUNDED_ACCOUNTS[1].address]
          },
          {
            id: 1,
            campaignId: 1,
            description: "Oxygen Pipeline Manifold & Emergency Backpressure Regulators",
            vendor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
            vendorName: "Cryo Air & Gas Systems Ltd",
            amountEth: 3.0,
            approvalEth: 1.5,
            approvalPercentage: 20.0, // 1.5 / 7.5 = 20% < 50%
            executed: false,
            invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("Oxygen Pipeline Manifold & Emergency Backpressure Regulators")),
            voters: [PREFUNDED_ACCOUNTS[2].address]
          }
        ]
      },
      {
        id: 2,
        title: "Drought-Resilient Solar Borewell & Clean Water Initiative",
        description: "Installation of 3 solar-powered borewell filtration pumps and gravity-fed distribution tanks across 4 drought-prone hamlets in Vidarbha region. Directly pays the licensed drilling contractors upon water table verification.",
        category: "Clean Water & Rural Infrastructure",
        beneficiaryName: "Gramin Vikas Foundation",
        organizer: PREFUNDED_ACCOUNTS[1].address,
        targetAmountEth: 8.0,
        totalDonatedEth: 3.0,
        totalSpentEth: 0,
        deadlineTimestamp: now + (45 * 24 * 3600),
        isClosed: false,
        metadataHash: ethers.keccak256(ethers.toUtf8Bytes("Drought-Resilient Solar Borewell & Clean Water Initiative")),
        donations: {
          [PREFUNDED_ACCOUNTS[2].address]: 3.0
        },
        requests: [
          {
            id: 0,
            campaignId: 2,
            description: "Deep Geotechnical Borewell Drilling & Solar Submersible Assembly",
            vendor: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
            vendorName: "Apex Geotechnical & Solar Drilling Corp",
            amountEth: 3.2,
            approvalEth: 0,
            approvalPercentage: 0,
            executed: false,
            invoiceHash: ethers.keccak256(ethers.toUtf8Bytes("Deep Geotechnical Borewell Drilling & Solar Submersible Assembly")),
            voters: []
          }
        ]
      }
    ];
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getAccounts(): Web3Account[] {
    return this.accounts;
  }

  public getCurrentAccount(): Web3Account {
    return this.currentAccount;
  }

  public isMetaMaskActive(): boolean {
    return this.isMetaMaskMode;
  }

  public getBlockNumber(): number {
    return this.currentBlock;
  }

  public getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  public setAccount(account: Web3Account) {
    this.currentAccount = account;
    this.isMetaMaskMode = account.role === 'metamask';
    this.notify();
  }

  public isConnecting(): boolean {
    return this.isConnectingMetaMask;
  }

  public disconnectMetaMask() {
    this.isMetaMaskMode = false;
    this.currentAccount = this.accounts[0];
    this.notify();
  }

  public topUpDemoBalance(amount: number = 5.0) {
    this.currentAccount.balanceEth = parseFloat((this.currentAccount.balanceEth + amount).toFixed(4));
    const idx = this.accounts.findIndex(a => a.id === this.currentAccount.id);
    if (idx >= 0) {
      this.accounts[idx].balanceEth = this.currentAccount.balanceEth;
    }
    this.notify();
  }

  public async resetToDefaults(): Promise<void> {
    this.accounts = PREFUNDED_ACCOUNTS.map(a => ({ ...a }));
    this.currentAccount = this.accounts[0];
    this.isMetaMaskMode = false;
    this.currentBlock = 19482910;
    this.initDefaultState();

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (err) {
      console.warn("Backend reset notice:", err);
    }

    this.notify();
  }

  private setupMetaMaskListeners(ethereum: any) {
    if (this.metaMaskListenersAttached || !ethereum || !ethereum.on) return;
    this.metaMaskListenersAttached = true;

    ethereum.on('accountsChanged', async (newAccounts: string[]) => {
      if (!newAccounts || newAccounts.length === 0) {
        this.disconnectMetaMask();
      } else {
        const address = newAccounts[0];
        let balanceEth = 10.0;
        try {
          const provider = new ethers.BrowserProvider(ethereum);
          const balanceBig = await provider.getBalance(address);
          const onChain = parseFloat(ethers.formatEther(balanceBig));
          if (onChain > 0) balanceEth = onChain;
        } catch {
          // ignore
        }
        const metaMaskAccount: Web3Account = {
          id: "metamask_user",
          name: `MetaMask (${address.slice(0, 6)}...${address.slice(-4)})`,
          role: "metamask",
          address,
          balanceEth,
          description: "Connected via external EIP-1193 MetaMask Provider"
        };
        const idx = this.accounts.findIndex(a => a.id === "metamask_user");
        if (idx >= 0) {
          this.accounts[idx] = metaMaskAccount;
        } else {
          this.accounts.push(metaMaskAccount);
        }
        if (this.isMetaMaskMode) {
          this.currentAccount = metaMaskAccount;
        }
        this.notify();
      }
    });

    ethereum.on('chainChanged', () => {
      this.refreshMetaMaskBalance();
    });
  }

  public async refreshMetaMaskBalance() {
    if (!this.isMetaMaskMode || typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const eth = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(eth);
      const balanceBig = await provider.getBalance(this.currentAccount.address);
      const onChain = parseFloat(ethers.formatEther(balanceBig));
      if (onChain > 0) {
        this.currentAccount.balanceEth = onChain;
        const idx = this.accounts.findIndex(a => a.id === "metamask_user");
        if (idx >= 0) this.accounts[idx].balanceEth = onChain;
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  public async connectMetaMask(): Promise<boolean> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error("MetaMask is not installed. Please install the MetaMask browser extension or use Built-in EVM Simulation.");
    }

    if (this.isConnectingMetaMask) {
      throw new Error("MetaMask request is already pending. Please click the MetaMask fox icon in your browser toolbar to approve.");
    }

    const ethereum = (window as any).ethereum;
    this.setupMetaMaskListeners(ethereum);

    let accounts: string[] = [];

    // 1. Silent check: If origin is already authorized, don't trigger eth_requestAccounts or -32002
    try {
      accounts = await ethereum.request({ method: 'eth_accounts' });
    } catch {
      // Proceed to request
    }

    // 2. If not yet authorized, invoke eth_requestAccounts directly on ethereum provider
    if (!accounts || accounts.length === 0) {
      try {
        this.isConnectingMetaMask = true;
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      } catch (rpcErr: any) {
        const code = rpcErr?.code ?? rpcErr?.info?.error?.code ?? rpcErr?.error?.code;
        const msg = String(rpcErr?.message || rpcErr || '');

        if (code === -32002 || msg.includes('-32002') || msg.includes('already pending')) {
          throw new Error("MetaMask request is already pending. Please click the MetaMask fox icon in your browser toolbar to approve.");
        }
        if (code === 4001 || msg.includes('4001') || msg.includes('User rejected') || msg.includes('user rejected')) {
          throw new Error("Connection request was cancelled in MetaMask.");
        }
        if (code === -32603 || msg.includes('Internal JSON-RPC error')) {
          throw new Error("MetaMask encountered an internal error. Please make sure your wallet is unlocked and retry.");
        }
        if (msg.includes('could not coalesce error')) {
          throw new Error("MetaMask request is already pending. Please click the MetaMask fox icon in your browser toolbar to approve.");
        }
        throw new Error(rpcErr.message || "Failed to connect to MetaMask");
      } finally {
        this.isConnectingMetaMask = false;
      }
    }

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in MetaMask.");
    }

    const address = accounts[0];
    let balanceEth = 0;
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      const balanceBig = await provider.getBalance(address);
      balanceEth = parseFloat(ethers.formatEther(balanceBig));
    } catch (balErr) {
      console.warn("Could not query on-chain balance:", balErr);
    }

    // If wallet balance is 0 (testnet or local), provide 10.0 test ETH so the user can test escrow donations right away
    if (balanceEth <= 0) {
      balanceEth = 10.0;
    }

    const metaMaskAccount: Web3Account = {
      id: "metamask_user",
      name: `MetaMask (${address.slice(0, 6)}...${address.slice(-4)})`,
      role: "metamask",
      address,
      balanceEth,
      description: "Connected via external EIP-1193 MetaMask Provider"
    };

    const existingIdx = this.accounts.findIndex(a => a.id === "metamask_user");
    if (existingIdx >= 0) {
      this.accounts[existingIdx] = metaMaskAccount;
    } else {
      this.accounts.push(metaMaskAccount);
    }

    this.currentAccount = metaMaskAccount;
    this.isMetaMaskMode = true;
    this.notify();
    return true;
  }

  public getCampaigns(): Campaign[] {
    return this.campaigns;
  }

  public getCampaign(id: number): Campaign | undefined {
    return this.campaigns.find(c => c.id === id);
  }

  private generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private async syncAuditLog(campaignId: number, eventName: string, txHash: string, payload: any) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          event_name: eventName,
          transaction_hash: txHash,
          sender_address: this.currentAccount.address,
          raw_payload: payload
        })
      });
    } catch (e) {
      console.warn("Audit sync skipped (backend offline or loading)", e);
    }
  }

  // Smart Contract Functions
  public async createCampaign(
    title: string,
    description: string,
    category: string,
    beneficiaryName: string,
    targetAmountEth: number,
    durationInDays: number
  ): Promise<TxResult> {
    if (targetAmountEth <= 0) {
      throw new Error("Solidity Error: InvalidAmount() - Target amount must be greater than 0 ETH.");
    }

    this.currentBlock++;
    const newId = this.campaigns.length + 1;
    const txHash = this.generateTxHash();
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + (durationInDays * 24 * 3600);

    // Compute cryptographic metadata hash
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(title.trim()));

    const newCampaign: Campaign = {
      id: newId,
      title,
      description,
      category,
      beneficiaryName,
      organizer: this.currentAccount.address,
      targetAmountEth,
      totalDonatedEth: 0,
      totalSpentEth: 0,
      deadlineTimestamp: deadline,
      isClosed: false,
      metadataHash,
      requests: [],
      donations: {}
    };

    this.campaigns.push(newCampaign);

    // Persist to backend SQLite
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: newId,
          title,
          description,
          category,
          beneficiary_name: beneficiaryName,
          organizer_address: this.currentAccount.address,
          target_eth: targetAmountEth,
          duration_days: durationInDays
        })
      });
    } catch (err) {
      console.warn("Backend campaign sync warning", err);
    }

    await this.syncAuditLog(newId, "CampaignCreated", txHash, {
      title,
      target: `${targetAmountEth} ETH`,
      organizer: this.currentAccount.address
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 142850,
      eventName: "CampaignCreated"
    };
  }

  public async donate(campaignId: number, amountEth: number): Promise<TxResult> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error("Campaign does not exist.");
    }

    if (campaign.isClosed) {
      throw new Error("Solidity Error: CampaignAlreadyClosed() - This campaign is closed.");
    }

    if (Math.floor(Date.now() / 1000) >= campaign.deadlineTimestamp) {
      throw new Error("Solidity Error: CampaignNotActive() - Campaign deadline has passed.");
    }

    if (amountEth <= 0) {
      throw new Error("Solidity Error: InvalidAmount() - Donation must be greater than 0 ETH.");
    }

    if (this.currentAccount.balanceEth < amountEth) {
      throw new Error(`Insufficient funds: Current wallet has ${this.currentAccount.balanceEth.toFixed(4)} ETH, requires ${amountEth} ETH.`);
    }

    this.currentBlock++;
    const txHash = this.generateTxHash();

    // Deduct from caller's wallet
    this.currentAccount.balanceEth -= amountEth;

    // Update campaign balance
    campaign.totalDonatedEth += amountEth;
    const currentDonation = campaign.donations[this.currentAccount.address] || 0;
    campaign.donations[this.currentAccount.address] = currentDonation + amountEth;

    // Recalculate approval percentages for existing requests
    campaign.requests.forEach(req => {
      req.approvalPercentage = campaign.totalDonatedEth > 0 
        ? Math.min(100, (req.approvalEth / campaign.totalDonatedEth) * 100) 
        : 0;
    });

    await this.syncAuditLog(campaignId, "DonationReceived", txHash, {
      donor: this.currentAccount.address,
      amount: `${amountEth} ETH`,
      totalDonated: `${campaign.totalDonatedEth} ETH`
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 65240,
      eventName: "DonationReceived"
    };
  }

  public async createSpendingRequest(
    campaignId: number,
    description: string,
    vendorAddress: string,
    vendorName: string,
    amountEth: number,
    invoiceText: string
  ): Promise<TxResult> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Campaign does not exist.");

    if (this.currentAccount.address.toLowerCase() !== campaign.organizer.toLowerCase()) {
      throw new Error("Solidity Error: UnauthorizedCaller() - Only the campaign organizer can submit milestone requests.");
    }

    const availableBalance = campaign.totalDonatedEth - campaign.totalSpentEth;
    if (amountEth <= 0 || amountEth > availableBalance) {
      throw new Error(`Solidity Error: InvalidAmount() - Requested ${amountEth} ETH exceeds available escrow balance (${availableBalance.toFixed(2)} ETH).`);
    }

    this.currentBlock++;
    const txHash = this.generateTxHash();
    const requestId = campaign.requests.length;

    // Compute cryptographic invoice hash
    const targetInvoiceContent = (invoiceText.trim() || description.trim());
    const invoiceHash = ethers.keccak256(ethers.toUtf8Bytes(targetInvoiceContent));

    const newRequest: SpendingRequest = {
      id: requestId,
      campaignId,
      description,
      vendor: vendorAddress,
      vendorName,
      amountEth,
      approvalEth: 0,
      approvalPercentage: 0,
      executed: false,
      invoiceHash,
      invoiceText: targetInvoiceContent,
      voters: []
    };

    campaign.requests.push(newRequest);

    // Save invoice to backend SQLite
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          request_id: requestId,
          vendor_name: vendorName,
          vendor_address: vendorAddress,
          amount_eth: amountEth,
          invoice_description: description,
          raw_invoice_data: targetInvoiceContent
        })
      });
    } catch (e) {
      console.warn("Backend invoice sync warning", e);
    }

    await this.syncAuditLog(campaignId, "SpendingRequestCreated", txHash, {
      requestId,
      vendor: vendorAddress,
      vendorName,
      amount: `${amountEth} ETH`,
      invoiceHash
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 98400,
      eventName: "SpendingRequestCreated"
    };
  }

  public async voteOnRequest(campaignId: number, requestId: number): Promise<TxResult> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Campaign does not exist.");

    const donorStake = campaign.donations[this.currentAccount.address] || 0;
    if (donorStake <= 0) {
      throw new Error("Solidity Error: NoDonationFound() - Only donors who contributed to this campaign can cast approval votes.");
    }

    const request = campaign.requests.find(r => r.id === requestId);
    if (!request) throw new Error("Milestone spending request does not exist.");

    if (campaign.isClosed) {
      throw new Error("Solidity Error: CampaignAlreadyClosed() - This campaign is closed to voting.");
    }

    if (request.executed) {
      throw new Error("Solidity Error: RequestAlreadyExecuted() - Milestone request is already finalized and executed.");
    }

    if (request.voters.includes(this.currentAccount.address.toLowerCase())) {
      throw new Error("Solidity Error: AlreadyVoted() - You have already voted on this milestone spending request.");
    }

    this.currentBlock++;
    const txHash = this.generateTxHash();

    // Record vote
    request.voters.push(this.currentAccount.address.toLowerCase());
    request.approvalEth += donorStake;
    request.approvalPercentage = campaign.totalDonatedEth > 0
      ? Math.min(100, (request.approvalEth / campaign.totalDonatedEth) * 100)
      : 0;

    await this.syncAuditLog(campaignId, "VoteSubmitted", txHash, {
      requestId,
      voter: this.currentAccount.address,
      stakeVoted: `${donorStake} ETH`,
      currentApproval: `${request.approvalPercentage.toFixed(1)}%`
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 48900,
      eventName: "VoteSubmitted"
    };
  }

  public async executePayment(campaignId: number, requestId: number): Promise<TxResult> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Campaign does not exist.");

    const request = campaign.requests.find(r => r.id === requestId);
    if (!request) throw new Error("Milestone spending request does not exist.");

    if (campaign.isClosed) {
      throw new Error("Solidity Error: CampaignAlreadyClosed() - This campaign is marked as closed.");
    }

    if (request.executed) {
      throw new Error("Solidity Error: RequestAlreadyExecuted() - This milestone payment has already been disbursed on-chain.");
    }

    // Governance consensus rule: > 50% approval
    if (request.approvalEth <= (campaign.totalDonatedEth / 2)) {
      throw new Error(`Solidity Error: TargetNotMet() - Consensus required > 50% approval. Currently approved: ${(request.approvalPercentage).toFixed(1)}% (${request.approvalEth} / ${campaign.totalDonatedEth} ETH).`);
    }

    const availableBalance = campaign.totalDonatedEth - campaign.totalSpentEth;
    if (availableBalance < request.amountEth) {
      throw new Error("Solidity Error: InsufficientContractBalance() - Contract balance insufficient for this payout.");
    }

    this.currentBlock++;
    const txHash = this.generateTxHash();

    // CEI: Checks-Effects-Interactions
    request.executed = true;
    campaign.totalSpentEth += request.amountEth;

    // Interaction: Credit Vendor Wallet
    const vendorAccount = this.accounts.find(a => a.address.toLowerCase() === request.vendor.toLowerCase());
    if (vendorAccount) {
      vendorAccount.balanceEth += request.amountEth;
    }

    await this.syncAuditLog(campaignId, "SpendingRequestFinalized", txHash, {
      requestId,
      vendor: request.vendor,
      vendorName: request.vendorName,
      amountDisbursed: `${request.amountEth} ETH`,
      invoiceHash: request.invoiceHash
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 89320,
      eventName: "SpendingRequestFinalized"
    };
  }

  public async claimRefund(campaignId: number): Promise<TxResult> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) throw new Error("Campaign does not exist.");

    const now = Math.floor(Date.now() / 1000);
    if (now < campaign.deadlineTimestamp) {
      throw new Error("Solidity Error: DeadlineNotPassed() - Refund cannot be claimed until the campaign deadline has expired.");
    }

    if (campaign.totalDonatedEth >= campaign.targetAmountEth) {
      throw new Error("Solidity Error: TargetMetCannotRefund() - Campaign reached its target. Escrow funds are allocated to vendor milestones.");
    }

    const donorAmount = campaign.donations[this.currentAccount.address] || 0;
    if (donorAmount <= 0) {
      throw new Error("Solidity Error: NoDonationFound() - No refundable deposit found for this account.");
    }

    this.currentBlock++;
    const txHash = this.generateTxHash();

    // Refund donor
    campaign.donations[this.currentAccount.address] = 0;
    this.currentAccount.balanceEth += donorAmount;

    await this.syncAuditLog(campaignId, "RefundIssued", txHash, {
      donor: this.currentAccount.address,
      refundAmount: `${donorAmount} ETH`
    });

    this.notify();

    return {
      success: true,
      txHash,
      blockNumber: this.currentBlock,
      gasUsed: 52100,
      eventName: "RefundIssued"
    };
  }
}

export const blockchain = new BlockchainEngine();

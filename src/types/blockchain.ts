export interface Web3Account {
  id: string;
  name: string;
  role: 'organizer' | 'donor' | 'vendor' | 'metamask';
  address: string;
  privateKey?: string;
  balanceEth: number;
  description: string;
}

export interface SpendingRequest {
  id: number;
  campaignId: number;
  description: string;
  vendor: string;
  vendorName: string;
  amountEth: number;
  approvalEth: number;
  approvalPercentage: number;
  executed: boolean;
  invoiceHash: string;
  invoiceText?: string;
  voters: string[];
}

export interface Campaign {
  id: number;
  title: string;
  description: string;
  category: string;
  beneficiaryName: string;
  organizer: string;
  targetAmountEth: number;
  totalDonatedEth: number;
  totalSpentEth: number;
  deadlineTimestamp: number;
  isClosed: boolean;
  metadataHash: string;
  chainId?: string;
  currencySymbol?: string;
  requests: SpendingRequest[];
  donations: Record<string, number>; // address -> amountEth
}

export interface InvoiceRecord {
  id: number;
  campaign_id: number;
  request_id: number;
  vendor_name: string;
  vendor_address: string;
  amount_eth: number;
  invoice_description: string;
  invoice_sha256: string;
  is_paid: number;
  paid_tx_hash?: string;
  chain_id?: string;
  created_at?: string;
}

export interface AuditLogItem {
  id: number;
  campaign_id: number;
  event_name: string;
  transaction_hash: string;
  sender_address: string;
  raw_payload: string;
  chain_id?: string;
  settlement_method?: string;
  block_number?: number;
  timestamp: string;
}

export interface NetworkSummary {
  id: string;
  numericChainId?: number;
  name: string;
  family: 'evm' | 'svm' | 'utxo' | 'move' | 'simulated';
  symbol: string;
  isTestnet: boolean;
  supportsMetaTx: boolean;
  status: 'online' | 'degraded' | 'simulated';
}

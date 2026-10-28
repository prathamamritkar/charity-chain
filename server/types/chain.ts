export type ChainFamily = 'evm' | 'svm' | 'utxo' | 'move' | 'simulated';

export type ExecutionMethod = 
  | 'direct_rpc'          // Direct native node RPC with standard gas settlement
  | 'meta_transaction'    // Gasless relay via EIP-712 sponsor execution
  | 'multisig_escrow'     // Multi-signature threshold governance (Safe style)
  | 'optimistic_relayer'  // L2/Relayer fast finality with dispute challenge window
  | 'virtual_sandbox';    // Zero-latency local deterministic state machine

export interface NetworkConfig {
  id: string;                         // e.g. 'sim-1337', 'eth-sepolia', 'polygon-pos', 'arbitrum-one', 'solana-devnet'
  numericChainId?: number;            // e.g. 1337, 11155111, 137, 42161, 8453
  name: string;                       // Human-friendly name
  family: ChainFamily;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcEndpoints: string[];             // Primary + redundant failover endpoints
  explorerTxUrl: string;              // e.g. 'https://sepolia.etherscan.io/tx/{hash}'
  contractAddress?: string;
  supportsMetaTx: boolean;            // Gasless sponsorship available
  supportsMultisig: boolean;
  avgBlockTimeSec: number;
  estimatedGasGwei: number;
  status: 'online' | 'degraded' | 'simulated';
}

export interface ChainHealth {
  chainId: string;
  isHealthy: boolean;
  activeEndpoint: string;
  blockHeight: number;
  latencyMs: number;
  peerCount: number;
  lastChecked: number;
}

export interface TransactionSubmissionRequest {
  campaignId: number;
  chainId?: string;
  method?: ExecutionMethod;
  sender: string;
  action: 'DONATE' | 'CREATE_CAMPAIGN' | 'SUBMIT_REQUEST' | 'VOTE_REQUEST' | 'FINALIZE_REQUEST' | 'REFUND';
  amount?: number;
  currencySymbol?: string;
  payload?: Record<string, any>;
  signature?: string;
  gaslessSponsor?: boolean;
}

export interface TransactionSubmissionResult {
  success: boolean;
  txHash: string;
  chainId: string;
  chainName: string;
  family: ChainFamily;
  settlementMethod: ExecutionMethod;
  blockNumber: number;
  gasUsed: string;
  gasCostNative: string;
  explorerUrl: string;
  cryptographicProof: string;
  timestamp: number;
  error?: string;
}

export interface GasEstimateComparison {
  chainId: string;
  chainName: string;
  family: ChainFamily;
  gasLimit: number;
  gasPriceGwei: number;
  estimatedFeeNative: string;
  estimatedFeeUsd: number;
  estimatedConfirmationSec: number;
  recommended: boolean;
}

import {
  NetworkConfig,
  ChainHealth,
  TransactionSubmissionRequest,
  TransactionSubmissionResult,
  GasEstimateComparison
} from '../types/chain.js';

export interface IChainAdapter {
  /**
   * Return the static network configuration
   */
  getNetworkConfig(): NetworkConfig;

  /**
   * Perform an active health check / ping to current active RPC with failover
   */
  checkHealth(): Promise<ChainHealth>;

  /**
   * Query the native account balance
   */
  getBalance(address: string): Promise<{ balance: string; symbol: string }>;

  /**
   * Verify an off-chain cryptographic signature (ECDSA secp256k1 or Ed25519)
   */
  verifySignature(address: string, message: string, signature: string): Promise<boolean>;

  /**
   * Execute an on-chain action or relay transaction via preferred method
   */
  executeTransaction(req: TransactionSubmissionRequest): Promise<TransactionSubmissionResult>;

  /**
   * Estimate execution gas / fees for the given action
   */
  estimateFee(action: string, payload?: Record<string, any>): Promise<GasEstimateComparison>;

  /**
   * Generate an explorer link for a given transaction hash
   */
  formatExplorerUrl(txHash: string): string;

  /**
   * Verify that an off-chain document / invoice hash matches an on-chain commitment
   */
  verifyHashAnchor(documentSha256: string, onChainCommitment: string): boolean;
}

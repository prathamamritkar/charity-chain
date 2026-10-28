import crypto from 'crypto';
import { IChainAdapter } from './IChainAdapter.js';
import {
  NetworkConfig,
  ChainHealth,
  TransactionSubmissionRequest,
  TransactionSubmissionResult,
  GasEstimateComparison
} from '../types/chain.js';

export class VirtualSandboxAdapter implements IChainAdapter {
  private config: NetworkConfig;
  private currentBlock: number = 19482910;
  private mockBalances: Map<string, number> = new Map();

  constructor(customConfig?: Partial<NetworkConfig>) {
    this.config = {
      id: 'sim-1337',
      numericChainId: 1337,
      name: 'CharityChain Virtual Sandbox (EVM L1)',
      family: 'simulated',
      isTestnet: true,
      nativeCurrency: {
        name: 'Virtual Ether',
        symbol: 'ETH',
        decimals: 18
      },
      rpcEndpoints: ['internal://virtual-consensus-node'],
      explorerTxUrl: 'https://explorer.charitychain.local/tx/{hash}',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      supportsMetaTx: true,
      supportsMultisig: true,
      avgBlockTimeSec: 0.1,
      estimatedGasGwei: 1.5,
      status: 'simulated',
      ...customConfig
    };
  }

  getNetworkConfig(): NetworkConfig {
    return this.config;
  }

  async checkHealth(): Promise<ChainHealth> {
    this.currentBlock += 1;
    return {
      chainId: this.config.id,
      isHealthy: true,
      activeEndpoint: this.config.rpcEndpoints[0],
      blockHeight: this.currentBlock,
      latencyMs: 1,
      peerCount: 16,
      lastChecked: Date.now()
    };
  }

  async getBalance(address: string): Promise<{ balance: string; symbol: string }> {
    const existing = this.mockBalances.get(address.toLowerCase());
    const balance = existing !== undefined ? existing : 100.0;
    return {
      balance: balance.toFixed(4),
      symbol: this.config.nativeCurrency.symbol
    };
  }

  async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    if (!signature || signature.length < 10) return false;
    // Sandbox accepts validly-formatted hex signatures
    return signature.startsWith('0x') && signature.length >= 66;
  }

  async executeTransaction(req: TransactionSubmissionRequest): Promise<TransactionSubmissionResult> {
    this.currentBlock += 1;
    const txHash = '0x' + crypto.randomBytes(32).toString('hex');
    const proof = '0x' + crypto.createHash('sha256')
      .update(`${req.sender}-${req.action}-${req.campaignId}-${this.currentBlock}-${Date.now()}`)
      .digest('hex');

    const method = req.method || (req.gaslessSponsor ? 'meta_transaction' : 'virtual_sandbox');

    return {
      success: true,
      txHash,
      chainId: this.config.id,
      chainName: this.config.name,
      family: this.config.family,
      settlementMethod: method,
      blockNumber: this.currentBlock,
      gasUsed: '21000',
      gasCostNative: '0.0000315',
      explorerUrl: this.formatExplorerUrl(txHash),
      cryptographicProof: proof,
      timestamp: Date.now()
    };
  }

  async estimateFee(action: string, payload?: Record<string, any>): Promise<GasEstimateComparison> {
    return {
      chainId: this.config.id,
      chainName: this.config.name,
      family: this.config.family,
      gasLimit: 65000,
      gasPriceGwei: 1.5,
      estimatedFeeNative: '0.0000975 ETH',
      estimatedFeeUsd: 0.28,
      estimatedConfirmationSec: 0.1,
      recommended: true
    };
  }

  formatExplorerUrl(txHash: string): string {
    return this.config.explorerTxUrl.replace('{hash}', txHash);
  }

  verifyHashAnchor(documentSha256: string, onChainCommitment: string): boolean {
    if (!documentSha256 || !onChainCommitment) return false;
    return documentSha256.toLowerCase() === onChainCommitment.toLowerCase();
  }
}

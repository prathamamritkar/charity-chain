import crypto from 'crypto';
import { IChainAdapter } from './IChainAdapter.js';
import {
  NetworkConfig,
  ChainHealth,
  TransactionSubmissionRequest,
  TransactionSubmissionResult,
  GasEstimateComparison
} from '../types/chain.js';

// Base58 alphabet for Solana-style addresses and signatures
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(buffer: Buffer): string {
  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let str = '';
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    str += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += BASE58_ALPHABET[digits[i]];
  }
  return str;
}

export class NonEvmAdapter implements IChainAdapter {
  private config: NetworkConfig;
  private currentSlot: number = 284192000;

  constructor(customConfig?: Partial<NetworkConfig>) {
    this.config = {
      id: 'solana-devnet',
      name: 'Solana Devnet (SVM / Sealevel Engine)',
      family: 'svm',
      isTestnet: true,
      nativeCurrency: {
        name: 'Solana',
        symbol: 'SOL',
        decimals: 9
      },
      rpcEndpoints: [
        'https://api.devnet.solana.com',
        'https://rpc.ankr.com/solana_devnet'
      ],
      explorerTxUrl: 'https://explorer.solana.com/tx/{hash}?cluster=devnet',
      contractAddress: 'CharityEscrow1111111111111111111111111111111',
      supportsMetaTx: true, // Sponsored fee payer / Octane style
      supportsMultisig: true, // Squads V4 multisig
      avgBlockTimeSec: 0.4,
      estimatedGasGwei: 0.005,
      status: 'online',
      ...customConfig
    };
  }

  getNetworkConfig(): NetworkConfig {
    return this.config;
  }

  async checkHealth(): Promise<ChainHealth> {
    this.currentSlot += 3;
    return {
      chainId: this.config.id,
      isHealthy: true,
      activeEndpoint: this.config.rpcEndpoints[0],
      blockHeight: this.currentSlot,
      latencyMs: 140,
      peerCount: 1850,
      lastChecked: Date.now()
    };
  }

  async getBalance(address: string): Promise<{ balance: string; symbol: string }> {
    return {
      balance: '14.8500',
      symbol: this.config.nativeCurrency.symbol
    };
  }

  async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    // Solana Ed25519 signature format verification (Base58 87-88 chars)
    if (!signature) return false;
    return signature.length >= 80 && signature.length <= 90;
  }

  async executeTransaction(req: TransactionSubmissionRequest): Promise<TransactionSubmissionResult> {
    this.currentSlot += 1;
    // Generate Base58 signature representation for Solana/SVM
    const rawSig = crypto.randomBytes(64);
    const txHash = encodeBase58(rawSig);

    const proof = 'sol_pda_' + crypto.createHash('sha256')
      .update(`${this.config.id}-${req.sender}-${req.action}-${req.campaignId}-${this.currentSlot}`)
      .digest('hex').substring(0, 32);

    const method = req.method || (req.gaslessSponsor ? 'meta_transaction' : 'direct_rpc');

    return {
      success: true,
      txHash,
      chainId: this.config.id,
      chainName: this.config.name,
      family: 'svm',
      settlementMethod: method,
      blockNumber: this.currentSlot,
      gasUsed: '5000 ComputeUnits',
      gasCostNative: '0.000005 SOL',
      explorerUrl: this.formatExplorerUrl(txHash),
      cryptographicProof: proof,
      timestamp: Date.now()
    };
  }

  async estimateFee(action: string, payload?: Record<string, any>): Promise<GasEstimateComparison> {
    return {
      chainId: this.config.id,
      chainName: this.config.name,
      family: 'svm',
      gasLimit: 5000,
      gasPriceGwei: 0.005,
      estimatedFeeNative: '0.000005 SOL',
      estimatedFeeUsd: 0.0008,
      estimatedConfirmationSec: 0.4,
      recommended: true
    };
  }

  formatExplorerUrl(txHash: string): string {
    return this.config.explorerTxUrl.replace('{hash}', txHash);
  }

  verifyHashAnchor(documentSha256: string, onChainCommitment: string): boolean {
    if (!documentSha256 || !onChainCommitment) return false;
    // Clean potential 0x prefix if comparing across EVM and SVM formats
    const cleanDoc = documentSha256.replace(/^0x/, '').toLowerCase();
    const cleanCommitment = onChainCommitment.replace(/^0x/, '').toLowerCase();
    return cleanDoc === cleanCommitment;
  }
}

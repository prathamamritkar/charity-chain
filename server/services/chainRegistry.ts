import { IChainAdapter } from '../adapters/IChainAdapter.js';
import { VirtualSandboxAdapter } from '../adapters/VirtualSandboxAdapter.js';
import { EvmChainAdapter } from '../adapters/EvmChainAdapter.js';
import { NonEvmAdapter } from '../adapters/NonEvmAdapter.js';
import { MetaTxRelayerAdapter } from '../adapters/MetaTxRelayerAdapter.js';
import { NetworkConfig, GasEstimateComparison } from '../types/chain.js';

class ChainRegistry {
  private adapters: Map<string, IChainAdapter> = new Map();
  private defaultChainId: string = 'sim-1337';
  private relayer: MetaTxRelayerAdapter = new MetaTxRelayerAdapter();

  constructor() {
    this.initializeChains();
  }

  private initializeChains() {
    // 1. Virtual Sandbox (Default zero-gas testing)
    const sandboxAdapter = new VirtualSandboxAdapter();
    this.adapters.set('sim-1337', sandboxAdapter);

    // 2. Ethereum Sepolia Testnet
    this.adapters.set('eth-sepolia', new EvmChainAdapter({
      id: 'eth-sepolia',
      numericChainId: 11155111,
      name: 'Ethereum Sepolia Testnet',
      family: 'evm',
      isTestnet: true,
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
      rpcEndpoints: [
        'https://rpc.sepolia.org',
        'https://rpc2.sepolia.org',
        'https://ethereum-sepolia.publicnode.com'
      ],
      explorerTxUrl: 'https://sepolia.etherscan.io/tx/{hash}',
      contractAddress: '0x4A6b9f2d1e089dF642F7b218B12f36C9F356079F',
      supportsMetaTx: true,
      supportsMultisig: true,
      avgBlockTimeSec: 12.0,
      estimatedGasGwei: 15.0,
      status: 'online'
    }));

    // 3. Polygon PoS
    this.adapters.set('polygon-pos', new EvmChainAdapter({
      id: 'polygon-pos',
      numericChainId: 137,
      name: 'Polygon PoS (High Speed / Micro-Donations)',
      family: 'evm',
      isTestnet: false,
      nativeCurrency: { name: 'Polygon Ecosystem Token', symbol: 'POL', decimals: 18 },
      rpcEndpoints: [
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon',
        'https://1rpc.io/matic'
      ],
      explorerTxUrl: 'https://polygonscan.com/tx/{hash}',
      contractAddress: '0x7B8C09D1d59D040A59d072f6E784a3Bfc18a66f0',
      supportsMetaTx: true,
      supportsMultisig: true,
      avgBlockTimeSec: 2.1,
      estimatedGasGwei: 35.0,
      status: 'online'
    }));

    // 4. Arbitrum One (L2 Rollup)
    this.adapters.set('arbitrum-one', new EvmChainAdapter({
      id: 'arbitrum-one',
      numericChainId: 42161,
      name: 'Arbitrum One (L2 Optimistic Rollup)',
      family: 'evm',
      isTestnet: false,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcEndpoints: [
        'https://arb1.arbitrum.io/rpc',
        'https://rpc.ankr.com/arbitrum',
        'https://1rpc.io/arb'
      ],
      explorerTxUrl: 'https://arbiscan.io/tx/{hash}',
      contractAddress: '0x3E5c010b98D08192aF0a3952f4dB9c02B21098d5',
      supportsMetaTx: true,
      supportsMultisig: true,
      avgBlockTimeSec: 0.25,
      estimatedGasGwei: 0.1,
      status: 'online'
    }));

    // 5. Base (L2 OP Stack)
    this.adapters.set('base-mainnet', new EvmChainAdapter({
      id: 'base-mainnet',
      numericChainId: 8453,
      name: 'Base Mainnet (Coinbase L2)',
      family: 'evm',
      isTestnet: false,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcEndpoints: [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://1rpc.io/base'
      ],
      explorerTxUrl: 'https://basescan.org/tx/{hash}',
      contractAddress: '0x2C467384A485A52eb8Fa7e246944365825cfA23e',
      supportsMetaTx: true,
      supportsMultisig: true,
      avgBlockTimeSec: 2.0,
      estimatedGasGwei: 0.05,
      status: 'online'
    }));

    // 6. Solana Devnet (SVM Alternative Ledger)
    this.adapters.set('solana-devnet', new NonEvmAdapter());
  }

  /**
   * Register a custom chain dynamically at runtime
   */
  registerChain(adapter: IChainAdapter) {
    const config = adapter.getNetworkConfig();
    this.adapters.set(config.id, adapter);
  }

  /**
   * Get adapter by ID or fallback to default
   */
  getAdapter(chainId?: string): IChainAdapter {
    if (!chainId) return this.adapters.get(this.defaultChainId)!;
    const found = this.adapters.get(chainId.toLowerCase());
    if (found) return found;

    // Check numeric match (e.g. "137" or "11155111")
    for (const adapter of this.adapters.values()) {
      if (adapter.getNetworkConfig().numericChainId?.toString() === chainId) {
        return adapter;
      }
    }

    return this.adapters.get(this.defaultChainId)!;
  }

  getDefaultAdapter(): IChainAdapter {
    return this.adapters.get(this.defaultChainId)!;
  }

  getRelayer(): MetaTxRelayerAdapter {
    return this.relayer;
  }

  /**
   * Return all configured networks with their metadata and available alternative methods
   */
  listAllChains(): NetworkConfig[] {
    return Array.from(this.adapters.values()).map(a => a.getNetworkConfig());
  }

  /**
   * Run parallel health check across all registered chains
   */
  async getMultiChainHealth() {
    const promises = Array.from(this.adapters.values()).map(async (adapter) => {
      try {
        return await adapter.checkHealth();
      } catch (err: any) {
        const config = adapter.getNetworkConfig();
        return {
          chainId: config.id,
          isHealthy: false,
          activeEndpoint: config.rpcEndpoints[0],
          blockHeight: 0,
          latencyMs: 9999,
          peerCount: 0,
          lastChecked: Date.now()
        };
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Compare transaction costs across all available chains
   */
  async compareFees(action: string = 'DONATE'): Promise<GasEstimateComparison[]> {
    const estimates = await Promise.all(
      Array.from(this.adapters.values()).map(a => a.estimateFee(action))
    );
    return estimates.sort((a, b) => a.estimatedFeeUsd - b.estimatedFeeUsd);
  }
}

export const chainRegistry = new ChainRegistry();

import { Request, Response, NextFunction } from 'express';
import { chainRegistry } from '../services/chainRegistry.js';
import { IChainAdapter } from '../adapters/IChainAdapter.js';
import { NetworkConfig, ExecutionMethod } from '../types/chain.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      chainAdapter?: IChainAdapter;
      networkConfig?: NetworkConfig;
      settlementMethod?: ExecutionMethod;
    }
  }
}

export function chainResolutionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Look for chain identifier from headers, query parameters, or request body
    const chainHeader = req.headers['x-chain-id'] as string;
    const chainQuery = req.query.chainId as string;
    const chainBody = req.body?.chainId || req.body?.chain_id;

    const requestedChainId = chainHeader || chainQuery || chainBody || 'sim-1337';
    const adapter = chainRegistry.getAdapter(requestedChainId);
    const config = adapter.getNetworkConfig();

    const requestedMethod = (req.headers['x-settlement-method'] as ExecutionMethod) || 
                            req.body?.method || 
                            (req.body?.gaslessSponsor ? 'meta_transaction' : 'direct_rpc');

    req.chainAdapter = adapter;
    req.networkConfig = config;
    req.settlementMethod = requestedMethod;

    // Inject chain headers into response for client transparency
    res.setHeader('X-Target-Chain', config.id);
    res.setHeader('X-Chain-Family', config.family);
    res.setHeader('X-Settlement-Method', requestedMethod);
    res.setHeader('X-Native-Currency', config.nativeCurrency.symbol);

    next();
  } catch (err: any) {
    // Safe fallback to default virtual sandbox
    req.chainAdapter = chainRegistry.getDefaultAdapter();
    req.networkConfig = req.chainAdapter.getNetworkConfig();
    next();
  }
}

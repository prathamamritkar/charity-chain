import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import { ethers } from 'ethers';

import { chainRegistry } from './server/services/chainRegistry.js';
import { chainResolutionMiddleware } from './server/middleware/chainMiddleware.js';
import { TransactionSubmissionRequest } from './server/types/chain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  exposedHeaders: ['X-Target-Chain', 'X-Chain-Family', 'X-Settlement-Method', 'X-Native-Currency']
}));
app.use(express.json());

// Initialize SQLite Relational Database (use /tmp on Vercel serverless environments)
const dbPath = process.env.VERCEL
  ? path.resolve('/tmp', 'charity_analytics.db')
  : path.resolve(__dirname, 'charity_analytics.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize Core Relational Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns_meta (
    campaign_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    organizer_address TEXT NOT NULL,
    target_eth REAL NOT NULL,
    metadata_hash TEXT NOT NULL,
    deadline_timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS spending_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    request_id INTEGER NOT NULL,
    vendor_name TEXT NOT NULL,
    vendor_address TEXT NOT NULL,
    amount_eth REAL NOT NULL,
    invoice_description TEXT NOT NULL,
    invoice_sha256 TEXT NOT NULL,
    is_paid INTEGER DEFAULT 0,
    paid_tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns_meta (campaign_id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    transaction_hash TEXT NOT NULL,
    sender_address TEXT,
    raw_payload TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe multi-chain migrations for flexible backend
const ensureColumn = (table: string, column: string, definition: string) => {
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  if (!columns.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

ensureColumn('campaigns_meta', 'chain_id', "TEXT DEFAULT 'sim-1337'");
ensureColumn('campaigns_meta', 'currency_symbol', "TEXT DEFAULT 'ETH'");
ensureColumn('spending_invoices', 'chain_id', "TEXT DEFAULT 'sim-1337'");
ensureColumn('audit_logs', 'chain_id', "TEXT DEFAULT 'sim-1337'");
ensureColumn('audit_logs', 'settlement_method', "TEXT DEFAULT 'direct_rpc'");
ensureColumn('audit_logs', 'block_number', 'INTEGER DEFAULT 0');

// Compute 32-byte 0x-prefixed SHA-256 hash
function computeSha256(data: string): string {
  return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

// Reset or preset database to pristine defaults
export function resetDatabaseState() {
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM spending_invoices;
    DELETE FROM campaigns_meta;
  `);

  const insertCamp = db.prepare(`
    INSERT INTO campaigns_meta (
      campaign_id, title, description, category, beneficiary_name, organizer_address, target_eth, metadata_hash, deadline_timestamp, chain_id, currency_symbol
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvoice = db.prepare(`
    INSERT INTO spending_invoices (
      campaign_id, request_id, vendor_name, vendor_address, amount_eth, invoice_description, invoice_sha256, is_paid, chain_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (
      campaign_id, event_name, transaction_hash, sender_address, raw_payload, chain_id, settlement_method, block_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Math.floor(Date.now() / 1000);
  const deadline30Days = now + (30 * 24 * 3600);
  const deadline45Days = now + (45 * 24 * 3600);

  // Campaign 1: Rural Hospital ICU
  const desc1 = "Procurement of 5 high-flow ventilators and multi-parameter cardiac monitors for rural trauma ICU in Nandurbar district. Funds are milestone-locked until supplier dispatch notes and warranty certificates are submitted.";
  const title1 = "Rural Hospital Oxygen & Ventilator ICU Fund";
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes(title1));
  insertCamp.run(1, title1, desc1, "Healthcare & Medical Aid", "Jeevan Memorial Charitable Trust", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 12.5, hash1, deadline30Days, 'sim-1337', 'ETH');

  // Invoices for Campaign 1
  const invDesc0 = "Procurement of 3 High-Flow Mechanical Ventilators (Batch A)";
  const invDesc1 = "Oxygen Pipeline Manifold & Emergency Backpressure Regulators";
  const invHash0 = ethers.keccak256(ethers.toUtf8Bytes(invDesc0));
  const invHash1 = ethers.keccak256(ethers.toUtf8Bytes(invDesc1));
  insertInvoice.run(1, 0, "Biomedical Equipments India Ltd", "0x90F79bf6EB2c4f870365E785982E1f101E93b906", 4.5, invDesc0, invHash0, 0, 'sim-1337');
  insertInvoice.run(1, 1, "Cryo Air & Gas Systems Ltd", "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", 3.0, invDesc1, invHash1, 0, 'sim-1337');

  // Audit logs for Campaign 1
  insertAudit.run(1, "CampaignCreated", "0x7a89f9e31d4e0bcf5678a12390ff5d67812984561234567890abcdef12345678", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", JSON.stringify({ target: "12.5 ETH", title: title1 }), 'sim-1337', 'virtual_sandbox', 19482911);
  insertAudit.run(1, "SpendingRequestCreated", "0x33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", JSON.stringify({ requestId: 0, amount: "4.5 ETH", vendor: "Biomedical Equipments India Ltd" }), 'sim-1337', 'virtual_sandbox', 19482912);

  // Campaign 2: Solar Borewell Clean Water
  const desc2 = "Installation of 3 solar-powered borewell filtration pumps and gravity-fed distribution tanks across 4 drought-prone hamlets in Vidarbha region. Directly pays the licensed drilling contractors upon water table verification.";
  const title2 = "Drought-Resilient Solar Borewell & Clean Water Initiative";
  const hash2 = ethers.keccak256(ethers.toUtf8Bytes(title2));
  insertCamp.run(2, title2, desc2, "Clean Water & Rural Infrastructure", "Gramin Vikas Foundation", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 8.0, hash2, deadline45Days, 'polygon-pos', 'POL');

  const invDesc2_0 = "Deep Geotechnical Borewell Drilling & Solar Submersible Assembly";
  const invHash2_0 = ethers.keccak256(ethers.toUtf8Bytes(invDesc2_0));
  insertInvoice.run(2, 0, "Apex Geotechnical & Solar Drilling Corp", "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df", 3.2, invDesc2_0, invHash2_0, 0, 'polygon-pos');
  insertAudit.run(2, "CampaignCreated", "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", JSON.stringify({ target: "8.0 POL", title: title2 }), 'polygon-pos', 'direct_rpc', 58190241);
}

// Seed initial realistic data if database is empty
const existingCount = db.prepare('SELECT COUNT(*) as count FROM campaigns_meta').get() as { count: number };
if (existingCount.count === 0) {
  resetDatabaseState();
}

// Attach dynamic chain resolution middleware to all /api routes
app.use('/api', chainResolutionMiddleware);

// ==========================================
// Multi-Chain & Alternative Methods APIs
// ==========================================

// 1. GET all supported networks with alternative execution methods
app.get('/api/chains', (req, res) => {
  try {
    const chains = chainRegistry.listAllChains();
    const availableMethods = [
      { id: 'direct_rpc', name: 'Direct Node RPC', description: 'Standard native node RPC execution with user gas payment' },
      { id: 'meta_transaction', name: 'Gasless Meta-Tx (EIP-712)', description: 'Relayer-sponsored gasless transaction for donors' },
      { id: 'multisig_escrow', name: 'Multi-Signature Governance', description: 'Threshold multisig approval for high-value vendor disbursements' },
      { id: 'optimistic_relayer', name: 'Optimistic Relayer', description: 'Instant off-chain confirmation with on-chain fraud challenge period' },
      { id: 'virtual_sandbox', name: 'Virtual Consensus Sandbox', description: 'Zero-latency deterministic state machine for local verification' }
    ];

    res.json({
      success: true,
      defaultChain: 'sim-1337',
      totalChains: chains.length,
      chains,
      availableMethods
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET multi-chain node health & latency check
app.get('/api/chains/health', async (req, res) => {
  try {
    const health = await chainRegistry.getMultiChainHealth();
    res.json({ success: true, timestamp: Date.now(), health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET cross-chain fee comparison
app.get('/api/chains/fees', async (req, res) => {
  try {
    const action = (req.query.action as string) || 'DONATE';
    const feeComparisons = await chainRegistry.compareFees(action);
    res.json({ success: true, action, feeComparisons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET gasless relayer info
app.get('/api/chains/relayer', (req, res) => {
  try {
    const relayer = chainRegistry.getRelayer();
    res.json({ success: true, ...relayer.getRelayerInfo() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST universal transaction executor
// Dispatches any action across any configured chain using the requested settlement method
app.post('/api/chains/execute', async (req, res) => {
  try {
    const { campaignId, chainId, method, sender, action, amount, payload, signature, gaslessSponsor } = req.body;

    if (!sender || !action) {
      return res.status(400).json({ success: false, error: 'sender and action are required' });
    }

    const adapter = req.chainAdapter || chainRegistry.getAdapter(chainId);
    const resolvedMethod = method || (gaslessSponsor ? 'meta_transaction' : 'direct_rpc');

    const txRequest: TransactionSubmissionRequest = {
      campaignId: campaignId ? parseInt(campaignId, 10) : 0,
      chainId: adapter.getNetworkConfig().id,
      method: resolvedMethod,
      sender,
      action,
      amount: amount ? parseFloat(amount) : undefined,
      payload: payload || {},
      signature,
      gaslessSponsor: Boolean(gaslessSponsor)
    };

    let result;
    if (resolvedMethod === 'meta_transaction' || gaslessSponsor) {
      result = await chainRegistry.getRelayer().relayTransaction(adapter, txRequest);
    } else {
      result = await adapter.executeTransaction(txRequest);
    }

    // Persist to SQLite audit log with chain ID and settlement method
    if (result.success && txRequest.campaignId) {
      db.prepare(`
        INSERT INTO audit_logs (campaign_id, event_name, transaction_hash, sender_address, raw_payload, chain_id, settlement_method, block_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txRequest.campaignId,
        `Tx_${action}`,
        result.txHash,
        sender,
        JSON.stringify({ ...payload, amount, chain: result.chainId, method: result.settlementMethod }),
        result.chainId,
        result.settlementMethod,
        result.blockNumber
      );
    }

    res.json({ success: true, transaction: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST dedicated gasless meta-transaction relay
app.post('/api/meta-tx/relay', async (req, res) => {
  try {
    const { campaignId, chainId, sender, action, amount, payload, signature } = req.body;
    const adapter = chainRegistry.getAdapter(chainId);

    const result = await chainRegistry.getRelayer().relayTransaction(adapter, {
      campaignId: campaignId || 0,
      chainId: adapter.getNetworkConfig().id,
      method: 'meta_transaction',
      sender,
      action: action || 'DONATE',
      amount,
      payload,
      signature,
      gaslessSponsor: true
    });

    res.json({ success: true, relayed: true, transaction: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Core Campaign & Escrow REST APIs
// ==========================================

// 7. GET all campaigns
app.get('/api/campaigns', (req, res) => {
  try {
    const chainFilter = req.query.chainId as string;
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT i.id) as invoice_count,
        COALESCE(SUM(CASE WHEN i.is_paid = 1 THEN i.amount_eth ELSE 0 END), 0) as total_disbursed_eth
      FROM campaigns_meta c
      LEFT JOIN spending_invoices i ON c.campaign_id = i.campaign_id
    `;
    const params: any[] = [];

    if (chainFilter) {
      query += ' WHERE c.chain_id = ? ';
      params.push(chainFilter);
    }

    query += ' GROUP BY c.campaign_id ORDER BY c.campaign_id ASC';

    const campaigns = db.prepare(query).all(...params);
    res.json({ success: true, campaigns, activeChain: req.networkConfig?.id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET single campaign with details & invoices
app.get('/api/campaigns/:id', (req, res) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const campaign = db.prepare('SELECT * FROM campaigns_meta WHERE campaign_id = ?').get(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const invoices = db.prepare('SELECT * FROM spending_invoices WHERE campaign_id = ? ORDER BY request_id ASC').all(campaignId);
    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE campaign_id = ? ORDER BY id DESC LIMIT 50').all(campaignId);

    res.json({
      success: true,
      campaign,
      invoices,
      auditLogs,
      activeChain: req.networkConfig?.id
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST create new campaign metadata
app.post('/api/campaigns', (req, res) => {
  try {
    const { campaign_id, title, description, category, beneficiary_name, organizer_address, target_eth, duration_days, chain_id, currency_symbol } = req.body;
    
    if (!title || !description || !target_eth || !organizer_address) {
      return res.status(400).json({ success: false, error: 'Missing required campaign parameters' });
    }

    const targetChain = chain_id || req.networkConfig?.id || 'sim-1337';
    const currency = currency_symbol || req.networkConfig?.nativeCurrency.symbol || 'ETH';

    const payloadString = JSON.stringify({ title, description, beneficiary_name, targetChain, timestamp: Date.now() });
    const metadata_hash = computeSha256(payloadString);
    const now = Math.floor(Date.now() / 1000);
    const deadline = now + ((duration_days || 30) * 24 * 3600);

    const insert = db.prepare(`
      INSERT INTO campaigns_meta (
        campaign_id, title, description, category, beneficiary_name, organizer_address, target_eth, metadata_hash, deadline_timestamp, chain_id, currency_symbol
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      campaign_id,
      title,
      description,
      category || 'General Welfare',
      beneficiary_name || 'Public Welfare',
      organizer_address,
      parseFloat(target_eth),
      metadata_hash,
      deadline,
      targetChain,
      currency
    );

    res.status(201).json({
      success: true,
      campaign_id,
      metadata_hash,
      chain_id: targetChain,
      currency_symbol: currency,
      message: `Campaign metadata anchored in SQLite for chain: ${targetChain}`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST create spending request invoice
app.post('/api/invoices', (req, res) => {
  try {
    const { campaign_id, request_id, vendor_name, vendor_address, amount_eth, invoice_description, raw_invoice_data, chain_id } = req.body;

    if (!campaign_id || request_id === undefined || !vendor_name || !vendor_address || !amount_eth) {
      return res.status(400).json({ success: false, error: 'Missing invoice fields' });
    }

    const invoiceHash = req.body.invoice_sha256 || req.body.invoice_hash || ethers.keccak256(ethers.toUtf8Bytes(raw_invoice_data || `${vendor_name}-${amount_eth}-${invoice_description}`));
    const targetChain = chain_id || req.networkConfig?.id || 'sim-1337';

    const insert = db.prepare(`
      INSERT INTO spending_invoices (
        campaign_id, request_id, vendor_name, vendor_address, amount_eth, invoice_description, invoice_sha256, is_paid, chain_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    insert.run(campaign_id, request_id, vendor_name, vendor_address, parseFloat(amount_eth), invoice_description || 'Vendor Supply Invoice', invoiceHash, targetChain);

    res.status(201).json({
      success: true,
      invoice_sha256: invoiceHash,
      chain_id: targetChain,
      message: 'Invoice cryptographically pinned for milestone spending'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. POST record smart contract event
app.post('/api/events', (req, res) => {
  try {
    const { campaign_id, event_name, transaction_hash, sender_address, raw_payload, chain_id, settlement_method, block_number } = req.body;

    if (!campaign_id || !event_name || !transaction_hash) {
      return res.status(400).json({ success: false, error: 'Missing event sync data' });
    }

    const targetChain = chain_id || req.networkConfig?.id || 'sim-1337';
    const method = settlement_method || req.settlementMethod || 'direct_rpc';

    const insert = db.prepare(`
      INSERT INTO audit_logs (campaign_id, event_name, transaction_hash, sender_address, raw_payload, chain_id, settlement_method, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      campaign_id,
      event_name,
      transaction_hash,
      sender_address || '0x0000000000000000000000000000000000000000',
      JSON.stringify(raw_payload || {}),
      targetChain,
      method,
      block_number || 0
    );

    // If spending request finalized, mark invoice as paid
    if (event_name === 'SpendingRequestFinalized' && raw_payload && raw_payload.requestId !== undefined) {
      db.prepare(`
        UPDATE spending_invoices 
        SET is_paid = 1, paid_tx_hash = ?
        WHERE campaign_id = ? AND request_id = ?
      `).run(transaction_hash, campaign_id, raw_payload.requestId);
    }

    res.json({ success: true, chain_id: targetChain, message: 'Event synchronized to immutable audit log' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. GET audit trail (filterable by campaign or chain)
app.get('/api/audit', (req, res) => {
  try {
    const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string, 10) : null;
    const chainFilter = req.query.chainId as string;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (campaignId) {
      query += ' AND campaign_id = ?';
      params.push(campaignId);
    }

    if (chainFilter) {
      query += ' AND chain_id = ?';
      params.push(chainFilter);
    }

    query += ' ORDER BY id DESC LIMIT 100';

    const logs = db.prepare(query).all(...params);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. POST hash verification helper
app.post('/api/verify-hash', (req, res) => {
  try {
    const { raw_text, expected_hash } = req.body;
    if (!raw_text || !expected_hash) {
      return res.status(400).json({ success: false, error: 'Provide raw_text and expected_hash' });
    }

    const calculatedKeccak = ethers.keccak256(ethers.toUtf8Bytes(raw_text));
    const calculatedSha256 = computeSha256(raw_text);
    const matchesKeccak = calculatedKeccak.toLowerCase() === expected_hash.toLowerCase();
    const matchesSha256 = calculatedSha256.toLowerCase() === expected_hash.toLowerCase();
    const matches = matchesKeccak || matchesSha256;
    const algorithm = matchesKeccak ? 'Keccak-256' : 'SHA-256';

    res.json({
      success: true,
      calculated_hash: matchesKeccak ? calculatedKeccak : calculatedSha256,
      expected_hash,
      matches,
      algorithm
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. POST reset / preset simulation state
app.post('/api/reset', (req, res) => {
  try {
    resetDatabaseState();
    res.json({
      success: true,
      message: 'Simulation database preset to pristine default state',
      timestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CharityChain Multi-Chain Middleware & Backend',
    registeredChains: chainRegistry.listAllChains().length,
    activeChain: req.networkConfig?.id || 'sim-1337',
    timestamp: new Date().toISOString()
  });
});

// Mount Vite in dev or serve static assets in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`[CharityChain Multi-Chain Server] running on http://0.0.0.0:${PORT} (${isProd ? 'Production' : 'Development'})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

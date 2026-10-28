import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'charity_analytics.db');

export function runPreset(verbose = true) {
  const db = new Database(dbPath);
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      chain_id TEXT DEFAULT 'sim-1337',
      currency_symbol TEXT DEFAULT 'ETH'
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
      chain_id TEXT DEFAULT 'sim-1337',
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
      chain_id TEXT DEFAULT 'sim-1337',
      settlement_method TEXT DEFAULT 'direct_rpc',
      block_number INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clear existing state to pristine factory defaults
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

  db.close();

  if (verbose) {
    console.log("✅ Simulation database successfully reset to factory preset defaults!");
  }
}

// When called directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPreset(true);
}

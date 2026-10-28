# CharityChain 🛡️
### Decentralized Milestone-Governed Escrow & Cryptographic Philanthropy Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![EVM Compatible](https://img.shields.io/badge/EVM-Compatible-627eea.svg)](https://ethereum.org/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployable-black.svg)](https://vercel.com/)

---

## 📌 Executive Overview

Traditional philanthropic fundraising suffers from an entrenched **agency and transparency gap**: once donations leave a contributor's wallet, they enter opaque bank accounts with zero donor recourse and high administrative overhead.

**CharityChain** is a production-grade Web3 escrow and governance protocol engineered to eliminate charitable fund leakage through **smart contract escrow**, **direct vendor settlements**, and **weighted donor consensus**.

### Core Protocol Invariants
1. **100% Escrow Custody**: Contributed funds are held inside smart contract escrow (`0x5FbDB2315678afecb367f032d93F642f64180aa3`). Campaign organizers **never** have direct custody, withdrawal, or redirection permissions.
2. **Direct-to-Vendor Settlement**: Payments are disbursed directly to pre-registered supplier/vendor wallet addresses upon milestone approval, bypassing organizers entirely.
3. **Consensus Majority Gate (>50%)**: No funds are released unless a spending bill achieves strictly greater than 50% approval from verified donors of that campaign, proportional to their donation stake.
4. **Cryptographic Invoice Immutability**: Every bill and delivery note is pinned via 32-byte **Keccak-256** hash anchors verified against on-chain transaction logs.
5. **Fail-Safe Refund Guarantee**: If a campaign fails to hit its funding target by the deadline timestamp, donors can invoke `claimRefund()` to reclaim 100% of their principal.

---

## 🏛️ System Architecture

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         CharityChain Web Client (React 19)                  │
 │      [Clean Slate & Trust Teal Palette · Segmented Gauges · Tooltips]       │
 └──────────────────────┬───────────────────────────────┬──────────────────────┘
                        │                               │
        EIP-1193 / Ethers.js Engine            REST API / Server Sync
                        │                               │
 ┌──────────────────────▼────────────────┐  ┌───────────▼──────────────────────┐
 │       EVM Escrow State Engine         │  │   Multi-Chain Resolution Engine  │
 │  • CEI Checks-Effects-Interactions    │  │   • Dynamic Chain Registry       │
 │  • Stake-Weighted Consensus Logic     │  │   • Gasless EIP-712 Relayer      │
 │  • Direct Vendor Payout Execution     │  │   • Multi-Sig Escrow Adaptors    │
 │  • Timelocked Refund Invariant        │  │   • Optimistic Relayer & Health  │
 └──────────────────────┬────────────────┘  └───────────┬──────────────────────┘
                        │                               │
 ┌──────────────────────▼───────────────────────────────▼──────────────────────┐
 │                Dual-Layer Cryptographic Audit Trail                         │
 │  • On-Chain Logs: Keccak-256 Hashes, Blocks, Merkle Transaction Receipts    │
 │  • Relational Store: SQLite WAL / Serverless Storage (/tmp on Vercel)       │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Smart Contract Escrow Mechanics
- **Checks-Effects-Interactions (CEI)**: Every payment updates internal state before transferring funds, mathematically eliminating reentrancy vulnerabilities.
- **Weighted Consensus**: `Approval% = (ApprovedDonorStake / TotalDonatedETH) * 100`. Only milestones exceeding the `50.0%` majority gate can be triggered.
- **Solidity Custom Errors**:
  - `NoDonationFound()`: Only donors who contributed to the campaign can cast approval votes.
  - `AlreadyVoted()`: Prevents duplicate voting power exploitation.
  - `RequestAlreadyExecuted()`: Milestone request is already finalized and payment has been disbursed to vendor.
  - `CampaignAlreadyClosed()`: Campaign is marked as closed.
  - `TargetNotMet()`: Consensus required > 50% approval before disbursement.
  - `InsufficientContractBalance()`: Contract balance insufficient for payout.
  - `DeadlineNotPassed()`: Refund cannot be claimed until the campaign deadline has expired.
  - `TargetMetCannotRefund()`: Campaign reached its target; escrow funds are allocated to vendor milestones.

### 2. Multi-Chain Middleware & Settlement Methods
The protocol includes a dynamic chain resolution layer supporting 5 alternative execution methods across modern blockchain networks:
| Method ID | Method Name | Description | Gas Model |
|:---|:---|:---|:---|
| `direct_rpc` | Direct Node RPC | Standard native transaction broadcast to node | User Gas |
| `meta_transaction` | Gasless Meta-Tx (EIP-712) | Relayer-sponsored transaction for zero-gas donor onboarding | Sponsored |
| `multisig_escrow` | Multi-Signature Governance | High-value vendor disbursement requiring multi-key quorums | Threshold |
| `optimistic_relayer` | Optimistic Relayer | Instant off-chain confirmation with fraud challenge window | Layer-2 Optimistic |
| `virtual_sandbox` | Virtual Consensus Sandbox | Zero-latency deterministic state machine for local validation | Zero Gas |

---

## 👥 Role-Based Access Control (RBAC) & Personas

The dApp includes a built-in Persona Switcher simulating realistic real-world actors:

| Persona | Role | Address | Demo Balance | Permissions & Authority |
|:---|:---|:---|:---|:---|
| **Dr. Arvind Kulkarni** | Organizer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 12.80 ETH | Can initialize campaigns and submit vendor invoice requests. **Cannot** withdraw escrow funds or vote on own milestones. |
| **Alice Sharma** | Angel Donor | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 48.50 ETH | Contributed 6.00 ETH to Campaign #1 (80% voting weight). Has unilateral majority power to approve or veto milestones. |
| **Bob Deshmukh** | Community Donor | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 25.00 ETH | Contributed 1.50 ETH to Campaign #1 (20% voting weight) and 3.00 ETH to Campaign #2. Can claim refunds if target fails. |
| **Biomedical Equipments Ltd** | Verified Supplier | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 104.20 ETH | Pre-registered vendor wallet. Directly receives contract funds when approved milestone bills are finalized. |
| **MetaMask / Browser Web3** | External Signer | *Dynamic EIP-1193* | *On-chain* | Live browser wallet integration. Can trigger actions on testnets or local nodes with faucet top-ups (+5 ETH). |

---

## 🚀 "Try It Out" Step-by-Step Scenario Guide

### Scenario 1: Cryptographic Invoice Hash Verification
1. Navigate to the **Campaigns & Causes** tab (`Campaigns` in top navigation).
2. Locate the **Rural Hospital Oxygen & Ventilator ICU Fund** card.
3. In the bills indicator row, click **Verify Hash** (or click any milestone's invoice hash link).
4. The **Cryptographic Invoice Verifier** modal opens:
   - It performs real-time **Keccak-256** hash calculation against the canonical bill text.
   - Observe the byte-for-byte matching badge: **100% Cryptographic Match On-Chain**.
   - Edit a character in the text sandbox to watch the checksum fail instantly if tampered with.

### Scenario 2: Milestone Consensus & Direct Vendor Disbursal Flow
1. Click the top-right **Persona Switcher** badge (showing role glyph and balance).
2. Select **Alice Sharma (Angel Donor)**.
3. Click the **Milestones & Governance** tab (`Milestones` in top navigation).
4. Select Campaign #1 (**Rural Hospital Oxygen & Ventilator ICU Fund**):
   - Notice **Milestone #1: Procurement of 3 High-Flow Mechanical Ventilators (Batch A)**:
   - Alice’s 6.00 ETH donation represents **80% consensus weight** (exceeds the 50% majority gate).
5. Notice the green **Disburse** button is active:
   - Click **Disburse**.
   - The button shows a real-time `Disbursing...` loading state.
   - The contract settles on-chain: `SpendingRequestFinalized` event is emitted.
   - The 4.50 ETH is transferred **directly** from the contract escrow into **Biomedical Equipments Ltd's** wallet (`0x90F79b...`).
   - The status updates to **Disbursed** with green checkmark badges.

### Scenario 3: Submitting a New Verified Vendor Bill as Organizer
1. Open the Persona Switcher and select **Dr. Arvind Kulkarni (Organizer)**.
2. Go to **Milestones & Governance** and click **Submit Milestone Bill**.
3. Fill in the bill parameters:
   - **Expense Item Description**: `Procurement of 2 Additional Ventilator Trolleys`
   - **Vendor Name**: `Cryo Air & Gas Systems Ltd`
   - **Vendor Wallet Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
   - **Milestone Payout Amount**: `2.0` ETH
   - **Detailed Invoice & Dispatch Text**: `INV-CRYO-2026-TROLLEYS-BATCH-B`
4. Click **Submit for Voting**:
   - The invoice text is hashed via Keccak-256.
   - The request is anchored in the smart contract escrow.
   - Donors can now cast weighted approval votes.

### Scenario 4: External MetaMask / Web3 Wallet Connection
1. Open the Persona Switcher and select **Connect MetaMask / Browser Web3**.
2. If your browser has MetaMask installed, approve the standard `eth_requestAccounts` prompt.
3. If an extension is not detected or you want instant simulation, click **Add +5.0 Test ETH** to top up demo balance.
4. The dApp binds directly to live account change and network change events via EIP-1193.

### Scenario 5: Resetting the Simulation to Factory Defaults
- Click the iconic **Reset** button (`RotateCcw`) in the top navigation bar.
- Both in-memory contract state and SQLite audit databases are instantly reset to pristine factory presets.

---

## 💻 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/charity-chain.git
cd charity-chain
npm install
```

### 2. Preset Simulation State
Initialize the SQLite database with factory campaigns and verified cryptographic hashes:
```bash
npm run preset
```

### 3. Run Development Server
Starts the full-stack Express server with Vite middleware on port 3000:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```

---

## ☁️ Deployment Guide (Hostable on Vercel)

CharityChain is architected to deploy to **Vercel** with zero extra configuration.

### 1-Click Vercel Deployment via Git
1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial CharityChain release"
   git remote add origin https://github.com/<your-username>/charity-chain.git
   git push -u origin main
   ```
2. Navigate to [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Select your `charity-chain` GitHub repository.
4. Vercel automatically detects the Vite configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

### How Vercel Compatibility Works
- **Client-Side Fallback (`vercel.json`)**: Configured with single-page application routing rewrites so all routes resolve cleanly to `/index.html`.
- **Zero-Latency In-Memory Escrow**: The client EVM state machine executes authoritatively in browser memory with full cryptographic hashing.
- **Serverless Path Handling**: If executing backend APIs on Vercel Serverless Functions, SQLite database paths automatically resolve to `/tmp` to support read-write execution in serverless container environments.

---

## 📡 REST API Reference

The backend provides comprehensive endpoints for cross-chain querying and audit trail inspection:

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/chains` | Returns all supported networks and execution methods |
| `GET` | `/api/chains/health` | Multi-chain node latency and status checks |
| `GET` | `/api/chains/fees` | Cross-chain gas fee comparison engine |
| `GET` | `/api/chains/relayer` | EIP-712 sponsored gasless relayer status |
| `POST` | `/api/chains/execute` | Universal transaction executor supporting all 5 settlement methods |
| `GET` | `/api/campaigns` | Lists all campaigns with live disbursement and escrow balances |
| `POST` | `/api/invoices` | Pinned spending request invoice with cryptographic Keccak-256 hash anchor |
| `POST` | `/api/events` | Synchronizes on-chain events to immutable audit logs |
| `GET` | `/api/audit` | Retrieves tamper-evident audit trail (filterable by chain or campaign) |
| `POST` | `/api/verify-hash` | Cryptographic verification helper validating payload hashes (Keccak-256 & SHA-256) |
| `POST` | `/api/reset` | Resets the simulation database to factory presets |
| `GET` | `/api/health` | System health check and uptime monitor |

---

## 📁 Repository Directory Structure

```
charity-chain/
├── scripts/
│   └── presetDefaults.ts          # CLI database seeder and reset automation
├── server/
│   ├── adapters/                  # Multi-chain adapters (Ethereum, Polygon, Arbitrum, Relayers)
│   ├── middleware/                # Dynamic chain resolution & header parser
│   ├── services/                  # ChainRegistry & Gasless Relayer service
│   └── types/                     # Protocol and transaction interface definitions
├── src/
│   ├── components/                # Modular UI components (Cards, Modals, Gauges, Toast)
│   │   ├── AuditTrailView.tsx
│   │   ├── CampaignCard.tsx
│   │   ├── CreateCampaignModal.tsx
│   │   ├── CreateRequestModal.tsx
│   │   ├── DonateModal.tsx
│   │   ├── InvoiceVerifierModal.tsx
│   │   ├── MilestoneGovernanceView.tsx
│   │   ├── Navbar.tsx
│   │   ├── PersonaSwitcherModal.tsx
│   │   ├── ProtocolSecurityView.tsx
│   │   ├── TransactionToast.tsx
│   │   └── TransparencyMetricsVisualizer.tsx
│   ├── services/
│   │   └── blockchainEngine.ts    # Authoritative EVM escrow simulation engine
│   ├── types/
│   │   └── blockchain.ts          # Shared TypeScript types for Web3 and campaigns
│   ├── App.tsx                    # Root dashboard application
│   ├── index.css                  # Tailwind CSS v4 design tokens and utility rules
│   └── main.tsx                   # React 19 entry point
├── charity_analytics.db           # SQLite database with WAL journaling
├── index.html                     # HTML5 entry with metadata & Google Fonts
├── package.json                   # Dependencies and scripts (build, preset, dev)
├── server.ts                      # Express API and Vite development server
├── tsconfig.json                  # Strict TypeScript configuration
├── vercel.json                    # Vercel deployment configuration
└── vite.config.ts                 # Vite build configuration with Tailwind plugin
```

---

## 🔒 Security Invariants Summary

- **Reentrancy Protection**: Employs CEI pattern across all disbursement methods.
- **Zero Custody by Organizers**: Escrow balances are locked exclusively in contract storage; organizers have no withdraw functions.
- **Cryptographic Hash Immutability**: Deliverables and invoices are tied to Keccak-256 digests; any byte modification triggers a verification failure.
- **Donor Power Parity**: Voting weights scale strictly with confirmed contributions, ensuring that those funding the project direct the release of capital.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute for commercial or open-source purposes.

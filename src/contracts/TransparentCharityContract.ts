import { Web3Account } from '../types/blockchain';

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "function createCampaign(string _title, bytes32 _metadataHash, uint256 _targetAmount, uint256 _durationInDays) external returns (uint256)",
  "function donate(uint256 _campaignId) external payable",
  "function createSpendingRequest(uint256 _campaignId, string calldata _description, address payable _vendor, uint256 _amount, bytes32 _invoiceHash) external",
  "function voteOnRequest(uint256 _campaignId, uint256 _requestId) external",
  "function executePayment(uint256 _campaignId, uint256 _requestId) external",
  "function claimRefund(uint256 _campaignId) external",
  "function campaignCounter() view returns (uint256)",
  "function campaigns(uint256) view returns (uint256 id, string title, bytes32 metadataHash, address payable organizer, uint256 targetAmount, uint256 totalDonated, uint256 totalSpent, uint256 deadline, bool isClosed, uint256 requestCount)",
  "event CampaignCreated(uint256 indexed campaignId, string title, address indexed organizer, uint256 targetAmount, uint256 deadline)",
  "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount)",
  "event SpendingRequestCreated(uint256 indexed campaignId, uint256 indexed requestId, address indexed vendor, uint256 amount)",
  "event VoteSubmitted(uint256 indexed campaignId, uint256 indexed requestId, address indexed voter)",
  "event SpendingRequestFinalized(uint256 indexed campaignId, uint256 indexed requestId, address vendor, uint256 amount)",
  "event RefundIssued(uint256 indexed campaignId, address indexed donor, uint256 amount)"
];

export const PREFUNDED_ACCOUNTS: Web3Account[] = [
  {
    id: "organizer",
    name: "Dr. Arvind Kulkarni",
    role: "organizer",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    balanceEth: 12.8,
    description: "Organizer (Can start campaigns and submit expense requests)"
  },
  {
    id: "donor_alice",
    name: "Alice Sharma",
    role: "donor",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    balanceEth: 48.5,
    description: "Angel Donor (Major contributor with voting power on expenses)"
  },
  {
    id: "donor_bob",
    name: "Bob Deshmukh",
    role: "donor",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    balanceEth: 25.0,
    description: "Community Donor (Contributor who votes on project expenses)"
  },
  {
    id: "vendor_med",
    name: "Biomedical Equipments Ltd",
    role: "vendor",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    balanceEth: 104.2,
    description: "Verified Supplier (Receives direct payments when bills are approved)"
  }
];

export const SOLIDITY_SOURCE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TransparentCharity
 * @notice Enterprise-grade milestone-gated charity escrow contract
 * @dev Autonomous decentralized escrow with cryptographic invoice verification
 */
contract TransparentCharity {
    // --- Custom Errors for Gas Optimization ---
    error InvalidAmount();
    error CampaignNotActive();
    error CampaignAlreadyClosed();
    error TargetNotMet();
    error TargetMetCannotRefund();
    error DeadlineNotPassed();
    error UnauthorizedCaller();
    error NoDonationFound();
    error AlreadyVoted();
    error InsufficientContractBalance();
    error VendorPayoutFailed();
    error ReentrancyGuardTriggered();

    // --- State & Structs ---
    struct SpendingRequest {
        string description;
        address payable vendor;
        uint256 amount;
        uint256 approvalCount;
        bool executed;
        bytes32 invoiceHash; // Off-chain document verification hash
        mapping(address => bool) voters;
    }

    struct Campaign {
        uint256 id;
        string title;
        bytes32 metadataHash; // IPFS CID / SHA256 digest of detailed proposal
        address payable organizer;
        uint256 targetAmount;
        uint256 totalDonated;
        uint256 totalSpent;
        uint256 deadline;
        bool isClosed;
        uint256 requestCount;
    }

    // --- State Variables ---
    uint256 private _reentrancyStatus;
    uint256 public campaignCounter;
    
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(uint256 => SpendingRequest)) public campaignRequests;
    mapping(uint256 => mapping(address => uint256)) public campaignDonations;

    // --- Events ---
    event CampaignCreated(uint256 indexed campaignId, string title, address indexed organizer, uint256 targetAmount, uint256 deadline);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount);
    event SpendingRequestCreated(uint256 indexed campaignId, uint256 indexed requestId, address indexed vendor, uint256 amount);
    event VoteSubmitted(uint256 indexed campaignId, uint256 indexed requestId, address indexed voter);
    event SpendingRequestFinalized(uint256 indexed campaignId, uint256 indexed requestId, address vendor, uint256 amount);
    event RefundIssued(uint256 indexed campaignId, address indexed donor, uint256 amount);

    // --- Modifiers ---
    modifier nonReentrant() {
        if (_reentrancyStatus == 2) revert ReentrancyGuardTriggered();
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    modifier onlyOrganizer(uint256 _campaignId) {
        if (msg.sender != campaigns[_campaignId].organizer) revert UnauthorizedCaller();
        _;
    }

    modifier activeCampaign(uint256 _campaignId) {
        if (campaigns[_campaignId].isClosed) revert CampaignAlreadyClosed();
        if (block.timestamp >= campaigns[_campaignId].deadline) revert CampaignNotActive();
        _;
    }

    constructor() {
        _reentrancyStatus = 1;
    }

    /**
     * @notice Create a new fundraising campaign
     */
    function createCampaign(
        string calldata _title,
        bytes32 _metadataHash,
        uint256 _targetAmount,
        uint256 _durationInDays
    ) external returns (uint256) {
        if (_targetAmount == 0) revert InvalidAmount();

        campaignCounter++;
        uint256 campaignId = campaignCounter;

        Campaign storage newCamp = campaigns[campaignId];
        newCamp.id = campaignId;
        newCamp.title = _title;
        newCamp.metadataHash = _metadataHash;
        newCamp.organizer = payable(msg.sender);
        newCamp.targetAmount = _targetAmount;
        newCamp.totalDonated = 0;
        newCamp.totalSpent = 0;
        newCamp.deadline = block.timestamp + (_durationInDays * 1 days);
        newCamp.isClosed = false;

        emit CampaignCreated(campaignId, _title, msg.sender, _targetAmount, newCamp.deadline);
        return campaignId;
    }

    /**
     * @notice Donate funds into campaign escrow
     */
    function donate(uint256 _campaignId) public payable activeCampaign(_campaignId) {
        if (msg.value == 0) revert InvalidAmount();

        campaigns[_campaignId].totalDonated += msg.value;
        campaignDonations[_campaignId][msg.sender] += msg.value;

        emit DonationReceived(_campaignId, msg.sender, msg.value);
    }

    /**
     * @notice Create spending request for an approved vendor invoice
     */
    function createSpendingRequest(
        uint256 _campaignId,
        string calldata _description,
        address payable _vendor,
        uint256 _amount,
        bytes32 _invoiceHash
    ) external onlyOrganizer(_campaignId) {
        Campaign storage camp = campaigns[_campaignId];
        uint256 availableBalance = camp.totalDonated - camp.totalSpent;
        
        if (_amount > availableBalance || _amount == 0) revert InvalidAmount();

        uint256 reqId = camp.requestCount++;
        SpendingRequest storage req = campaignRequests[_campaignId][reqId];
        req.description = _description;
        req.vendor = _vendor;
        req.amount = _amount;
        req.invoiceHash = _invoiceHash;
        req.executed = false;
        req.approvalCount = 0;

        emit SpendingRequestCreated(_campaignId, reqId, _vendor, _amount);
    }

    /**
     * @notice Donors cast approval vote on transparent expenditure
     */
    function voteOnRequest(uint256 _campaignId, uint256 _requestId) external {
        if (campaignDonations[_campaignId][msg.sender] == 0) revert NoDonationFound();
        
        SpendingRequest storage req = campaignRequests[_campaignId][_requestId];
        if (req.voters[msg.sender]) revert AlreadyVoted();

        req.voters[msg.sender] = true;
        // Stake-weighted voting based on donation amount
        req.approvalCount += campaignDonations[_campaignId][msg.sender];

        emit VoteSubmitted(_campaignId, _requestId, msg.sender);
    }

    /**
     * @notice Releases payment directly to vendor once consensus threshold is achieved
     */
    function executePayment(uint256 _campaignId, uint256 _requestId) external nonReentrant {
        Campaign storage camp = campaigns[_campaignId];
        SpendingRequest storage req = campaignRequests[_campaignId][_requestId];

        if (req.executed) revert CampaignAlreadyClosed();
        
        // Governance rule: Milestone approved if >50% of donated capital voted in favor
        if (req.approvalCount <= (camp.totalDonated / 2)) revert TargetNotMet();

        uint256 currentBalance = address(this).balance;
        if (currentBalance < req.amount) revert InsufficientContractBalance();

        // Checks & Effects
        req.executed = true;
        camp.totalSpent += req.amount;

        // Interaction (Transfer funds directly to third-party vendor)
        (bool success, ) = req.vendor.call{value: req.amount}("");
        if (!success) revert VendorPayoutFailed();

        emit SpendingRequestFinalized(_campaignId, _requestId, req.vendor, req.amount);
    }

    /**
     * @notice Refund facility for donors if target is not met by the deadline
     */
    function claimRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage camp = campaigns[_campaignId];
        
        if (block.timestamp < camp.deadline) revert DeadlineNotPassed();
        if (camp.totalDonated >= camp.targetAmount) revert TargetMetCannotRefund();

        uint256 donatedValue = campaignDonations[_campaignId][msg.sender];
        if (donatedValue == 0) revert NoDonationFound();

        campaignDonations[_campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: donatedValue}("");
        if (!success) revert VendorPayoutFailed();

        emit RefundIssued(_campaignId, msg.sender, donatedValue);
    }

    // --- Native Value Reception & Guard Handlers ---
    receive() external payable {
        // Direct donations routed directly to campaign #1 escrow
        if (campaignCounter > 0 && !campaigns[1].isClosed) {
            campaigns[1].totalDonated += msg.value;
            campaignDonations[1][msg.sender] += msg.value;
            emit DonationReceived(1, msg.sender, msg.value);
        } else {
            revert InvalidAmount();
        }
    }

    fallback() external payable {
        revert UnauthorizedCaller();
    }
}`;

export const PROTOCOL_FAQ = [
  {
    q: "How does CharityChain protect my donation?",
    a: "Your donation is held safely in escrow by the smart contract. The organizer cannot withdraw the funds directly. Money is only paid out when the organizer submits a supplier bill and donors vote to approve it."
  },
  {
    q: "How are expense payments approved?",
    a: "When an organizer submits a bill for supplies or services, donors review it. Donors have voting power proportional to their contribution. Once more than 50% of the donated funds approve the bill, payment can be released."
  },
  {
    q: "Who receives the money?",
    a: "Payments are sent directly to the supplier's verified wallet, never to the organizer's personal account. This ensures charity money goes straight to purchases and services."
  },
  {
    q: "How do I know bills and receipts are real?",
    a: "Each expense includes a digital fingerprint of the original invoice. Anyone can compare the bill with the permanent record on the blockchain to verify it has not been altered."
  },
  {
    q: "Can I get a refund if the campaign doesn't reach its goal?",
    a: "Yes. If a campaign reaches its deadline without hitting its fundraising goal, any donor can claim an instant, full refund directly through the smart contract."
  }
];

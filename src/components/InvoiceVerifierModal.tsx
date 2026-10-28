import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, Copy, Check, FileCode, Fingerprint } from 'lucide-react';
import { ethers } from 'ethers';

interface InvoiceVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialHash?: string;
  initialDescription?: string;
}

export const InvoiceVerifierModal: React.FC<InvoiceVerifierModalProps> = ({
  isOpen,
  onClose,
  initialHash = '',
  initialDescription = ''
}) => {
  const [targetHash, setTargetHash] = useState(initialHash);
  const [inputText, setInputText] = useState(
    initialDescription || 'Invoice #INV-2026-4491: 5x Medical Grade Multipara Monitors with 2-year warranty'
  );
  const [calculatedKeccak, setCalculatedKeccak] = useState('');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeHash = initialHash || '';
      const activeText = initialDescription || '';
      setTargetHash(activeHash);
      setInputText(activeText);

      if (activeHash && activeText) {
        try {
          const computed = ethers.keccak256(ethers.toUtf8Bytes(activeText.trim()));
          setCalculatedKeccak(computed);
          setIsMatch(computed.toLowerCase() === activeHash.trim().toLowerCase());
        } catch {
          setCalculatedKeccak('');
          setIsMatch(null);
        }
      } else {
        setCalculatedKeccak('');
        setIsMatch(null);
      }
    }
  }, [isOpen, initialHash, initialDescription]);

  if (!isOpen) return null;

  const handleVerify = () => {
    try {
      const computed = ethers.keccak256(ethers.toUtf8Bytes(inputText.trim()));
      setCalculatedKeccak(computed);

      if (targetHash.trim()) {
        const matches = computed.toLowerCase() === targetHash.trim().toLowerCase();
        setIsMatch(matches);
      } else {
        setIsMatch(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to chunk hashes into visual nibble blocks
  const chunkHash = (hash: string) => {
    const clean = hash.startsWith('0x') ? hash.slice(2) : hash;
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += 8) {
      chunks.push(clean.slice(i, i + 8));
    }
    return chunks;
  };

  const targetChunks = chunkHash(targetHash);
  const calculatedChunks = chunkHash(calculatedKeccak);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-900">Cryptographic Invoice Verifier</h3>
              <p className="text-xs text-slate-500 font-sans">Verify off-chain supplier invoices against on-chain hash anchors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase tracking-wider">
              On-Chain Fingerprint Commitment (Target Hash)
            </label>
            <input
              type="text"
              value={targetHash}
              onChange={(e) => {
                setTargetHash(e.target.value);
                setIsMatch(null);
              }}
              placeholder="0x..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 font-mono uppercase tracking-wider">
              Original Supplier Receipt / Bill Content
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setIsMatch(null);
              }}
              placeholder="Paste raw invoice text..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-teal-500 leading-relaxed shadow-xs"
            />
          </div>

          <button
            onClick={handleVerify}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Generate & Compare Fingerprint</span>
          </button>

          {calculatedKeccak && (
            <div className="space-y-3 pt-2">
              {/* Visual Byte-Block Grid Matcher */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="text-[11px] font-mono text-slate-600 uppercase tracking-wider flex items-center justify-between">
                  <span>Cryptographic Byte-Block Comparison</span>
                  {isMatch !== null && (
                    <span className={`font-bold ${isMatch ? 'text-teal-700' : 'text-rose-700'}`}>
                      {isMatch ? '100% Exact Match Verified' : 'Mismatch Detected'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 font-mono text-[10px]">
                  {calculatedChunks.map((chunk, idx) => {
                    const targetChunk = targetChunks[idx];
                    const chunkMatches = targetChunk && chunk.toLowerCase() === targetChunk.toLowerCase();

                    return (
                      <div
                        key={idx}
                        className={`p-1.5 rounded text-center border transition-all ${
                          targetHash
                            ? chunkMatches
                              ? 'bg-teal-50 border-teal-400 text-teal-800 font-bold'
                              : 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {chunk}
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center justify-between border-t border-slate-200">
                  <span className="truncate pr-2">Calculated: {calculatedKeccak}</span>
                  <button
                    onClick={() => handleCopy(calculatedKeccak)}
                    className="text-slate-500 hover:text-teal-700 shrink-0 p-1 cursor-pointer"
                    title="Copy Calculated Hash"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Status Outcome */}
              {isMatch === true && (
                <div className="p-3 bg-teal-50 border border-teal-300 rounded-lg flex items-center gap-2.5 text-xs text-teal-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    <strong>Authentic Invoice:</strong> The invoice content exactly produces the recorded on-chain SHA-256 fingerprint. No tampering or alteration detected.
                  </span>
                </div>
              )}

              {isMatch === false && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2.5 text-xs text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Verification Failed:</strong> The provided invoice text does not match the on-chain recorded fingerprint. The bill may have been altered or replaced.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

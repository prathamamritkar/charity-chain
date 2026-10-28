import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { TxResult } from '../services/blockchainEngine';

interface TransactionToastProps {
  txResult: TxResult | null;
  errorMessage: string | null;
  onClose: () => void;
}

export const TransactionToast: React.FC<TransactionToastProps> = ({
  txResult,
  errorMessage,
  onClose
}) => {
  if (!txResult && !errorMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slide-up">
      {txResult && !errorMessage && (
        <div className="p-4 bg-white border border-teal-500/80 rounded-xl shadow-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-800 font-semibold font-display">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Transaction Settled On-Chain</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close toast"
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="font-mono text-slate-800 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Event:</span>
              <span className="text-teal-700 font-bold">{txResult.eventName || 'Confirmed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Block Number:</span>
              <span className="tabular-nums font-bold">#{txResult.blockNumber}</span>
            </div>
            <div className="text-slate-500 truncate pt-1 border-t border-slate-200">
              Tx: <span className="text-slate-700 select-all font-medium">{txResult.txHash}</span>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (() => {
        let cleanMsg = errorMessage;
        if (cleanMsg.includes('-32002') || cleanMsg.includes('already pending')) {
          cleanMsg = "MetaMask request is already pending. Please click the MetaMask fox icon in your browser toolbar to approve.";
        } else if (cleanMsg.includes('4001') || cleanMsg.includes('User rejected') || cleanMsg.includes('user rejected')) {
          cleanMsg = "Action was cancelled in your wallet.";
        } else if (cleanMsg.includes('could not coalesce error')) {
          cleanMsg = "Wallet connection pending. Please check your browser wallet extension.";
        } else if (cleanMsg.includes('Solidity Error:')) {
          const parts = cleanMsg.split(' - ');
          cleanMsg = parts.length > 1 ? parts[1] : cleanMsg.replace('Solidity Error: ', '');
        }

        return (
          <div className="p-4 bg-white border border-rose-400 rounded-xl shadow-xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Notice</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close notification"
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-rose-900 text-xs leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {cleanMsg}
            </p>
          </div>
        );
      })()}
    </div>
  );
};

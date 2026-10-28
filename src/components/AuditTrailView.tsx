import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { AuditLogItem } from '../types/blockchain';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterEvent, setFilterEvent] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getEventLabel = (name: string) => {
    switch (name) {
      case 'CampaignCreated':
        return 'Project Created';
      case 'DonationReceived':
        return 'Donation';
      case 'SpendingRequestCreated':
        return 'Expense Bill';
      case 'VoteSubmitted':
        return 'Approval Vote';
      case 'SpendingRequestFinalized':
        return 'Disbursement';
      case 'RefundIssued':
        return 'Refund';
      default:
        return name;
    }
  };

  const getBadgeStyle = (name: string) => {
    switch (name) {
      case 'CampaignCreated':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'DonationReceived':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'SpendingRequestCreated':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'VoteSubmitted':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'SpendingRequestFinalized':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'RefundIssued':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const formatPayload = (log: AuditLogItem) => {
    try {
      const parsed = JSON.parse(log.raw_payload);
      const keys = Object.keys(parsed);
      return keys.slice(0, 3).map(k => `${k}: ${parsed[k]}`).join(' · ');
    } catch {
      return log.raw_payload.slice(0, 50);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filterEvent === 'ALL' || log.event_name === filterEvent;
    const matchesSearch =
      searchQuery === '' ||
      log.transaction_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sender_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.raw_payload.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>Immutable Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              All transactions, votes, and vendor payments anchored irrevocably into SQLite & Blockchain state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by transaction hash, address, or payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              aria-label="Filter events"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Events</option>
              <option value="CampaignCreated">Project Created</option>
              <option value="DonationReceived">Donations</option>
              <option value="SpendingRequestCreated">Expense Bills</option>
              <option value="VoteSubmitted">Votes</option>
              <option value="SpendingRequestFinalized">Disbursements</option>
              <option value="RefundIssued">Refunds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Transaction Hash</th>
                <th className="px-5 py-3 font-semibold">Sender</th>
                <th className="px-5 py-3 font-semibold">Anchored Payload</th>
                <th className="px-5 py-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-mono">
                    Loading blockchain audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Event Badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyle(log.event_name)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {getEventLabel(log.event_name)}
                      </span>
                    </td>

                    {/* Transaction Hash */}
                    <td className="px-5 py-3 font-mono text-[11px] text-teal-700 font-medium whitespace-nowrap">
                      <div className="tooltip-group">
                        <span className="cursor-pointer hover:underline">
                          {log.transaction_hash.slice(0, 10)}...{log.transaction_hash.slice(-8)}
                        </span>
                        <div className="tooltip-panel absolute bottom-full mb-1 left-0 z-50 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-md whitespace-nowrap font-mono">
                          {log.transaction_hash}
                        </div>
                      </div>
                    </td>

                    {/* Sender Address */}
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {log.sender_address ? (
                        <span>{log.sender_address.slice(0, 8)}...{log.sender_address.slice(-6)}</span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Payload Details */}
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate text-[11px]">
                      {formatPayload(log)}
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-400 text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

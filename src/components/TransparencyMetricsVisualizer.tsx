import React from 'react';
import { Campaign } from '../types/blockchain';
import { Layers, ShieldCheck } from 'lucide-react';

interface TransparencyMetricsVisualizerProps {
  campaigns: Campaign[];
}

export const TransparencyMetricsVisualizer: React.FC<TransparencyMetricsVisualizerProps> = ({
  campaigns
}) => {
  const totalTarget = campaigns.reduce((acc, c) => acc + c.targetAmountEth, 0);
  const totalDonated = campaigns.reduce((acc, c) => acc + c.totalDonatedEth, 0);
  const totalDisbursed = campaigns.reduce((acc, c) => acc + c.totalSpentEth, 0);
  const totalEscrow = Math.max(0, totalDonated - totalDisbursed);
  const unfundedGap = Math.max(0, totalTarget - totalDonated);

  const percentEscrow = totalTarget > 0 ? (totalEscrow / totalTarget) * 100 : 0;
  const percentDisbursed = totalTarget > 0 ? (totalDisbursed / totalTarget) * 100 : 0;
  const percentGap = totalTarget > 0 ? (unfundedGap / totalTarget) * 100 : 0;

  // Category aggregation
  const categoryMap: { [cat: string]: { totalDonated: number; totalSpent: number; count: number } } = {};
  campaigns.forEach(c => {
    if (!categoryMap[c.category]) {
      categoryMap[c.category] = { totalDonated: 0, totalSpent: 0, count: 0 };
    }
    categoryMap[c.category].totalDonated += c.totalDonatedEth;
    categoryMap[c.category].totalSpent += c.totalSpentEth;
    categoryMap[c.category].count += 1;
  });

  const categories = Object.keys(categoryMap).map(name => ({
    name,
    donated: categoryMap[name].totalDonated,
    spent: categoryMap[name].totalSpent,
    count: categoryMap[name].count
  }));

  const categoryColors: { [key: string]: { dot: string; text: string } } = {
    'Healthcare & Medical Aid': { dot: 'bg-teal-600', text: 'text-teal-900' },
    'Clean Water & Rural Infrastructure': { dot: 'bg-blue-600', text: 'text-blue-900' },
    'Education & Welfare': { dot: 'bg-amber-600', text: 'text-amber-900' },
    'Emergency Relief': { dot: 'bg-rose-600', text: 'text-rose-900' }
  };

  const dynamicPalette = [
    { dot: 'bg-teal-600', text: 'text-teal-900' },
    { dot: 'bg-blue-600', text: 'text-blue-900' },
    { dot: 'bg-amber-600', text: 'text-amber-900' },
    { dot: 'bg-rose-600', text: 'text-rose-900' },
    { dot: 'bg-emerald-600', text: 'text-emerald-900' },
    { dot: 'bg-indigo-600', text: 'text-indigo-900' },
    { dot: 'bg-purple-600', text: 'text-purple-900' },
    { dot: 'bg-cyan-600', text: 'text-cyan-900' }
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Fund Allocation & Capital Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of active escrow vaults and supplier disbursements.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md self-start sm:self-auto">
          Total Target: <span className="text-slate-900 font-bold">{totalTarget.toFixed(2)} ETH</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Segmented Total Target Ratio Bar */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-slate-700 font-sans font-medium">Global Escrow Ratio</span>
              <span className="text-teal-700 font-bold tabular-nums">
                {((totalDonated / (totalTarget || 1)) * 100).toFixed(1)}% Goal Achieved
              </span>
            </div>

            {/* Tri-Color Composite Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 p-0.5">
              {/* Settled to Vendors */}
              <div
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${percentDisbursed}%` }}
                title={`Settled: ${totalDisbursed.toFixed(2)} ETH`}
              />
              {/* Held in Escrow */}
              <div
                className="bg-teal-600 h-full transition-all duration-500"
                style={{ width: `${percentEscrow}%` }}
                title={`Held in Escrow: ${totalEscrow.toFixed(2)} ETH`}
              />
              {/* Unfunded Gap */}
              <div
                className="bg-slate-200 h-full transition-all duration-500"
                style={{ width: `${percentGap}%` }}
                title={`Remaining Goal: ${unfundedGap.toFixed(2)} ETH`}
              />
            </div>

            {/* Clean Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Disbursed: {totalDisbursed.toFixed(2)} ETH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span className="text-slate-600">Locked in Escrow: {totalEscrow.toFixed(2)} ETH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-500">Remaining: {unfundedGap.toFixed(2)} ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Unboxed Category Sector Breakdown */}
        <div className="lg:col-span-6 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-mono text-slate-500 font-semibold mb-2">
            <span>Sector Allocation</span>
            <span>{categories.length} Categories</span>
          </div>

          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {categories.map((cat, idx) => {
              const styling = categoryColors[cat.name] || dynamicPalette[idx % dynamicPalette.length];
              const categoryPercent = totalDonated > 0 ? (cat.donated / totalDonated) * 100 : 0;

              return (
                <div key={cat.name} className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${styling.dot}`} />
                    <span className="font-medium text-slate-800 truncate" title={cat.name}>{cat.name}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">({cat.count})</span>
                  </div>

                  <div className="font-mono text-right shrink-0">
                    <span className="font-bold text-slate-900 tabular-nums">{cat.donated.toFixed(2)} ETH</span>
                    <span className="text-slate-500 text-[11px] ml-1.5 font-sans">({categoryPercent.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

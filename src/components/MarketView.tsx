import React, { useState } from 'react';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { MarketStock } from '../types';
import { StockDetailModal } from './StockDetailModal';

interface MarketViewProps {
  stocks: MarketStock[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  selectedStock: MarketStock | null;
  onSelectStock: (stock: MarketStock | null) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  stocks,
  watchlist,
  onToggleWatchlist,
  selectedStock,
  onSelectStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'watchlist' | 'nifty' | 'it' | 'banking' | 'global'>('all');

  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.sector.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'watchlist') {
      return watchlist.includes(stock.symbol);
    }
    if (selectedCategory === 'nifty') {
      return stock.symbol.includes('.NS') || stock.symbol === '^NSEI';
    }
    if (selectedCategory === 'it') {
      return stock.sector.toLowerCase().includes('information technology') || stock.sector.toLowerCase().includes('software');
    }
    if (selectedCategory === 'banking') {
      return stock.sector.toLowerCase().includes('banking') || stock.sector.toLowerCase().includes('financials');
    }
    if (selectedCategory === 'global') {
      return stock.exchange === 'NASDAQ';
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-20 pt-2 max-w-4xl mx-auto px-4">
      {/* Title & Market Disclosures */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">Indian & Global Share Market</h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              NSE / BSE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real reference quotes, technical indicators (RSI, MA20/50, MACD) & Gemini AI thesis.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Status: Public Reference Feed (15m Delayed)</span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stocks (e.g. Reliance, TCS, Infosys, Nifty 50, Apple)..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'watchlist', label: `Watchlist (${watchlist.length})` },
            { id: 'nifty', label: 'NSE India' },
            { id: 'it', label: 'Tech & IT' },
            { id: 'banking', label: 'Banking' },
            { id: 'global', label: 'Global Tech' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredStocks.map((stock) => {
          const isPos = stock.change >= 0;
          const isStar = watchlist.includes(stock.symbol);

          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="cursor-pointer rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-4 transition-all shadow-md group space-y-3"
            >
              {/* Header info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white group-hover:text-cyan-400 transition-colors">
                      {stock.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {stock.symbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stock.sector}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(stock.symbol);
                  }}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isStar
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-500 hover:text-slate-300'
                  }`}
                  title="Watchlist"
                >
                  <Star className={`w-3.5 h-3.5 ${isStar ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* Price & Change */}
              <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/70">
                <div>
                  <span className="text-lg font-extrabold font-mono text-white">
                    ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold mt-0.5">
                    <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                      {isPos ? '+' : ''}
                      {stock.change.toFixed(2)} ({isPos ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Technical Snippets */}
                <div className="text-right text-[11px]">
                  <div className="font-mono text-slate-300">
                    <span className="text-slate-500 mr-1">RSI:</span>
                    <span className={stock.rsi14 > 70 ? 'text-rose-400' : stock.rsi14 < 30 ? 'text-emerald-400' : 'text-slate-200'}>
                      {stock.rsi14}
                    </span>
                  </div>
                  <div className="font-mono text-slate-400 text-[10px] mt-0.5">
                    P/E: {stock.peRatio} • MC: {stock.marketCap.split(' ')[0]}
                  </div>
                </div>
              </div>

              {/* Card Footer with AI Analysis prompt */}
              <div className="flex items-center justify-between text-[11px] text-indigo-400 font-medium pt-1 border-t border-slate-800/50">
                <span className="flex items-center gap-1 text-slate-400 group-hover:text-slate-300">
                  <Clock className="w-3 h-3" /> Delayed 15m
                </span>
                <span className="flex items-center gap-1 text-cyan-400 group-hover:underline">
                  <Sparkles className="w-3 h-3" /> View AI Thesis →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStocks.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          No stocks found matching &quot;{searchQuery}&quot;. Try searching Reliance, TCS, Infosys, or Nifty 50.
        </div>
      )}

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => onSelectStock(null)}
          isWatchlisted={watchlist.includes(selectedStock.symbol)}
          onToggleWatchlist={onToggleWatchlist}
        />
      )}
    </div>
  );
};

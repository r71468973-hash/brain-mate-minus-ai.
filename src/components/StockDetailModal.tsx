import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Share2,
  Star,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MarketStock, StockAiAnalysis, StockChartPoint } from '../types';
import { AndroidIntentService } from '../services/androidIntents';

interface StockDetailModalProps {
  stock: MarketStock | null;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [aiAnalysis, setAiAnalysis] = useState<StockAiAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeChartPoint, setActiveChartPoint] = useState<StockChartPoint | null>(null);

  useEffect(() => {
    setAiAnalysis(null);
    setActiveChartPoint(null);
  }, [stock?.symbol]);

  if (!stock) return null;

  const isPos = stock.change >= 0;

  // Select chart data based on timeframe
  const chartData: StockChartPoint[] =
    timeframe === '1D'
      ? stock.chartData1D
      : timeframe === '1W'
      ? stock.chartData1W
      : timeframe === '1M'
      ? stock.chartData1M
      : stock.chartData1Y;

  // Chart min/max scaling
  const prices = chartData.map((d) => d.price);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;
  const range = maxPrice - minPrice || 1;

  // SVG Chart path generation
  const width = 500;
  const height = 180;
  const points = chartData.map((d, idx) => {
    const x = (idx / (chartData.length - 1)) * width;
    const y = height - ((d.price - minPrice) / range) * (height - 20) - 10;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  // Fetch AI deep analysis from backend
  const handleFetchAiAnalysis = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/assistant/stock-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: stock.symbol, stockData: stock }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error('Error fetching stock analysis:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleShare = () => {
    const text = `${stock.name} (${stock.symbol}) Price: ₹${stock.price} (${isPos ? '+' : ''}${stock.changePercent.toFixed(2)}%). RSI: ${stock.rsi14}. Analyzed on Brain Mate AI.`;
    AndroidIntentService.shareNative(`Brain Mate Stock Analysis: ${stock.name}`, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full sm:max-w-2xl bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{stock.name}</h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {stock.symbol} • {stock.exchange}
                </span>
              </div>
              <p className="text-xs text-slate-400">{stock.sector}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleWatchlist(stock.symbol)}
              className={`p-2 rounded-lg border transition-colors ${
                isWatchlisted
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Share Stock via Android"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Price Overview Banner */}
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                  ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-sm font-bold font-mono ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {isPos ? '+' : ''}
                  {stock.change.toFixed(2)} ({isPos ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Data Feed: {stock.dataSource}</span>
                <span className="text-slate-600">•</span>
                <span>Delayed 15m</span>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
              {(['1D', '1W', '1M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setActiveChartPoint(null);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart */}
          <div className="relative rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 overflow-hidden">
            {activeChartPoint && (
              <div className="absolute top-3 left-4 text-xs font-mono text-cyan-400 z-10">
                At {activeChartPoint.time}: ₹{activeChartPoint.price}
              </div>
            )}
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 overflow-visible"
              preserveAspectRatio="none"
              onMouseLeave={() => setActiveChartPoint(null)}
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPos ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor={isPos ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#1e293b" strokeDasharray="3 3" />

              {/* Area & Stroke */}
              <path d={areaD} fill="url(#chartGrad)" />
              <path
                d={pathD}
                fill="none"
                stroke={isPos ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover Trigger Dots */}
              {chartData.map((d, i) => {
                const x = (i / (chartData.length - 1)) * width;
                const y = height - ((d.price - minPrice) / range) * (height - 20) - 10;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    className="opacity-0 hover:opacity-100 fill-white stroke-cyan-400 stroke-2 cursor-pointer transition-opacity"
                    onMouseEnter={() => setActiveChartPoint(d)}
                  />
                );
              })}
            </svg>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
              <span>{chartData[0]?.time}</span>
              <span>Price Range: ₹{minPrice.toFixed(1)} - ₹{maxPrice.toFixed(1)}</span>
              <span>{chartData[chartData.length - 1]?.time}</span>
            </div>
          </div>

          {/* Technical Indicators Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* RSI */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">14-Day RSI</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-extrabold font-mono text-white">{stock.rsi14}</span>
                <span className={`text-[10px] font-bold ${
                  stock.rsi14 > 70 ? 'text-rose-400' : stock.rsi14 < 30 ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {stock.rsi14 > 70 ? 'Overbought' : stock.rsi14 < 30 ? 'Oversold' : 'Neutral'}
                </span>
              </div>
            </div>

            {/* 20-Day MA */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">20-Day MA</span>
              <span className="text-base font-extrabold font-mono text-white">₹{stock.ma20}</span>
              <span className="text-[10px] text-slate-400 block">
                {stock.price >= stock.ma20 ? 'Above 20-MA (Bullish)' : 'Below 20-MA'}
              </span>
            </div>

            {/* 50-Day MA */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">50-Day MA</span>
              <span className="text-base font-extrabold font-mono text-white">₹{stock.ma50}</span>
              <span className="text-[10px] text-slate-400 block">Medium Trend</span>
            </div>

            {/* MACD */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">MACD (12,26,9)</span>
              <span className="text-base font-extrabold font-mono text-white">
                {stock.macd.histogram >= 0 ? '+' : ''}{stock.macd.histogram}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {stock.macd.histogram >= 0 ? 'Bullish Momentum' : 'Bearish Divergence'}
              </span>
            </div>
          </div>

          {/* Fundamentals Table */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Company Fundamentals
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Market Cap:</span>
                <p className="font-mono font-semibold text-white">{stock.marketCap}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">P/E Ratio:</span>
                <p className="font-mono font-semibold text-white">{stock.peRatio}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Dividend Yield:</span>
                <p className="font-mono font-semibold text-white">{stock.dividendYield}%</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">52-Week High:</span>
                <p className="font-mono font-semibold text-white">₹{stock.week52High}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">52-Week Low:</span>
                <p className="font-mono font-semibold text-white">₹{stock.week52Low}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Day Volume:</span>
                <p className="font-mono font-semibold text-white">{stock.volume}</p>
              </div>
            </div>
          </div>

          {/* AI Deep Analysis Section */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  Brain Mate AI Fundamental & Technical Thesis
                </h4>
              </div>
              {!aiAnalysis && (
                <button
                  onClick={handleFetchAiAnalysis}
                  disabled={loadingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {loadingAi ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{loadingAi ? 'Analyzing...' : 'Generate AI Report'}</span>
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <h5 className="font-bold text-cyan-400 text-[11px] uppercase tracking-wider mb-1">
                    Business Overview & Moat
                  </h5>
                  <p>{aiAnalysis.overview}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <h5 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider mb-1">
                      Key Growth Drivers
                    </h5>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysis.growthDrivers.map((driver, idx) => (
                        <li key={idx}>{driver}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <h5 className="font-bold text-rose-400 text-[11px] uppercase tracking-wider mb-1">
                      Major Risks & Headwinds
                    </h5>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysis.majorRisks.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <h5 className="font-bold text-indigo-400 text-[11px] uppercase tracking-wider mb-1">
                    Valuation & Technical Outlook
                  </h5>
                  <p>{aiAnalysis.valuation}</p>
                  <p className="mt-1 text-slate-400">{aiAnalysis.technicalSummary}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Tap &quot;Generate AI Report&quot; to have Gemini 3.8 Flash evaluate {stock.name}&apos;s valuation, balance sheet health, RSI momentum, and sector opportunities.
              </p>
            )}
          </div>

          {/* Mandatory Educational Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Educational Information Only:</span> Brain Mate provides financial data and AI analytics strictly for educational and self-research purposes. This does not constitute personalized financial advice, investment recommendations, or guaranteed returns. Brain Mate does not connect to brokers or execute real market trades.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

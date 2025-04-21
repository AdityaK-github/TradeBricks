import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CandlestickChart, {
  MarketData as CandlestickData,
} from "./CandlestickChart";
import { ErrorBoundary } from "react-error-boundary";

// Simple fallback component when candlestick chart fails
const FallbackCandlestickChart = ({ symbol }: { symbol: string }) => {
  return (
    <div className="h-96 flex flex-col items-center justify-center dark:text-dark-text">
      <p className="text-red-500 mb-2">Could not load candlestick chart</p>
      <p>Price data for {symbol} could not be displayed</p>
      <p className="text-sm mt-4">Please try the Equity Curve view instead</p>
    </div>
  );
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define the expected backend response format
interface Trade {
  date: string;
  action: "BUY" | "SELL";
  price: number;
}

interface BacktestResultData {
  trades: Trade[];
  finalCapital: number;
  totalReturn: number;
  symbol?: string;
  network?: string; // Add network field to track if it's Ethereum, etc.
  tokenAddress?: string; // Add tokenAddress for Ethereum tokens
  gasUsed?: number; // Track gas costs for Ethereum transactions
  usingSimulatedData?: boolean; // Flag indicating if simulated data was used
}

interface BacktestResponse {
  message: string;
  result: BacktestResultData;
}

interface BacktestResultsProps {
  results: BacktestResponse | null;
  isLoading: boolean;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({
  results,
  isLoading,
}) => {
  const [equityCurve, setEquityCurve] = useState<
    { date: string; equity: number }[]
  >([]);
  const [dailyReturns, setDailyReturns] = useState<number[]>([]);
  const [riskMetrics, setRiskMetrics] = useState({
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
    sortinoRatio: 0,
  });
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [marketData, setMarketData] = useState<CandlestickData[]>([]);

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Process the results to create an equity curve and market data for candlesticks
  useEffect(() => {
    if (!results?.result) return;

    try {
      // Create an equity curve from trades
      const { trades, finalCapital } = results.result;
      const initialCapital =
        finalCapital / (1 + results.result.totalReturn / 100);

      let equity = initialCapital;
      const curve = [];
      const ohlcData: CandlestickData[] = [];
      const priceMap = new Map<string, number[]>();

      let position = 0; // Number of shares held

      console.log("Processing trades for candlestick data:", trades.length);

      // First pass: collect all prices by date
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        const { date, price } = trade;

        if (!priceMap.has(date)) {
          priceMap.set(date, []);
        }
        priceMap.get(date)?.push(price);
      }

      // Second pass: create equity curve
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];
        const { date, action, price } = trade;

        // For buy trades, reduce cash and increase position
        if (action === "BUY") {
          position = equity / price; // Assuming we're buying with all available equity
          equity = 0;
        }
        // For sell trades, increase cash and decrease position
        else if (action === "SELL") {
          equity = position * price;
          position = 0;
        }

        curve.push({
          date,
          equity: position * price + equity, // Total equity is cash + value of holdings
        });
      }

      // Create enhanced candlestick data with better price spread
      console.log("Creating candlestick data from price map:", priceMap.size);
      priceMap.forEach((prices, date) => {
        if (prices.length > 0) {
          // Always use the closing price (last price of the day)
          let close = prices[prices.length - 1];

          // For visualization purposes, create open, high, low based on close
          let open = prices[0];
          let high = Math.max(...prices);
          let low = Math.min(...prices);

          // Enhance with some randomness for better visualization if high = low
          if (high === low) {
            const spread = high * 0.01; // 1% spread
            high += spread;
            low -= spread;
          }

          ohlcData.push({
            date,
            open,
            high,
            low,
            close, // Using closing price for calculations
            volume: prices.length * 1000, // Simulate volume based on number of trades
          });
        }
      });

      // If no price data but we have trades, create synthetic OHLC
      if (ohlcData.length === 0 && trades.length > 0) {
        console.log("No price data available, creating synthetic data");

        // Get unique dates from trades
        const uniqueDates = [...new Set(trades.map((t) => t.date))].sort();

        // Use first and last trade price as baseline
        const firstPrice = trades[0].price;
        const lastPrice = trades[trades.length - 1].price;
        const priceDelta = (lastPrice - firstPrice) / uniqueDates.length;

        uniqueDates.forEach((date, i) => {
          const basePrice = firstPrice + priceDelta * i;
          const volatility = basePrice * 0.02; // 2% volatility

          ohlcData.push({
            date,
            open: basePrice - volatility / 2,
            high: basePrice + volatility,
            low: basePrice - volatility,
            close: basePrice + volatility / 2,
            volume: 10000,
          });
        });
      }

      // If there are no trades at all, add dummy data
      if (curve.length === 0) {
        console.log("No trades, creating dummy data");
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(new Date().getTime() + 86400000)
          .toISOString()
          .split("T")[0];

        curve.push({
          date: today,
          equity: initialCapital,
        });

        curve.push({
          date: tomorrow,
          equity: finalCapital,
        });

        // Add simple candlestick data for 5 days
        const basePrice = 100; // Arbitrary price
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];

          const change = (Math.random() - 0.5) * 0.04; // -2% to +2%
          const price = basePrice * (1 + change);

          ohlcData.push({
            date: dateStr,
            open: price * 0.99,
            high: price * 1.02,
            low: price * 0.98,
            close: price * 1.01,
            volume: 10000 + Math.random() * 5000,
          });
        }
      }

      // Sort OHLC data by date
      ohlcData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      console.log("Final OHLC data:", ohlcData);

      // Rest of the function remains the same - calculate returns and risk metrics

      // Calculate daily returns from the equity curve
      const returns: number[] = [];
      for (let i = 1; i < curve.length; i++) {
        const prevEquity = curve[i - 1].equity;
        const currentEquity = curve[i].equity;
        const dailyReturn = (currentEquity - prevEquity) / prevEquity;
        returns.push(dailyReturn);
      }
      setDailyReturns(returns);

      // Calculate risk metrics
      if (returns.length > 0) {
        // Volatility (annualized standard deviation of returns)
        const avgReturn =
          returns.reduce((sum, val) => sum + val, 0) / returns.length;
        const sumSquaredDiff = returns.reduce(
          (sum, val) => sum + Math.pow(val - avgReturn, 2),
          0
        );
        const stdDev = Math.sqrt(sumSquaredDiff / returns.length);
        const annualVolatility = stdDev * Math.sqrt(252) * 100; // Annualized, assuming 252 trading days

        // Maximum drawdown
        let maxDrawdown = 0;
        let peak = curve[0].equity;

        for (const point of curve) {
          if (point.equity > peak) {
            peak = point.equity;
          }

          const drawdown = (peak - point.equity) / peak;
          if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
          }
        }

        // Sharpe ratio (assuming 2% risk-free rate)
        const riskFreeRate = 0.02; // 2% annual
        const totalReturnDecimal = results.result.totalReturn / 100;
        const annualizedReturn =
          Math.pow(1 + totalReturnDecimal, 252 / returns.length) - 1;
        const sharpeRatio =
          (annualizedReturn - riskFreeRate) / (annualVolatility / 100);

        // Sortino ratio (like Sharpe but only uses downside volatility)
        const downReturns = returns.filter((ret) => ret < 0);
        const downsideDeviation =
          Math.sqrt(
            downReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) /
              (downReturns.length || 1)
          ) * Math.sqrt(252);
        const sortinoRatio =
          (annualizedReturn - riskFreeRate) / downsideDeviation;

        setRiskMetrics({
          sharpeRatio: isNaN(sharpeRatio) ? 0 : sharpeRatio,
          maxDrawdown: maxDrawdown * 100,
          volatility: annualVolatility,
          sortinoRatio: isNaN(sortinoRatio) ? 0 : sortinoRatio,
        });
      }

      setEquityCurve(curve);
      setMarketData(ohlcData);
    } catch (error) {
      console.error("Error processing backtest data:", error);
    }
  }, [results]);

  // Determine if the asset is an Ethereum token
  const isEthereumToken = results?.result?.network === "ethereum";

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center dark:text-dark-text">
        <div className="text-lg">Running backtest...</div>
      </div>
    );
  }

  if (!results || !results.result) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg text-gray-500 dark:text-dark-muted">
          No backtest results yet
        </div>
      </div>
    );
  }

  const { trades, finalCapital, totalReturn } = results.result;

  // Calculate metrics
  const initialCapital = finalCapital / (1 + totalReturn / 100);
  const profitLoss = finalCapital - initialCapital;

  // Prepare chart data
  const chartData = {
    labels: equityCurve.map((point) => point.date),
    datasets: [
      {
        label: "Portfolio Equity",
        data: equityCurve.map((point) => point.equity),
        borderColor: "rgb(59, 130, 246)", // Brighter blue
        backgroundColor: isDarkMode
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(59, 130, 246, 0.1)", // Light blue background
        borderWidth: 2,
        tension: 0.3, // More curve
        fill: true,
        pointRadius: 0, // Hide points for smoother line
      },
      // Add buy/sell markers
      {
        label: "Buy Points",
        data: trades
          .filter((t) => t.action === "BUY")
          .map((t) => ({
            x: t.date,
            y: equityCurve.find((p) => p.date === t.date)?.equity || null,
          })),
        backgroundColor: "rgba(16, 185, 129, 0.8)", // Green
        borderColor: "rgba(16, 185, 129, 1)",
        pointRadius: 6,
        pointStyle: "triangle",
        showLine: false,
      },
      {
        label: "Sell Points",
        data: trades
          .filter((t) => t.action === "SELL")
          .map((t) => ({
            x: t.date,
            y: equityCurve.find((p) => p.date === t.date)?.equity || null,
          })),
        backgroundColor: "rgba(239, 68, 68, 0.8)", // Red
        borderColor: "rgba(239, 68, 68, 1)",
        pointRadius: 6,
        pointStyle: "triangle",
        pointRotation: 180,
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          font: {
            size: 12,
          },
          color: isDarkMode ? "#F8FAFC" : undefined, // Use dark-text in dark mode
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.label === "Portfolio Equity") {
              return `Equity: $${context.raw.toFixed(2)}`;
            }
            if (context.dataset.label === "Buy Points") {
              return `Buy: $${context.raw.y.toFixed(2)}`;
            }
            if (context.dataset.label === "Sell Points") {
              return `Sell: $${context.raw.y.toFixed(2)}`;
            }
            return context.dataset.label;
          },
        },
        backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : undefined, // dark-primary with opacity
        titleColor: isDarkMode ? "#F8FAFC" : undefined,
        bodyColor: isDarkMode ? "#F8FAFC" : undefined,
      },
      title: {
        display: true,
        text: "Equity Curve & Trades",
        font: {
          size: 16,
          weight: "bold",
        },
        color: isDarkMode ? "#F8FAFC" : undefined, // Use dark-text in dark mode
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          maxRotation: 0,
          color: isDarkMode ? "#CBD5E1" : undefined, // Use dark.chart.text in dark mode
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(0, 0, 0, 0.05)", // Use dark.chart.grid in dark mode
        },
        ticks: {
          callback: (value: any) => `$${value}`,
          color: isDarkMode ? "#CBD5E1" : undefined, // Use dark.chart.text in dark mode
        },
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    elements: {
      line: {
        borderJoinStyle: "round",
      },
    },
  };

  // Calculate additional performance metrics
  const winningTrades = trades.filter((t, i, arr) => {
    if (t.action !== "SELL") return false;
    const prevBuy = arr
      .slice(0, i)
      .reverse()
      .find((pt) => pt.action === "BUY");
    return prevBuy && t.price > prevBuy.price;
  }).length;

  const losingTrades =
    trades.filter((t) => t.action === "SELL").length - winningTrades;
  const winRate =
    trades.filter((t) => t.action === "SELL").length > 0
      ? (winningTrades / trades.filter((t) => t.action === "SELL").length) * 100
      : 0;

  return (
    <div className="w-full h-full p-4 bg-white rounded-lg shadow overflow-auto dark:bg-dark-secondary dark:text-dark-text">
      <h2 className="text-xl font-bold mb-6 dark:text-dark-text">Backtest Results</h2>

      {results.result.usingSimulatedData && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-800 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200">
          <div className="flex">
            <div className="py-1">
              <svg
                className="h-6 w-6 text-yellow-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold">Note: Simulated Data</p>
              <p className="text-sm">
                This backtest is using simulated market data because real market
                data could not be retrieved. Results may not reflect actual
                market conditions and should be used for educational purposes
                only.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Initial Capital
          </div>
          <div className="text-xl font-bold">${initialCapital.toFixed(2)}</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Final Capital
          </div>
          <div className="text-xl font-bold">${finalCapital.toFixed(2)}</div>
        </div>

        <div
          className={`${
            profitLoss >= 0
              ? "bg-green-50 dark:bg-green-900/30"
              : "bg-red-50 dark:bg-red-900/30"
          } p-4 rounded-lg`}
        >
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Total Return
          </div>
          <div
            className={`text-xl font-bold ${
              profitLoss >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {totalReturn.toFixed(2)}%
          </div>
        </div>

        <div
          className={`${
            profitLoss >= 0
              ? "bg-green-50 dark:bg-green-900/30"
              : "bg-red-50 dark:bg-red-900/30"
          } p-4 rounded-lg`}
        >
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Profit/Loss
          </div>
          <div
            className={`text-xl font-bold ${
              profitLoss >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            ${profitLoss.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Add Ethereum-specific information if applicable */}
      {isEthereumToken && results?.result?.tokenAddress && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg dark:bg-indigo-900/30">
          <h3 className="text-lg font-bold mb-3">Ethereum Token Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-dark-muted">
                Token Address
              </div>
              <div className="text-sm font-mono break-all">
                {results.result.tokenAddress}
              </div>
            </div>
            {results.result.gasUsed && (
              <div>
                <div className="text-sm text-gray-500 dark:text-dark-muted">
                  Estimated Gas Used
                </div>
                <div className="text-sm">
                  {results.result.gasUsed.toLocaleString()} gas units
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold mb-3">Trade Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Total Trades
          </div>
          <div className="text-xl font-bold">{trades.length}</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Win/Loss Ratio
          </div>
          <div className="text-xl font-bold">
            {winningTrades}:{losingTrades}
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Winning vs losing trades
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Win Rate
          </div>
          <div className="text-xl font-bold">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Percentage of winning trades
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg dark:bg-slate-700">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Avg. Trade Return
          </div>
          <div className="text-xl font-bold">
            {(totalReturn / (trades.length / 2)).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Return per completed trade
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-3">Risk Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg dark:bg-indigo-900/30">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Sharpe Ratio
          </div>
          <div className="text-xl font-bold">
            {riskMetrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Risk-adjusted return
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg dark:bg-indigo-900/30">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Sortino Ratio
          </div>
          <div className="text-xl font-bold">
            {riskMetrics.sortinoRatio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Downside risk-adjusted
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg dark:bg-indigo-900/30">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Max Drawdown
          </div>
          <div className="text-xl font-bold">
            {riskMetrics.maxDrawdown.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Largest peak-to-trough decline
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg dark:bg-indigo-900/30">
          <div className="text-sm text-gray-500 dark:text-dark-muted">
            Volatility (Ann.)
          </div>
          <div className="text-xl font-bold">
            {riskMetrics.volatility.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
            Annualized standard deviation
          </div>
        </div>
      </div>

      {/* Chart type toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Performance Chart</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="line-chart"
              name="chart-type"
              value="line"
              checked={chartType === "line"}
              onChange={() => setChartType("line")}
              className="mr-2"
            />
            <label htmlFor="line-chart" className="text-sm">
              Equity Curve
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="candlestick-chart"
              name="chart-type"
              value="candlestick"
              checked={chartType === "candlestick"}
              onChange={() => setChartType("candlestick")}
              className="mr-2"
            />
            <label htmlFor="candlestick-chart" className="text-sm">
              Price Chart
            </label>
          </div>
        </div>
      </div>

      <div className="mb-8 h-96">
        {equityCurve.length > 0 && chartType === "line" && (
          <Line data={chartData} options={chartOptions} />
        )}
        {chartType === "candlestick" && (
          <>
            {marketData.length > 0 ? (
              <ErrorBoundary
                fallback={
                  <FallbackCandlestickChart
                    symbol={results.result.symbol || "Symbol"}
                  />
                }
              >
                <CandlestickChart
                  data={marketData}
                  title={`Price Chart for ${results.result.symbol || "Symbol"}`}
                />
              </ErrorBoundary>
            ) : (
              <div className="h-96 flex items-center justify-center dark:text-dark-text">
                No price data available for candlestick chart
              </div>
            )}
          </>
        )}
      </div>

      <h3 className="text-lg font-bold mb-3">Trades</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-dark-secondary">
          <thead>
            <tr className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Action</th>
              <th className="py-2 px-4 text-left">Price</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="py-2 px-4">{trade.date}</td>
                <td
                  className={`py-2 px-4 ${
                    trade.action === "BUY"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {trade.action}
                </td>
                <td className="py-2 px-4">${trade.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BacktestResults;

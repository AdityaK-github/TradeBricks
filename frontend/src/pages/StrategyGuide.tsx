import React from "react";
import { Link } from "react-router-dom";

const StrategyGuide: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        TradeBricks Strategy Building Guide
      </h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Introduction
        </h2>
        <p className="mb-4">
          Trading strategies in TradeBricks work by connecting different blocks
          in a logical flow. Each block performs a specific function, and when
          connected properly, they create a complete trading system that can be
          backtested with historical data.
        </p>
        <p className="mb-4">
          For a strategy to work correctly, it needs to have a logical flow from
          data sources through analysis and signal generation to order
          execution.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Essential Strategy Components
        </h2>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            1. Data Source Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-blue-500">
            Every strategy must start with a data source block. This provides
            the price and volume data needed for your strategy.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Example:</strong> The Market Data block fetches price and
            volume data for a specified symbol (like AAPL, BTC, etc.).
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Outputs:</strong> price, volume (connects to technical
            indicators, conditions, etc.)
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            2. Technical Indicator Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-green-500">
            These blocks calculate technical indicators based on price or volume
            data.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Examples:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>
                Moving Average (MA) - calculates average price over a specified
                period
              </li>
              <li>
                RSI - measures momentum and overbought/oversold conditions
              </li>
            </ul>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Inputs:</strong> price or volume (from data source)
            <br />
            <strong>Outputs:</strong> indicator values (connects to comparison
            blocks)
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            3. Condition Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-yellow-500">
            These blocks compare values to create logical conditions for trading
            decisions.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Example:</strong> A Comparison block might check if a fast
            MA is greater than a slow MA.
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Inputs:</strong> values to compare (from indicators or data)
            <br />
            <strong>Outputs:</strong> boolean result (connects to signal blocks)
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            4. Signal Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-purple-500">
            These blocks generate buy or sell signals based on conditions.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Example:</strong> A Trade Signal block generates a BUY
            signal when its input condition is true.
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Inputs:</strong> condition (from comparison blocks)
            <br />
            <strong>Outputs:</strong> trading signal (connects to order
            execution or risk management)
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            5. Risk Management Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-orange-500">
            These blocks help manage risk by setting stop losses, take profits,
            and position sizes.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Examples:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>
                Stop Loss - exits a position if price moves against you by a
                specified amount
              </li>
              <li>
                Take Profit - exits a position when a profit target is reached
              </li>
              <li>
                Position Sizing - calculates appropriate position size based on
                account size and risk
              </li>
            </ul>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Inputs:</strong> entry price, risk parameters
            <br />
            <strong>Outputs:</strong> exit signals, position size (connects to
            order execution)
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            6. Order Execution Blocks
          </h3>
          <p className="mb-2 pl-4 border-l-4 border-red-500">
            These blocks execute trades based on signals. Every strategy must
            end with at least one order execution block.
          </p>
          <div className="bg-gray-100 p-3 rounded-md text-sm dark:bg-gray-700 dark:text-gray-300">
            <strong>Example:</strong> The Market Order block executes buy or
            sell orders based on incoming signals.
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <strong>Inputs:</strong> trading signals, position size
            <br />
            <strong>Outputs:</strong> None (end of the strategy flow)
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Building a Logical Flow
        </h2>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            Correct Connection Order
          </h3>
          <p className="mb-4">
            For a strategy to produce accurate results, blocks should be
            connected in a logical order:
          </p>
          <ol className="list-decimal list-inside mb-4 space-y-2">
            <li>
              Start with a{" "}
              <strong className="text-blue-600 dark:text-blue-400">
                Data Source
              </strong>{" "}
              block
            </li>
            <li>
              Connect to{" "}
              <strong className="text-green-600 dark:text-green-400">
                Technical Indicators
              </strong>{" "}
              for analysis
            </li>
            <li>
              Feed the indicators into{" "}
              <strong className="text-yellow-600 dark:text-yellow-400">
                Condition
              </strong>{" "}
              blocks to create trading rules
            </li>
            <li>
              Connect conditions to{" "}
              <strong className="text-purple-600 dark:text-purple-400">
                Signal
              </strong>{" "}
              blocks
            </li>
            <li>
              Add{" "}
              <strong className="text-orange-600 dark:text-orange-400">
                Risk Management
              </strong>{" "}
              blocks to protect your capital
            </li>
            <li>
              End with{" "}
              <strong className="text-red-600 dark:text-red-400">
                Order Execution
              </strong>{" "}
              blocks to execute trades
            </li>
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            Common Connection Mistakes
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Disconnected blocks that don't feed into any other block</li>
            <li>Missing data source at the start of the strategy</li>
            <li>Missing order execution at the end of the strategy</li>
            <li>No complete path from data to orders</li>
            <li>
              Connecting incompatible inputs/outputs (e.g., connecting a price
              output to a boolean input)
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Strategy Templates
        </h2>
        <p className="mb-4">
          If you're new to building strategies, we recommend starting with one
          of our templates:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>
            <strong>Moving Average Crossover</strong> - A popular
            trend-following strategy using two moving averages
          </li>
          <li>
            <strong>RSI Overbought/Oversold</strong> - A mean-reversion strategy
            using the RSI indicator
          </li>
          <li>
            <strong>Risk Management Strategy</strong> - Demonstrates
            professional risk management techniques
          </li>
        </ul>
        <p>
          These templates provide properly connected blocks with complete
          logical flows.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 dark:bg-gray-800 dark:text-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Backtesting Considerations
        </h2>

        <div className="mb-4">
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            What Happens With Invalid Strategies?
          </h3>
          <p className="mb-2">
            When a strategy has issues, the following may happen during
            backtesting:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Empty strategies:</strong> No trades will be generated
            </li>
            <li>
              <strong>Disconnected blocks:</strong> Parts of your strategy will
              be ignored
            </li>
            <li>
              <strong>No data source:</strong> No price data means no signals or
              trades
            </li>
            <li>
              <strong>No order execution:</strong> Signals will be generated but
              no trades will be executed
            </li>
            <li>
              <strong>Incomplete paths:</strong> The backtest will run but may
              not produce the results you expect
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reliability of Results
          </h3>
          <p className="mb-2">
            The reliability of your backtest results depends directly on the
            quality of your strategy construction:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Well-connected strategies:</strong> Produce reliable,
              deterministic results based on historical data
            </li>
            <li>
              <strong>Incomplete strategies:</strong> May produce random or
              misleading results
            </li>
            <li>
              <strong>Strategies with logic gaps:</strong> Results may not
              reflect what would happen in real trading
            </li>
          </ul>
          <p className="mt-3 italic text-gray-600 dark:text-gray-400">
            Remember: TradeBricks simulates trading based on the logic you build
            with blocks. If your logic is incomplete, the results will not be
            reliable for real trading decisions.
          </p>
        </div>
      </div>

      <div className="text-center mt-8 mb-12">
        <Link
          to="/editor"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block font-medium shadow-md dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Return to Strategy Editor
        </Link>
      </div>
    </div>
  );
};

export default StrategyGuide;

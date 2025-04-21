import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Simple market data service
async function fetchHistoricalData(symbol, startDate, endDate) {
  try {
    console.log(
      `Fetching real market data for ${symbol} from ${startDate} to ${endDate}`
    );

    // Try to fetch real data using API keys in .env
    const apiKey = process.env.MARKET_DATA_API_KEY;
    if (!apiKey) {
      console.warn("No API key found in environment variables");
    } else {
      console.log(`Using API key: ${apiKey.substring(0, 3)}...`);

      try {
        // Try to use Alpha Vantage for stocks
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
        const response = await axios.get(url);

        if (response.data && response.data["Time Series (Daily)"]) {
          console.log(
            "Successfully fetched real market data from Alpha Vantage"
          );

          const timeSeriesData = response.data["Time Series (Daily)"];
          const formattedData = [];

          const startTime = new Date(startDate).getTime();
          const endTime = new Date(endDate).getTime();

          for (const date in timeSeriesData) {
            const currentDate = new Date(date);
            if (currentDate >= startTime && currentDate <= endTime) {
              const dataPoint = timeSeriesData[date];

              formattedData.push({
                date,
                open: parseFloat(dataPoint["1. open"]),
                high: parseFloat(dataPoint["2. high"]),
                low: parseFloat(dataPoint["3. low"]),
                close: parseFloat(dataPoint["5. adjusted close"]), // Using adjusted close
                volume: parseFloat(dataPoint["6. volume"]),
              });
            }
          }

          // Sort by date
          formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));

          if (formattedData.length > 0) {
            return formattedData;
          }
        }
      } catch (apiError) {
        console.error("Error fetching from market data API:", apiError.message);
      }
    }

    // If we get here, real data fetch failed, generate simulated data
    console.warn("Falling back to simulated market data");

    // Generate simulated market data
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Random starting price between $50 and $200
    let price = 50 + Math.random() * 150;

    // Generate daily data
    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      // Skip weekends in simulated data
      const day = date.getDay();
      if (day === 0 || day === 6) continue;

      // Random daily change -3% to +3%
      const change = (Math.random() * 6 - 3) / 100;

      // Calculate OHLC prices
      const dateStr = date.toISOString().split("T")[0];
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 10000000);

      data.push({
        date: dateStr,
        open,
        high,
        low,
        close,
        volume,
      });

      // Set next day's starting price
      price = close;
    }

    return data;
  } catch (error) {
    console.error("Error fetching historical data:", error);
    throw new Error("Failed to fetch market data");
  }
}

// Simple backtest function
async function runBacktest(strategy, options) {
  const { startDate, endDate, initialCapital } = options;

  console.log(
    `Running backtest for strategy '${strategy.name}' on ${strategy.symbol}`
  );

  // Fetch market data
  const marketData = await fetchHistoricalData(
    strategy.symbol,
    startDate,
    endDate
  );

  // Initialize variables
  let capital = initialCapital;
  let position = 0;
  let buyPrice = 0;
  const trades = [];

  // Simple moving average crossover strategy
  const shortPeriod = 10;
  const longPeriod = 30;

  // Process each day
  for (let i = longPeriod; i < marketData.length; i++) {
    const currentData = marketData[i];

    // Calculate short MA
    const shortMAData = marketData.slice(i - shortPeriod, i);
    const shortMA =
      shortMAData.reduce((sum, day) => sum + day.close, 0) / shortPeriod;

    // Calculate long MA
    const longMAData = marketData.slice(i - longPeriod, i);
    const longMA =
      longMAData.reduce((sum, day) => sum + day.close, 0) / longPeriod;

    // Buy signal: short MA crosses above long MA
    if (position === 0 && shortMA > longMA) {
      position = capital / currentData.close;
      buyPrice = currentData.close;
      capital = 0;
      trades.push({
        date: currentData.date,
        action: "BUY",
        price: currentData.close,
      });
      console.log(
        `BUY on ${currentData.date} at $${currentData.close.toFixed(2)}`
      );
    }
    // Sell signal: short MA crosses below long MA
    else if (position > 0 && shortMA < longMA) {
      capital = position * currentData.close;
      position = 0;
      trades.push({
        date: currentData.date,
        action: "SELL",
        price: currentData.close,
      });
      console.log(
        `SELL on ${currentData.date} at $${currentData.close.toFixed(2)}`
      );
    }
  }

  // Final exit - sell any remaining position at the last price
  if (position > 0) {
    const lastDay = marketData[marketData.length - 1];
    capital = position * lastDay.close;
    position = 0;
    trades.push({ date: lastDay.date, action: "SELL", price: lastDay.close });
    console.log(
      `Final SELL on ${lastDay.date} at $${lastDay.close.toFixed(2)}`
    );
  }

  // Calculate results
  const totalReturn = ((capital - initialCapital) / initialCapital) * 100;

  console.log(`Backtest completed with ${trades.length} trades`);
  console.log(`Initial capital: $${initialCapital.toFixed(2)}`);
  console.log(`Final capital: $${capital.toFixed(2)}`);
  console.log(`Total return: ${totalReturn.toFixed(2)}%`);

  return {
    trades,
    finalCapital: capital,
    totalReturn,
    usingSimulatedData: true,
  };
}

// Set up global variables
global.inMemoryDB = {
  strategies: [],
  users: [],
};

// Add a test strategy
global.inMemoryDB.strategies.push({
  _id: "test-strategy-1",
  name: "Test Strategy",
  userId: "123",
  blocks: [
    {
      id: "price-1",
      data: {
        blockType: {
          id: "price",
        },
        priceType: "close",
      },
    },
    {
      id: "ma-1",
      data: {
        blockType: {
          id: "moving_average",
        },
        period: "20",
      },
    },
    {
      id: "comparison-1",
      data: {
        blockType: {
          id: "comparison",
        },
        comparisonType: "greater_than",
      },
    },
  ],
  connections: [
    {
      source: "price-1",
      target: "comparison-1",
      targetHandle: "input1",
    },
    {
      source: "ma-1",
      target: "comparison-1",
      targetHandle: "input2",
    },
  ],
});

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TradeBricks API is running!" });
});

// Get all strategies
app.get("/api/strategies", (req, res) => {
  res.json(global.inMemoryDB.strategies);
});

// Get strategies by user ID
app.get("/api/strategies/user/:userId", (req, res) => {
  const { userId } = req.params;
  const strategies = global.inMemoryDB.strategies.filter(
    (s) => s.userId === userId
  );
  res.json(strategies);
});

// Get a strategy by ID
app.get("/api/strategies/:id", (req, res) => {
  const { id } = req.params;
  const strategy = global.inMemoryDB.strategies.find((s) => s._id === id);

  if (!strategy) {
    return res.status(404).json({ message: "Strategy not found" });
  }

  res.json(strategy);
});

// Run backtest
app.post("/api/backtest/:strategyId", async (req, res) => {
  try {
    const { strategyId } = req.params;
    const {
      startDate,
      endDate,
      initialCapital,
      symbol,
      tokenAddress,
      assetType,
      allowSimulatedData = false, // Default to NOT allowing simulated data
    } = req.body;

    if (!symbol) {
      res.status(400).json({ message: "Symbol is required for backtesting" });
      return;
    }

    console.log(
      `Backtest request received: symbol=${symbol}, tokenAddress=${
        tokenAddress || "N/A"
      }, assetType=${
        assetType || "stock"
      }, allowSimulatedData=${allowSimulatedData}`
    );

    const strategy = global.inMemoryDB.strategies.find(
      (s) => s._id === strategyId
    );

    if (!strategy) {
      res.status(404).json({ message: "Strategy not found" });
      return;
    }

    // Add symbol and token data to strategy for backtest
    strategy.symbol = symbol;

    // For Ethereum tokens, attach the token address
    if (assetType === "crypto" && tokenAddress) {
      strategy.tokenAddress = tokenAddress;
    }

    try {
      // Run the actual backtest
      const result = await runBacktest(strategy, {
        startDate,
        endDate,
        initialCapital,
        tokenAddress,
        allowSimulatedData,
      });

      // If simulated data was used but not allowed, return an error
      if (result.usingSimulatedData && !allowSimulatedData) {
        res.status(400).json({
          message:
            "Could not retrieve real market data and simulated data was not allowed",
          error: "SIMULATED_DATA_NOT_ALLOWED",
        });
        return;
      }

      res.status(200).json({
        message: "Backtest completed successfully",
        result,
        warnings: result.usingSimulatedData
          ? [
              "Simulated data was used for this backtest. Results may not reflect real market conditions.",
            ]
          : [],
      });
    } catch (error) {
      // Special handling for "No market data available" errors
      if (
        error instanceof Error &&
        error.message.includes("No market data available")
      ) {
        res.status(400).json({
          message:
            "No market data available for the specified period and symbol",
          error: "NO_MARKET_DATA",
        });
        return;
      }

      throw error; // Re-throw for general error handling
    }
  } catch (error) {
    console.error("Error running backtest:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error running backtest", error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test strategy available with ID: test-strategy-1`);
});

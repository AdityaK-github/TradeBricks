import React, { useState, useEffect } from "react";

/**
 * Asset selector for backtesting that properly handles both stocks and Ethereum tokens
 */
const BacktestAssetSelector = ({ onSelect, className }) => {
  const [assets, setAssets] = useState({
    topStocks: [],
    ethTokens: [],
    popularStocks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Popular stocks that should always be available (without prices)
  const POPULAR_STOCKS = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "WMT", name: "Walmart Inc." },
  ];

  // Popular Ethereum tokens that should always be available (without prices)
  const POPULAR_ETH_TOKENS = [
    {
      symbol: "ETH",
      name: "Ethereum",
      address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      address: "0x514910771af9ca656af840dff83e8264ecf986ca",
    },
    {
      symbol: "UNI",
      name: "Uniswap",
      address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    },
    {
      symbol: "AAVE",
      name: "Aave",
      address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
    },
    {
      symbol: "MKR",
      name: "Maker",
      address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
    },
    {
      symbol: "SNX",
      name: "Synthetix",
      address: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
    },
    {
      symbol: "COMP",
      name: "Compound",
      address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
    },
    {
      symbol: "SUSHI",
      name: "SushiSwap",
      address: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    // Only use built-in stock and token lists initially to avoid unnecessary API calls
    setAssets({
      topStocks: POPULAR_STOCKS,
      popularStocks: POPULAR_STOCKS,
      ethTokens: POPULAR_ETH_TOKENS,
    });
    setIsLoading(false);

    // Fetch any additional assets asynchronously if needed in the future

    return () => {
      isMounted = false; // Prevent state updates if component unmounts
    };
  }, []);

  const handleChange = (event) => {
    const value = event.target.value;

    if (value) {
      const [type, index] = value.split("-");

      let selectedAsset;
      if (type === "stock") {
        selectedAsset = {
          ...assets.topStocks[parseInt(index)],
          assetType: "stock",
        };
      } else if (type === "popular") {
        selectedAsset = {
          ...assets.popularStocks[parseInt(index)],
          assetType: "stock",
        };
      } else if (type === "eth") {
        selectedAsset = {
          ...assets.ethTokens[parseInt(index)],
          assetType: "crypto",
        };
      }

      console.log("Asset selected in component:", selectedAsset);
      onSelect(selectedAsset);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter assets based on search term
  const filteredStocks = assets.topStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEthTokens = assets.ethTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to format price display
  const formatPriceDisplay = (asset) => {
    if (asset.price !== undefined) {
      return `${asset.symbol} - ${asset.name} ($${asset.price.toFixed(2)})`;
    }
    return `${asset.symbol} - ${asset.name}`;
  };

  return (
    <div className={`inline-block min-w-[200px] ${className || ""}`}>
      <div className="mb-2 relative">
        <input
          type="text"
          placeholder="Search by symbol or name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white dark:bg-dark-primary dark:border-gray-700 dark:text-gray-200"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <select
        onChange={handleChange}
        disabled={isLoading}
        className="w-full p-2 border border-gray-300 rounded text-gray-800 bg-white dark:bg-dark-primary dark:border-gray-700 dark:text-gray-200 cursor-pointer"
      >
        <option value="">Select Asset</option>

        {/* Stocks Group - Show first */}
        {filteredStocks.length > 0 && (
          <optgroup label="Stocks">
            {filteredStocks.map((stock, index) => (
              <option key={`stock-${index}`} value={`stock-${index}`}>
                {formatPriceDisplay(stock)}
              </option>
            ))}
          </optgroup>
        )}

        {/* Ethereum Tokens Group */}
        {filteredEthTokens.length > 0 && (
          <optgroup label="Ethereum Tokens">
            {filteredEthTokens.map((token, index) => (
              <option key={`eth-${index}`} value={`eth-${index}`}>
                {formatPriceDisplay(token)}
              </option>
            ))}
          </optgroup>
        )}

        {/* No Results Message */}
        {filteredStocks.length === 0 &&
          filteredEthTokens.length === 0 &&
          searchTerm && <option disabled>No assets match your search</option>}
      </select>

      {isLoading && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Loading assets...
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <i>
          Note: All backtests will use real market data from financial APIs.
        </i>
      </div>
    </div>
  );
};

export default BacktestAssetSelector;

import React, { useState, useEffect } from "react";

/**
 * AssetSelector component that fetches and displays a list of top stocks and cryptocurrencies
 * in a styled dropdown menu
 */
const AssetSelector = ({ onAssetSelect }) => {
  const [assets, setAssets] = useState({
    topStocks: [],
    topCrypto: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "http://localhost:3000/api/ethereum/top-assets"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assets");
        }

        const data = await response.json();
        setAssets(data.result);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching assets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const handleAssetSelect = (event) => {
    const value = event.target.value;

    // Parse the value to determine if it's a stock or crypto and its index
    if (value) {
      const [type, index] = value.split("-");
      const selectedItem =
        type === "stock"
          ? assets.topStocks[parseInt(index)]
          : assets.topCrypto[parseInt(index)];

      setSelectedAsset(selectedItem);

      // Call the parent component's callback with the selected asset
      if (onAssetSelect) {
        onAssetSelect(selectedItem);
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Loading assets...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="asset-selector">
      <label htmlFor="asset-select">Select an asset:</label>
      <select
        id="asset-select"
        onChange={handleAssetSelect}
        className="asset-select-dropdown"
      >
        <option value="">-- Select an asset --</option>

        {/* Stocks group */}
        {assets.topStocks && assets.topStocks.length > 0 && (
          <optgroup label="Stocks">
            {assets.topStocks.map((stock, index) => (
              <option key={`stock-${index}`} value={`stock-${index}`}>
                {stock.symbol} - {stock.name} (${stock.price.toFixed(2)})
              </option>
            ))}
          </optgroup>
        )}

        {/* Crypto group */}
        {assets.topCrypto && assets.topCrypto.length > 0 && (
          <optgroup label="Cryptocurrencies">
            {assets.topCrypto.map((crypto, index) => (
              <option key={`crypto-${index}`} value={`crypto-${index}`}>
                {crypto.symbol} - {crypto.name} (${crypto.price.toFixed(2)})
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {selectedAsset && (
        <div className="selected-asset-info">
          <h4>Selected Asset</h4>
          <p>Symbol: {selectedAsset.symbol}</p>
          <p>Name: {selectedAsset.name}</p>
          <p>Price: ${selectedAsset.price.toFixed(2)}</p>
          <p>24h Change: {selectedAsset.change.toFixed(2)}%</p>
          {selectedAsset.address && (
            <p>Ethereum Address: {selectedAsset.address}</p>
          )}
        </div>
      )}

      <style jsx>{`
        .asset-selector {
          margin: 20px 0;
          font-family: "Arial", sans-serif;
        }

        .asset-select-dropdown {
          width: 100%;
          padding: 10px;
          margin-top: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }

        .selected-asset-info {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 4px;
          background-color: #f9f9f9;
        }

        .loading,
        .error {
          padding: 10px;
          text-align: center;
        }

        .error {
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
};

export default AssetSelector;

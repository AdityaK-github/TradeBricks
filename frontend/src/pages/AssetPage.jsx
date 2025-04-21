import React, { useState } from "react";
import AssetSelector from "../components/AssetSelector";

const AssetPage = () => {
  const [selectedAsset, setSelectedAsset] = useState(null);

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    console.log("Selected asset:", asset);

    // You can fetch historical data or perform other actions with the selected asset
    if (asset.address) {
      // For Ethereum tokens, you might want to get token details
      console.log("Getting Ethereum token details for address:", asset.address);
    }
  };

  return (
    <div className="asset-page">
      <h1>Stock & Cryptocurrency Tracker</h1>

      <div className="container">
        <div className="selector-section">
          <h2>Select an Asset</h2>
          <p>Choose from our list of top stocks and cryptocurrencies</p>

          <AssetSelector onAssetSelect={handleAssetSelect} />
        </div>

        {selectedAsset && (
          <div className="analysis-section">
            <h2>Asset Analysis</h2>
            <p>
              You selected {selectedAsset.name} ({selectedAsset.symbol})
            </p>

            <div className="price-section">
              <div className="current-price">
                <h3>Current Price</h3>
                <p className="price">${selectedAsset.price.toFixed(2)}</p>
                <p
                  className={`change ${
                    selectedAsset.change >= 0 ? "positive" : "negative"
                  }`}
                >
                  {selectedAsset.change >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(selectedAsset.change).toFixed(2)}%
                </p>
              </div>

              <div className="actions">
                <button className="btn btn-primary">
                  View Historical Data
                </button>
                {selectedAsset.address && (
                  <button className="btn btn-secondary">
                    View Token Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .asset-page {
          font-family: "Arial", sans-serif;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #2c3e50;
        }

        .container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }

        @media (min-width: 768px) {
          .container {
            grid-template-columns: 1fr 1fr;
          }
        }

        .selector-section,
        .analysis-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 25px;
        }

        h2 {
          margin-top: 0;
          color: #2c3e50;
        }

        .price-section {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .current-price {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .price {
          font-size: 32px;
          font-weight: bold;
          margin: 5px 0;
        }

        .change {
          font-size: 18px;
          font-weight: 500;
        }

        .positive {
          color: #28a745;
        }

        .negative {
          color: #dc3545;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background-color: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2980b9;
        }

        .btn-secondary {
          background-color: #ecf0f1;
          color: #2c3e50;
        }

        .btn-secondary:hover {
          background-color: #bdc3c7;
        }
      `}</style>
    </div>
  );
};

export default AssetPage;

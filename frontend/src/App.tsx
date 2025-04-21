import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import FlowEditor from "./components/editor/FlowEditor";
import BlocksSidebar from "./components/editor/BlocksSidebar";
import BacktestResults from "./components/backtest/BacktestResults";
import StrategyList from "./components/editor/StrategyList";
import StrategyGuide from "./pages/StrategyGuide";
import { BlockType } from "./components/blocks/BlockTypes";
import { getStrategiesByUser, runBacktest } from "./services/apiService";
import Toast from "./components/Toast";
import DarkModeToggle from "./components/DarkModeToggle";
import BacktestAssetSelector from "./components/BacktestAssetSelector";
import "./index.css";

// Define a type for strategy
interface Strategy {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  blocks: any[];
  connections: any[];
  createdAt: string;
  updatedAt: string;
}

function App() {
  // Main app state
  const [activeTab, setActiveTab] = useState("editor");
  const [userId, setUserId] = useState("123"); // Hardcoded for now; would come from auth in a real app
  const [showStrategySidebar, setShowStrategySidebar] = useState(true);

  // Strategy state
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);
  const [errorStrategies, setErrorStrategies] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );

  // Backtest state
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isLoadingBacktest, setIsLoadingBacktest] = useState(false);
  const [errorBacktest, setErrorBacktest] = useState<string | null>(null);
  const [showBacktestForm, setShowBacktestForm] = useState(false);
  const [backtestParams, setBacktestParams] = useState({
    symbol: "",
    assetType: "crypto", // Default to crypto for now
    assetAddress: "",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10), // Default to 90 days ago
    endDate: new Date().toISOString().substring(0, 10), // Default to today
    initialCapital: 10000,
    allowSimulatedData: false, // Default to not allowing simulated data
  });

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prevToast) => ({ ...prevToast, show: false }));
    }, 5000);
  };

  // Handler for BlocksSidebar
  const handleDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(blockType)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // Fetch strategies when component mounts or when strategies need to be refreshed
  const fetchStrategies = async () => {
    setIsLoadingStrategies(true);
    setErrorStrategies(null);
    try {
      const fetchedStrategies = await getStrategiesByUser(userId);
      setStrategies(fetchedStrategies);
      console.log("Fetched strategies:", fetchedStrategies);
    } catch (error: any) {
      console.error("Failed to fetch strategies:", error);
      const errorMessage = error.message || "Failed to load strategies.";
      setErrorStrategies(errorMessage);
      showToast(errorMessage, "error");
    }
    setIsLoadingStrategies(false);
  };

  // Load strategies on mount
  useEffect(() => {
    fetchStrategies();
  }, [userId]);

  // Handle selecting a strategy
  const handleSelectStrategy = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
  };

  // Handle creating a new strategy
  const handleCreateStrategy = () => {
    // Clear the selected strategy to show an empty editor
    setSelectedStrategyId(null);
  };

  // Handle strategy created callback from FlowEditor
  const handleStrategyCreated = (strategyId: string) => {
    // Refresh strategies and select the new one
    fetchStrategies();
    setSelectedStrategyId(strategyId);
    showToast("Strategy created successfully!", "success");
  };

  // Handle strategy updated callback
  const handleStrategyUpdated = () => {
    fetchStrategies();
    showToast("Strategy updated successfully!", "success");
  };

  // Run backtest for the selected strategy
  const handleRunBacktest = async () => {
    if (!selectedStrategyId) {
      showToast("Please select a strategy first.", "error");
      return;
    }

    if (!backtestParams.symbol) {
      showToast("Please select an asset for backtesting.", "error");
      return;
    }

    try {
      setIsLoadingBacktest(true);
      setErrorBacktest(null);
      setBacktestResults(null);

      const params = {
        ...backtestParams,
        initialCapital: Number(backtestParams.initialCapital),
        ...(backtestParams.assetType === "crypto" &&
          backtestParams.assetAddress && {
            tokenAddress: backtestParams.assetAddress,
          }),
      };

      console.log("Running backtest with params:", params);
      const results = await runBacktest(selectedStrategyId, params);
      console.log("Backtest results received:", results);

      if (!results || !results.result) {
        console.error("Invalid backtest results structure:", results);
        showToast(
          "Backtest returned invalid results. Please try again.",
          "error"
        );
        return;
      }

      setBacktestResults(results);
      setActiveTab("backtest"); // Switch to backtest tab to show results
      showToast(
        `Backtest completed with ${results.result.trades.length} trades!`,
        "success"
      );
    } catch (error: any) {
      console.error("Failed to run backtest:", error);
      const errorMessage =
        error.message || "Failed to run backtest. Please try again.";
      setErrorBacktest(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoadingBacktest(false);
      setShowBacktestForm(false);
    }
  };

  // Handle asset selection from the dropdown
  const handleAssetSelect = (asset: any) => {
    console.log("Selected asset:", asset);

    // First check if the asset has an explicit type (from our BacktestAssetSelector)
    const assetType =
      asset.assetType ||
      (asset.address && asset.address.startsWith("0x") ? "crypto" : "stock");

    setBacktestParams({
      ...backtestParams,
      symbol: asset.symbol,
      assetType: assetType,
      // Only include address for crypto assets
      assetAddress: assetType === "crypto" ? asset.address || "" : "",
    });

    console.log(
      `Asset type set to: ${assetType}, Address: ${
        assetType === "crypto" ? asset.address || "none" : "none (stock)"
      }`
    );
  };

  // Main App UI Component
  const MainApp = () => (
    <div className="flex flex-col h-screen bg-blue-100 dark:bg-gray-900">
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast((prevToast) => ({ ...prevToast, show: false }))
          }
        />
      )}

      {/* Header */}
      <header className="bg-white p-4 flex justify-between items-center dark:bg-dark-primary dark:border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <img
            src="/tradebricks-logo.svg"
            alt="TradeBricks Logo"
            className="h-10 w-10"
          />
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            TradeBricks
          </h1>
        </div>
        <DarkModeToggle />
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md dark:bg-dark-primary dark:border-b dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 py-2">
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "editor"
                  ? "bg-blue-600 text-white dark:bg-dark-accent"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Strategy Editor
            </button>
            <button
              onClick={() => setActiveTab("backtest")}
              className={`px-4 py-2 rounded-md ${
                activeTab === "backtest"
                  ? "bg-blue-600 text-white dark:bg-dark-accent"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Backtesting
            </button>
            <button
              onClick={() => window.open("/strategy-guide", "_blank")}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              Strategy Guide
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "editor" && (
          <div className="flex h-full">
            {/* Strategy List Sidebar */}
            {showStrategySidebar && (
              <div className="w-64 border-r border-gray-200 bg-white overflow-auto dark:bg-dark-secondary dark:border-gray-700">
                <StrategyList
                  strategies={strategies}
                  isLoading={isLoadingStrategies}
                  error={errorStrategies}
                  onSelectStrategy={handleSelectStrategy}
                  onCreateStrategy={handleCreateStrategy}
                  onRefreshStrategies={fetchStrategies}
                  userId={userId}
                  showToast={showToast}
                />
              </div>
            )}

            {/* Strategy Editor */}
            <div className="flex-1 dark:bg-dark-primary relative">
              {!showStrategySidebar && (
                <button
                  onClick={() => setShowStrategySidebar(true)}
                  className="absolute top-4 left-4 z-10 px-2 py-1 bg-white text-gray-800 rounded hover:bg-gray-100 border border-gray-300 dark:bg-dark-secondary dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                  title="Show strategies"
                >
                  ≡
                </button>
              )}
              <FlowEditor
                userId={userId}
                selectedStrategyId={selectedStrategyId}
                onStrategyCreated={handleStrategyCreated}
                onStrategyUpdated={handleStrategyUpdated}
                showToast={showToast}
                showStrategySidebar={showStrategySidebar}
                toggleStrategySidebar={() =>
                  setShowStrategySidebar(!showStrategySidebar)
                }
              />
            </div>
          </div>
        )}

        {activeTab === "backtest" && (
          <div className="p-4 h-full overflow-auto">
            {/* Backtest Controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-dark-text">
                  Backtest Results
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowBacktestForm(!showBacktestForm)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-dark-accent dark:hover:bg-blue-600"
                  >
                    {showBacktestForm ? "Cancel" : "New Backtest"}
                  </button>
                  {selectedStrategyId && (
                    <span className="text-sm text-gray-600 py-2 dark:text-dark-muted">
                      Strategy:{" "}
                      {strategies.find((s) => s._id === selectedStrategyId)
                        ?.name || "Selected Strategy"}
                    </span>
                  )}
                </div>
              </div>

              {/* Backtest Form */}
              {showBacktestForm && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow dark:bg-dark-secondary dark:shadow-dark-md">
                  <h3 className="text-lg font-semibold mb-3 dark:text-dark-text">
                    Backtest Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text">
                        Strategy
                      </label>
                      <select
                        value={selectedStrategyId || ""}
                        onChange={(e) => setSelectedStrategyId(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-dark-primary dark:border-gray-700 dark:text-dark-text"
                      >
                        <option value="">Select Strategy</option>
                        {strategies.map((strategy) => (
                          <option key={strategy._id} value={strategy._id}>
                            {strategy.name}
                          </option>
                        ))}
                      </select>
                      {!selectedStrategyId && (
                        <div className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                          Please select a strategy first
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text">
                        Asset
                      </label>
                      <BacktestAssetSelector
                        onSelect={handleAssetSelect}
                        className="w-full"
                      />
                      {backtestParams.symbol && (
                        <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                          Selected: {backtestParams.symbol}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text">
                        Start Date
                      </label>
                      <input
                        type="date"
                        key={`start-date-${backtestParams.startDate}`}
                        defaultValue={backtestParams.startDate}
                        onBlur={(e) => {
                          if (e.target.value) {
                            setBacktestParams((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }));
                          }
                        }}
                        className="w-full p-2 border rounded dark:bg-dark-primary dark:border-gray-700 dark:text-dark-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text">
                        End Date
                      </label>
                      <input
                        type="date"
                        key={`end-date-${backtestParams.endDate}`}
                        defaultValue={backtestParams.endDate}
                        onBlur={(e) => {
                          if (e.target.value) {
                            setBacktestParams((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }));
                          }
                        }}
                        className="w-full p-2 border rounded dark:bg-dark-primary dark:border-gray-700 dark:text-dark-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text">
                        Initial Capital
                      </label>
                      <input
                        type="number"
                        value={backtestParams.initialCapital}
                        onChange={(e) =>
                          setBacktestParams({
                            ...backtestParams,
                            initialCapital: parseFloat(e.target.value),
                          })
                        }
                        className="w-full p-2 border rounded dark:bg-dark-primary dark:border-gray-700 dark:text-dark-text"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={backtestParams.allowSimulatedData}
                        onChange={(e) =>
                          setBacktestParams({
                            ...backtestParams,
                            allowSimulatedData: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span>
                        Allow simulated data if real market data is unavailable
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      If unchecked, the backtest will fail if real market data
                      cannot be obtained. This ensures your backtest results
                      reflect real market conditions.
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleRunBacktest}
                      disabled={isLoadingBacktest}
                      className={`px-4 py-2 rounded ${
                        isLoadingBacktest
                          ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                          : "bg-green-500 hover:bg-green-600 text-white dark:bg-dark-success"
                      }`}
                    >
                      {isLoadingBacktest ? "Running..." : "Run Backtest"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Backtest Results */}
            <BacktestResults
              results={backtestResults}
              isLoading={isLoadingBacktest}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white p-3 text-center text-gray-500 text-sm dark:bg-dark-primary dark:text-gray-400">
        <div className="flex items-center justify-center gap-2">
          <img
            src="/tradebricks-logo.svg"
            alt="TradeBricks Logo"
            className="h-6 w-6"
          />
          <span>
            TradeBricks © {new Date().getFullYear()} - Build and Backtest
            Trading Strategies
          </span>
        </div>
      </footer>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/strategy-guide" element={<StrategyGuide />} />
        <Route path="/editor" element={<MainApp />} />
        <Route path="/" element={<Navigate to="/editor" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

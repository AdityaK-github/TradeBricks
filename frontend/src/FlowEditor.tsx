interface FlowEditorProps {
  userId: string;
  selectedStrategyId: string | null;
  onStrategyCreated?: (strategyId: string) => void;
  onStrategyUpdated?: () => void;
  showToast?: (message: string, type: "success" | "error") => void;
  showStrategySidebar?: boolean;
  toggleStrategySidebar?: () => void;
}

const FlowEditor: React.FC<FlowEditorProps> = ({
  userId,
  selectedStrategyId,
  onStrategyCreated,
  onStrategyUpdated,
  showToast = (message, type) => {}, // Default no-op implementation
  showStrategySidebar = true,
  toggleStrategySidebar = () => {}, // Default no-op implementation
}) => {
  // ... existing code ...

  return (
    <div className="flex flex-col h-full">
      {/* Strategy info and save button */}
      <div className="bg-white p-4 border-b dark:bg-dark-secondary dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full text-xl font-bold border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-1 dark:bg-dark-secondary dark:text-dark-text dark:hover:border-gray-600 dark:focus:border-blue-400"
              placeholder="Strategy Name"
            />
            <input
              type="text"
              value={strategyDescription}
              onChange={(e) => setStrategyDescription(e.target.value)}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-1 mt-1 dark:bg-dark-secondary dark:text-dark-muted dark:hover:border-gray-600 dark:focus:border-blue-400"
              placeholder="Strategy Description (optional)"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleStrategySidebar}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title={
                showStrategySidebar ? "Hide strategies" : "Show strategies"
              }
            >
              {showStrategySidebar ? "Hide Strategies" : "Show Strategies"}
            </button>
            <button
              onClick={() => setShowBlocksSidebar(!showBlocksSidebar)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title={
                showBlocksSidebar
                  ? "Hide blocks sidebar"
                  : "Show blocks sidebar"
              }
            >
              {showBlocksSidebar ? "Hide Blocks" : "Show Blocks"}
            </button>
            <button
              onClick={saveStrategy}
              disabled={isSaving}
              className={`px-4 py-2 rounded ${
                isSaving
                  ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 text-white dark:bg-dark-accent dark:hover:bg-blue-600"
              }`}
            >
              {isSaving
                ? "Saving..."
                : currentStrategy?._id
                ? "Update Strategy"
                : "Save Strategy"}
            </button>
          </div>
        </div>
      </div>

      {/* Flow editor */}
      {/* ... existing code ... */}
    </div>
  );
};

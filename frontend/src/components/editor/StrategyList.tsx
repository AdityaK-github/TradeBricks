import React, { useState } from "react";
import { deleteStrategy, createStrategy } from "../../services/apiService";
import { allTemplates } from "../../services/strategyTemplates";

interface Strategy {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface StrategyListProps {
  strategies: Strategy[];
  isLoading: boolean;
  error: string | null;
  onSelectStrategy: (strategyId: string) => void;
  onCreateStrategy: () => void;
  onRefreshStrategies: () => void;
  userId: string;
  showToast?: (message: string, type: "success" | "error") => void;
}

const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  isLoading,
  error,
  onSelectStrategy,
  onCreateStrategy,
  onRefreshStrategies,
  userId,
  showToast = () => {}, // Default no-op if not provided
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const handleDeleteStrategy = async (
    e: React.MouseEvent,
    strategyId: string
  ) => {
    e.stopPropagation(); // Prevent the click from selecting the strategy

    if (window.confirm("Are you sure you want to delete this strategy?")) {
      try {
        await deleteStrategy(strategyId);
        onRefreshStrategies(); // Refresh the list after deletion
        showToast("Strategy deleted successfully", "success");
      } catch (error) {
        console.error("Failed to delete strategy:", error);
        showToast("Failed to delete strategy. Please try again.", "error");
      }
    }
  };

  // Function to toggle template display
  const toggleTemplates = () => {
    setShowTemplates(!showTemplates);
  };

  // Create a strategy from a template
  const createStrategyFromTemplate = async (templateIndex: number) => {
    const template = allTemplates[templateIndex];

    if (isCreatingTemplate) return; // Prevent multiple clicks

    setIsCreatingTemplate(true);

    try {
      console.log(`Creating strategy from template: ${template.name}`);
      console.log(
        `Template has ${template.blocks.length} blocks and ${template.connections.length} connections`
      );

      // Log first few connections for debugging
      if (template.connections.length > 0) {
        console.log("Sample connections:", template.connections.slice(0, 3));
      }

      // Prepare strategy data from template
      const strategyData = {
        name: `${template.name}`,
        description: template.description,
        userId,
        blocks: template.blocks,
        connections: template.connections,
      };

      // Create strategy in the API
      const newStrategy = await createStrategy(strategyData);
      console.log("Strategy created successfully:", newStrategy._id);

      // Refresh and select the new strategy
      onRefreshStrategies();
      onSelectStrategy(newStrategy._id);

      showToast(`Strategy created from template: ${template.name}`, "success");
    } catch (error) {
      console.error("Failed to create strategy from template:", error);
      showToast(
        "Failed to create strategy from template. Please try again.",
        "error"
      );
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 dark:bg-dark-secondary">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400 dark:bg-dark-secondary">
        <p>Error loading strategies:</p>
        <p>{error}</p>
        <button
          onClick={onRefreshStrategies}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-dark-accent"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 dark:bg-dark-secondary dark:text-dark-text">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Strategies</h2>
        <div>
          <button
            onClick={onCreateStrategy}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-dark-success dark:hover:bg-green-600"
          >
            Create Strategy
          </button>
        </div>
      </div>

      {/* Template Strategies Section */}
      <div className="mb-6">
        <button
          onClick={toggleTemplates}
          className="flex items-center justify-between w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded dark:bg-blue-900/40 dark:hover:bg-blue-800/50 dark:text-blue-300"
        >
          <span className="font-medium">Strategy Templates</span>
          <span>{showTemplates ? "▲" : "▼"}</span>
        </button>

        {showTemplates && (
          <div className="mt-2 border rounded-lg overflow-hidden dark:border-gray-700">
            <div className="p-2 bg-gray-100 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Select a template to start with a pre-configured strategy
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {allTemplates.map((template, index) => (
                <li
                  key={index}
                  className="py-2 px-3 hover:bg-blue-50 cursor-pointer relative group dark:hover:bg-blue-900/20"
                  onClick={() => createStrategyFromTemplate(index)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium dark:text-dark-text">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 text-white px-2 py-1 rounded text-xs dark:bg-dark-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        createStrategyFromTemplate(index);
                      }}
                    >
                      Use
                    </button>
                  </div>

                  {/* Tooltip with more details */}
                  <div className="absolute invisible group-hover:visible z-10 bg-gray-800 text-white text-xs p-2 rounded shadow-lg -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full w-64">
                    <div className="font-semibold mb-1">Strategy Details:</div>
                    <p>• {template.blocks.length} Blocks</p>
                    <p>• {template.connections.length} Connections</p>
                    <p>
                      • Symbol:{" "}
                      {template.blocks[0]?.data?.data?.symbol || "N/A"}
                    </p>
                    <div className="mt-1 text-gray-300">
                      Click to create a strategy from this template
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* User Strategies */}
      <h3 className="font-medium text-gray-700 mb-2 dark:text-gray-300">
        Your Saved Strategies
      </h3>
      {strategies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>You don't have any strategies yet.</p>
          <p className="mt-2">
            Click the "Create Strategy" button above to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {strategies.map((strategy) => (
            <li
              key={strategy._id}
              className="py-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800"
              onClick={() => onSelectStrategy(strategy._id)}
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{strategy.name}</h3>
                {strategy.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {strategy.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Last updated: {new Date(strategy.updatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteStrategy(e, strategy._id)}
                className="ml-2 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StrategyList;

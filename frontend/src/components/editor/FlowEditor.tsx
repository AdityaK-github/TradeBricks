import React, { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  Connection,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Node,
  ConnectionMode,
  NodeTypes,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";

import BlocksSidebar from "./BlocksSidebar";
import AlgoNode from "../blocks/AlgoNode";
import { BlockType } from "../blocks/BlockTypes";
import {
  getStrategyById,
  createStrategy,
  updateStrategy,
} from "../../services/apiService";

// Define types for strategy data
interface Strategy {
  _id?: string;
  name: string;
  description: string;
  userId: string;
  blocks: any[];
  connections: any[];
}

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState(
    `Strategy ${new Date().toLocaleDateString()}`
  );
  const [strategyDescription, setStrategyDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showBlocksSidebar, setShowBlocksSidebar] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationWarning, setShowValidationWarning] = useState(false);

  // Force edge reconnection when component mounts or edges change
  useEffect(() => {
    if (edges.length > 0 && reactFlowInstance) {
      // Force a small delay to ensure nodes are properly rendered
      const timer = setTimeout(() => {
        console.log("Refreshing connection layout with", edges.length, "edges");

        // Force a re-render of edges with enhanced styling
        setEdges((currentEdges) =>
          currentEdges.map((edge) => ({
            ...edge,
            animated: true, // Temporarily animate to make them more visible
            style: {
              stroke: "#2563eb", // Use a more visible blue color
              strokeWidth: 3,
            },
          }))
        );

        // After animation, revert to normal style
        setTimeout(() => {
          setEdges((currentEdges) =>
            currentEdges.map((edge) => ({
              ...edge,
              animated: false,
              style: {
                stroke: "#555",
                strokeWidth: 2,
              },
            }))
          );
          // Don't auto-fit view here as it causes unexpected zoom changes
          // reactFlowInstance.fitView({ padding: 0.2 });
        }, 500);
      }, 300);
      return () => clearTimeout(timer);
    }
    // Only depend on edges.length and reactFlowInstance existence, not setEdges which never changes
  }, [edges.length, reactFlowInstance]);

  // Define custom node types (now moved inside the component after setNodes is defined)
  const nodeTypes = useMemo(
    () => ({
      algoNode: (props: any) => <AlgoNode {...props} setNodes={setNodes} />,
    }),
    [setNodes]
  );

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        console.warn(
          "Invalid connection attempt - missing source or target",
          connection
        );
        return;
      }

      // Enhanced edge with better styling and properties
      const newEdge: Edge = {
        ...connection,
        id: uuidv4(),
        animated: false,
        style: { stroke: "#555", strokeWidth: 2 },
      };

      console.log("Creating new connection:", newEdge);

      setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        console.log("Updated edges count:", newEdges.length);
        return newEdges;
      });
    },
    [setEdges]
  );

  // Load strategy when selectedStrategyId changes
  useEffect(() => {
    const loadStrategy = async () => {
      if (!selectedStrategyId) {
        // Reset to new strategy if no ID is selected
        setNodes([]);
        setEdges([]);
        setCurrentStrategy(null);
        setStrategyName(`Strategy ${new Date().toLocaleDateString()}`);
        setStrategyDescription("");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const strategy = await getStrategyById(selectedStrategyId);
        setCurrentStrategy(strategy);
        setStrategyName(strategy.name);
        setStrategyDescription(strategy.description || "");

        // Convert strategy blocks to nodes
        const flowNodes = strategy.blocks.map((block: any) => ({
          id: block.id,
          type: "algoNode",
          position: block.position,
          data: block.data,
        }));

        // Apply better positioning for visualization
        const optimizeNodePositions = (nodes: any[]) => {
          // Only optimize if it looks like a template (predefined positions)
          const isTemplate =
            nodes.length > 3 &&
            nodes.every(
              (node) =>
                node.position &&
                (node.position.x % 100 === 0 || node.position.y % 100 === 0)
            );

          if (!isTemplate) return nodes;

          console.log("Optimizing node positions for template strategy");

          // Find node types to better organize
          const dataNodes = nodes.filter(
            (n) => n.data?.blockType?.category === "Data Source"
          );
          const indicatorNodes = nodes.filter(
            (n) => n.data?.blockType?.category === "Technical Indicator"
          );
          const conditionNodes = nodes.filter(
            (n) =>
              n.data?.blockType?.category === "Condition" ||
              n.data?.blockType?.category.includes("Signal")
          );
          const orderNodes = nodes.filter(
            (n) =>
              n.data?.blockType?.category === "Order Execution" ||
              n.data?.blockType?.category === "Risk Management"
          );

          // Horizontal spacing
          const columnWidth = 300;
          // Vertical spacing
          const rowHeight = 150;

          // Position nodes in columns by type
          let updatedNodes = [...nodes];

          // Helper to position nodes in a column
          const positionColumn = (columnNodes: any[], colIndex: number) => {
            return columnNodes.map((node, i) => {
              const yPos = 100 + i * rowHeight;
              const xPos = 100 + colIndex * columnWidth;

              // Find and update the node
              const nodeIndex = updatedNodes.findIndex((n) => n.id === node.id);
              if (nodeIndex >= 0) {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  position: { x: xPos, y: yPos },
                };
              }
              return updatedNodes[nodeIndex];
            });
          };

          // Position each column
          positionColumn(dataNodes, 0);
          positionColumn(indicatorNodes, 1);
          positionColumn(conditionNodes, 2);
          positionColumn(orderNodes, 3);

          return updatedNodes;
        };

        // Apply the optimization
        const optimizedNodes = optimizeNodePositions(flowNodes);

        // Convert strategy connections to edges with proper validation
        const flowEdges = strategy.connections
          .filter((connection: any) => {
            // Validate that source and target nodes exist
            const sourceExists = optimizedNodes.some(
              (node: any) => node.id === connection.source
            );
            const targetExists = optimizedNodes.some(
              (node: any) => node.id === connection.target
            );
            if (!sourceExists || !targetExists) {
              console.warn(
                `Connection ${connection.id} has invalid source or target`,
                connection
              );
              return false;
            }
            return true;
          })
          .map((connection: any) => ({
            id: connection.id,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            // Add these properties to ensure the connection is displayed properly
            animated: true,
            type: "smoothstep",
            style: {
              stroke: "#2563eb",
              strokeWidth: 2.5,
            },
            labelStyle: { fill: "#888", fontSize: 12 },
            labelShowBg: true,
            labelBgStyle: { fill: "rgba(255, 255, 255, 0.8)" },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 2,
          }));

        setNodes(optimizedNodes);
        setEdges(flowEdges);
        console.log(
          "Loaded nodes:",
          optimizedNodes.length,
          "and edges:",
          flowEdges.length
        );

        // Apply staggered animation for edges to ensure they render
        // This helps ReactFlow render connections properly
        if (flowEdges.length > 0) {
          setTimeout(() => {
            // First set all edges to animated to make them appear
            setEdges((currentEdges) =>
              currentEdges.map((edge) => ({
                ...edge,
                animated: true,
                style: {
                  ...edge.style,
                  stroke: "#2563eb",
                  strokeWidth: 3,
                },
              }))
            );

            // Instead of updating edges in separate timeouts (causing many re-renders),
            // schedule a single update after all animations would have completed
            setTimeout(() => {
              setEdges((currentEdges) =>
                currentEdges.map((edge) => ({
                  ...edge,
                  animated: false,
                  style: {
                    ...edge.style,
                    strokeWidth: 2.5,
                  },
                }))
              );
            }, 100 * flowEdges.length + 100); // Add a buffer of 100ms
          }, 500);
        }

        // Only fit view on initial load, not on subsequent changes
        if (reactFlowInstance && !currentStrategy) {
          // Use a timeout to ensure nodes are rendered before fitting
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.4, duration: 200 });
          }, 300);
        }
      } catch (error) {
        console.error("Error loading strategy:", error);
        setError("Failed to load strategy. Please try again.");
      }

      setIsLoading(false);
    };

    loadStrategy();
  }, [selectedStrategyId, setNodes, setEdges, reactFlowInstance]);

  // Validate the current strategy
  const validateStrategy = useCallback(() => {
    const errors: string[] = [];

    // Check if strategy is empty
    if (nodes.length === 0) {
      errors.push(
        "Strategy is empty. Add blocks to build your trading strategy."
      );
      setValidationErrors(errors);
      return errors;
    }

    // Check for orphaned nodes (no connections)
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const orphanedNodes = nodes.filter(
      (node) => !connectedNodeIds.has(node.id)
    );
    if (orphanedNodes.length > 0) {
      const nodeNames = orphanedNodes
        .map((node) => node.data.blockType.name)
        .join(", ");
      errors.push(
        `Disconnected blocks found: ${nodeNames}. Connect them to create a complete flow.`
      );
    }

    // Check for data source
    const hasDataSource = nodes.some(
      (node) => node.data.blockType.category === "Data Source"
    );
    if (!hasDataSource) {
      errors.push(
        "No market data source found. Add a Market Data block to get price data."
      );
    }

    // Check for order execution block
    const hasOrderBlock = nodes.some(
      (node) => node.data.blockType.category === "Order Execution"
    );
    if (!hasOrderBlock) {
      errors.push(
        "No order execution block found. Add a Market Order block to execute trades."
      );
    }

    // Check for incomplete flow (no path from data to order)
    if (hasDataSource && hasOrderBlock) {
      // Find all data source nodes
      const dataSourceNodes = nodes.filter(
        (node) => node.data.blockType.category === "Data Source"
      );

      // Find all order execution nodes
      const orderNodes = nodes.filter(
        (node) => node.data.blockType.category === "Order Execution"
      );

      // Simple connectivity check (can be improved)
      let pathExists = false;

      // Track visited nodes to avoid infinite loops
      const visitedNodes = new Set<string>();

      // Function to check if there's a path from source to target
      const hasPath = (
        source: string,
        target: string,
        visited: Set<string>
      ) => {
        if (source === target) return true;
        if (visited.has(source)) return false;

        visited.add(source);

        // Get all outgoing edges from this node
        const outgoingEdges = edges.filter((edge) => edge.source === source);

        for (const edge of outgoingEdges) {
          if (hasPath(edge.target, target, new Set(visited))) {
            return true;
          }
        }

        return false;
      };

      // Check if there's a path from any data source to any order node
      for (const dataNode of dataSourceNodes) {
        for (const orderNode of orderNodes) {
          if (hasPath(dataNode.id, orderNode.id, new Set<string>())) {
            pathExists = true;
            break;
          }
        }
        if (pathExists) break;
      }

      if (!pathExists) {
        errors.push(
          "No complete path from data source to order execution. Connect your blocks to create a working strategy."
        );
      }
    }

    setValidationErrors(errors);
    return errors;
  }, [nodes.length, edges.length]); // Only depend on the lengths, not entire arrays

  // Validate on nodes/edges change
  useEffect(() => {
    // Move validation logic directly into the effect instead of depending on validateStrategy
    const errors = validateStrategy();
    setShowValidationWarning(errors.length > 0);
  }, [nodes.length, edges.length]); // Remove validateStrategy from dependencies

  // Save the current strategy
  const saveStrategy = async () => {
    if (!reactFlowInstance) {
      showToast("Flow editor not ready. Please try again.", "error");
      return;
    }

    // Validate the strategy before saving
    const errors = validateStrategy();
    if (errors.length > 0) {
      const confirmSave = window.confirm(
        `Your strategy has the following issues:\n\n${errors.join(
          "\n"
        )}\n\nDo you still want to save it?`
      );
      if (!confirmSave) {
        return;
      }
    }

    setIsSaving(true);
    try {
      // Convert nodes and edges to strategy format
      const strategyBlocks = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      }));

      const strategyConnections = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      }));

      const strategyData = {
        name: strategyName,
        description: strategyDescription,
        userId,
        blocks: strategyBlocks,
        connections: strategyConnections,
      };

      if (currentStrategy?._id) {
        // Update existing strategy
        await updateStrategy(currentStrategy._id, strategyData);
        if (onStrategyUpdated) {
          onStrategyUpdated();
        }
      } else {
        // Create new strategy
        const newStrategy = await createStrategy(strategyData);
        setCurrentStrategy(newStrategy);
        if (onStrategyCreated) {
          onStrategyCreated(newStrategy._id);
        }
      }

      showToast("Strategy saved successfully!", "success");
    } catch (error) {
      console.error("Error saving strategy:", error);
      showToast("Failed to save strategy. Please try again.", "error");
    }
    setIsSaving(false);
  };

  // Handle drag start for blocks from sidebar
  const onDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(blockType)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // Handle drop of blocks onto the canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        console.error("Flow instance not initialized");
        return;
      }

      // Validate data transfer
      if (!event.dataTransfer.getData("application/reactflow")) {
        console.error("No valid data found in drag event");
        return;
      }

      // Get the mouse position relative to the flow
      const reactFlowBounds = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      try {
        const blockTypeData = event.dataTransfer.getData(
          "application/reactflow"
        );

        // Parse the data, handle potential JSON errors
        let blockType: BlockType;
        try {
          blockType = JSON.parse(blockTypeData);
        } catch (parseError) {
          console.error("Error parsing block data:", parseError);
          return;
        }

        // Validate blockType
        if (
          !blockType ||
          !blockType.id ||
          !blockType.name ||
          !blockType.category
        ) {
          console.error("Invalid block data:", blockType);
          return;
        }

        // Create a new node
        const newNode: Node = {
          id: uuidv4(),
          type: "algoNode",
          position: {
            x: reactFlowBounds.x,
            y: reactFlowBounds.y,
          },
          data: {
            blockType,
            data: blockType.defaultData || {},
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error("Error adding new node:", error);
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Strategy info and save button */}
      <div className="bg-white p-4 border-b dark:bg-dark-secondary dark:border-gray-700 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full text-xl font-bold border-b-2 border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none py-2 px-3 bg-blue-50 rounded dark:bg-gray-700 dark:border-blue-600 dark:text-white dark:hover:border-blue-500 dark:focus:border-blue-400"
              placeholder="Strategy Name"
            />
            <input
              type="text"
              value={strategyDescription}
              onChange={(e) => setStrategyDescription(e.target.value)}
              className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-1 px-3 mt-1 dark:bg-dark-secondary dark:text-dark-muted dark:hover:border-gray-600 dark:focus:border-blue-400"
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
      <div className="flex flex-1 overflow-hidden relative">
        {showBlocksSidebar && <BlocksSidebar onDragStart={onDragStart} />}

        <div className="flex-1 h-full relative">
          {!showBlocksSidebar && (
            <>
              <button
                onClick={() => setShowBlocksSidebar(true)}
                className="absolute top-16 left-4 z-10 w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md dark:bg-dark-accent dark:hover:bg-blue-600"
              >
                +
              </button>

              {/* Always visible persistent strategy name banner */}
              <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 shadow-lg flex items-center">
                <span className="font-semibold truncate mr-auto">
                  {strategyName}
                </span>
                {!showBlocksSidebar && (
                  <button
                    onClick={() => setShowBlocksSidebar(true)}
                    className="ml-4 text-xs bg-white text-blue-500 px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Show Blocks
                  </button>
                )}
              </div>
            </>
          )}
          {isLoading ? (
            <div className="h-full flex items-center justify-center dark:text-dark-text">
              <div className="text-lg">Loading strategy...</div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-lg text-red-500 dark:text-red-400">
                {error}
              </div>
            </div>
          ) : (
            <ReactFlowProvider>
              <div
                className="h-full w-full"
                onDrop={onDrop}
                onDragOver={onDragOver}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  onInit={(instance) => {
                    // Only set the instance if it's changed to prevent unnecessary re-renders
                    setReactFlowInstance((prev) => {
                      if (!prev) {
                        // Only fit view once on initial load
                        if (!selectedStrategyId) {
                          setTimeout(
                            () => instance.fitView({ padding: 0.4 }),
                            200
                          );
                        }
                        return instance;
                      }
                      return prev;
                    });
                  }}
                  fitView={false} // Disable automatic fitting
                  fitViewOptions={{ padding: 0.4, duration: 300 }}
                  minZoom={0.1}
                  maxZoom={2.5}
                  defaultZoom={0.8}
                  zoomOnScroll={true}
                  panOnScroll={false}
                  className="dark:bg-dark-primary"
                  defaultEdgeOptions={{
                    animated: true,
                    style: {
                      stroke: "#2563eb",
                      strokeWidth: 2.5,
                    },
                    type: "smoothstep",
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      width: 15,
                      height: 15,
                      color: "#2563eb",
                    },
                  }}
                  connectionLineStyle={{
                    stroke: "#2563eb",
                    strokeWidth: 3,
                    strokeDasharray: "5,5",
                  }}
                  connectionLineType="smoothstep"
                  elevateEdgesOnSelect={true}
                  elementsSelectable={true}
                  nodesDraggable={true}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                >
                  <Background className="dark:bg-dark-primary" />
                  <Controls
                    className="dark:bg-dark-secondary dark:text-dark-text dark:border-gray-700"
                    showZoom={true}
                    showFitView={true}
                    fitViewOptions={{ padding: 0.4, duration: 500 }}
                  />

                  {/* Strategy Validation Panel */}
                  {showValidationWarning && (
                    <Panel
                      position="top-right"
                      className="bg-amber-50 p-3 rounded-md shadow-md border border-amber-200 text-amber-700 dark:bg-amber-900/50 dark:border-amber-700/50 dark:text-amber-200 max-w-md"
                    >
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h3 className="font-bold mb-1">
                            Strategy Validation Issues
                          </h3>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                          <div className="mt-2 text-sm">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open("/strategy-guide", "_blank");
                              }}
                              className="text-blue-600 dark:text-blue-400 underline"
                            >
                              View Strategy Building Guide
                            </a>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  )}
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;

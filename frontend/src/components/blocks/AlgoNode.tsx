import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { BlockType, BlockInput, BlockOutput } from "./BlockTypes";

interface AlgoNodeData {
  blockType: BlockType;
  data: Record<string, any>;
}

interface AlgoNodeProps extends NodeProps<AlgoNodeData> {
  setNodes?: (updater: any) => void;
}

const AlgoNode = ({ data, id, setNodes }: AlgoNodeProps) => {
  const { blockType } = data;
  const { inputs, outputs, name, category } = blockType;
  const [isEditing, setIsEditing] = useState(false);

  // Define category colors
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      "Data Source": "bg-blue-500",
      "Technical Indicator": "bg-green-500",
      Condition: "bg-yellow-500",
      "Trading Signal": "bg-purple-500",
      "Order Execution": "bg-red-500",
      "Risk Management": "bg-orange-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const handleInputChange = (inputId: string, value: any) => {
    // Add console logging for debugging
    console.log("Changing input:", inputId, "to value:", value);

    // Update the node data
    setNodes?.((nds: any) => {
      // Add more console logging to track the update
      console.log("Current nodes:", nds);

      const updatedNodes = nds.map((node: any) => {
        if (node.id === id) {
          // Log before update
          console.log(
            "Updating node:",
            node.id,
            "Current data:",
            node.data.data
          );

          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              data: {
                ...node.data.data,
                [inputId]: value,
              },
            },
          };

          // Log after update
          console.log("Updated node data:", updatedNode.data.data);
          return updatedNode;
        }
        return node;
      });

      return updatedNodes;
    });
  };

  // Format the input field based on type
  const renderInputField = (input: BlockInput) => {
    const currentValue =
      data.data[input.id] !== undefined
        ? data.data[input.id]
        : input.defaultValue || "";

    const inputClassBase =
      "w-full p-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text";

    switch (input.type) {
      case "number":
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const value =
                e.target.value === "" ? 0 : parseFloat(e.target.value);
              if (!isNaN(value)) {
                handleInputChange(input.id, value);
              }
            }}
            className={inputClassBase}
          />
        );
      case "string":
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            className={inputClassBase}
          />
        );
      case "boolean":
        return (
          <select
            value={currentValue.toString()}
            onChange={(e) =>
              handleInputChange(input.id, e.target.value === "true")
            }
            className={inputClassBase}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            className={inputClassBase}
          />
        );
    }
  };

  return (
    <div className="rounded-md border border-gray-300 shadow-md bg-white w-[220px] dark:bg-gray-800 dark:border-gray-700 dark:text-dark-text">
      {/* Header */}
      <div
        className={`${getCategoryColor(
          category
        )} text-white p-2 rounded-t-md font-bold text-sm flex justify-between items-center`}
      >
        <span>{name}</span>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Body */}
      <div className="p-3 relative">
        {/* Input Handles and Fields */}
        {inputs?.map((input: BlockInput, index: number) => (
          <div key={`input-${input.id}`} className="mb-3 relative">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              style={{
                top: `${(index + 1) * 32}px`,
                background: "#2563eb",
                width: "12px",
                height: "12px",
                border: "2px solid white",
              }}
            />
            <div className="pl-5">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {input.name}
                {input.isRequired && <span className="text-red-500">*</span>}
              </div>
              {isEditing ? (
                renderInputField(input)
              ) : (
                <div className="text-xs font-medium mt-1 dark:text-dark-text">
                  {data.data[input.id] || input.defaultValue || "-"}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Output Handles */}
        {outputs?.map((output: BlockOutput, index: number) => (
          <div key={`output-${output.id}`} className="mb-3 relative">
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              style={{
                top: `${(index + 1) * 32}px`,
                background: "#2563eb",
                width: "12px",
                height: "12px",
                border: "2px solid white",
              }}
            />
            <div className="text-xs text-gray-600 text-right pr-5 dark:text-gray-400">
              {output.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlgoNode;

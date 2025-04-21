import React from "react";
import { BLOCK_TYPES, BlockCategory, BlockType } from "../blocks/BlockTypes";

interface BlocksSidebarProps {
  onDragStart: (event: React.DragEvent, blockType: BlockType) => void;
}

const BlocksSidebar: React.FC<BlocksSidebarProps> = ({ onDragStart }) => {
  // Group blocks by category
  const blocksByCategory = BLOCK_TYPES.reduce((acc, block) => {
    const category = block.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as Record<BlockCategory, BlockType[]>);

  return (
    <div className="w-64 bg-white border-r border-gray-300 h-full overflow-auto p-4 dark:bg-dark-secondary dark:border-gray-700 dark:text-dark-text">
      <h2 className="text-xl font-bold mb-4">Blocks</h2>

      {Object.entries(blocksByCategory).map(([category, blocks]) => (
        <div key={category} className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {category}
          </h3>

          <div className="space-y-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={(event) => onDragStart(event, block)}
                className="p-2 bg-gray-100 border border-gray-300 rounded-md cursor-move hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <div className="text-sm font-medium dark:text-dark-text">
                  {block.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {block.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BlocksSidebar;

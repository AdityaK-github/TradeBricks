// Simple script to debug Tailwind CSS issues
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get content paths from Tailwind config
import tailwindConfig from "./tailwind.config.js";

console.log("Tailwind CSS Debug Information:");
console.log("------------------------------");
console.log("Content paths:", tailwindConfig.content);

// Check if paths exist
const checkedPaths = [];
for (const contentPath of tailwindConfig.content) {
  if (typeof contentPath === "string") {
    // Convert glob patterns to directory paths for checking
    const basePath = contentPath.split("*")[0].replace(/\/\*\*$/, "");
    const fullPath = path.join(__dirname, basePath);

    try {
      const stats = fs.statSync(fullPath);
      checkedPaths.push({
        path: contentPath,
        exists: true,
        isDirectory: stats.isDirectory(),
      });
    } catch (error) {
      checkedPaths.push({
        path: contentPath,
        exists: false,
        error: error.message,
      });
    }
  }
}

console.log("\nPath existence check:");
console.table(checkedPaths);

// Try to find one file with Tailwind classes
console.log("\nSearching for files with Tailwind classes:");

// Get all css/js/ts/tsx files from src directory
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (/\.(js|jsx|ts|tsx|css|html)$/.test(file)) {
      results.push(filePath);
    }
  }

  return results;
}

try {
  const files = walkDir(path.join(__dirname, "src"));

  // Look for Tailwind classes in first 10 files
  const filesToCheck = files.slice(0, 10);

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, "utf-8");

    // Simple check for common Tailwind classes
    const hasTailwindClasses =
      /class(Name)?="[^"]*(?:bg-|text-|flex|grid|p-|m-|w-|h-)[^"]*"/.test(
        content
      );

    console.log(
      `${hasTailwindClasses ? "✅" : "❌"} ${path.relative(__dirname, file)}`
    );
  }
} catch (error) {
  console.error("Error scanning files:", error);
}

console.log("\nTailwind DEBUG complete!");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{css,scss}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-blue-600",
    "text-white",
    "dark:bg-dark-accent",
    "bg-gray-200",
    "text-gray-700",
    "hover:bg-gray-300",
    "dark:bg-gray-700",
    "dark:text-gray-200",
    "dark:hover:bg-gray-600",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode custom colors
        dark: {
          primary: "#1E293B", // slate-800
          secondary: "#334155", // slate-700
          accent: "#3B82F6", // blue-500
          text: "#F8FAFC", // slate-50
          muted: "#94A3B8", // slate-400
          success: "#10B981", // emerald-500
          error: "#EF4444", // red-500
          warning: "#F59E0B", // amber-500
          info: "#3B82F6", // blue-500
          chart: {
            bg: "#1E293B",
            line: "#60A5FA",
            grid: "#475569",
            text: "#CBD5E1",
          },
        },
      },
      boxShadow: {
        "dark-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.5)",
        "dark-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "dark-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

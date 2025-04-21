import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Let Vite handle PostCSS configuration automatically
  // No need to explicitly require tailwindcss and autoprefixer here
});

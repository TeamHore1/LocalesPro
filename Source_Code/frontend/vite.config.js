import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH || "/";

  return {
    base: basePath.endsWith("/") ? basePath : `${basePath}/`,
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 600,
    },
  };
});

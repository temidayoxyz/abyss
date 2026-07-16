import { defineConfig } from "vite";

// Project site: https://temidayoxyz.github.io/abyss/
export default defineConfig({
  base: "/abyss/",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2020",
    outDir: "dist",
    assetsDir: "assets",
  },
});

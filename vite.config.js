import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/demo1/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        main: resolve(__dirname, "main.html"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "main") return "main/index.js";
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});

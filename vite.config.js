import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    force: true,
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@heroicons/react",
    ],
  },
});

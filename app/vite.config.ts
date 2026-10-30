import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    {
      name: "archive-entry",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "index.html",
          source: readFileSync(
            new URL("./index.html", import.meta.url),
            "utf8",
          ),
        });
      },
    },
  ],
  build: {
    outDir: fileURLToPath(new URL("../template/", import.meta.url)),
    emptyOutDir: false,
    lib: {
      entry: "src/main.tsx",
      name: "BoragomArchive",
      formats: ["iife"],
      fileName: () => "assets/app.js",
      cssFileName: "archive",
    },
    cssCodeSplit: false,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
      },
      output: { assetFileNames: "assets/[name][extname]" },
    },
    minify: "esbuild",
  },
  define: { "process.env.NODE_ENV": '"production"' },
});

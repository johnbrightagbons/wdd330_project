import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",
  publicDir: "../public",
  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        login: resolve(__dirname, "src/auth/login.html"),
        signup: resolve(__dirname, "src/auth/signup.html"),
        budget: resolve(__dirname, "src/budget/index.html"),
        transactions: resolve(__dirname, "src/transactions/transaction.html"),
        // report: resolve(__dirname, "src/reports/report.html"),
      },
    },
    assetsInclude: ["**/*.json", "**/*.svg"],
    copyPublicDir: true,
  },
});

import { ReportModule } from "./reports.js";
import { CurrencyModule } from "./currency.js";
import { NotificationModule } from "./notifications.js";
import { ChartsModule } from "./charts.js";
import { CategoriesModule } from "./categories.js";
import { MessageHandler } from "./message-handler.js";

class AppModules {
  constructor() {
    this.reports = new ReportModule();
    this.currency = new CurrencyModule();
    this.notifications = new NotificationModule();
    this.charts = new ChartsModule();
    this.categories = new CategoriesModule();
    this.messageHandler = new MessageHandler();
  }

  async initialize() {
    try {
      console.log("Initializing application modules...");

      // Initialize core modules first
      await this.messageHandler.init();
      await this.categories.init();

      // Initialize other modules
      await this.currency.initialize();
      await this.charts.initialize();
      await this.reports.initialize();

      // Set up cross-module communication
      this.setupEventListeners();

      console.log("All modules initialized successfully");

      // Show success notification
      await MessageHandler.showToast(
        "Application loaded successfully!",
        "success"
      );
    } catch (error) {
      console.error("Failed to initialize modules:", error);

      // Show error notification
      await MessageHandler.showToast(
        "Failed to initialize application modules",
        "error"
      );

      // Fallback initialization
      this.initializeFallback();
    }
  }

  async initializeFallback() {
    console.log("Initializing fallback modules...");
    try {
      // Initialize with default configurations
      await this.reports.initializeWithDefaults();
      await this.charts.initializeWithDefaults();

      console.log("Fallback initialization completed");
    } catch (error) {
      console.error("Fallback initialization failed:", error);
    }
  }

  setupEventListeners() {
    // Listen for currency changes to update reports and charts
    document.addEventListener("currencyChanged", async (event) => {
      console.log("Currency changed:", event.detail);

      await this.reports.updateCharts();
      await this.charts.updateAllCharts();

      await MessageHandler.showToast("Currency updated", "info", 2000);
    });

    // Listen for transaction changes to update reports and charts
    document.addEventListener("transactionAdded", async (event) => {
      const { type, amount, category } = event.detail;
      console.log("Transaction added:", event.detail);

      // Update modules
      await this.reports.updateCharts();
      await this.charts.updateChart("expense");
      await this.charts.updateChart("trend");

      // Show notifications
      this.notifications.confirmTransaction(type, amount, category);
      await MessageHandler.showTransactionAdded();

      // Check budget warnings
      await this.checkBudgetWarnings(category, amount);
    });

    // Listen for transaction updates
    document.addEventListener("transactionUpdated", async (event) => {
      console.log("Transaction updated:", event.detail);

      await this.reports.updateCharts();
      await this.charts.updateAllCharts();

      await MessageHandler.showToast("Transaction updated", "success", 2000);
    });

    // Listen for transaction deletions
    document.addEventListener("transactionDeleted", async (event) => {
      console.log("Transaction deleted:", event.detail);

      await this.reports.updateCharts();
      await this.charts.updateAllCharts();

      await MessageHandler.showToast("Transaction deleted", "info", 2000);
    });

    // Listen for budget changes
    document.addEventListener("budgetUpdated", async (event) => {
      console.log("Budget updated:", event.detail);

      await this.reports.updateBudgetChart();
      await this.charts.updateChart("budget");

      await MessageHandler.showToast("Budget updated", "success", 2000);
    });

    // Listen for export events
    document.addEventListener("dataExported", async (event) => {
      console.log("Data exported:", event.detail);
      await MessageHandler.showExportSuccess();
    });

    // Listen for sync events
    document.addEventListener("syncStarted", async () => {
      await MessageHandler.showSyncInProgress();
    });

    document.addEventListener("syncCompleted", async (event) => {
      const { success, message } = event.detail;
      if (success) {
        await MessageHandler.showToast("Data synchronized", "success", 2000);
      } else {
        await MessageHandler.showToast(message || "Sync failed", "error");
      }
    });
  }

  async checkBudgetWarnings(category, amount) {
    try {
      const categoryInfo = this.categories.getCategoryInfo("expense", category);
      if (!categoryInfo || !categoryInfo.budget) return;

      // Get current spending for category (this would come from your transaction manager)
      const currentSpending = await this.getCurrentSpending(category);
      const budget = categoryInfo.budget;
      const percentage = (currentSpending / budget) * 100;

      if (percentage >= 100) {
        await MessageHandler.showBudgetExceeded(categoryInfo.label);
      } else if (percentage >= 80) {
        await MessageHandler.showBudgetWarning(categoryInfo.label);
      }
    } catch (error) {
      console.error("Error checking budget warnings:", error);
    }
  }

  async getCurrentSpending(category) {
    // This would integrate with your transaction manager
    // For now, return a placeholder
    return 0;
  }

  // Utility methods for other parts of the app
  getModule(moduleName) {
    switch (moduleName) {
      case "reports":
        return this.reports;
      case "currency":
        return this.currency;
      case "notifications":
        return this.notifications;
      case "charts":
        return this.charts;
      case "categories":
        return this.categories;
      case "messageHandler":
        return this.messageHandler;
      default:
        console.warn(`Module '${moduleName}' not found`);
        return null;
    }
  }

  async refreshAllModules() {
    try {
      await MessageHandler.showToast("Refreshing data...", "info", 1000);

      await this.reports.generateReport();
      await this.charts.updateAllCharts();

      await MessageHandler.showToast("Data refreshed", "success", 2000);
    } catch (error) {
      console.error("Error refreshing modules:", error);
      await MessageHandler.showToast("Failed to refresh data", "error");
    }
  }

  async exportAllData(format = "csv") {
    try {
      await MessageHandler.showToast("Preparing export...", "info", 1000);

      // Trigger export event
      document.dispatchEvent(
        new CustomEvent("dataExported", {
          detail: { format, timestamp: new Date().toISOString() },
        })
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      await MessageHandler.showToast("Export failed", "error");
    }
  }
}

// Create global instance
window.AppModules = AppModules;

export default AppModules;

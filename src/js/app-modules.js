import { ReportModule } from "./reports.js";
import { CurrencyModule } from "./currency.js";
import { NotificationModule } from "./notifications.js";

class AppModules {
  constructor() {
    this.reports = new ReportModule();
    this.currency = new CurrencyModule();
    this.notifications = new NotificationModule();
  }

  async initialize() {
    try {
      // Initialize all modules
      await this.currency.initialize();
      await this.reports.initialize();

      // Set up cross-module communication
      this.setupEventListeners();

      console.log("All modules initialized successfully");
    } catch (error) {
      console.error("Failed to initialize modules:", error);
      this.notifications.showError("Failed to initialize application modules");
    }
  }

  setupEventListeners() {
    // Listen for currency changes to update reports
    document.addEventListener("currencyChanged", () => {
      this.reports.updateCharts();
    });

    // Listen for transaction changes to update reports
    document.addEventListener("transactionAdded", (event) => {
      const { type, amount, category } = event.detail;
      this.notifications.confirmTransaction(type, amount, category);
      this.reports.updateCharts();
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.appModules = new AppModules();
  window.appModules.initialize();
});

import { AuthManager } from "./auth.js";
import { MobileMenuManager } from "./mobile-menu.js";
import { TransactionManager } from "./transactions.js";
import { ReportModule } from "./reports.js";
import { CurrencyModule } from "./currency.js";
import { NotificationModule } from "./notifications.js";
import { CategoriesModule } from "./categories.js";

// Main application entry point
class BudgetBluApp {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.isInitialized = false;
    this.mobileMenu = null;
    this.transactionManager = null;
    this.reportModule = null;
    this.currencyModule = null;
    this.notificationModule = null;
  }

  async init() {
    try {
      console.log("Initializing Budget Blu App...");

      this.setupErrorHandling();

      this.notificationModule = new NotificationModule();
      this.currencyModule = new CurrencyModule();
      this.initializeMobileMenu();

      await this.initializePage();

      const addBtn = document.querySelector(".add-btn");
      if (addBtn) {
        addBtn.addEventListener("click", (e) => {
          if (!AuthManager.isUserLoggedIn?.()) {
            e.preventDefault();
            alert("You must be logged in to add a transaction.");
          }
        });
      }

      window.notificationModule = this.notificationModule;
      window.currencyModule = this.currencyModule;
      window.transactionManager = this.transactionManager;
      window.reportModule = this.reportModule;

      this.isInitialized = true;
      console.log("Budget Blu App initialized successfully");

      if (this.notificationModule) {
        this.notificationModule.showSuccess("Application loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to initialize Budget Blu App:", error);
      if (this.notificationModule) {
        this.notificationModule.showError("Failed to initialize application");
      }
    }
  }

  initializeMobileMenu() {
    this.mobileMenu = new MobileMenuManager();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("dashboard") || path.includes("index"))
      return "dashboard";
    if (path.includes("budget")) return "budget";
    if (
      path.includes("auth") ||
      path.includes("login") ||
      path.includes("signup")
    )
      return "auth";
    if (path.includes("transactions")) return "transactions";
    if (path.includes("reports")) return "reports";
    return "dashboard";
  }

  async initializePage() {
    if (this.currencyModule) {
      await this.currencyModule.initialize();
    }

    switch (this.currentPage) {
      case "dashboard":
        await this.initializeDashboard();
        break;
      case "transactions":
        await this.initializeTransactions();
        break;
      case "reports":
        await this.initializeReports();
        break;
      case "budget":
        await this.initializeBudget();
        break;
    }
  }

  async initializeDashboard() {
    try {
      // Initialize new modules
      this.categoryModule = new CategoryModule();
      this.budgetModule = new BudgetModule();
      this.budgetAlertManager = new BudgetAlertManager(
        this.budgetModule,
        this.notificationModule
      );

      // Populate category selects
      const categorySelect = document.getElementById("transactionCategory");
      if (categorySelect) {
        this.categoriesModule.populateCategorySelect(categorySelect);
      }

      // Check budget alerts
      this.budgetAlertManager.checkAllBudgets();

      // Update budget progress in dashboard
      this.updateBudgetProgress();

      console.log("Dashboard initialized successfully");
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    }
  }

  async initializeTransactions() {
    this.transactionManager = new TransactionManager(
      this.updateDashboardStats.bind(this)
    );
    this.transactionManager.initialize();
  }

  async initializeReports() {
    this.reportModule = new ReportModule();
    await this.reportModule.initialize();
  }

  async initializeBudget() {
    console.log("Budget page initialized");
  }

  updateDashboardStats() {
    if (!this.transactionManager) return;

    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) return;

    const transactions = this.transactionManager.transactions;

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = totalIncome - totalExpenses;

    this.updateStatElement("totalIncome", totalIncome);
    this.updateStatElement("totalExpenses", totalExpenses);
    this.updateStatElement("balance", balance);
  }

  updateStatElement(elementId, amount) {
    const element = document.getElementById(elementId);
    if (element) {
      element.dataset.amount = amount;
      if (this.currencyModule) {
        element.textContent = this.currencyModule.formatAmount(amount);
      } else {
        element.textContent = `$${amount.toFixed(2)}`;
      }
    }
  }

  setupErrorHandling() {
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      if (this.notificationModule) {
        this.notificationModule.showError("An unexpected error occurred");
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      if (this.notificationModule) {
        this.notificationModule.showError("An unexpected error occurred");
      }
    });
  }
}

// Global logout function
window.logout = function () {
  AuthManager.logout();
  if (window.notificationModule) {
    window.notificationModule.showSuccess("Logged out successfully");
  }
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
};

document.addEventListener("DOMContentLoaded", () => {
  window.budgetApp = new BudgetBluApp();
  window.budgetApp.init();
});

export default BudgetBluApp;

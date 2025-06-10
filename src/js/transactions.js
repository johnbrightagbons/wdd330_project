import { AuthManager } from "./auth.js";

export class TransactionManager {
  constructor(updateDashboardStatsFn = () => {}) {
    this.transactions = [];
    this.categories = [
      "Food & Dining",
      "Transportation",
      "Shopping",
      "Entertainment",
      "Bills & Utilities",
      "Healthcare",
      "Education",
      "Travel",
      "Groceries",
      "Rent/Mortgage",
      "Insurance",
      "Savings",
      "Investment",
      "Other",
    ];
    this.isInitialized = false;
    this.updateDashboardStats = updateDashboardStatsFn;
  }

  initialize() {
    if (this.isInitialized) return;

    const currentUser = AuthManager.getCurrentUser();
    if (currentUser) {
      this.loadUserTransactions(currentUser.email);
    }

    this.setupEventListeners();
    this.updateTransactionDisplay();

    if (typeof this.updateDashboardStats === "function") {
      this.updateDashboardStats();
    }

    this.isInitialized = true;
  }
}

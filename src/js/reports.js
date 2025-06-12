import { AuthManager } from "./auth.js";
import { TransactionManager } from "./transactions.js";

export class ReportModule {
  constructor() {
    this.transactionManager = null;
    this.currentPeriod = "monthly";
    this.currentCategory = "all";
    this.charts = {};
    this.reportData = null;
  }

  async initialize(transactionManager) {
    this.transactionManager = transactionManager;
    this.setupEventListeners();
    this.populateCategoryFilter();
    await this.generateReport();
  }

  setupEventListeners() {
    const reportPeriod = document.getElementById("reportPeriod");
    const reportCategory = document.getElementById("reportCategory");
    const generateReportBtn = document.getElementById("generateReport");
    const customDateRange = document.getElementById("customDateRange");

    if (reportPeriod) {
      reportPeriod.addEventListener("change", (e) => {
        this.currentPeriod = e.target.value;
        if (e.target.value === "custom") {
          customDateRange.style.display = "flex";
        } else {
          customDateRange.style.display = "none";
        }
      });
    }

    if (reportCategory) {
      reportCategory.addEventListener("change", (e) => {
        this.currentCategory = e.target.value;
      });
    }

    if (generateReportBtn) {
      generateReportBtn.addEventListener("click", () => {
        this.generateReport();
      });
    }

    // Export buttons
    const exportPDF = document.getElementById("exportPDF");
    const exportCSV = document.getElementById("exportCSV");

    if (exportPDF) {
      exportPDF.addEventListener("click", () => this.exportToPDF());
    }

    if (exportCSV) {
      exportCSV.addEventListener("click", () => this.exportToCSV());
    }
  }

  populateCategoryFilter() {
    const categorySelect = document.getElementById("reportCategory");
    if (!categorySelect || !this.transactionManager) return;

    const transactions = this.transactionManager.getTransactions();
    const categories = [...new Set(transactions.map((t) => t.category))];

    categorySelect.innerHTML =
      '<option value="all">All Categories</option>' +
      categories
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
  }

  async generateReport() {
    if (!this.transactionManager) {
      console.error("Transaction manager not initialized");
      return;
    }

    try {
      const { startDate, endDate } = this.getDateRange();
      const transactions = this.filterTransactions(startDate, endDate);

      this.reportData = this.calculateReportData(transactions);
      this.updateSummaryCards();
      this.updateCharts();
      this.updateBreakdownTable();

      // Show success notification
      if (window.notificationModule) {
        window.notificationModule.showSuccess("Report generated successfully!");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      if (window.notificationModule) {
        window.notificationModule.showError("Failed to generate report");
      }
    }
  }

  getDateRange() {
    const now = new Date();
    let startDate, endDate;

    switch (this.currentPeriod) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "custom":
        const startInput = document.getElementById("startDate");
        const endInput = document.getElementById("endDate");
        startDate = startInput?.value
          ? new Date(startInput.value)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = endInput?.value ? new Date(endInput.value) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return { startDate, endDate };
  }

  filterTransactions(startDate, endDate) {
    const allTransactions = this.transactionManager.getTransactions();

    return allTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const dateInRange =
        transactionDate >= startDate && transactionDate < endDate;
      const categoryMatch =
        this.currentCategory === "all" ||
        transaction.category === this.currentCategory;

      return dateInRange && categoryMatch;
    });
  }

  calculateReportData(transactions) {
    const income = transactions.filter((t) => t.type === "income");
    const expenses = transactions.filter((t) => t.type === "expense");

    const totalIncome = income.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const totalExpenses = expenses.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach((transaction) => {
      const category = transaction.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          amount: 0,
          count: 0,
          transactions: [],
        };
      }
      categoryBreakdown[category].amount += parseFloat(transaction.amount);
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].transactions.push(transaction);
    });

    return {
      summary: this.calculateSummary(filteredTransactions),
      categoryBreakdown: this.getCategoryBreakdown(filteredTransactions),
      trends: this.calculateTrends(filteredTransactions),
    };
  }

  filterByPeriod(transactions, period, startDate = null, endDate = null) {
    const now = new Date();
    let filterStart, filterEnd;

    switch (period) {
      case "daily":
        filterStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        filterEnd = new Date(filterStart.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        const dayOfWeek = now.getDay();
        filterStart = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        filterEnd = new Date(filterStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "custom":
        filterStart = startDate ? new Date(startDate) : new Date(0);
        filterEnd = endDate ? new Date(endDate) : new Date();
        break;
    }

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= filterStart && transactionDate < filterEnd;
    });
  }
}

export { ReportModule as ReportManager };
export default ReportModule;

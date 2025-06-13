import { CategoriesModule } from "./categories.js";
import { ChartsModule } from "./charts.js";
import { MessageHandler } from "./message-handler.js";

export class ReportModule {
  constructor() {
    this.transactionManager = null;
    this.currentPeriod = "monthly";
    this.currentCategory = "all";
    this.charts = {};
    this.reportData = null;
    this.categoriesModule = new CategoriesModule();
    this.chartsModule = new ChartsModule();
  }

  async initialize(transactionManager) {
    try {
      this.transactionManager = transactionManager;

      // Initialize dependencies
      await this.categoriesModule.init();
      await this.chartsModule.initialize();

      this.setupEventListeners();
      this.populateCategoryFilter();
      await this.generateReport();

      console.log("Report module initialized successfully");
    } catch (error) {
      console.error("Failed to initialize report module:", error);
      await this.initializeWithDefaults();
    }
  }

  async initializeWithDefaults() {
    console.log("Initializing report module with defaults...");
    this.setupEventListeners();
    this.populateCategoryFilter();
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
      generateReportBtn.addEventListener("click", async () => {
        await this.generateReport();
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
    if (!categorySelect) return;

    try {
      // Clear existing options except "All Categories"
      const allOption = categorySelect.querySelector('option[value="all"]');
      categorySelect.innerHTML = "";

      if (allOption) {
        categorySelect.appendChild(allOption);
      } else {
        const defaultOption = document.createElement("option");
        defaultOption.value = "all";
        defaultOption.textContent = "All Categories";
        categorySelect.appendChild(defaultOption);
      }

      // Add expense categories
      const expenseCategories = this.categoriesModule.getExpenseCategories();
      if (expenseCategories) {
        const expenseGroup = document.createElement("optgroup");
        expenseGroup.label = "Expense Categories";

        Object.entries(expenseCategories).forEach(([key, category]) => {
          const option = document.createElement("option");
          option.value = `expense_${key}`;
          option.textContent = `${category.icon} ${category.label}`;
          expenseGroup.appendChild(option);
        });

        categorySelect.appendChild(expenseGroup);
      }

      // Add income categories
      const incomeCategories = this.categoriesModule.getIncomeCategories();
      if (incomeCategories) {
        const incomeGroup = document.createElement("optgroup");
        incomeGroup.label = "Income Categories";

        Object.entries(incomeCategories).forEach(([key, category]) => {
          const option = document.createElement("option");
          option.value = `income_${key}`;
          option.textContent = `${category.icon} ${category.label}`;
          incomeGroup.appendChild(option);
        });

        categorySelect.appendChild(incomeGroup);
      }
    } catch (error) {
      console.error("Error populating category filter:", error);
    }
  }

  async generateReport() {
    try {
      await MessageHandler.showToast("Generating report...", "info", 1000);

      const dateRange = this.getDateRange();
      const transactions = this.getFilteredTransactions(dateRange);

      this.reportData = this.processReportData(transactions);

      await this.updateReportDisplay();
      await this.updateCharts();

      await MessageHandler.showToast(
        "Report generated successfully",
        "success",
        2000
      );
    } catch (error) {
      console.error("Error generating report:", error);
      await MessageHandler.showToast("Failed to generate report", "error");
    }
  }

  getDateRange() {
    const now = new Date();
    let startDate, endDate;

    switch (this.currentPeriod) {
      case "weekly":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7
        );
        endDate = now;
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "custom":
        const startInput = document.getElementById("startDate");
        const endInput = document.getElementById("endDate");
        startDate = startInput
          ? new Date(startInput.value)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = endInput ? new Date(endInput.value) : now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
    }

    return { startDate, endDate };
  }

  getFilteredTransactions(dateRange) {
    if (!this.transactionManager) {
      return this.getMockTransactions();
    }

    let transactions = this.transactionManager.getTransactionsByDateRange(
      dateRange.startDate,
      dateRange.endDate
    );

    // Filter by category if not "all"
    if (this.currentCategory !== "all") {
      const [type, category] = this.currentCategory.split("_");
      transactions = transactions.filter(
        (t) => t.type === type && t.category === category
      );
    }

    return transactions;
  }

  getMockTransactions() {
    // Mock data for demonstration
    return [
      {
        id: 1,
        type: "expense",
        category: "food",
        amount: 45.5,
        date: new Date(),
        description: "Lunch",
      },
      {
        id: 2,
        type: "expense",
        category: "transportation",
        amount: 25.0,
        date: new Date(),
        description: "Gas",
      },
      {
        id: 3,
        type: "income",
        category: "salary",
        amount: 3000.0,
        date: new Date(),
        description: "Monthly salary",
      },
      {
        id: 4,
        type: "expense",
        category: "entertainment",
        amount: 15.99,
        date: new Date(),
        description: "Netflix",
      },
      {
        id: 5,
        type: "expense",
        category: "utilities",
        amount: 120.0,
        date: new Date(),
        description: "Electricity bill",
      },
    ];
  }

  processReportData(transactions) {
    const data = {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      transactionCount: transactions.length,
      categoryBreakdown: {},
      dailyTrends: {},
      topCategories: {},
      averageTransaction: 0,
    };

    // Process transactions
    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      const category = transaction.category;
      const type = transaction.type;
      const date = new Date(transaction.date).toDateString();

      // Update totals
      if (type === "income") {
        data.totalIncome += amount;
      } else if (type === "expense") {
        data.totalExpenses += amount;
      }

      // Category breakdown
      const categoryKey = `${type}_${category}`;
      if (!data.categoryBreakdown[categoryKey]) {
        data.categoryBreakdown[categoryKey] = {
          type,
          category,
          amount: 0,
          count: 0,
          transactions: [],
        };
      }
      data.categoryBreakdown[categoryKey].amount += amount;
      data.categoryBreakdown[categoryKey].count += 1;
      data.categoryBreakdown[categoryKey].transactions.push(transaction);

      // Daily trends
      if (!data.dailyTrends[date]) {
        data.dailyTrends[date] = { income: 0, expenses: 0 };
      }
      data.dailyTrends[date][type === "income" ? "income" : "expenses"] +=
        amount;
    });

    // Calculate derived values
    data.netIncome = data.totalIncome - data.totalExpenses;
    data.averageTransaction =
      transactions.length > 0
        ? (data.totalIncome + data.totalExpenses) / transactions.length
        : 0;

    // Top categories
    data.topCategories = Object.values(data.categoryBreakdown)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return data;
  }

  async updateReportDisplay() {
    if (!this.reportData) return;

    try {
      // Update summary cards
      this.updateSummaryCards();

      // Update detailed breakdown
      this.updateCategoryBreakdown();

      // Update transaction list
      this.updateTransactionList();
    } catch (error) {
      console.error("Error updating report display:", error);
    }
  }

  updateSummaryCards() {
    const { totalIncome, totalExpenses, netIncome, transactionCount } =
      this.reportData;

    // Update income card
    const incomeElement = document.getElementById("totalIncome");
    if (incomeElement) {
      incomeElement.textContent = `$${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    }

    // Update expenses card
    const expensesElement = document.getElementById("totalExpenses");
    if (expensesElement) {
      expensesElement.textContent = `$${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    }

    // Update net income card
    const netIncomeElement = document.getElementById("netIncome");
    if (netIncomeElement) {
      netIncomeElement.textContent = `$${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      netIncomeElement.className = netIncome >= 0 ? "positive" : "negative";
    }

    // Update transaction count
    const countElement = document.getElementById("transactionCount");
    if (countElement) {
      countElement.textContent = transactionCount.toString();
    }
  }

  updateCategoryBreakdown() {
    const container = document.getElementById("categoryBreakdown");
    if (!container) return;

    container.innerHTML = "";

    Object.values(this.reportData.categoryBreakdown).forEach((categoryData) => {
      const categoryInfo = this.categoriesModule.getCategoryInfo(
        categoryData.type,
        categoryData.category
      );

      const categoryElement = document.createElement("div");
      categoryElement.className = "category-item";
      categoryElement.innerHTML = `
        <div class="category-header">
          <span class="category-icon">${categoryInfo?.icon || "📊"}</span>
          <span class="category-name">${categoryInfo?.label || categoryData.category}</span>
          <span class="category-amount ${categoryData.type}">
            ${categoryData.type === "expense" ? "-" : "+"}$${categoryData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div class="category-details">
          <small>${categoryData.count} transactions</small>
        </div>
      `;

      container.appendChild(categoryElement);
    });
  }

  updateTransactionList() {
    const container = document.getElementById("transactionList");
    if (!container) return;

    container.innerHTML = "";

    // Get all transactions from category breakdown
    const allTransactions = [];
    Object.values(this.reportData.categoryBreakdown).forEach((categoryData) => {
      allTransactions.push(...categoryData.transactions);
    });

    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display transactions
    allTransactions.slice(0, 20).forEach((transaction) => {
      // Show only first 20
      const categoryInfo = this.categoriesModule.getCategoryInfo(
        transaction.type,
        transaction.category
      );

      const transactionElement = document.createElement("div");
      transactionElement.className = "transaction-item";
      transactionElement.innerHTML = `
        <div class="transaction-icon">${categoryInfo?.icon || "📊"}</div>
        <div class="transaction-details">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-category">${categoryInfo?.label || transaction.category}</div>
          <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === "expense" ? "-" : "+"}$${parseFloat(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      `;

      container.appendChild(transactionElement);
    });
  }

  async updateCharts() {
    try {
      // Update expense breakdown chart
      const expenseData = this.getExpenseChartData();
      if (expenseData.labels.length > 0) {
        await this.chartsModule.updateChart("expense", expenseData);
      }

      // Update trend chart
      const trendData = this.getTrendChartData();
      if (trendData.labels.length > 0) {
        await this.chartsModule.updateChart("trend", trendData);
      }

      // Update income chart if exists
      const incomeData = this.getIncomeChartData();
      if (incomeData.labels.length > 0) {
        await this.chartsModule.updateChart("income", incomeData);
      }
    } catch (error) {
      console.error("Error updating charts:", error);
    }
  }

  getExpenseChartData() {
    const data = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };

    Object.values(this.reportData.categoryBreakdown).forEach((categoryData) => {
      if (categoryData.type === "expense") {
        data.labels.push(categoryData.category);
        data.datasets[0].data.push(categoryData.amount);
      }
    });

    return data;
  }

  getTrendChartData() {
    const data = {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          backgroundColor: "#4CAF50",
          borderColor: "#45a049",
          borderWidth: 1,
        },
        {
          label: "Expenses",
          data: [],
          borderColor: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          tension: 0.4,
        },
      ],
    };

    Object.entries(this.reportData.dailyTrends).forEach(([date, trendData]) => {
      data.labels.push(date);
      data.datasets[0].data.push(trendData.income);
      data.datasets[1].data.push(trendData.expenses);
    });

    return data;
  }

  getIncomeChartData() {
    const data = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Income",
          data: [3000, 3200, 2800, 3500, 3100, 3300],
          backgroundColor: "#4CAF50",
          borderColor: "#45a049",
          borderWidth: 1,
        },
      ],
    };

    // Process transactions to get monthly income data
    // This is a placeholder for actual data processing logic
    // You would need to implement this based on your data structure

    return data;
  }

  exportToPDF() {
    // Implementation for PDF export
    console.log("Exporting to PDF...");
  }

  exportToCSV() {
    if (!this.transactionManager) return;

    const transactions = this.transactionManager.getTransactions();
    const filteredTransactions = this.filterTransactionsByPeriod(transactions);

    const csvContent = this.convertToCSV(filteredTransactions);
    this.downloadCSV(
      csvContent,
      `financial-report-${new Date().toISOString().split("T")[0]}.csv`
    );
  }

  convertToCSV(transactions) {
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const csvRows = [headers.join(",")];

    transactions.forEach((transaction) => {
      const row = [
        transaction.date,
        transaction.type,
        transaction.category || "",
        transaction.description || "",
        transaction.amount,
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }

  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export { ReportModule as ReportManager };
export default ReportModule;

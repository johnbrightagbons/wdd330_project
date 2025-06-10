import { AuthManager } from "./auth.js";
import { TransactionManager } from "./transactions.js";

export class ReportModule {
  constructor() {
    this.transactionManager = new TransactionManager();
    this.charts = {};
    this.chartColors = [
      "#060481",
      "#4CAF50",
      "#FF9800",
      "#F44336",
      "#9C27B0",
      "#2196F3",
      "#FF5722",
      "#795548",
      "#607D8B",
      "#E91E63",
    ];
  }

  // Initialize all charts
  async initialize() {
    const currentUser = AuthManager.getCurrentUser();
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }

    this.transactionManager.loadUserTransactions(currentUser.email);
    await this.loadChartJS();
    this.createExpenseByCategory();
    this.createMonthlyTrends();
    this.createIncomeVsExpenses();
  }

  // Load Chart.js library
  async loadChartJS() {
    if (typeof Chart !== "undefined") return;

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Create expense breakdown by category
  createExpenseByCategory() {
    const canvas = document.getElementById("expenseCategoryChart");
    if (!canvas) return;

    const expenses = this.transactionManager.transactions.filter(
      (t) => t.type === "expense"
    );
    const categoryData = this.groupByCategory(expenses);

    if (this.charts.categoryChart) {
      this.charts.categoryChart.destroy();
    }

    this.charts.categoryChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: Object.keys(categoryData),
        datasets: [
          {
            data: Object.values(categoryData),
            backgroundColor: this.chartColors,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Expenses by Category",
            font: { size: 16, weight: "bold" },
          },
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Create monthly spending trends
  createMonthlyTrends() {
    const canvas = document.getElementById("monthlyTrendsChart");
    if (!canvas) return;

    const monthlyData = this.getMonthlyData();

    if (this.charts.trendsChart) {
      this.charts.trendsChart.destroy();
    }

    this.charts.trendsChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: "Monthly Expenses",
            data: monthlyData.expenses,
            borderColor: "#060481",
            backgroundColor: "rgba(6, 4, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Monthly Spending Trends",
            font: { size: 16, weight: "bold" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "$" + value.toFixed(2);
              },
            },
          },
        },
      },
    });
  }

  // Create income vs expenses comparison
  createIncomeVsExpenses() {
    const canvas = document.getElementById("incomeExpenseChart");
    if (!canvas) return;

    const monthlyData = this.getMonthlyIncomeExpenseData();

    if (this.charts.incomeExpenseChart) {
      this.charts.incomeExpenseChart.destroy();
    }

    this.charts.incomeExpenseChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: monthlyData.labels,
        datasets: [
          {
            label: "Income",
            data: monthlyData.income,
            backgroundColor: "#4CAF50",
            borderColor: "#388E3C",
            borderWidth: 1,
          },
          {
            label: "Expenses",
            data: monthlyData.expenses,
            backgroundColor: "#F44336",
            borderColor: "#D32F2F",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Income vs Expenses",
            font: { size: 16, weight: "bold" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "$" + value.toFixed(2);
              },
            },
          },
        },
      },
    });
  }

  // Helper method to group transactions by category
  groupByCategory(transactions) {
    return transactions.reduce((acc, transaction) => {
      const category = transaction.category || "Other";
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {});
  }

  // Helper method to get monthly data
  getMonthlyData() {
    const months = [];
    const expenses = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      months.push(monthName);

      const monthExpenses = this.transactionManager.transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            t.type === "expense" &&
            transactionDate.getMonth() === date.getMonth() &&
            transactionDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      expenses.push(monthExpenses);
    }

    return { labels: months, expenses };
  }

  // Helper method to get monthly income vs expense data
  getMonthlyIncomeExpenseData() {
    const months = [];
    const income = [];
    const expenses = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      months.push(monthName);

      const monthTransactions = this.transactionManager.transactions.filter(
        (t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate.getMonth() === date.getMonth() &&
            transactionDate.getFullYear() === date.getFullYear()
          );
        }
      );

      const monthIncome = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      income.push(monthIncome);
      expenses.push(monthExpenses);
    }

    return { labels: months, income, expenses };
  }

  // Update all charts with new data
  updateCharts() {
    this.createExpenseByCategory();
    this.createMonthlyTrends();
    this.createIncomeVsExpenses();
  }

  // Destroy all charts (cleanup)
  destroy() {
    Object.values(this.charts).forEach((chart) => {
      if (chart) chart.destroy();
    });
    this.charts = {};
  }
}

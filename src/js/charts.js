import { ConfigLoader } from "./config-loader.js";

export class ChartsModule {
  constructor() {
    this.charts = {};
    this.chartConfigs = {};
    this.colorSchemes = {};
    this.configLoader = new ConfigLoader();
  }

  async initialize() {
    try {
      // Load all configuration files
      await this.loadConfigurations();

      // Load Chart.js if not already loaded
      if (typeof Chart === "undefined") {
        await this.loadChartJS();
      }

      this.initializeAllCharts();
    } catch (error) {
      console.error("Failed to initialize charts:", error);
    }
  }

  async loadConfigurations() {
    try {
      // Load chart configurations
      const chartsConfig = await this.configLoader.loadConfig("charts.json");
      this.chartConfigs = chartsConfig.chartTypes;
      this.chartDefaults = chartsConfig.chartDefaults;

      // Load color schemes
      const colorsConfig = await this.configLoader.loadConfig("colors.json");
      this.colorSchemes = colorsConfig.colorSchemes;
      this.categoryColors = colorsConfig.categoryColors;

      console.log("Chart configurations loaded successfully");
    } catch (error) {
      console.error("Failed to load chart configurations:", error);
      // Fallback to default configurations
      this.setDefaultConfigurations();
    }
  }

  setDefaultConfigurations() {
    // Fallback configurations if JSON loading fails
    this.chartConfigs = {
      expense: {
        type: "doughnut",
        elementId: "expenseChart",
        title: "Expense Breakdown",
      },
      income: {
        type: "bar",
        elementId: "incomeChart",
        title: "Monthly Income",
      },
      trend: {
        type: "line",
        elementId: "trendChart",
        title: "Income vs Expenses Trend",
      },
    };
  }

  async loadChartJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js";
      script.onload = () => {
        console.log("Chart.js loaded successfully");
        resolve();
      };
      script.onerror = () => {
        console.error("Failed to load Chart.js");
        reject(new Error("Failed to load Chart.js"));
      };
      document.head.appendChild(script);
    });
  }

  initializeAllCharts() {
    Object.keys(this.chartConfigs).forEach((chartKey) => {
      this.createChart(chartKey);
    });
  }

  createChart(chartKey) {
    const config = this.chartConfigs[chartKey];
    if (!config) {
      console.warn(`Chart configuration for '${chartKey}' not found`);
      return;
    }

    const ctx = document.getElementById(config.elementId);
    if (!ctx) {
      console.warn(`Canvas element with ID '${config.elementId}' not found`);
      return;
    }

    // Apply color scheme based on chart type
    const colors = this.getColorsForChart(chartKey);

    switch (config.type) {
      case "doughnut":
        this.createDoughnutChart(chartKey, ctx, config, colors);
        break;
      case "bar":
        this.createBarChart(chartKey, ctx, config, colors);
        break;
      case "line":
        this.createLineChart(chartKey, ctx, config, colors);
        break;
      default:
        console.warn(`Unknown chart type: ${config.type}`);
    }
  }

  getColorsForChart(chartKey) {
    switch (chartKey) {
      case "expense":
        return this.colorSchemes.expense || {};
      case "income":
        return this.colorSchemes.income || {};
      case "trend":
        return this.colorSchemes.trend || {};
      default:
        return {};
    }
  }

  createDoughnutChart(chartKey, ctx, config, colors) {
    const defaultData = config.defaultData || {};

    this.charts[chartKey] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: defaultData.labels || [],
        datasets: [
          {
            data: defaultData.values || [],
            backgroundColor: colors.primary || [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
            ],
            hoverBackgroundColor: colors.hover || colors.primary,
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        ...config.options,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 16, weight: "bold" },
          },
          ...config.options?.plugins,
        },
      },
    });
  }

  createBarChart(chartKey, ctx, config, colors) {
    const defaultData = config.defaultData || {};

    this.charts[chartKey] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: defaultData.labels || [],
        datasets: [
          {
            label: "Income",
            data: defaultData.values || [],
            backgroundColor:
              colors.gradient?.start || colors.primary?.[0] || "#4CAF50",
            borderColor: colors.primary?.[0] || "#4CAF50",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        ...config.options,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 16, weight: "bold" },
          },
          ...config.options?.plugins,
        },
      },
    });
  }

  createLineChart(chartKey, ctx, config, colors) {
    const defaultData = config.defaultData || {};

    this.charts[chartKey] = new Chart(ctx, {
      type: "line",
      data: {
        labels: defaultData.labels || [],
        datasets: [
          {
            label: "Income",
            data: defaultData.income || [],
            borderColor: colors.income?.line || "#4CAF50",
            backgroundColor: colors.income?.fill || "rgba(76, 175, 80, 0.1)",
            tension: config.options?.tension || 0.4,
            fill: true,
            pointBackgroundColor: colors.income?.point || "#4CAF50",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
          },
          {
            label: "Expenses",
            data: defaultData.expenses || [],
            borderColor: colors.expense?.line || "#f44336",
            backgroundColor: colors.expense?.fill || "rgba(244, 67, 54, 0.1)",
            tension: config.options?.tension || 0.4,
            fill: true,
            pointBackgroundColor: colors.expense?.point || "#f44336",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
          },
        ],
      },
      options: {
        ...this.chartDefaults,
        ...config.options,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: { size: 16, weight: "bold" },
          },
          ...config.options?.plugins,
        },
      },
    });
  }

  updateChart(chartKey, data) {
    if (!this.charts[chartKey]) {
      console.warn(`Chart '${chartKey}' not found`);
      return;
    }

    const chart = this.charts[chartKey];

    switch (chartKey) {
      case "expense":
        this.updateExpenseChart(chart, data);
        break;
      case "income":
        this.updateIncomeChart(chart, data);
        break;
      case "trend":
        this.updateTrendChart(chart, data);
        break;
    }
  }

  updateExpenseChart(chart, data) {
    if (data.labels && data.values) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;

      // Update colors based on categories
      const colors = data.labels.map(
        (label) => this.categoryColors[label.toLowerCase()] || "#C9CBCF"
      );
      chart.data.datasets[0].backgroundColor = colors;

      chart.update("active");
    }
  }

  updateIncomeChart(chart, data) {
    if (data.labels && data.values) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;
      chart.update("active");
    }
  }

  updateTrendChart(chart, data) {
    if (data.labels && data.income && data.expenses) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.income;
      chart.data.datasets[1].data = data.expenses;
      chart.update("active");
    }
  }

  updateAllCharts(transactionData) {
    if (!transactionData) return;

    // Process data for expense chart
    const expenseData = this.processExpenseData(transactionData);
    this.updateChart("expense", expenseData);

    // Process data for income chart
    const incomeData = this.processIncomeData(transactionData);
    this.updateChart("income", incomeData);

    // Process data for trend chart
    const trendData = this.processTrendData(transactionData);
    this.updateChart("trend", trendData);
  }

  processExpenseData(transactions) {
    const expenses = transactions.filter((t) => t.type === "expense");
    const categoryTotals = {};

    expenses.forEach((transaction) => {
      const category = transaction.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Math.abs(transaction.amount);
    });

    return {
      labels: Object.keys(categoryTotals),
      values: Object.values(categoryTotals),
    };
  }

  processIncomeData(transactions) {
    const income = transactions.filter((t) => t.type === "income");
    const monthlyTotals = {};

    income.forEach((transaction) => {
      const date = new Date(transaction.date);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      monthlyTotals[month] =
        (monthlyTotals[month] || 0) + Math.abs(transaction.amount);
    });

    return {
      labels: Object.keys(monthlyTotals),
      values: Object.values(monthlyTotals),
    };
  }

  processTrendData(transactions) {
    const weeklyData = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const week = this.getWeekNumber(date);
      const weekLabel = `Week ${week}`;

      if (!weeklyData[weekLabel]) {
        weeklyData[weekLabel] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        weeklyData[weekLabel].income += Math.abs(transaction.amount);
      } else {
        weeklyData[weekLabel].expenses += Math.abs(transaction.amount);
      }
    });

    const labels = Object.keys(weeklyData).sort();
    const income = labels.map((label) => weeklyData[label].income);
    const expenses = labels.map((label) => weeklyData[label].expenses);

    return {
      labels,
      income,
      expenses,
    };
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  resizeCharts() {
    Object.values(this.charts).forEach((chart) => {
      chart.resize();
    });
  }

  destroyChart(chartKey) {
    if (this.charts[chartKey]) {
      this.charts[chartKey].destroy();
      delete this.charts[chartKey];
    }
  }

  destroyAllCharts() {
    Object.keys(this.charts).forEach((chartKey) => {
      this.destroyChart(chartKey);
    });
  }

  getChartImage(chartKey, format = "image/png") {
    if (!this.charts[chartKey]) {
      console.warn(`Chart '${chartKey}' not found`);
      return null;
    }

    return this.charts[chartKey].toBase64Image(format);
  }

  downloadChartImage(chartKey, filename) {
    const imageData = this.getChartImage(chartKey);
    if (!imageData) return;

    const link = document.createElement("a");
    link.download = filename || `${chartKey}-chart.png`;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  addChartConfig(key, config) {
    this.chartConfigs[key] = config;
  }

  removeChartConfig(key) {
    delete this.chartConfigs[key];
    this.destroyChart(key);
  }

  // Animation methods
  animateChart(chartKey, animationConfig) {
    if (!this.charts[chartKey]) return;

    this.charts[chartKey].update(animationConfig || "active");
  }

  // Theme methods
  setChartTheme(theme) {
    const themes = {
      light: {
        backgroundColor: "#ffffff",
        textColor: "#333333",
        gridColor: "rgba(0, 0, 0, 0.1)",
      },
      dark: {
        backgroundColor: "#2d3748",
        textColor: "#ffffff",
        gridColor: "rgba(255, 255, 255, 0.1)",
      },
    };

    const selectedTheme = themes[theme] || themes.light;

    Object.values(this.charts).forEach((chart) => {
      chart.options.plugins.title.color = selectedTheme.textColor;
      chart.options.plugins.legend.labels.color = selectedTheme.textColor;

      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.ticks.color = selectedTheme.textColor;
          chart.options.scales.x.grid.color = selectedTheme.gridColor;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = selectedTheme.textColor;
          chart.options.scales.y.grid.color = selectedTheme.gridColor;
        }
      }
      chart.canvas.style.backgroundColor = selectedTheme.backgroundColor;
      chart.update("active");
    });
  }
  setLightTheme() {
    this.setChartTheme("light");
  }
  setDarkTheme() {
    this.setChartTheme("dark");
  }
}

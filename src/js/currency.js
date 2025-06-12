export class CurrencyModule {
  constructor() {
    this.apiKey = "3be8c0a0d1464c98d722973a"; // Get from https://www.exchangerate-api.com/
    this.baseUrl =
      "https://v6.exchangerate-api.com/v6/3be8c0a0d1464c98d722973a/latest/USD";
    this.fallbackUrl = "https://api.exchangerate-api.com/v4/latest"; // Free tier fallback
    this.currentCurrency = this.loadCurrentCurrency();
    this.exchangeRates = this.loadExchangeRates();
    this.lastUpdated = this.getLastUpdated();
    this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Supported currencies
    this.supportedCurrencies = {
      USD: { name: "US Dollar", symbol: "$", flag: "🇺🇸" },
      EUR: { name: "Euro", symbol: "€", flag: "🇪🇺" },
      GBP: { name: "British Pound", symbol: "£", flag: "🇬🇧" },
      NGN: { name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
      JPY: { name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
      CAD: { name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
      AUD: { name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
      CHF: { name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
      CNY: { name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
      INR: { name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
      ZAR: { name: "South African Rand", symbol: "R", flag: "🇿🇦" },
      KES: { name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
      GHS: { name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭" },
    };
  }

  async initialize() {
    try {
      console.log("Initializing Currency Module...");

      // Check if rates need updating
      if (this.shouldUpdateRates()) {
        await this.fetchExchangeRates();
      }

      this.setupCurrencySelector();
      this.updateCurrencyDisplay();

      console.log("Currency Module initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Currency Module:", error);
      this.handleApiError(error);
      return false;
    }
  }

  shouldUpdateRates() {
    if (!this.lastUpdated || Object.keys(this.exchangeRates).length === 0) {
      return true;
    }

    const now = new Date().getTime();
    const timeSinceUpdate = now - new Date(this.lastUpdated).getTime();

    return timeSinceUpdate > this.updateInterval;
  }

  async fetchExchangeRates(baseCurrency = "USD") {
    try {
      console.log("Fetching exchange rates...");

      // Show loading indicator
      this.showLoadingIndicator(true);

      let url;
      if (this.apiKey && this.apiKey !== "3be8c0a0d1464c98d722973a") {
        // Use paid API with key
        url = `${this.baseUrl}/${this.apiKey}/latest/${baseCurrency}`;
      } else {
        // Use free API (limited requests)
        url = `${this.fallbackUrl}/${baseCurrency}`;
      }

      const response = await fetch(
        "https://v6.exchangerate-api.com/v6/3be8c0a0d1464c98d722973a/latest/USD"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different API response formats
      if (data.conversion_rates) {
        // Paid API format
        this.exchangeRates = data.conversion_rates;
      } else if (data.rates) {
        // Free API format
        this.exchangeRates = data.rates;
      } else {
        throw new Error("Invalid API response format");
      }

      // Add base currency rate
      this.exchangeRates[baseCurrency] = 1;

      // Save to localStorage
      this.saveExchangeRates();
      this.saveLastUpdated();

      console.log("Exchange rates updated successfully");

      // Show success notification
      if (window.notificationModule) {
        window.notificationModule.showSuccess(
          "Exchange rates updated successfully!"
        );
      }

      return this.exchangeRates;
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      this.handleApiError(error);
      throw error;
    } finally {
      this.showLoadingIndicator(false);
    }
  }

  async convertAmount(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return parseFloat(amount);
      }

      // Ensure we have current rates
      if (this.shouldUpdateRates()) {
        await this.fetchExchangeRates();
      }

      const fromRate = this.exchangeRates[fromCurrency];
      const toRate = this.exchangeRates[toCurrency];

      if (!fromRate || !toRate) {
        throw new Error(
          `Exchange rate not available for ${fromCurrency} or ${toCurrency}`
        );
      }

      // Convert via USD (base currency)
      const usdAmount = parseFloat(amount) / fromRate;
      const convertedAmount = usdAmount * toRate;

      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error("Error converting amount:", error);
      throw error;
    }
  }

  formatAmount(amount, currency = null) {
    const targetCurrency = currency || this.currentCurrency;
    const currencyInfo = this.supportedCurrencies[targetCurrency];

    if (!currencyInfo) {
      return `${parseFloat(amount).toFixed(2)} ${targetCurrency}`;
    }

    const formattedAmount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));

    return `${currencyInfo.symbol}${formattedAmount}`;
  }

  setupCurrencySelector() {
    const selector = document.getElementById("currencySelector");
    if (!selector) return;

    // Clear existing options
    selector.innerHTML = "";

    // Populate with supported currencies
    Object.entries(this.supportedCurrencies).forEach(([code, info]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${info.flag} ${code} - ${info.name}`;
      option.selected = code === this.currentCurrency;
      selector.appendChild(option);
    });

    // Handle currency change
    selector.addEventListener("change", async (e) => {
      await this.changeCurrency(e.target.value);
    });
  }

  async changeCurrency(newCurrency) {
    try {
      if (newCurrency === this.currentCurrency) return;

      const oldCurrency = this.currentCurrency;
      this.currentCurrency = newCurrency;

      // Save to localStorage
      this.saveCurrentCurrency();

      // Update all displayed amounts
      await this.updateAllAmounts(oldCurrency, newCurrency);

      // Update currency display
      this.updateCurrencyDisplay();

      // Show success notification
      if (window.notificationModule) {
        const currencyInfo = this.supportedCurrencies[newCurrency];
        window.notificationModule.showSuccess(
          `Currency changed to ${currencyInfo.name} (${currencyInfo.symbol})`
        );
      }

      console.log(`Currency changed from ${oldCurrency} to ${newCurrency}`);
    } catch (error) {
      console.error("Error changing currency:", error);
      if (window.notificationModule) {
        window.notificationModule.showError("Failed to change currency");
      }
    }
  }

  async updateAllAmounts(fromCurrency, toCurrency) {
    // Update dashboard amounts
    const amountElements = document.querySelectorAll("[data-amount]");

    for (const element of amountElements) {
      const originalAmount = parseFloat(element.dataset.amount);
      if (!isNaN(originalAmount)) {
        try {
          const convertedAmount = await this.convertAmount(
            originalAmount,
            fromCurrency,
            toCurrency
          );
          element.textContent = this.formatAmount(convertedAmount, toCurrency);
          element.dataset.amount = convertedAmount;
        } catch (error) {
          console.error("Error updating amount:", error);
        }
      }
    }

    // Update transaction amounts if on transactions page
    if (window.transactionManager) {
      await this.updateTransactionAmounts(fromCurrency, toCurrency);
    }
  }

  async updateTransactionAmounts(fromCurrency, toCurrency) {
    const transactionElements = document.querySelectorAll(
      ".transaction-amount"
    );

    for (const element of transactionElements) {
      const originalAmount = parseFloat(
        element.dataset.originalAmount ||
          element.textContent.replace(/[^\d.-]/g, "")
      );
      if (!isNaN(originalAmount)) {
        try {
          const convertedAmount = await this.convertAmount(
            originalAmount,
            fromCurrency,
            toCurrency
          );
          element.textContent = this.formatAmount(convertedAmount, toCurrency);
        } catch (error) {
          console.error("Error updating transaction amount:", error);
        }
      }
    }
  }

  updateCurrencyDisplay() {
    // Update currency symbols throughout the app
    const currencySymbols = document.querySelectorAll(".currency-symbol");
    const currencyInfo = this.supportedCurrencies[this.currentCurrency];

    currencySymbols.forEach((element) => {
      element.textContent = currencyInfo
        ? currencyInfo.symbol
        : this.currentCurrency;
    });

    // Update currency selector if it exists
    const selector = document.getElementById("currencySelector");
    if (selector) {
      selector.value = this.currentCurrency;
    }
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const fromRate = this.exchangeRates[fromCurrency];
    const toRate = this.exchangeRates[toCurrency];

    if (!fromRate || !toRate) return null;

    return toRate / fromRate;
  }

  getAvailableCurrencies() {
    return Object.keys(this.supportedCurrencies);
  }

  getCurrencyInfo(currency) {
    return this.supportedCurrencies[currency] || null;
  }

  getCurrencySymbol(currency) {
    const info = this.supportedCurrencies[currency];
    return info ? info.symbol : currency;
  }

  getCurrencyName(currency) {
    const info = this.supportedCurrencies[currency];
    return info ? info.name : currency;
  }

  showLoadingIndicator(show) {
    const indicator = document.getElementById("currencyLoadingIndicator");
    if (indicator) {
      indicator.style.display = show ? "block" : "none";
    }
  }

  handleApiError(error) {
    console.error("Currency API Error:", error);

    let errorMessage = "Failed to update exchange rates";

    if (error.message.includes("429")) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (error.message.includes("401")) {
      errorMessage = "Invalid API key. Please check your configuration.";
    } else if (error.message.includes("network")) {
      errorMessage = "Network error. Please check your internet connection.";
    }

    if (window.notificationModule) {
      window.notificationModule.showError(errorMessage);
    }
  }

  // Storage methods
  loadCurrentCurrency() {
    return localStorage.getItem("budgetBlu_currentCurrency") || "NGN";
  }

  saveCurrentCurrency() {
    localStorage.setItem("budgetBlu_currentCurrency", this.currentCurrency);
  }

  loadExchangeRates() {
    const stored = localStorage.getItem("budgetBlu_exchangeRates");
    return stored ? JSON.parse(stored) : {};
  }

  saveExchangeRates() {
    localStorage.setItem(
      "budgetBlu_exchangeRates",
      JSON.stringify(this.exchangeRates)
    );
  }

  getLastUpdated() {
    return localStorage.getItem("budgetBlu_ratesLastUpdated");
  }

  saveLastUpdated() {
    const now = new Date().toISOString();
    localStorage.setItem("budgetBlu_ratesLastUpdated", now);
    this.lastUpdated = now;
  }

  // Utility method to refresh rates manually
  async refreshRates() {
    try {
      await this.fetchExchangeRates();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get rate update status
  getRateUpdateStatus() {
    if (!this.lastUpdated) {
      return { status: "never", message: "Rates never updated" };
    }

    const now = new Date().getTime();
    const lastUpdate = new Date(this.lastUpdated).getTime();
    const timeSinceUpdate = now - lastUpdate;
    const hoursAgo = Math.floor(timeSinceUpdate / (60 * 60 * 1000));

    if (hoursAgo < 1) {
      return { status: "recent", message: "Updated less than an hour ago" };
    } else if (hoursAgo < 24) {
      return { status: "today", message: `Updated ${hoursAgo} hours ago` };
    } else {
      const daysAgo = Math.floor(hoursAgo / 24);
      return { status: "old", message: `Updated ${daysAgo} days ago` };
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = CurrencyModule;
}

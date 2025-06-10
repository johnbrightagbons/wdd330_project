export class CurrencyModule {
  constructor() {
    this.apiKey = "3be8c0a0d1464c98d722973a"; // Replace with actual API key
    this.baseUrl = "https://api.exchangerate-api.com/v4/latest/";
    this.fallbackUrl = "https://api.fixer.io/latest"; // Backup API
    this.defaultCurrency = "USD";
    this.currentCurrency =
      localStorage.getItem("selectedCurrency") || this.defaultCurrency;
    this.exchangeRates = {};
    this.lastUpdated = null;
    this.cacheTimeout = 3600000; // 1 hour in milliseconds
  }

  // Initialize currency module
  async initialize() {
    try {
      await this.loadExchangeRates();
      this.setupCurrencySelector();
      this.updateAllDisplayedAmounts();
      console.log("Currency module initialized successfully");
    } catch (error) {
      console.error("Failed to initialize currency module:", error);
      this.handleApiError();
    }
  }

  // Load exchange rates from API
  async loadExchangeRates() {
    // Check if we have cached rates that are still valid
    if (this.isCacheValid()) {
      this.exchangeRates = JSON.parse(localStorage.getItem("exchangeRates"));
      this.lastUpdated = new Date(localStorage.getItem("ratesLastUpdated"));
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.defaultCurrency}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.exchangeRates = data.rates;
      this.lastUpdated = new Date();

      // Cache the rates
      localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
      localStorage.setItem("ratesLastUpdated", this.lastUpdated.toISOString());
    } catch (error) {
      console.error("Primary API failed, trying fallback:", error);
      await this.loadFallbackRates();
    }
  }

  // Load rates from fallback API
  async loadFallbackRates() {
    try {
      const response = await fetch(this.fallbackUrl);
      const data = await response.json();
      this.exchangeRates = data.rates;
      this.lastUpdated = new Date();

      localStorage.setItem("exchangeRates", JSON.stringify(this.exchangeRates));
      localStorage.setItem("ratesLastUpdated", this.lastUpdated.toISOString());
    } catch (error) {
      console.error("Fallback API also failed:", error);
      this.useOfflineRates();
    }
  }

  // Use offline/default rates when APIs fail
  useOfflineRates() {
    this.exchangeRates = {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CAD: 1.25,
      AUD: 1.35,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5,
    };
    console.warn("Using offline exchange rates");
  }

  // Check if cached rates are still valid
  isCacheValid() {
    const cachedRates = localStorage.getItem("exchangeRates");
    const lastUpdated = localStorage.getItem("ratesLastUpdated");

    if (!cachedRates || !lastUpdated) return false;

    const timeDiff = Date.now() - new Date(lastUpdated).getTime();
    return timeDiff < this.cacheTimeout;
  }

  // Setup currency selector dropdown
  setupCurrencySelector() {
    const selector = document.getElementById("currencySelector");
    if (!selector) return;

    // Populate currency options
    const currencies = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
    ];
    selector.innerHTML = currencies
      .map(
        (currency) =>
          `<option value="${currency}" ${currency === this.currentCurrency ? "selected" : ""}>
        ${currency} - ${this.getCurrencyName(currency)}
      </option>`
      )
      .join("");

    // Handle currency change
    selector.addEventListener("change", (e) => {
      this.changeCurrency(e.target.value);
    });
  }

  // Change the current currency
  async changeCurrency(newCurrency) {
    if (newCurrency === this.currentCurrency) return;

    try {
      this.currentCurrency = newCurrency;
      localStorage.setItem("selectedCurrency", newCurrency);

      // Refresh rates if needed
      if (!this.isCacheValid()) {
        await this.loadExchangeRates();
      }

      this.updateAllDisplayedAmounts();
      this.showCurrencyChangeNotification(newCurrency);
    } catch (error) {
      console.error("Error changing currency:", error);
    }
  }

  // Convert amount from USD to target currency
  convertAmount(amount, targetCurrency = this.currentCurrency) {
    if (targetCurrency === this.defaultCurrency) return amount;

    const rate = this.exchangeRates[targetCurrency];
    if (!rate) {
      console.warn(`Exchange rate not found for ${targetCurrency}`);
      return amount;
    }

    return amount * rate;
  }

  // Convert amount from any currency to USD
  convertToUSD(amount, fromCurrency) {
    if (fromCurrency === this.defaultCurrency) return amount;

    const rate = this.exchangeRates[fromCurrency];
    if (!rate) return amount;

    return amount / rate;
  }

  // Format amount with currency symbol
  formatAmount(amount, currency = this.currentCurrency) {
    const convertedAmount = this.convertAmount(amount, currency);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  }

  // Get currency symbol
  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CHF: "CHF",
      CNY: "¥",
      INR: "₹",
    };
    return symbols[currency] || currency;
  }

  // Get currency name
  getCurrencyName(currency) {
    const names = {
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
      CAD: "Canadian Dollar",
      AUD: "Australian Dollar",
      CHF: "Swiss Franc",
      CNY: "Chinese Yuan",
      INR: "Indian Rupee",
    };
    return names[currency] || currency;
  }

  // Update all displayed amounts on the page
  updateAllDisplayedAmounts() {
    const amountElements = document.querySelectorAll("[data-amount]");
    amountElements.forEach((element) => {
      const originalAmount = parseFloat(element.dataset.amount);
      if (!isNaN(originalAmount)) {
        element.textContent = this.formatAmount(originalAmount);
      }
    });

    // Update summary boxes
    this.updateSummaryBoxes();

    // Trigger custom event for other modules to listen
    document.dispatchEvent(
      new CustomEvent("currencyChanged", {
        detail: { currency: this.currentCurrency },
      })
    );
  }

  // Update dashboard summary boxes
  updateSummaryBoxes() {
    const totalIncomeEl = document.getElementById("totalIncome");
    const totalExpensesEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("balance");

    if (totalIncomeEl && totalIncomeEl.dataset.amount) {
      totalIncomeEl.textContent = this.formatAmount(
        parseFloat(totalIncomeEl.dataset.amount)
      );
    }

    if (totalExpensesEl && totalExpensesEl.dataset.amount) {
      totalExpensesEl.textContent = this.formatAmount(
        parseFloat(totalExpensesEl.dataset.amount)
      );
    }

    if (balanceEl && balanceEl.dataset.amount) {
      balanceEl.textContent = this.formatAmount(
        parseFloat(balanceEl.dataset.amount)
      );
    }
  }

  // Show currency change notification
  showCurrencyChangeNotification(currency) {
    if (typeof NotificationModule !== "undefined") {
      NotificationModule.showSuccess(
        `Currency changed to ${this.getCurrencyName(currency)} (${currency})`
      );
    }
  }

  // Handle API errors
  handleApiError() {
    if (typeof NotificationModule !== "undefined") {
      NotificationModule.showWarning(
        "Unable to fetch latest exchange rates. Using cached or default rates."
      );
    }
  }

  // Get current exchange rate for a currency
  getExchangeRate(currency) {
    return this.exchangeRates[currency] || 1;
  }

  // Get all available currencies
  getAvailableCurrencies() {
    return Object.keys(this.exchangeRates);
  }

  // Refresh exchange rates manually
  async refreshRates() {
    try {
      // Clear cache
      localStorage.removeItem("exchangeRates");
      localStorage.removeItem("ratesLastUpdated");

      await this.loadExchangeRates();
      this.updateAllDisplayedAmounts();

      if (typeof NotificationModule !== "undefined") {
        NotificationModule.showSuccess("Exchange rates updated successfully");
      }
    } catch (error) {
      console.error("Failed to refresh rates:", error);
      if (typeof NotificationModule !== "undefined") {
        NotificationModule.showError("Failed to update exchange rates");
      }
    }
  }
}

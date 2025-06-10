class BudgetManager {
  constructor() {
    this.init();
  }

  init() {
    console.log("Budget manager initialized");
    this.updateUIBasedOnAuth();
    this.setupEventListeners();
    this.loadBudgetData();
  }

  updateUIBasedOnAuth() {
    const isLoggedIn = this.isUserLoggedIn();
    const budgetFormSection = document.querySelector(".budget-form-section");
    const summaryBoxes = document.querySelector(".summary-boxes");
    const budgetHistory = document.querySelector(".budget-history");

    if (!isLoggedIn) {
      this.showLoginMessage(budgetFormSection);
      this.hideBudgetFeatures(summaryBoxes, budgetHistory);
    } else {
      this.showBudgetFeatures(budgetFormSection, summaryBoxes, budgetHistory);
      this.loadUserBudgetData();
    }
  }

  showLoginMessage(budgetFormSection) {
    if (budgetFormSection) {
      budgetFormSection.innerHTML = `
        <div class="auth-required-message">
          <div class="message-content">
            <i class="fas fa-lock"></i>
            <h2>Authentication Required</h2>
            <p>Please login or register to manage your budget and track your expenses.</p>
            <div class="auth-buttons">
              <a href="../auth/login.html" class="auth-btn primary">
                <i class="fas fa-sign-in-alt"></i>
                Login
              </a>
              <a href="../auth/signup.html" class="auth-btn secondary">
                <i class="fas fa-user-plus"></i>
                Register
              </a>
            </div>
          </div>
        </div>
      `;
    }
  }

  hideBudgetFeatures(summaryBoxes, budgetHistory) {
    if (summaryBoxes) {
      summaryBoxes.style.display = "none";
    }
    if (budgetHistory) {
      budgetHistory.style.display = "none";
    }
  }

  showBudgetFeatures(budgetFormSection, summaryBoxes, budgetHistory) {
    if (summaryBoxes) {
      summaryBoxes.style.display = "flex";
    }
    if (budgetHistory) {
      budgetHistory.style.display = "block";
    }

    // Restore original budget form
    if (budgetFormSection) {
      budgetFormSection.innerHTML = `
        <h2>Set Your Monthly Budget</h2>
        <form id="budgetForm" class="form-container">
          <div class="form-group">
            <label for="budgetAmount">
              <i class="fas fa-wallet"></i>
              Monthly Budget Amount (₦)
            </label>
            <input type="number" id="budgetAmount" name="budgetAmount" min="0" step="0.01" required placeholder="Enter amount" />
          </div>
          <button type="submit" class="auth-btn primary">Save Budget</button>
          <div class="error-message" id="budgetError"></div>
        </form>
      `;
    }
  }

  setupEventListeners() {
    // Only set up form listener if user is logged in
    if (this.isUserLoggedIn()) {
      const budgetForm = document.getElementById("budgetForm");
      if (budgetForm) {
        budgetForm.addEventListener("submit", (e) =>
          this.handleBudgetSubmit(e)
        );
      }
    }
  }

  handleBudgetSubmit(e) {
    e.preventDefault();

    const budgetAmount = document.getElementById("budgetAmount").value;
    const errorDiv = document.getElementById("budgetError");

    if (!budgetAmount || budgetAmount <= 0) {
      this.showError("Please enter a valid budget amount", errorDiv);
      return;
    }

    try {
      this.saveBudget(parseFloat(budgetAmount));
      this.showSuccess("Budget saved successfully!");
      this.updateBudgetDisplay();
      this.addToBudgetHistory(budgetAmount);
    } catch (error) {
      this.showError("Failed to save budget. Please try again.", errorDiv);
      console.error("Budget save error:", error);
    }
  }

  isUserLoggedIn() {
    // Check if AuthManager exists and user is logged in
    if (typeof AuthManager !== "undefined") {
      return AuthManager.isLoggedIn();
    }

    // Fallback check for session storage
    const session =
      localStorage.getItem("budgetBluSession") ||
      sessionStorage.getItem("budgetBluSession");
    return !!session;
  }

  loadUserBudgetData() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.loadBudgetData();
    }
  }

  getCurrentUser() {
    if (typeof AuthManager !== "undefined") {
      return AuthManager.getCurrentUser();
    }

    // Fallback
    const userData = localStorage.getItem("currentUser");
    return userData ? JSON.parse(userData) : null;
  }

  saveBudget(amount) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    const budgetData = {
      userId: currentUser.id,
      amount: amount,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const budgets = JSON.parse(localStorage.getItem("userBudgets") || "[]");

    // Remove existing budget for current month/year
    const filteredBudgets = budgets.filter(
      (b) =>
        !(
          b.userId === currentUser.id &&
          b.month === budgetData.month &&
          b.year === budgetData.year
        )
    );

    filteredBudgets.push(budgetData);
    localStorage.setItem("userBudgets", JSON.stringify(filteredBudgets));
  }

  loadBudgetData() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    const budgets = JSON.parse(localStorage.getItem("userBudgets") || "[]");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentBudget = budgets.find(
      (b) =>
        b.userId === currentUser.id &&
        b.month === currentMonth &&
        b.year === currentYear
    );

    if (currentBudget) {
      this.updateBudgetDisplay(currentBudget.amount);
    }
  }

  updateBudgetDisplay(budgetAmount = 0) {
    const monthlyBudgetEl = document.getElementById("monthlyBudget");
    const amountSpentEl = document.getElementById("amountSpent");
    const amountRemainingEl = document.getElementById("amountRemaining");

    if (monthlyBudgetEl) {
      monthlyBudgetEl.textContent = budgetAmount.toFixed(2);
    }

    // Calculate spent amount from transactions (you'll need to implement this)
    const spentAmount = this.calculateSpentAmount();
    if (amountSpentEl) {
      amountSpentEl.textContent = spentAmount.toFixed(2);
    }

    const remaining = budgetAmount - spentAmount;
    if (amountRemainingEl) {
      amountRemainingEl.textContent = remaining.toFixed(2);

      // Add visual indicator for overspending
      if (remaining < 0) {
        amountRemainingEl.style.color = "#e74c3c";
      } else {
        amountRemainingEl.style.color = "#27ae60";
      }
    }
  }

  calculateSpentAmount() {
    // This should integrate with your transaction system
    // For now, return 0
    return 0;
  }

  addToBudgetHistory(amount) {
    const historyList = document.getElementById("budgetHistoryList");
    if (!historyList) return;

    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <div class="budget-history-item">
        <span class="budget-amount">₦${parseFloat(amount).toFixed(2)}</span>
        <span class="budget-date">${new Date().toLocaleDateString()}</span>
      </div>
    `;

    historyList.insertBefore(listItem, historyList.firstChild);
  }

  showError(message, errorDiv) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
      errorDiv.style.color = "#e74c3c";
    }
  }

  showSuccess(message) {
    // You can implement a toast notification or similar
    alert(message);
  }
}

// Global logout function
function logout() {
  if (typeof AuthManager !== "undefined") {
    AuthManager.logout();
  } else {
    localStorage.removeItem("budgetBluSession");
    sessionStorage.removeItem("budgetBluSession");
    localStorage.removeItem("currentUser");
  }
  window.location.href = "../auth/login.html";
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new BudgetManager();
});

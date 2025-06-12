class BudgetModule {
  constructor() {
    this.budgets = this.loadBudgets();
  }

  setBudgetLimit(category, amount, period = "monthly") {
    const budget = {
      id: Date.now(),
      category,
      limit: amount,
      period,
      createdAt: new Date().toISOString(),
    };

    this.budgets[category] = budget;
    this.saveBudgets();
    return budget;
  }

  checkBudgetStatus(category) {
    const budget = this.budgets[category];
    if (!budget) return null;

    const spent = this.calculateSpentAmount(category);
    const percentage = (spent / budget.limit) * 100;

    return {
      category,
      limit: budget.limit,
      spent,
      remaining: budget.limit - spent,
      percentage: Math.min(percentage, 100),
      status:
        percentage >= 100 ? "exceeded" : percentage >= 80 ? "warning" : "good",
    };
  }

  loadBudgets() {
    return JSON.parse(localStorage.getItem("budgetBlu_budgets") || "{}");
  }

  saveBudgets() {
    localStorage.setItem("budgetBlu_budgets", JSON.stringify(this.budgets));
  }
}
<div id="currencyLoadingIndicator"></div>;

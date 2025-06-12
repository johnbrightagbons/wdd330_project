class BudgetAlertManager {
  constructor(budgetModule, notificationModule) {
    this.budgetModule = budgetModule;
    this.notificationModule = notificationModule;
  }

  checkAllBudgets() {
    const categories = Object.keys(this.budgetModule.budgets);

    categories.forEach((category) => {
      const status = this.budgetModule.checkBudgetStatus(category);
      if (status) {
        this.handleBudgetAlert(status);
      }
    });
  }

  handleBudgetAlert(status) {
    if (status.status === "exceeded") {
      this.notificationModule.showError(
        `Budget exceeded for ${status.category}! You've spent ₦${status.spent.toFixed(2)} of ₦${status.limit.toFixed(2)}`
      );
    } else if (status.status === "warning") {
      this.notificationModule.showWarning(
        `Budget warning for ${status.category}: ${status.percentage.toFixed(1)}% used`
      );
    }
  }
}

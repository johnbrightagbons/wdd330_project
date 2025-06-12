class CategoryModule {
  constructor() {
    this.defaultCategories = {
      income: ["Salary", "Freelance", "Investment", "Gift", "Other Income"],
      expense: [
        "Tithes",
        "Offerings",
        "Food",
        "Rent",
        "Utilities",
        "Transportation",
        "Entertainment",
        "Healthcare",
        "Shopping",
        "Other",
      ],
    };
  }

  getCategories(type = "all") {
    if (type === "all") {
      return [
        ...this.defaultCategories.income,
        ...this.defaultCategories.expense,
      ];
    }
    return this.defaultCategories[type] || [];
  }

  populateCategorySelect(selectElement, type = "expense") {
    const categories = this.getCategories(type);
    selectElement.innerHTML =
      '<option value="">Select Category</option>' +
      categories
        .map((cat) => `<option value="${cat}">${cat}</option>`)
        .join("");
  }
}

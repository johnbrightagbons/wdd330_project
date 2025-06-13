import { ConfigLoader } from "./config-loader.js";

export class CategoriesModule {
  constructor() {
    this.configLoader = new ConfigLoader();
    this.categories = null;
    this.init();
  }

  async init() {
    try {
      this.categories = await this.configLoader.loadConfig("categories.json");
    } catch (error) {
      console.error("Failed to load categories configuration:", error);
      this.setDefaultCategories();
    }
  }

  setDefaultCategories() {
    this.categories = {
      expense: {
        food: { label: "Food & Dining", icon: "🍽️", color: "#FF6384" },
        transportation: {
          label: "Transportation",
          icon: "🚗",
          color: "#36A2EB",
        },
        entertainment: { label: "Entertainment", icon: "🎬", color: "#FFCE56" },
      },
      income: {
        salary: { label: "Salary", icon: "💼", color: "#4CAF50" },
        freelance: { label: "Freelance", icon: "💻", color: "#2196F3" },
      },
    };
  }

  getExpenseCategories() {
    return this.categories?.expense || {};
  }

  getIncomeCategories() {
    return this.categories?.income || {};
  }

  getCategoryInfo(type, categoryKey) {
    return this.categories?.[type]?.[categoryKey] || null;
  }

  getAllCategories() {
    return this.categories || {};
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

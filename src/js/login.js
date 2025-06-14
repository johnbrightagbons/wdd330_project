import { AuthManager } from "./auth.js";
import { MessageHandler, Validator, delay } from "./utils.js";

class LoginHandler {
  constructor() {
    this.form = null;
    this.submitBtn = null;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeElements()
      );
    } else {
      this.initializeElements();
    }
  }

  initializeElements() {
    this.form = document.getElementById("loginForm");
    if (!this.form) {
      console.error("Login form with ID 'loginForm' not found");
      return;
    }

    this.submitBtn = document.getElementById("loginBtn");
    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector('button[type="submit"]');
    }
    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector("button");
    }
    if (!this.submitBtn) {
      console.error("Submit button not found");
      return;
    }

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = this.getFormData();
    MessageHandler.hideMessage("messageArea");

    if (!this.validateForm(formData)) {
      return;
    }

    this.setLoadingState(true);

    try {
      await delay(500);

      // Use AuthManager's async login method
      const result = await AuthManager.login(formData.email, formData.password);

      if (result.success) {
        MessageHandler.showMessage(
          "messageArea",
          "✅ Login successful! Redirecting to dashboard...",
          "success"
        );
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
      } else {
        MessageHandler.showMessage("messageArea", result.message, "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      MessageHandler.showMessage(
        "messageArea",
        "An error occurred. Please try again.",
        "error"
      );
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(isLoading) {
    if (!this.submitBtn) {
      this.submitBtn =
        document.getElementById("loginBtn") ||
        document.querySelector('button[type="submit"]') ||
        document.querySelector("form button");
      if (!this.submitBtn) return;
    }
    this.submitBtn.disabled = isLoading;
    this.submitBtn.textContent = isLoading ? "Logging in..." : "Login";
  }

  getFormData() {
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");
    if (!emailElement || !passwordElement) {
      return { email: "", password: "" };
    }
    return {
      email: emailElement.value.trim().toLowerCase(),
      password: passwordElement.value,
    };
  }

  validateForm(data) {
    if (
      !Validator.validateRequired(data.email) ||
      !Validator.validateRequired(data.password)
    ) {
      MessageHandler.showMessage(
        "messageArea",
        "Please fill in all fields",
        "error"
      );
      return false;
    }
    return true;
  }
}

// Initialize when DOM is ready - but only if we're on the login page
if (document.getElementById("loginForm")) {
  new LoginHandler();
}

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
    console.log("Initializing login handler...");

    this.form = document.getElementById("loginForm");
    if (!this.form) {
      console.error("Login form with ID 'loginForm' not found");
      return;
    }

    this.submitBtn = document.getElementById("loginBtn");

    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector('button[type="submit"]');
      console.log("Submit button found by type selector:", this.submitBtn);
    }

    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector("button");
      console.log("Submit button found by button selector:", this.submitBtn);
    }

    if (this.submitBtn) {
      console.log("Submit button found successfully:", this.submitBtn);
    } else {
      console.error("Submit button not found with any method");
      const allButtons = document.querySelectorAll("button");
      console.log("All buttons found in document:", allButtons);
      return;
    }

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.form.addEventListener("input", () => {
      MessageHandler.hideMessage("messageArea");
    });

    console.log("Login handler initialized successfully");
  }

  async handleSubmit(e) {
    e.preventDefault();
    console.log("Login form submitted");

    const formData = this.getFormData();
    MessageHandler.hideMessage("messageArea");

    if (!this.validateForm(formData)) {
      return;
    }

    this.setLoadingState(true);

    try {
      await delay(500); // Simulate processing delay

      const result = await this.authenticateUser(formData); // FIXED: Await async method

      if (result.success) {
        AuthManager.setUser(result.user);
        MessageHandler.showMessage(
          "messageArea",
          "✅ Login successful! Redirecting to dashboard...",
          "success"
        );

        setTimeout(() => {
          window.location.href = "../index.html";
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      MessageHandler.showMessage("messageArea", error.message, "error");
    } finally {
      this.setLoadingState(false);
    }
  }

  setLoadingState(isLoading) {
    if (!this.submitBtn) {
      console.warn("Submit button not found, cannot set loading state");
      this.submitBtn =
        document.getElementById("loginBtn") ||
        document.querySelector('button[type="submit"]') ||
        document.querySelector("form button");

      if (!this.submitBtn) {
        console.error("Still cannot find submit button");
        return;
      }
    }

    if (isLoading) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = "Logging in...";
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = "Login";
    }
  }

  getFormData() {
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");

    if (!emailElement || !passwordElement) {
      console.error("Email or password input not found");
      MessageHandler.showMessage(
        "messageArea",
        "Email or password field is missing.",
        "error"
      );
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

  // FIXED: Made async
  async authenticateUser(credentials) {
    try {
      const user = AuthManager.findUserByEmail(credentials.email);

      if (!user) {
        return {
          success: false,
          message: "No account found with this email address",
        };
      }

      if (user.password !== credentials.password) {
        return {
          success: false,
          message: "Invalid password",
        };
      }

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        message: "Authentication failed. Please try again.",
      };
    }
  }
}

// Only initialize if login form is present
if (document.getElementById("loginForm")) {
  new LoginHandler();
}

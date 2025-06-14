import { AuthManager } from "./auth.js";
import { MessageHandler, Validator, delay } from "./utils.js";

class LoginHandler {
  constructor() {
    this.form = null;
    this.submitBtn = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
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

    // Get form element
    this.form = document.getElementById("loginForm");
    if (!this.form) {
      console.error("Login form with ID 'loginForm' not found");
      return;
    }

    // Get submit button - try multiple methods
    this.submitBtn = document.getElementById("loginBtn");

    // If not found by ID, try to find by type within the form
    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector('button[type="submit"]');
      console.log("Submit button found by type selector:", this.submitBtn);
    }

    // If still not found, try to find any button in the form
    if (!this.submitBtn) {
      this.submitBtn = this.form.querySelector("button");
      console.log("Submit button found by button selector:", this.submitBtn);
    }

    if (this.submitBtn) {
      console.log("Submit button found successfully:", this.submitBtn);
    } else {
      console.error("Submit button not found with any method");
      // List all buttons in the document for debugging
      const allButtons = document.querySelectorAll("button");
      console.log("All buttons found in document:", allButtons);
      return;
    }

    // Add event listener to form
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    console.log("Login handler initialized successfully");
  }

  async handleSubmit(e) {
    e.preventDefault();
    console.log("Login form submitted");

    const formData = this.getFormData();
    MessageHandler.hideMessage("messageArea");

    // Validate form
    if (!this.validateForm(formData)) {
      return;
    }

    // Show loading state
    this.setLoadingState(true);

    try {
      // Simulate processing delay
      await delay(500);

      // Authenticate user
      const result = this.authenticateUser(formData);

      if (result.success) {
        AuthManager.setUser(result.user);
        MessageHandler.showMessage(
          "messageArea",
          "✅ Login successful! Redirecting to dashboard...",
          "success"
        );

        // Redirect after 2 seconds
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
    console.log(
      "Setting loading state:",
      isLoading,
      "Button exists:",
      !!this.submitBtn
    );

    // Check if submitBtn exists before trying to modify it
    if (!this.submitBtn) {
      console.warn("Submit button not found, cannot set loading state");
      // Try to find the button again
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
      console.log("Button set to loading state");
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = "Login";
      console.log("Button loading state cleared");
    }
  }

  getFormData() {
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");

    if (!emailElement || !passwordElement) {
      console.error("Email or password input not found");
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

  authenticateUser(credentials) {
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

// Initialize when DOM is ready - but only if we're on the login page
if (document.getElementById("loginForm")) {
  new LoginHandler();
}

import { AuthManager } from "./auth.js";
import { MessageHandler, Validator, delay } from "./utils.js";

class SignupHandler {
  constructor() {
    this.form = document.getElementById("signupForm");
    this.submitBtn = document.getElementById("signupBtn");
    this.init();
  }

  init() {
    console.log("Signup handler initialized");
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();
    console.log("Signup form submitted");

    const formData = this.getFormData();
    MessageHandler.hideMessage("messageArea");

    // Validate form
    const validation = this.validateForm(formData);
    if (!validation.isValid) {
      MessageHandler.showMessage("messageArea", validation.message, "error");
      return;
    }

    // Show loading state
    this.setLoadingState(true);

    try {
      // Simulate processing delay
      await delay(1000);

      // Create account
      const result = await this.createAccount(formData);

      if (result.success) {
        MessageHandler.showMessage(
          "messageArea",
          "🎉 Account created successfully! Redirecting to login page...",
          "success",
        );
        this.form.reset();

        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      MessageHandler.showMessage("messageArea", error.message, "error");
    } finally {
      this.setLoadingState(false);
    }
  }

  getFormData() {
    return {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };
  }

  validateForm(data) {
    // Check required fields
    if (
      !Validator.validateRequired(data.fullName) ||
      !Validator.validateRequired(data.email) ||
      !Validator.validateRequired(data.password) ||
      !Validator.validateRequired(data.confirmPassword)
    ) {
      return { isValid: false, message: "Please fill in all fields" };
    }

    // Validate email
    if (!Validator.validateEmail(data.email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    // Validate password
    if (!Validator.validatePassword(data.password)) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }

    // Check password match
    if (data.password !== data.confirmPassword) {
      return { isValid: false, message: "Passwords do not match" };
    }

    // Check if email exists
    if (AuthManager.findUserByEmail(data.email)) {
      return {
        isValid: false,
        message: "An account with this email already exists",
      };
    }

    return { isValid: true };
  }

  async createAccount(userData) {
    try {
      const newUser = {
        id: Date.now().toString(),
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password, // In production, hash this
        createdAt: new Date().toISOString(),
      };

      AuthManager.saveUser(newUser);
      console.log("User created successfully:", newUser);

      return { success: true, message: "Account created successfully!" };
    } catch (error) {
      console.error("Error creating account:", error);
      return {
        success: false,
        message: "Failed to create account. Please try again.",
      };
    }
  }

  setLoadingState(isLoading) {
    if (isLoading) {
      this.submitBtn.textContent = "Creating Account...";
      this.submitBtn.disabled = true;
    } else {
      this.submitBtn.textContent = "Create Account";
      this.submitBtn.disabled = false;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SignupHandler();
});

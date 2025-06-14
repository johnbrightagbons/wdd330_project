import { AuthManager } from "./auth.js";
import { MessageHandler, Validator, delay } from "./utils.js";

class SignupHandler {
  constructor() {
    this.form = document.getElementById("signupForm");
    this.submitBtn = document.getElementById("signupBtn");
    this.init();
  }

  init() {
    if (!this.form) return;
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

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
      await delay(1000);

      // Create account
      const result = await this.createAccount(formData);

      if (result.success) {
        MessageHandler.showMessage(
          "messageArea",
          "🎉 Account created successfully! Redirecting to login page...",
          "success"
        );
        this.form.reset();

        setTimeout(() => {
          window.location.href = "login.html";
        }, 5000);
      } else {
        MessageHandler.showMessage("messageArea", result.message, "error");
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
      purpose: document.getElementById("purpose")?.value || "",
      agreeTerms: document.getElementById("agreeTerms")?.checked || false,
    };
  }

  validateForm(data) {
    // Check required fields
    if (
      !Validator.validateRequired(data.fullName) ||
      !Validator.validateRequired(data.email) ||
      !Validator.validateRequired(data.password) ||
      !Validator.validateRequired(data.confirmPassword) ||
      !Validator.validateRequired(data.purpose) ||
      !data.agreeTerms
    ) {
      return {
        isValid: false,
        message: "Please fill in all required fields and agree to the terms.",
      };
    }

    if (!Validator.validateEmail(data.email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    if (!Validator.validatePassword(data.password)) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }

    if (data.password !== data.confirmPassword) {
      return { isValid: false, message: "Passwords do not match" };
    }

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
      // Use AuthManager.register to hash the password and save the user
      const result = await AuthManager.register(
        userData.fullName,
        userData.email,
        userData.password
      );
      return result;
    } catch (error) {
      console.error("Error creating account:", error);
      return {
        success: false,
        message: "Failed to create account. Please try again.",
      };
    }
  }

  setLoadingState(isLoading) {
    if (!this.submitBtn) return;
    this.submitBtn.textContent = isLoading
      ? "Creating Account..."
      : "Create Account";
    this.submitBtn.disabled = isLoading;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SignupHandler();
});
document.addEventListener("DOMContentLoaded", () => {
  // Password strength and toggle
  const passwordInput = document.getElementById("password");
  const strengthFill = document.getElementById("strengthFill");
  const strengthText = document.getElementById("strengthText");
  const togglePassword = document.getElementById("togglePassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Password strength logic
  if (passwordInput && strengthFill && strengthText) {
    passwordInput.addEventListener("input", () => {
      const val = passwordInput.value;
      const strength = getPasswordStrength(val);

      // Update bar and text
      if (val.length === 0) {
        strengthFill.style.width = "0%";
        strengthFill.style.background = "#eee";
        strengthText.textContent = "Password strength";
      } else if (strength === "weak") {
        strengthFill.style.width = "33%";
        strengthFill.style.background = "#f44336";
        strengthText.textContent = "Weak";
      } else if (strength === "medium") {
        strengthFill.style.width = "66%";
        strengthFill.style.background = "#ff9800";
        strengthText.textContent = "Medium";
      } else {
        strengthFill.style.width = "100%";
        strengthFill.style.background = "#4caf50";
        strengthText.textContent = "Strong";
      }
    });
  }

  // Show/hide password logic
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.innerHTML = isPassword
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });
  }
});

// Helper function for password strength
function getPasswordStrength(password) {
  if (password.length < 6) return "weak";
  // If password contains any special character, it's strong
  if (password.match(/[^A-Za-z0-9]/)) return "strong";
  // If it contains uppercase or number, it's medium
  if (password.match(/[A-Z]/) || password.match(/[0-9]/)) return "medium";
  return "weak";
}
